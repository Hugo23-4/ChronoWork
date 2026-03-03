import { verifyRegistrationResponse } from '@simplewebauthn/server';
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
        const { userId, credential, deviceName } = await req.json();

        if (!userId || !credential) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        const rpID = getRpId(req);
        const expectedOrigin = getOrigin(req);

        // Recuperar el challenge guardado para este usuario
        const { data: row, error: rowErr } = await supabaseAdmin
            .from('webauthn_challenges')
            .select('challenge, id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (rowErr || !row) {
            return NextResponse.json({ error: 'Challenge expirado. Pulsa de nuevo "Añadir dispositivo".' }, { status: 400 });
        }

        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response: credential,
                expectedChallenge: row.challenge,
                expectedOrigin,
                expectedRPID: rpID,
                requireUserVerification: true,
            });
        } catch (ve) {
            console.error('[register-verify] verifyRegistrationResponse error:', ve);
            await supabaseAdmin.from('webauthn_challenges').delete().eq('id', row.id);
            return NextResponse.json({
                error: `Verificación fallida: ${ve instanceof Error ? ve.message : 'error desconocido'}`,
            }, { status: 400 });
        }

        if (!verification.verified || !verification.registrationInfo) {
            await supabaseAdmin.from('webauthn_challenges').delete().eq('id', row.id);
            return NextResponse.json({ error: 'Registro no verificado' }, { status: 400 });
        }

        const { credential: cred } = verification.registrationInfo;

        // Guardar passkey con upsert (tolerante a registros duplicados)
        const { error: upsertErr } = await supabaseAdmin.from('passkeys').upsert(
            {
                user_id: userId,
                credential_id: cred.id,
                public_key: Buffer.from(cred.publicKey).toString('base64'),
                counter: cred.counter,
                device_name: deviceName ?? 'Mi dispositivo',
                transports: credential.response?.transports ?? [],
            },
            { onConflict: 'credential_id' }
        );

        if (upsertErr) {
            console.error('[register-verify] upsert error:', upsertErr);
            return NextResponse.json({ error: 'Error guardando passkey en base de datos' }, { status: 500 });
        }

        // Limpiar challenge
        await supabaseAdmin.from('webauthn_challenges').delete().eq('id', row.id);

        return NextResponse.json({ verified: true });
    } catch (err) {
        console.error('[register-verify]', err);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
