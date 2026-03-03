import { verifyRegistrationResponse } from '@simplewebauthn/server';
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
        const { userId, credential, deviceName } = await req.json();

        if (!userId || !credential) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        const rpID = getRpId(req);
        const origin = getOrigin(req);

        // Recuperar challenge del usuario
        const { data: challengeRow, error: challengeErr } = await supabaseAdmin
            .from('webauthn_challenges')
            .select('challenge, id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (challengeErr || !challengeRow) {
            return NextResponse.json({ error: 'Challenge expirado. Vuelve a intentarlo.' }, { status: 400 });
        }

        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response: credential,
                expectedChallenge: challengeRow.challenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                requireUserVerification: true,
            });
        } catch (verifyErr) {
            console.error('[register-verify] Verification error:', verifyErr);
            // Limpiar challenge fallido
            await supabaseAdmin.from('webauthn_challenges').delete().eq('id', challengeRow.id);
            return NextResponse.json({
                error: 'Verificación fallida. Asegúrate de estar en la URL correcta de la app.',
            }, { status: 400 });
        }

        if (!verification.verified || !verification.registrationInfo) {
            await supabaseAdmin.from('webauthn_challenges').delete().eq('id', challengeRow.id);
            return NextResponse.json({ error: 'Registro no verificado' }, { status: 400 });
        }

        const { credential: cred } = verification.registrationInfo;

        // Guardar passkey (upsert por credential_id para evitar duplicados)
        const { error: insertErr } = await supabaseAdmin.from('passkeys').upsert({
            user_id: userId,
            credential_id: cred.id,
            public_key: Buffer.from(cred.publicKey).toString('base64'),
            counter: cred.counter,
            device_name: deviceName ?? 'Dispositivo',
        }, { onConflict: 'credential_id' });

        if (insertErr) {
            console.error('[register-verify] DB insert error:', insertErr);
            return NextResponse.json({ error: 'Error guardando la passkey' }, { status: 500 });
        }

        // Limpiar challenge usado
        await supabaseAdmin.from('webauthn_challenges').delete().eq('id', challengeRow.id);

        return NextResponse.json({ verified: true });
    } catch (error) {
        console.error('[register-verify]', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
