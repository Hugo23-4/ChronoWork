import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function getRpId(req: NextRequest): string {
    const origin = req.headers.get('origin') ?? '';
    try { return new URL(origin).hostname; } catch {
        return (process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost')
            .replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    }
}

function getOrigin(req: NextRequest): string {
    const o = req.headers.get('origin');
    if (o) return o.replace(/\/$/, '');
    const h = getRpId(req);
    return h === 'localhost' ? 'http://localhost:3000' : `https://${h}`;
}

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = getAdmin();
        const { credential } = await req.json();

        if (!credential?.id) {
            return NextResponse.json({ error: 'Credencial incompleta' }, { status: 400 });
        }

        const rpID = getRpId(req);
        const expectedOrigin = getOrigin(req);

        // 1. Buscar la passkey por credential_id
        const { data: passkey, error: passkeyErr } = await supabaseAdmin
            .from('passkeys')
            .select('*')
            .eq('credential_id', credential.id)
            .single();

        if (passkeyErr || !passkey) {
            return NextResponse.json({
                error: 'Passkey no registrada en este dispositivo. Ve a Perfil → Seguridad para añadirlo.',
            }, { status: 404 });
        }

        // 2. Obtener el challenge más reciente
        const { data: row, error: rowErr } = await supabaseAdmin
            .from('webauthn_challenges')
            .select('challenge, id')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (rowErr || !row) {
            return NextResponse.json({ error: 'Challenge expirado. Recarga la página.' }, { status: 400 });
        }

        // 3. Verificar la firma criptográfica del dispositivo
        let verification;
        try {
            verification = await verifyAuthenticationResponse({
                response: credential,
                expectedChallenge: row.challenge,
                expectedOrigin,
                expectedRPID: rpID,
                credential: {
                    id: passkey.credential_id,
                    publicKey: Buffer.from(passkey.public_key, 'base64'),
                    counter: passkey.counter,
                    transports: passkey.transports ?? [],
                },
                requireUserVerification: true,
            });
        } catch (ve) {
            console.error('[login-verify] verifyAuthenticationResponse error:', ve);
            await supabaseAdmin.from('webauthn_challenges').delete().eq('id', row.id);
            return NextResponse.json({
                error: `Error de verificación: ${ve instanceof Error ? ve.message : 'error desconocido'}`,
            }, { status: 401 });
        }

        if (!verification.verified) {
            await supabaseAdmin.from('webauthn_challenges').delete().eq('id', row.id);
            return NextResponse.json({ error: 'Autenticación rechazada por el dispositivo' }, { status: 401 });
        }

        // 4. Actualizar counter (protección anti-replay) y timestamp de uso
        await supabaseAdmin
            .from('passkeys')
            .update({
                counter: verification.authenticationInfo.newCounter,
                last_used_at: new Date().toISOString(),
            })
            .eq('credential_id', credential.id);

        // 5. Limpiar challenge consumido
        await supabaseAdmin.from('webauthn_challenges').delete().eq('id', row.id);

        // 6. Obtener email del usuario
        const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(
            passkey.user_id
        );

        if (userErr || !userData?.user?.email) {
            return NextResponse.json({ error: 'Usuario no encontrado en Supabase' }, { status: 404 });
        }

        // 7. Generar magic link del admin — el cliente lo visita y obtiene sesión real
        const appOrigin = expectedOrigin.replace(/\/$/, '');
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: userData.user.email,
            options: { redirectTo: `${appOrigin}/dashboard` },
        });

        if (linkErr || !linkData?.properties?.action_link) {
            console.error('[login-verify] generateLink error:', linkErr);
            // Fallback — el frontend puede reintentar con email/password
            return NextResponse.json({ verified: true, fallback: true });
        }

        return NextResponse.json({
            verified: true,
            action_link: linkData.properties.action_link,
        });
    } catch (err) {
        console.error('[login-verify]', err);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
