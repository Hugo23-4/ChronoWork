import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RP_ID = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost';
const ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'http://localhost:3000';

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
        if (!credential) {
            return NextResponse.json({ error: 'Credencial requerida' }, { status: 400 });
        }

        // 1. Buscar la passkey registrada
        const { data: passkey, error: passkeyErr } = await supabaseAdmin
            .from('passkeys')
            .select('*')
            .eq('credential_id', credential.id)
            .single();

        if (passkeyErr || !passkey) {
            return NextResponse.json({ error: 'Passkey no encontrada. Regístrala primero desde tu perfil.' }, { status: 404 });
        }

        // 2. Recuperar challenge más reciente
        const { data: challengeRow, error: challengeErr } = await supabaseAdmin
            .from('webauthn_challenges')
            .select('challenge, id')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (challengeErr || !challengeRow) {
            return NextResponse.json({ error: 'Challenge expirado. Inténtalo de nuevo.' }, { status: 400 });
        }

        // 3. Verificar la firma biométrica
        const verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge: challengeRow.challenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            credential: {
                id: passkey.credential_id,
                publicKey: Buffer.from(passkey.public_key, 'base64'),
                counter: passkey.counter,
            },
            requireUserVerification: true,
        });

        if (!verification.verified) {
            return NextResponse.json({ error: 'Verificación fallida' }, { status: 401 });
        }

        // 4. Actualizar counter y timestamp
        await supabaseAdmin
            .from('passkeys')
            .update({
                counter: verification.authenticationInfo.newCounter,
                last_used_at: new Date().toISOString(),
            })
            .eq('credential_id', credential.id);

        // 5. Limpiar challenge
        await supabaseAdmin.from('webauthn_challenges').delete().eq('id', challengeRow.id);

        // 6. Obtener email del usuario
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(passkey.user_id);
        if (!userData?.user?.email) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // 7. Generar magic link — el cliente lo visitará para obtener sesión real
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: userData.user.email,
            options: {
                redirectTo: `${ORIGIN}/dashboard`,
            },
        });

        if (linkErr || !linkData?.properties?.action_link) {
            // Fallback: devolver email para que lo intente de otra forma
            return NextResponse.json({ verified: true, email: userData.user.email });
        }

        return NextResponse.json({
            verified: true,
            action_link: linkData.properties.action_link,
            email: userData.user.email,
        });
    } catch (error) {
        console.error('[passkey/login-verify]', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
