import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { getRpId, getExpectedOrigin } from '@/lib/webauthn-rp';

export const dynamic = 'force-dynamic';

function getAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    }
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = getAdmin();
        const { credential } = await req.json();

        if (!credential?.id) {
            return NextResponse.json({ error: 'Credencial incompleta' }, { status: 400 });
        }

        const rpID = getRpId(req);
        const expectedOrigin = getExpectedOrigin(req);

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
            await supabaseAdmin.from('auditoria_seguridad').insert({
                user_id: passkey.user_id,
                evento: 'passkey.login.fail',
                metadata: {
                    reason: ve instanceof Error ? ve.message : 'verify-error',
                    ip: req.headers.get('x-forwarded-for') ?? null,
                    ua: req.headers.get('user-agent') ?? null,
                },
            }).then(() => {}, () => {});
            return NextResponse.json({
                error: `Verificación fallida: ${ve instanceof Error ? ve.message : String(ve)}`,
            }, { status: 401 });
        }

        if (!verification.verified) {
            await supabaseAdmin.from('webauthn_challenges').delete().eq('id', row.id);
            await supabaseAdmin.from('auditoria_seguridad').insert({
                user_id: passkey.user_id,
                evento: 'passkey.login.fail',
                metadata: {
                    reason: 'rejected-by-device',
                    ip: req.headers.get('x-forwarded-for') ?? null,
                    ua: req.headers.get('user-agent') ?? null,
                },
            }).then(() => {}, () => {});
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

        // 6.0 Auditoría
        await supabaseAdmin.from('auditoria_seguridad').insert({
            user_id: passkey.user_id,
            evento: 'passkey.login.success',
            metadata: {
                ip: req.headers.get('x-forwarded-for') ?? null,
                ua: req.headers.get('user-agent') ?? null,
            },
        }).then(() => {}, () => {});

        // 6. Obtener datos del usuario
        const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(
            passkey.user_id
        );

        if (userErr || !userData?.user) {
            console.error('[login-verify] getUserById error:', userErr);
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // 7. Generar magiclink y canjearlo server-side por tokens.
        //    Esto evita la necesidad de que el browser visite el action_link
        //    (que en iOS Chrome rompe el flujo y deja al usuario "pillado").
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: userData.user.email!,
            options: { redirectTo: `${expectedOrigin}/auth/callback` },
        });

        if (linkErr || !linkData?.properties?.action_link) {
            console.error('[login-verify] generateLink error:', linkErr);
            return NextResponse.json({ error: 'Error generando sesión' }, { status: 500 });
        }

        const tokenHash = linkData.properties.hashed_token;
        if (!tokenHash) {
            console.error('[login-verify] hashed_token missing from generateLink response');
            return NextResponse.json({ error: 'Token de sesión inválido' }, { status: 500 });
        }

        // verifyOtp server-side con type=email (Supabase >=2.x usa "email" para magiclinks).
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
            body: JSON.stringify({ token_hash: tokenHash, type: 'email' }),
        });

        if (verifyRes.ok) {
            const session = await verifyRes.json();
            if (session?.access_token && session?.refresh_token) {
                // Escribir cookies de sesión SERVER-SIDE vía @supabase/ssr.
                // El cliente NO necesita hacer setSession (race condition en iOS
                // Chrome) — al recibir la response con Set-Cookie, las cookies
                // quedan listas para la siguiente navegación.
                try {
                    const ssr = await createSupabaseServerClient();
                    await ssr.auth.setSession({
                        access_token: session.access_token,
                        refresh_token: session.refresh_token,
                    });
                } catch (cookieErr) {
                    console.error('[login-verify] ssr.setSession error:', cookieErr);
                }

                return NextResponse.json({ verified: true });
            }
            console.error('[login-verify] verifyOtp ok but no tokens:', session);
        } else {
            const errBody = await verifyRes.text();
            console.error('[login-verify] verifyOtp HTTP', verifyRes.status, errBody);
        }

        // Si llegamos aquí la verificación falló.
        return NextResponse.json({
            error: 'No se pudo crear la sesión. Inténtalo con email y contraseña.',
        }, { status: 500 });

    } catch (err) {
        console.error('[login-verify] unexpected error:', err);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
