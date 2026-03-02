import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
        const { userId } = await req.json();

        let allowCredentials: { id: string; type: 'public-key' }[] = [];
        if (userId) {
            const { data: passkeys } = await supabaseAdmin
                .from('passkeys')
                .select('credential_id')
                .eq('user_id', userId);

            allowCredentials = (passkeys ?? []).map((p) => ({
                id: p.credential_id,
                type: 'public-key' as const,
            }));
        }

        const options = await generateAuthenticationOptions({
            rpID: RP_ID,
            userVerification: 'preferred',
            allowCredentials,
        });

        await supabaseAdmin.from('webauthn_challenges').insert({
            user_id: userId ?? null,
            challenge: options.challenge,
        });

        return NextResponse.json(options);
    } catch (error) {
        console.error('[passkey/login-options]', error);
        return NextResponse.json({ error: 'Error generando opciones de login' }, { status: 500 });
    }
}
