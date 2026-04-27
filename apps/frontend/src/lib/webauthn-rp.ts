import type { NextRequest } from 'next/server';

/**
 * Hostname (RP ID) deducido del request.
 * Orden:
 *   1. Header `origin` (caso fetch normal del browser)
 *   2. Header `host` (Next.js Route Handlers, fallback fiable en Vercel)
 *   3. NEXT_PUBLIC_APP_DOMAIN env (config explícita)
 *   4. 'localhost' (dev local)
 */
export function getRpId(req: NextRequest): string {
    const origin = req.headers.get('origin');
    if (origin) {
        try { return new URL(origin).hostname; } catch {}
    }
    const host = req.headers.get('host');
    if (host) return host.replace(/:\d+$/, '');
    const env = process.env.NEXT_PUBLIC_APP_DOMAIN;
    if (env) return env.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
    return 'localhost';
}

/**
 * Origin completo (con protocolo) para verify de WebAuthn.
 */
export function getExpectedOrigin(req: NextRequest): string {
    const o = req.headers.get('origin');
    if (o) return o.replace(/\/$/, '');
    const host = req.headers.get('host');
    if (host) {
        const isLocal = host.startsWith('localhost') || host.startsWith('127.');
        return `${isLocal ? 'http' : 'https'}://${host}`;
    }
    const rp = getRpId(req);
    return rp === 'localhost' ? 'http://localhost:3000' : `https://${rp}`;
}
