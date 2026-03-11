'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { startAuthentication } from '@simplewebauthn/browser';

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const MAX_BIOMETRIC_ATTEMPTS = 2;
const BIOMETRIC_TIMEOUT_MS = 8000;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
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

// ─── PÁGINA ──────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const aborted = useRef(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Biometric state
  const [showBio, setShowBio] = useState(false);
  const [bioStatus, setBioStatus] = useState<'prompting' | 'failed'>('prompting');
  const [bioAttempts, setBioAttempts] = useState(0);
  const [platformName, setPlatformName] = useState('biometría');
  const [bioSupported, setBioSupported] = useState(false);

  // ── Init ────────────────────────────────────────────────────────────────────
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
    }).catch(() => { });

    return () => { aborted.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Biometría ───────────────────────────────────────────────────────────────
  const triggerBiometric = useCallback(async () => {
    if (aborted.current) return;
    setShowBio(true);
    setBioStatus('prompting');
    setError(null);

    const tid = setTimeout(() => { }, BIOMETRIC_TIMEOUT_MS);
    try {
      const optRes = await fetch('/api/auth/passkey/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: null }),
      });
      clearTimeout(tid);

      if (!optRes.ok) { setShowBio(false); return; }
      const options = await optRes.json();

      const assertion = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch('/api/auth/passkey/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: assertion }),
      });
      const result = await verifyRes.json();
      if (!verifyRes.ok || !result.verified) throw new Error(result.error ?? 'failed');

      if (result.access_token && result.refresh_token) {
        await supabase.auth.setSession({ access_token: result.access_token, refresh_token: result.refresh_token });
        router.push('/dashboard');
        return;
      }
      if (result.action_link) { window.location.href = result.action_link; return; }
      router.push('/dashboard');

    } catch (err: unknown) {
      clearTimeout(tid);
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
      } else {
        setBioStatus('failed');
      }
    }
  }, [bioAttempts, router]);

  // ── Email / Password ────────────────────────────────────────────────────────
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

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>

      {/* ── Panel izquierdo (Desktop) ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-6 relative overflow-hidden login-bg"
        style={{ width: '46%', flexShrink: 0 }}
      >
        {/* Grid lines decorativos */}
        <div className="login-grid-lines" />

        {/* Orbs de luz */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Contenido */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span style={{ color: 'white', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              ChronoWork
            </span>
          </div>

          <h1 style={{
            color: 'white', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
            fontSize: 'clamp(2rem, 3vw, 2.75rem)', fontWeight: 800,
            letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '1.25rem',
          }}>
            Gestión horaria<br />
            <span style={{
              background: 'linear-gradient(135deg, #60A5FA, #818CF8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              inteligente
            </span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', lineHeight: 1.65, maxWidth: 340 }}>
            Control de presencia seguro, transparente y conforme a la normativa laboral vigente.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {['Fichaje seguro', 'Face ID / Biometría', 'Reportes en tiempo real'].map((label) => (
              <span key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.8125rem', fontWeight: 500,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.09)', paddingTop: '1.25rem' }}>
          <small style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
            LOOM S.L. © 2026 · Extremadura · ISO 27001
          </small>
        </div>
      </div>

      {/* ── Panel derecho — Formulario ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative"
        style={{ background: '#F8FAFC', minHeight: '100vh', overflow: 'hidden' }}>

        {/* Fondo decorativo mobile */}
        <div className="lg:hidden" style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Header mobile */}
        <div className="lg:hidden text-center mb-4 anim-fade-up" style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #0F172A, #1E3A5F)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>
              ChronoWork
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: 4, marginBottom: 0 }}>
            Acceso de Empleado
          </p>
        </div>

        {/* ── BIOMETRIC OVERLAY ─────────────────────────────────────────────── */}
        {showBio && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(248,250,252,0.97)',
            backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
          }} className="anim-fade-in">
            {/* Icono animado */}
            <div style={{
              width: 100, height: 100, borderRadius: '50%', marginBottom: '1.75rem',
              background: bioStatus === 'prompting'
                ? 'linear-gradient(135deg, #0F172A, #1E3A5F)'
                : 'linear-gradient(135deg, #EF4444, #B91C1C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: bioStatus === 'prompting'
                ? '0 0 0 12px rgba(37,99,235,0.1), 0 0 0 24px rgba(37,99,235,0.05)'
                : '0 0 0 12px rgba(239,68,68,0.1), 0 0 0 24px rgba(239,68,68,0.04)',
              transition: 'all 0.4s ease',
            }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white"
                strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 9H9.01M15 9H15.01M9 15C9.83 15.67 10.83 16 12 16C13.17 16 14.17 15.67 15 15" />
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
              </svg>
            </div>

            <h3 style={{
              fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
              fontWeight: 700, fontSize: '1.375rem', color: '#0F172A',
              marginBottom: 8, letterSpacing: '-0.02em',
            }}>
              {bioStatus === 'failed' ? 'No reconocido' : `Identifícate con ${platformName}`}
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.9rem', textAlign: 'center', maxWidth: 260, lineHeight: 1.6, marginBottom: '1.75rem' }}>
              {bioStatus === 'failed'
                ? `Intento ${bioAttempts} de ${MAX_BIOMETRIC_ATTEMPTS}. Vuelve a intentarlo.`
                : 'Sigue las instrucciones del dispositivo para acceder de forma segura.'}
            </p>

            {bioStatus === 'prompting' && (
              <div className="flex gap-2 mb-4">
                {[0, 1, 2].map((i) => (
                  <div key={i}
                    style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', animationDelay: `${i * 0.2}s` }}
                    className="animate-pulse animate-pulse w-2 h-2 text-chrono-blue" />
                ))}
              </div>
            )}

            {bioStatus === 'failed' && (
              <button type="button" onClick={triggerBiometric}
                className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none px-6 py-3 rounded-full font-bold mb-3">
                Reintentar {platformName}
              </button>
            )}

            <button type="button"
              onClick={() => { setShowBio(false); setBioStatus('prompting'); }}
              style={{
                background: 'none', border: '1px solid #E2E8F0', borderRadius: 10,
                padding: '10px 20px', color: '#64748B', fontSize: '0.875rem', fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              Usar contraseña en su lugar
            </button>
          </div>
        )}

        {/* ── FORMULARIO ────────────────────────────────────────────────────── */}
        <div className="w-full anim-fade-up" style={{ maxWidth: 420, position: 'relative', zIndex: 1 }}>

          {/* Heading desktop */}
          <div className="hidden lg:block mb-4">
            <h2 style={{
              fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
              fontSize: '1.875rem', fontWeight: 800, color: '#0F172A',
              letterSpacing: '-0.03em', marginBottom: 6,
            }}>
              Bienvenido de nuevo
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.9375rem', marginBottom: 0 }}>
              Introduce tus credenciales para acceder al panel.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="anim-scale-in" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 12, marginBottom: '1.25rem',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#B91C1C', fontSize: '0.875rem', fontWeight: 500,
            }}>
              <i className="bi bi-exclamation-circle-fill" style={{ color: '#EF4444', flexShrink: 0 }} />
              {error}
            </div>
          )}
          {successMsg && (
            <div className="anim-scale-in" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 12, marginBottom: '1.25rem',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              color: '#065F46', fontSize: '0.875rem', fontWeight: 500,
            }}>
              <i className="bi bi-check-circle-fill" style={{ color: '#10B981', flexShrink: 0 }} />
              {successMsg}
            </div>
          )}

          {/* ── Card glassmorphism ── */}
          <div className="cw-reflective-card p-4 sm:p-6">

            <form onSubmit={handleLogin} noValidate>

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="login-email" style={{
                  display: 'block', fontSize: '0.8125rem', fontWeight: 600,
                  color: '#374151', marginBottom: 8, letterSpacing: '0.01em',
                }}>
                  Correo Electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: '#94A3B8', pointerEvents: 'none',
                  }}>
                    <i className="bi bi-envelope" style={{ fontSize: '0.9rem' }} />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="nombre@empresa.es"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="login-pwd" style={{
                    fontSize: '0.8125rem', fontWeight: 600, color: '#374151', letterSpacing: '0.01em',
                  }}>
                    Contraseña
                  </label>
                  <button
                    type="button"
                    disabled={resetLoading}
                    onClick={handleForgot}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      fontSize: '0.8125rem', fontWeight: 500, color: '#2563EB', cursor: 'pointer',
                    }}>
                    {resetLoading ? 'Enviando...' : '¿Olvidaste la contraseña?'}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: '#94A3B8', pointerEvents: 'none',
                  }}>
                    <i className="bi bi-lock" style={{ fontSize: '0.9rem' }} />
                  </div>
                  <input
                    id="login-pwd"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••••"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm"
                    style={{ paddingLeft: 40, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPwd(!showPwd)}
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    style={{
                      position: 'absolute', right: 0, top: 0, bottom: 0, width: 44,
                      background: 'none', border: 'none', color: '#94A3B8',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#475569')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                  >
                    <i className={`bi bi-${showPwd ? 'eye-slash-fill' : 'eye-fill'}`} />
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox" id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-chrono-blue"
                  style={{ width: 16, height: 16, accentColor: '#2563EB', flexShrink: 0, margin: 0 }}
                />
                <label htmlFor="remember-me" style={{ fontSize: '0.875rem', color: '#64748B', cursor: 'pointer', marginBottom: 0 }}>
                  Recordar mi email
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full font-bold"
                style={{
                  padding: '13px 24px', borderRadius: 12, border: 'none',
                  background: loading
                    ? '#E2E8F0'
                    : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  color: loading ? '#94A3B8' : 'white',
                  fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.01em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(15,23,42,0.25)',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin animate-spin w-4 h-4" style={{ width: 16, height: 16, borderWidth: 2 }} aria-hidden="true" />
                    Accediendo...
                  </span>
                ) : 'Acceder al Panel'}
              </button>

              {/* Divisor */}
              {bioSupported && (
                <>
                  <div className="flex items-center gap-3 my-4">
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #E2E8F0)' }} />
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      o continúa con
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #E2E8F0, transparent)' }} />
                  </div>

                  {/* Biometric button */}
                  <button
                    type="button"
                    onClick={triggerBiometric}
                    style={{
                      width: '100%', padding: '12px 24px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.9)',
                      border: '1.5px solid #E2E8F0',
                      color: '#0F172A', fontSize: '0.875rem', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 10,
                      transition: 'all 0.2s',
                      backdropFilter: 'blur(8px)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 9H9.01M15 9H15.01M9 15C9.83 15.67 10.83 16 12 16C13.17 16 14.17 15.67 15 15" />
                      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                    </svg>
                    Entrar con {platformName}
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: '#94A3B8' }}>
            Acceso restringido a personal autorizado por LOOM S.L.
          </p>
        </div>
      </div>
    </div>
  );
}