import { generateRegistrationOptions } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RP_NAME = 'ChronoWork';

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/** Hostname limpio extraído del origin real del request */
function getRpId(req: NextRequest): string {
    const origin = req.headers.get('origin') ?? '';
    try {
        const { hostname } = new URL(origin);
        return hostname;
    } catch {
        const env = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost';
        return env.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    }
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
            return NextResponse.json({ error: 'Error interno guardando challenge' }, { status: 500 });
        }

        return NextResponse.json(options);
    } catch (err) {
        console.error('[register-options]', err);
        return NextResponse.json({ error: 'Error generando opciones de registro' }, { status: 500 });
    }
}
