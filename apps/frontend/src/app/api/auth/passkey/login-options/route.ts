import { generateAuthenticationOptions } from '@simplewebauthn/server';
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
        const rpID = getRpId(req);

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
            rpID,
            userVerification: 'required',
            // Si no hay credenciales conocidas, el navegador busca él solo (passkey picker nativo)
            ...(allowCredentials.length > 0 ? { allowCredentials } : {}),
        });

        // Limpiar challenges viejos sin user_id y guardar el nuevo
        await supabaseAdmin.from('webauthn_challenges').delete().is('user_id', null);
        await supabaseAdmin.from('webauthn_challenges').insert({
            user_id: userId ?? null,
            challenge: options.challenge,
        });

        return NextResponse.json(options);
    } catch (error) {
        console.error('[login-options]', error);
        return NextResponse.json({ error: 'Error generando opciones de autenticación' }, { status: 500 });
    }
}
