import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getRpId(req: NextRequest): string {
    const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? '';
    try {
        return new URL(origin).hostname;
    } catch {
        return process.env.NEXT_PUBLIC_APP_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? 'localhost';
    }
}

function getOrigin(req: NextRequest): string {
    const origin = req.headers.get('origin');
    if (origin) return origin.replace(/\/$/, '');
    const domain = getRpId(req);
    return domain === 'localhost' ? 'http://localhost:3000' : `https://${domain}`;
}

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = getAdmin();
        const { credential } = await req.json();

        if (!credential?.id) {
            return NextResponse.json({ error: 'Credencial incompleta' }, { status: 400 });
        }

        const rpID = getRpId(req);
        const origin = getOrigin(req);

        // 1. Buscar passkey por credential_id
        const { data: passkey, error: passkeyErr } = await supabaseAdmin
            .from('passkeys')
            .select('*')
            .eq('credential_id', credential.id)
            .single();

        if (passkeyErr || !passkey) {
            return NextResponse.json({
                error: 'Passkey no encontrada. Regístrala primero en Perfil → Seguridad.',
            }, { status: 404 });
        }

        // 2. Recuperar challenge más reciente
        const { data: challengeRow, error: challengeErr } = await supabaseAdmin
            .from('webauthn_challenges')
            .select('challenge, id')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (challengeErr || !challengeRow) {
            return NextResponse.json({ error: 'Challenge expirado. Recarga la página e inténtalo de nuevo.' }, { status: 400 });
        }

        // 3. Verificar la firma biométrica
        let verification;
        try {
            verification = await verifyAuthenticationResponse({
                response: credential,
                expectedChallenge: challengeRow.challenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                credential: {
                    id: passkey.credential_id,
                    publicKey: Buffer.from(passkey.public_key, 'base64'),
                    counter: passkey.counter,
                },
                requireUserVerification: true,
            });
        } catch (verifyErr) {
            console.error('[login-verify] Verification error:', verifyErr);
            await supabaseAdmin.from('webauthn_challenges').delete().eq('id', challengeRow.id);
            return NextResponse.json({ error: 'Verificación biométrica fallida.' }, { status: 401 });
        }

        if (!verification.verified) {
            await supabaseAdmin.from('webauthn_challenges').delete().eq('id', challengeRow.id);
            return NextResponse.json({ error: 'Autenticación rechazada' }, { status: 401 });
        }

        // 4. Actualizar counter (anti-replay) y last_used_at
        await supabaseAdmin
            .from('passkeys')
            .update({
                counter: verification.authenticationInfo.newCounter,
                last_used_at: new Date().toISOString(),
            })
            .eq('credential_id', credential.id);

        // 5. Limpiar challenge
        await supabaseAdmin.from('webauthn_challenges').delete().eq('id', challengeRow.id);

        // 6. Obtener email y generar magic link para crear sesión real
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(passkey.user_id);
        if (!userData?.user?.email) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const appOrigin = origin.replace(/\/$/, '');
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: userData.user.email,
            options: { redirectTo: `${appOrigin}/dashboard` },
        });

        if (linkErr || !linkData?.properties?.action_link) {
            console.error('[login-verify] generateLink error:', linkErr);
            return NextResponse.json({ verified: true, email: userData.user.email });
        }

        return NextResponse.json({
            verified: true,
            action_link: linkData.properties.action_link,
        });
    } catch (error) {
        console.error('[login-verify]', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
