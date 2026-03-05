import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
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
            console.error('[login-verify] passkey not found for credential_id:', credential.id, passkeyErr);
            return NextResponse.json({
                error: 'Passkey no encontrada. Regístrala desde Perfil → Seguridad.',
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
            console.error('[login-verify] no challenge found:', rowErr);
            return NextResponse.json({ error: 'Challenge expirado. Recarga la página.' }, { status: 400 });
        }

        // 3. Verificar la firma criptográfica
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
                    transports: (passkey.transports ?? []) as AuthenticatorTransportFuture[],
                },
                requireUserVerification: true,
            });
        } catch (ve) {
            console.error('[login-verify] verifyAuthenticationResponse error:', ve);
            await supabaseAdmin.from('webauthn_challenges').delete().eq('id', row.id);
            return NextResponse.json({
                error: `Verificación fallida: ${ve instanceof Error ? ve.message : String(ve)}`,
            }, { status: 401 });
        }

        if (!verification.verified) {
            await supabaseAdmin.from('webauthn_challenges').delete().eq('id', row.id);
            return NextResponse.json({ error: 'Autenticación rechazada por el dispositivo' }, { status: 401 });
        }

        // 4. Actualizar counter anti-replay y timestamp
        await supabaseAdmin
            .from('passkeys')
            .update({
                counter: verification.authenticationInfo.newCounter,
                last_used_at: new Date().toISOString(),
            })
            .eq('credential_id', credential.id);

        // 5. Limpiar challenge consumido
        await supabaseAdmin.from('webauthn_challenges').delete().eq('id', row.id);

        // 6. Obtener datos del usuario
        const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(
            passkey.user_id
        );

        if (userErr || !userData?.user) {
            console.error('[login-verify] getUserById error:', userErr);
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // 7. Crear sesión directamente vía signInWithOtp (más fiable en iOS que action_link)
        //    Generamos un OTP de un solo uso y lo verificamos de inmediato para obtener
        //    access_token + refresh_token que el cliente puede usar con setSession()
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: userData.user.email!,
            options: { redirectTo: `${expectedOrigin}/auth/callback` },
        });

        if (linkErr || !linkData?.properties?.action_link) {
            console.error('[login-verify] generateLink error:', linkErr);
            return NextResponse.json({ error: 'Error generando sesión' }, { status: 500 });
        }

        // Extraer el token del action_link para hacer la verificación server-side
        const actionUrl = new URL(linkData.properties.action_link);
        const token = actionUrl.searchParams.get('token');
        const tokenHash = linkData.properties.hashed_token;

        if (!token && !tokenHash) {
            // Fallback: devolver el action_link para que el cliente lo visite
            return NextResponse.json({
                verified: true,
                action_link: linkData.properties.action_link,
            });
        }

        // Verificar el OTP server-side para obtener la sesión
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify({
                token_hash: tokenHash ?? token,
                type: 'magiclink',
            }),
        });

        if (verifyRes.ok) {
            const session = await verifyRes.json();
            if (session?.access_token && session?.refresh_token) {
                return NextResponse.json({
                    verified: true,
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                });
            }
        }

        // Si la verificación server-side falla, dar el action_link como fallback
        return NextResponse.json({
            verified: true,
            action_link: linkData.properties.action_link,
        });

    } catch (err) {
        console.error('[login-verify] unexpected error:', err);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
