import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de diagnóstico de variables de entorno en runtime.
 * NO expone valores secretos — sólo presencia, longitud y prefijo/sufijo
 * de keys para detectar copy/paste con whitespace o vacíos.
 *
 * Visita: https://chrono-work-pi.vercel.app/api/health/env
 */
export async function GET() {
    const probe = (raw: string | undefined) => {
        if (!raw) return { present: false };
        return {
            present: true,
            length: raw.length,
            startsWith: raw.slice(0, 6),
            endsWith: raw.slice(-4),
            hasLeadingSpace: raw !== raw.trimStart(),
            hasTrailingSpace: raw !== raw.trimEnd(),
            hasNewline: /[\r\n]/.test(raw),
        };
    };

    const reveal = (raw: string | undefined) => raw ?? null;

    return NextResponse.json({
        runtime: 'nodejs',
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV ?? null,
        vercel_url: process.env.VERCEL_URL ?? null,
        envs: {
            NEXT_PUBLIC_SUPABASE_URL: { ...probe(process.env.NEXT_PUBLIC_SUPABASE_URL), value: reveal(process.env.NEXT_PUBLIC_SUPABASE_URL) },
            NEXT_PUBLIC_SUPABASE_ANON_KEY: probe(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
            SUPABASE_SERVICE_ROLE_KEY: probe(process.env.SUPABASE_SERVICE_ROLE_KEY),
            NEXT_PUBLIC_APP_DOMAIN: { ...probe(process.env.NEXT_PUBLIC_APP_DOMAIN), value: reveal(process.env.NEXT_PUBLIC_APP_DOMAIN) },
            NEXT_PUBLIC_APP_ORIGIN: { ...probe(process.env.NEXT_PUBLIC_APP_ORIGIN), value: reveal(process.env.NEXT_PUBLIC_APP_ORIGIN) },
        },
    });
}
