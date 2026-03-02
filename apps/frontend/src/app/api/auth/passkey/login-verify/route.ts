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

        const credentialId = credential.id;

        const { data: passkey, error: passkeyErr } = await supabaseAdmin
            .from('passkeys')
            .select('*')
            .eq('credential_id', credentialId)
            .single();

        if (passkeyErr || !passkey) {
            return NextResponse.json({ error: 'Passkey no encontrada. Regístrala primero desde tu perfil.' }, { status: 404 });
        }

        const { data: challengeRow, error: challengeErr } = await supabaseAdmin
            .from('webauthn_challenges')
            .select('challenge, id')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (challengeErr || !challengeRow) {
            return NextResponse.json({ error: 'Challenge expirado. Inténtalo de nuevo.' }, { status: 400 });
        }

        const publicKeyBuffer = Buffer.from(passkey.public_key, 'base64');

        const verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge: challengeRow.challenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            credential: {
                id: passkey.credential_id,
                publicKey: publicKeyBuffer,
                counter: passkey.counter,
            },
            requireUserVerification: true,
        });

        if (!verification.verified) {
            return NextResponse.json({ error: 'Autenticación biométrica fallida' }, { status: 401 });
        }

        await supabaseAdmin
            .from('passkeys')
            .update({
                counter: verification.authenticationInfo.newCounter,
                last_used_at: new Date().toISOString(),
            })
            .eq('credential_id', credentialId);

        await supabaseAdmin
            .from('webauthn_challenges')
            .delete()
            .eq('id', challengeRow.id);

        const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(passkey.user_id);
        if (userErr || !userData.user?.email) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            verified: true,
            email: userData.user.email,
        });
    } catch (error) {
        console.error('[passkey/login-verify]', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
