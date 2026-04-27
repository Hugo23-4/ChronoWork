'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * Auth callback — maneja el caso en que Supabase redirige aquí tras un magiclink.
 *
 * Supabase devuelve los tokens en el FRAGMENT del URL (no en query):
 *   /auth/callback#access_token=...&refresh_token=...&expires_in=3600&type=magiclink
 *
 * Como el fragment NO se manda al servidor, esta página debe ser cliente.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const handle = async () => {
      try {
        // 1. Intento extraer del hash (#access_token=...)
        const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
        if (hash) {
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token && refresh_token) {
            const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
            if (setErr) throw setErr;
            if (!cancelled) router.replace('/dashboard');
            return;
          }
          const errorDescription = params.get('error_description') || params.get('error');
          if (errorDescription) throw new Error(decodeURIComponent(errorDescription));
        }

        // 2. PKCE flow: ?code=
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr) throw exchErr;
          if (!cancelled) router.replace('/dashboard');
          return;
        }

        throw new Error('No se recibió ningún token de sesión.');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Error desconocido al completar el inicio de sesión.';
        setError(msg);
      }
    };

    handle();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-white dark:bg-black">
      {error ? (
        <div className="cw-surface p-6 max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-[#FF3B30]/12 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7 text-[#FF3B30]" />
          </div>
          <h2 className="cw-title-2 text-[--color-label-primary] dark:text-white mb-1.5">
            No pudimos completar el acceso
          </h2>
          <p className="text-[14px] text-[--color-label-secondary] dark:text-[#aeaeb2] mb-4 leading-relaxed">
            {error}
          </p>
          <button
            onClick={() => router.replace('/login')}
            className="w-full h-11 rounded-[14px] bg-ios-blue text-white font-semibold text-[15px] border-none cursor-pointer hover:bg-[#0066D9] active:scale-[0.97] transition-all"
            style={{ boxShadow: '0 4px 14px rgba(0,122,255,0.25)' }}
          >
            Volver a iniciar sesión
          </button>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-ios-blue animate-spin mx-auto mb-3" />
          <p className="text-[14px] text-[--color-label-secondary] dark:text-[#aeaeb2]">
            Completando inicio de sesión…
          </p>
        </div>
      )}
    </div>
  );
}
