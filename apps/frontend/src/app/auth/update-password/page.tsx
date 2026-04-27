'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

type Phase = 'verifying' | 'ready' | 'no-session' | 'updating' | 'done' | 'error';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<Phase>('verifying');
  const [error, setError] = useState<string | null>(null);

  // Maneja la llegada desde el email de recovery.
  // Supabase puede entregar el token en 3 formas:
  //   1. URL hash: #access_token=...&refresh_token=...&type=recovery
  //   2. URL query: ?code=...   (PKCE flow)
  //   3. Evento onAuthStateChange = PASSWORD_RECOVERY (handled automáticamente
  //      por createBrowserClient — debería establecer la sesión solo)
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
          const errorDescription = params.get('error_description') || params.get('error');
          if (errorDescription) {
            if (!cancelled) {
              setError(decodeURIComponent(errorDescription));
              setPhase('error');
            }
            return;
          }
          if (access_token && refresh_token) {
            const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
            if (setErr) throw setErr;
            // Limpiar el hash de la URL
            history.replaceState(null, '', window.location.pathname);
            if (!cancelled) setPhase('ready');
            return;
          }
        }

        // 2. PKCE flow: ?code=
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr) throw exchErr;
          history.replaceState(null, '', window.location.pathname);
          if (!cancelled) setPhase('ready');
          return;
        }

        // 3. Sesión ya activa (caso: usuario ya logueado quiere cambiar pwd)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (!cancelled) setPhase('ready');
          return;
        }

        if (!cancelled) setPhase('no-session');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Error verificando enlace.';
        setError(msg);
        setPhase('error');
      }
    };

    handle();

    // Suscripción al evento PASSWORD_RECOVERY como red de seguridad.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && !cancelled) setPhase('ready');
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setPhase('updating'); setError(null);
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) throw updErr;
      setPhase('done');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido.';
      setError(msg);
      setPhase('ready');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-dvh bg-systemGray-6 dark:bg-black p-4">
      <div className="cw-surface p-7 w-full max-w-sm">

        {phase === 'verifying' && (
          <div className="text-center py-6">
            <Loader2 className="w-8 h-8 text-ios-blue animate-spin mx-auto mb-3" />
            <p className="text-[14px] text-[--color-label-secondary] dark:text-[#aeaeb2]">
              Verificando enlace…
            </p>
          </div>
        )}

        {phase === 'no-session' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#FF9500]/12 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-7 h-7 text-[#FF9500]" />
            </div>
            <h2 className="cw-title-2 text-[--color-label-primary] dark:text-white mb-1.5">
              Enlace no válido
            </h2>
            <p className="text-[14px] text-[--color-label-secondary] dark:text-[#aeaeb2] mb-5 leading-relaxed">
              El enlace de recuperación ha expirado o ya se usó. Solicita uno nuevo desde la pantalla de inicio de sesión.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full h-12 rounded-[14px] bg-ios-blue text-white font-semibold text-[15px] border-none cursor-pointer hover:bg-[#0066D9] active:scale-[0.97] transition-all"
              style={{ boxShadow: '0 4px 14px rgba(0,122,255,0.25)' }}
            >
              Volver al inicio
            </button>
          </div>
        )}

        {phase === 'error' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#FF3B30]/12 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-7 h-7 text-[#FF3B30]" />
            </div>
            <h2 className="cw-title-2 text-[--color-label-primary] dark:text-white mb-1.5">
              No se pudo verificar
            </h2>
            <p className="text-[14px] text-[--color-label-secondary] dark:text-[#aeaeb2] mb-5 leading-relaxed">
              {error ?? 'Error desconocido.'}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full h-12 rounded-[14px] bg-ios-blue text-white font-semibold text-[15px] border-none cursor-pointer hover:bg-[#0066D9] active:scale-[0.97] transition-all"
              style={{ boxShadow: '0 4px 14px rgba(0,122,255,0.25)' }}
            >
              Volver al inicio
            </button>
          </div>
        )}

        {phase === 'done' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#34C759]/12 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-[#34C759]" />
            </div>
            <h2 className="cw-title-2 text-[--color-label-primary] dark:text-white mb-1.5">
              Contraseña actualizada
            </h2>
            <p className="text-[14px] text-[--color-label-secondary] dark:text-[#aeaeb2]">
              Te redirigimos al panel…
            </p>
          </div>
        )}

        {(phase === 'ready' || phase === 'updating') && (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-ios-blue/12 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6 text-ios-blue" />
              </div>
              <h2 className="cw-title-2 text-[--color-label-primary] dark:text-white">
                Nueva contraseña
              </h2>
              <p className="text-[13px] text-[--color-label-secondary] dark:text-[#aeaeb2] mt-1">
                Elige una clave segura para tu cuenta.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-[#FF3B30]/10 text-[#C9251D] dark:text-[#FF6961] rounded-[14px] px-3.5 py-2.5 text-[13px] mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleUpdate}>
              <label className="block text-[13px] font-medium text-[--color-label-primary] dark:text-[#E5E5EA] mb-1.5">
                Contraseña
              </label>
              <div className="relative mb-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3.5 py-2.5 pr-11 border border-[--color-separator] dark:border-white/10 rounded-[14px] bg-systemGray-6 dark:bg-white/5 text-[--color-label-primary] dark:text-white placeholder:text-[--color-label-tertiary] focus:border-ios-blue focus:ring-[3px] focus:ring-ios-blue/25 focus:bg-white dark:focus:bg-white/8 outline-none transition-all text-[14px]"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-label-secondary] hover:text-[--color-label-primary] bg-transparent border-none cursor-pointer p-1 flex items-center">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <label className="block text-[13px] font-medium text-[--color-label-primary] dark:text-[#E5E5EA] mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-3.5 py-2.5 border border-[--color-separator] dark:border-white/10 rounded-[14px] bg-systemGray-6 dark:bg-white/5 text-[--color-label-primary] dark:text-white placeholder:text-[--color-label-tertiary] focus:border-ios-blue focus:ring-[3px] focus:ring-ios-blue/25 focus:bg-white dark:focus:bg-white/8 outline-none transition-all text-[14px] mb-5"
                placeholder="Repite la contraseña"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />

              <button
                type="submit"
                disabled={phase === 'updating'}
                className="w-full h-12 rounded-[14px] bg-ios-blue text-white font-semibold text-[15px] border-none cursor-pointer hover:bg-[#0066D9] active:scale-[0.97] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ boxShadow: '0 4px 14px rgba(0,122,255,0.25)' }}
              >
                {phase === 'updating'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                  : 'Guardar contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
