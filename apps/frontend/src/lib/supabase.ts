import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * customFetch con timeout de 30s, EXCEPTO para endpoints de auth donde
 * usamos el fetch nativo. iOS Chrome con red móvil puede tardar varios
 * segundos en negociar TLS para llamadas a /auth/v1/* (token exchange,
 * verify, recovery). Abortar a los 15s rompía login biométrico y
 * password reset.
 */
const customFetch = (url: RequestInfo | URL, options: RequestInit = {}) => {
    const href = typeof url === 'string' ? url : url instanceof URL ? url.href : (url as Request).url;
    if (href.includes('/auth/v1/')) {
        return fetch(url, options);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
};

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: customFetch },
});