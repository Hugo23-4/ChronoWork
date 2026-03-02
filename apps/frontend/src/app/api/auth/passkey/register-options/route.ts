import { generateRegistrationOptions } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // No pre-renderizar en build time

const RP_NAME = 'ChronoWork';
const RP_ID = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost';

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

        const { data: existingPasskeys } = await supabaseAdmin
            .from('passkeys')
            .select('credential_id')
            .eq('user_id', userId);

        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID: RP_ID,
            userID: new TextEncoder().encode(userId),
            userName: userEmail,
            userDisplayName: userName ?? userEmail,
            attestationType: 'none',
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                residentKey: 'preferred',
                userVerification: 'preferred',
            },
            excludeCredentials: (existingPasskeys ?? []).map((p) => ({
                id: p.credential_id,
                type: 'public-key' as const,
            })),
        });

        await supabaseAdmin.from('webauthn_challenges').insert({
            user_id: userId,
            challenge: options.challenge,
        });

        return NextResponse.json(options);
    } catch (error) {
        console.error('[passkey/register-options]', error);
        return NextResponse.json({ error: 'Error generando opciones de registro' }, { status: 500 });
    }
}
