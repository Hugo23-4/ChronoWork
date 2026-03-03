import { generateRegistrationOptions } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RP_NAME = 'ChronoWork';

/** Extrae el rpID (hostname limpio) del origin real del request */
function getRpId(req: NextRequest): string {
    const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? '';
    try {
        return new URL(origin).hostname;
    } catch {
        return process.env.NEXT_PUBLIC_APP_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? 'localhost';
    }
}

/** Extrae el origin limpio (sin trailing slash) */
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
        const { userId, userEmail, userName } = await req.json();

        if (!userId || !userEmail) {
            return NextResponse.json({ error: 'userId y userEmail son requeridos' }, { status: 400 });
        }

        const rpID = getRpId(req);

        // iOS 17.4+ tiene un bug con excludeCredentials — lo omitimos directamente
        // para evitar el InvalidStateError en Apple devices
        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID,
            userID: new TextEncoder().encode(userId), // Uint8Array — requerido por spec
            userName: userEmail,
            userDisplayName: userName ?? userEmail,
            attestationType: 'none',
            authenticatorSelection: {
                authenticatorAttachment: 'platform', // Solo Face ID / Huella (no YubiKey)
                residentKey: 'required',             // Passkey real (discoverable credential)
                userVerification: 'required',        // Biometría obligatoria
            },
            // NO pasamos excludeCredentials — bug de iOS 17.4+ Safari lo ignora y falla
        });

        // Limpiar challenges anteriores del usuario y guardar el nuevo
        await supabaseAdmin.from('webauthn_challenges').delete().eq('user_id', userId);
        await supabaseAdmin.from('webauthn_challenges').insert({
            user_id: userId,
            challenge: options.challenge,
        });

        return NextResponse.json(options);
    } catch (error) {
        console.error('[register-options]', error);
        return NextResponse.json({ error: 'Error generando opciones de registro' }, { status: 500 });
    }
}
