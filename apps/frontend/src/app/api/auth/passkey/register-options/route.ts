import { generateRegistrationOptions } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getRpId } from '@/lib/webauthn-rp';

export const dynamic = 'force-dynamic';

const RP_NAME = 'ChronoWork';

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
        const body = await req.json();
        const { userId, userEmail, userName } = body;

        if (!userId || !userEmail) {
            return NextResponse.json({ error: 'Faltan userId o userEmail' }, { status: 400 });
        }

        const rpID = getRpId(req);
        console.log('[register-options] rpID resolved:', rpID, 'origin:', req.headers.get('origin'), 'host:', req.headers.get('host'));

        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID,
            userID: new TextEncoder().encode(userId),
            userName: userEmail,
            userDisplayName: userName ?? userEmail,
            attestationType: 'none',
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                residentKey: 'required',
                userVerification: 'required',
            },
            // excludeCredentials omitido — bug confirmado en Safari iOS 17.4+
        });

        // Guardar challenge (borrar el anterior del usuario primero)
        await supabaseAdmin
            .from('webauthn_challenges')
            .delete()
            .eq('user_id', userId);

        const { error: insertErr } = await supabaseAdmin
            .from('webauthn_challenges')
            .insert({ user_id: userId, challenge: options.challenge });

        if (insertErr) {
            console.error('[register-options] challenge insert error:', insertErr);
            return NextResponse.json({ error: `Error guardando challenge: ${insertErr.message}` }, { status: 500 });
        }

        return NextResponse.json(options);
    } catch (err) {
        console.error('[register-options]', err);
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        return NextResponse.json({ error: `Error generando opciones: ${msg}` }, { status: 500 });
    }
}
