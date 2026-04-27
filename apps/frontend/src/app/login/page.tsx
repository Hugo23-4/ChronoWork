'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { startAuthentication } from '@simplewebauthn/browser';
import type { PasskeyLoginResponse } from '@/lib/passkey-types';
import { cn } from '@/lib/utils';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ScanFace, Loader2, Clock } from 'lucide-react';

const MAX_BIOMETRIC_ATTEMPTS = 3;

async function checkBiometricSupport(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    return await Promise.race([
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
      new Promise<boolean>((_, r) => setTimeout(() => r(new Error('to')), 2000)),
    ]);
  } catch { return false; }
}

function getPlatformName(): string {
  if (typeof navigator === 'undefined') return 'biometría';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'Face ID / Touch ID';
  if (/Android/i.test(ua)) return 'huella dactilar';
  if (/Win/i.test(ua)) return 'Windows Hello';
  if (/Mac/i.test(ua)) return 'Touch ID';
  return 'biometría';
}

export default function LoginPage() {
  const router = useRouter();
  const aborted = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showBio, setShowBio] = useState(false);
  const [bioStatus, setBioStatus] = useState<'prompting' | 'failed'>('prompting');
  const [bioAttempts, setBioAttempts] = useState(0);
  const [platformName, setPlatformName] = useState('biometría');
  const [bioSupported, setBioSupported] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('chrono_saved_email');
    if (saved) { setEmail(saved); setRememberMe(true); }

    const params = new URLSearchParams(window.location.search);
    if (params.get('session') === 'expired') {
      setError('⏰ Tu sesión ha expirado. Vuelve a iniciar sesión.');
    }

    setPlatformName(getPlatformName());

    const hasPasskey = localStorage.getItem('chrono_has_passkey') === 'true';
    checkBiometricSupport().then((ok) => {
      setBioSupported(ok);
      if (ok && hasPasskey && !aborted.current) triggerBiometric();
      else if (ok && !aborted.current) startConditionalAuth();
    }).catch(() => { });

    return () => { aborted.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Conditional UI — el navegador propone passkeys en el campo email
   * (autocomplete="username webauthn"). Al elegir una, autentica sin botón.
   * Corre en paralelo al formulario; si el usuario teclea email/contraseña
   * o pulsa el botón de Face ID, ese flujo gana.
   */
  const startConditionalAuth = useCallback(async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) return;
    // Solo si el navegador soporta conditional mediation
    const isCondAvailable = await (window.PublicKeyCredential as typeof window.PublicKeyCredential & {
      isConditionalMediationAvailable?: () => Promise<boolean>;
    }).isConditionalMediationAvailable?.().catch(() => false);
    if (!isCondAvailable) return;

    try {
      const optRes = await fetch('/api/auth/passkey/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: null }),
      });
      if (!optRes.ok) return;
      const options = await optRes.json();

      const assertion = await startAuthentication({ optionsJSON: options, useBrowserAutofill: true });

      const verifyRes = await fetch('/api/auth/passkey/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: assertion }),
      });
      const result: PasskeyLoginResponse = await verifyRes.json();
      if (!verifyRes.ok || !result.verified) return;

      if (result.access_token && result.refresh_token) {
        const { error: setErr } = await supabase.auth.setSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        });
        if (setErr) return;
        await new Promise(r => setTimeout(r, 80));
        window.location.assign('/dashboard');
      } else if (result.action_link) {
        window.location.href = result.action_link;
      }
    } catch {
      // El usuario tecleó / cerró autofill / abort: ignorar silenciosamente
    }
  }, []);

  const triggerBiometric = useCallback(async () => {
    if (aborted.current) return;
    setShowBio(true);
    setBioStatus('prompting');
    setError(null);

    try {
      const optRes = await fetch('/api/auth/passkey/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: null }),
      });

      if (!optRes.ok) { setShowBio(false); return; }
      const options = await optRes.json();

      const assertion = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch('/api/auth/passkey/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: assertion }),
      });
      const result: PasskeyLoginResponse = await verifyRes.json();
      if (!verifyRes.ok || !result.verified) throw new Error(result.error ?? 'failed');

      if (result.access_token && result.refresh_token) {
        const { error: setErr } = await supabase.auth.setSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        });
        if (setErr) throw setErr;
        // Esperar un tick para que las cookies de Supabase queden persistidas
        // antes de navegar (algunos browsers iOS bloquean si la cookie aún
        // no se ha escrito y el middleware SSR no encuentra sesión).
        await new Promise(r => setTimeout(r, 80));
        window.location.assign('/dashboard');
        return;
      }
      if (result.action_link) { window.location.href = result.action_link; return; }
      window.location.assign('/dashboard');

    } catch (err: unknown) {
      console.error('[login.triggerBiometric]', err);
      const name = (err instanceof Error) ? err.name : '';
      if (name === 'NotAllowedError' || name === 'AbortError' || name === 'TypeError') {
        setShowBio(false);
        return;
      }
      const next = bioAttempts + 1;
      setBioAttempts(next);
      if (next >= MAX_BIOMETRIC_ATTEMPTS) {
        setShowBio(false);
        localStorage.removeItem('chrono_has_passkey');
        const msg = err instanceof Error ? err.message : 'No se pudo verificar la biometría.';
        setError(`${msg} Usa email y contraseña.`);
      } else {
        setBioStatus('failed');
      }
    }
  }, [bioAttempts, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(), password,
      });
      if (authErr) throw authErr;

      if (rememberMe) localStorage.setItem('chrono_saved_email', email.trim());
      else localStorage.removeItem('chrono_saved_email');

      let rolId: number | null = null;
      try {
        const timeout = new Promise<null>((res) => setTimeout(() => res(null), 4000));
        const query = supabase.from('empleados_info').select('rol_id')
          .eq('id', data.user.id).single()
          .then(({ data: p }) => (p?.rol_id ?? null) as number | null);
        rolId = await Promise.race([query, timeout]);
      } catch { /* go to dashboard */ }

      if (rolId === 1) router.push('/admin');
      else if (rolId === 3) router.push('/inspector');
      else router.push('/dashboard');

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
        setError('Email o contraseña incorrectos.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirma tu email antes de acceder.');
      } else {
        setError('No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) { setError('Introduce tu email primero.'); return; }
    setResetLoading(true);
    try {
      const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (e) throw e;
      setSuccessMsg(`✅ Enlace de recuperación enviado a ${email.trim()}.`);
    } catch {
      setError('No pudimos enviar el correo. Comprueba que el email es correcto.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh bg-bg-body">

      {/* ── Panel izquierdo (Desktop) ─────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden login-bg w-[46%] shrink-0">
        <div className="login-grid-lines" />

        {/* Orbs */}
        <div className="absolute -top-20 -right-20 w-[360px] h-[360px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.25)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.2)_0%,transparent_70%)] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
              <Clock className="w-[22px] h-[22px] text-white" />
            </div>
            <span className="text-white font-[family-name:var(--font-jakarta)] text-xl font-bold tracking-[-0.02em]">
              ChronoWork
            </span>
          </div>

          <h1 className="text-white font-[family-name:var(--font-jakarta)] text-[clamp(2rem,3.2vw,2.75rem)] font-extrabold tracking-[-0.04em] leading-[1.12] mb-5">
            Gestión horaria
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              inteligente
            </span>
          </h1>

          <p className="text-white/50 text-base leading-relaxed max-w-[340px] mb-8">
            Control de presencia seguro, transparente y conforme a la normativa laboral vigente.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Fichaje seguro', 'Face ID / Biometría', 'Reportes en tiempo real'].map((label) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/65 text-[0.8125rem] font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 border-t border-white/[0.08] pt-5">
          <small className="text-white/30 text-[0.8rem]">
            LOOM S.L. © 2026 · Extremadura · ISO 27001
          </small>
        </div>
      </div>

      {/* ── Panel derecho — Formulario ────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 md:p-8 relative min-h-dvh overflow-hidden">

        {/* Decorative orb mobile */}
        <div className="lg:hidden absolute -top-10 -right-10 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.07)_0%,transparent_70%)] pointer-events-none" />

        {/* Mobile header */}
        <div className="lg:hidden text-center mb-8 relative z-10 animate-fade-up">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy to-slate-dark flex items-center justify-center">
              <Clock className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-navy">
              ChronoWork
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Acceso de Empleado</p>
        </div>

        {/* ── BIOMETRIC OVERLAY (iOS frost) ────────────────────────────── */}
        {showBio && (
          <div className="fixed inset-0 z-50 bg-white/85 dark:bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-fade-in">
            <div
              className={cn(
                'w-24 h-24 rounded-full mb-6 flex items-center justify-center transition-colors duration-300',
                bioStatus === 'prompting' ? 'bg-ios-blue/12' : 'bg-[#FF3B30]/12'
              )}
              style={
                bioStatus === 'prompting'
                  ? { boxShadow: '0 0 0 10px rgba(0,122,255,0.06), 0 0 0 22px rgba(0,122,255,0.03)' }
                  : { boxShadow: '0 0 0 10px rgba(255,59,48,0.06), 0 0 0 22px rgba(255,59,48,0.03)' }
              }
            >
              <ScanFace className={cn('w-11 h-11', bioStatus === 'prompting' ? 'text-ios-blue' : 'text-[#FF3B30]')} />
            </div>

            <h3 className="cw-title-2 text-[--color-label-primary] dark:text-white text-center mb-1.5">
              {bioStatus === 'failed' ? 'No reconocido' : `Identifícate con ${platformName}`}
            </h3>
            <p className="text-[14px] text-[--color-label-secondary] dark:text-[#aeaeb2] text-center max-w-[280px] leading-relaxed mb-6">
              {bioStatus === 'failed'
                ? `Intento ${bioAttempts} de ${MAX_BIOMETRIC_ATTEMPTS}. Vuelve a intentarlo o usa tu contraseña.`
                : 'Sigue las instrucciones del dispositivo para acceder de forma segura.'}
            </p>

            {bioStatus === 'prompting' && (
              <div className="flex gap-1.5 mb-5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-ios-blue animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 w-full max-w-[280px]">
              {bioStatus === 'failed' && (
                <button
                  type="button"
                  onClick={triggerBiometric}
                  className="w-full h-12 rounded-[14px] bg-ios-blue text-white text-[15px] font-semibold border-none cursor-pointer hover:bg-[#0066D9] active:scale-[0.97] transition-all"
                  style={{ boxShadow: '0 4px 14px rgba(0,122,255,0.25)' }}
                >
                  Reintentar {platformName}
                </button>
              )}

              <button
                type="button"
                onClick={() => { setShowBio(false); setBioStatus('prompting'); }}
                className="w-full h-12 rounded-[14px] bg-systemGray-6 dark:bg-white/8 hover:bg-systemGray-5 dark:hover:bg-white/12 text-[--color-label-primary] dark:text-white text-[15px] font-medium border-none cursor-pointer transition-colors"
              >
                Usar contraseña
              </button>
            </div>
          </div>
        )}

        {/* ── FORM ─────────────────────────────────────────────────────── */}
        <div className="w-full max-w-[420px] relative z-10 animate-fade-up">

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h2 className="font-[family-name:var(--font-jakarta)] text-[1.875rem] font-extrabold text-navy tracking-[-0.03em] mb-1.5">
              Bienvenido de nuevo
            </h2>
            <p className="text-slate-500 text-[0.9375rem]">
              Introduce tus credenciales para acceder al panel.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 bg-red-500/[0.07] border border-red-500/20 text-red-700 text-sm font-medium animate-scale-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              {error}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 bg-emerald-500/[0.07] border border-emerald-500/20 text-emerald-700 text-sm font-medium animate-scale-in">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Card */}
          <div className="cw-reflective-card p-5 sm:p-7">
            <form onSubmit={handleLogin} noValidate>

              {/* Email */}
              <div className="mb-5">
                <label htmlFor="login-email" className="block text-[0.8125rem] font-semibold text-gray-700 mb-2 tracking-[0.01em]">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username webauthn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="nombre@empresa.es"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/60 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-all text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="login-pwd" className="text-[0.8125rem] font-semibold text-gray-700 tracking-[0.01em]">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    disabled={resetLoading}
                    onClick={handleForgot}
                    className="bg-transparent border-none p-0 text-[0.8125rem] font-medium text-chrono-blue cursor-pointer hover:text-blue-700 transition-colors disabled:opacity-50"
                  >
                    {resetLoading ? 'Enviando...' : '¿Olvidaste la contraseña?'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-pwd"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password webauthn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••••"
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl bg-gray-50/60 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-all text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPwd(!showPwd)}
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-0 top-0 bottom-0 w-11 bg-transparent border-none text-slate-400 cursor-pointer flex items-center justify-center hover:text-slate-600 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <div className="flex items-center gap-2.5 mb-5">
                <input
                  type="checkbox" id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-chrono-blue shrink-0 m-0 rounded"
                />
                <label htmlFor="remember-me" className="text-sm text-slate-500 cursor-pointer m-0">
                  Recordar mi email
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full py-3.5 rounded-xl font-bold text-[0.9375rem] tracking-[-0.01em] transition-all border-none',
                  loading
                    ? 'bg-gray-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-b from-navy to-slate-dark text-white cursor-pointer shadow-lg shadow-navy/25 hover:-translate-y-px hover:shadow-xl hover:shadow-navy/30'
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Accediendo...
                  </span>
                ) : 'Acceder al Panel'}
              </button>

              {/* Divider + Biometric */}
              {bioSupported && (
                <>
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200" />
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">o continúa con</span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200" />
                  </div>

                  <button
                    type="button"
                    onClick={triggerBiometric}
                    className="w-full py-3 rounded-xl bg-white/90 border-[1.5px] border-gray-200 text-navy text-sm font-semibold cursor-pointer flex items-center justify-center gap-2.5 transition-all hover:border-gray-300 hover:-translate-y-px hover:shadow-md backdrop-blur-sm"
                  >
                    <ScanFace className="w-[18px] h-[18px]" />
                    Entrar con {platformName}
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Footer */}
          <p className="text-center mt-6 text-xs text-slate-400">
            Acceso restringido a personal autorizado por LOOM S.L.
          </p>
        </div>
      </div>
    </div>
  );
}