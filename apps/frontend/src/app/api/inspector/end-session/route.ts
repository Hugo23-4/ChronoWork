import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Called by sendBeacon on tab close — cannot use user session (no auth headers in beacon).
// Uses service role key to update the specific session row by its UUID.
// Only sets hora_fin and duracion_minutos — no destructive side effects.
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { sessionId, durationMinutes } = body as { sessionId?: string; durationMinutes?: number };

        if (!sessionId || typeof durationMinutes !== 'number') {
            return NextResponse.json({ error: 'Missing sessionId or durationMinutes' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabaseAdmin
            .from('inspector_sesiones')
            .update({ hora_fin: new Date().toISOString(), duracion_minutos: Math.max(1, durationMinutes) })
            .eq('id', sessionId)
            .is('hora_fin', null); // only close sessions that are still open

        if (error) {
            console.error('[inspector/end-session]', error);
            return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[inspector/end-session]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
