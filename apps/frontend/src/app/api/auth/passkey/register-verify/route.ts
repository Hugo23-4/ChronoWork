import { verifyRegistrationResponse } from '@simplewebauthn/server';
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
        const { userId, credential, deviceName } = await req.json();
        if (!userId || !credential) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        const { data: challengeRow, error: challengeErr } = await supabaseAdmin
            .from('webauthn_challenges')
            .select('challenge')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (challengeErr || !challengeRow) {
            return NextResponse.json({ error: 'Challenge no encontrado o expirado' }, { status: 400 });
        }

        const verification = await verifyRegistrationResponse({
            response: credential,
            expectedChallenge: challengeRow.challenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            requireUserVerification: true,
        });

        if (!verification.verified || !verification.registrationInfo) {
            return NextResponse.json({ error: 'Verificación fallida' }, { status: 400 });
        }

        const { credential: cred } = verification.registrationInfo;

        await supabaseAdmin.from('passkeys').insert({
            user_id: userId,
            credential_id: cred.id,
            public_key: Buffer.from(cred.publicKey).toString('base64'),
            counter: cred.counter,
            device_name: deviceName ?? 'Dispositivo desconocido',
        });

        await supabaseAdmin
            .from('webauthn_challenges')
            .delete()
            .eq('user_id', userId);

        return NextResponse.json({ verified: true });
    } catch (error) {
        console.error('[passkey/register-verify]', error);
        return NextResponse.json({ error: 'Error verificando registro' }, { status: 500 });
    }
}
