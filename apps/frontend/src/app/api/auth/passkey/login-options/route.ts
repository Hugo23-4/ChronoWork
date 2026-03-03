import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
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

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = getAdmin();
        const body = await req.json().catch(() => ({}));
        const { userId } = body;
        const rpID = getRpId(req);

        let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = [];
        if (userId) {
            const { data: passkeys } = await supabaseAdmin
                .from('passkeys')
                .select('credential_id, transports')
                .eq('user_id', userId);

            allowCredentials = (passkeys ?? []).map((p) => ({
                id: p.credential_id,
                transports: (p.transports ?? []) as AuthenticatorTransportFuture[],
            }));
        }

        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: 'required',
            ...(allowCredentials.length > 0 ? { allowCredentials } : {}),
        });

        // Limpiar challenges anónimos viejos y guardar el nuevo
        await supabaseAdmin.from('webauthn_challenges').delete().is('user_id', null);
        const { error: insertErr } = await supabaseAdmin.from('webauthn_challenges').insert({
            user_id: userId ?? null,
            challenge: options.challenge,
        });

        if (insertErr) {
            console.error('[login-options] challenge insert error:', insertErr);
            return NextResponse.json({ error: 'Error guardando challenge' }, { status: 500 });
        }

        return NextResponse.json(options);
    } catch (err) {
        console.error('[login-options]', err);
        return NextResponse.json({ error: 'Error generando opciones de login' }, { status: 500 });
    }
}
