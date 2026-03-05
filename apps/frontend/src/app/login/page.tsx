'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { startAuthentication } from '@simplewebauthn/browser';

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const MAX_BIOMETRIC_ATTEMPTS = 2;
const BIOMETRIC_API_TIMEOUT_MS = 8000; // Si las APIs tardan más de 8s, cancelamos

// ─── HELPERS ─────────────────────────────────────────────────────────────────
async function checkBiometricSupport(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    return await Promise.race([
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 2000)
      ),
    ]);
  } catch {
    return false;
  }
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
  const biometricAborted = useRef(false);

  // Estado del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estado biométrico — SIEMPRE empieza en show-form para que el login funcione
  const [showBiometricOverlay, setShowBiometricOverlay] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'prompting' | 'failed'>('idle');
  const [biometricAttempts, setBiometricAttempts] = useState(0);
  const [platformName, setPlatformName] = useState('biometría');
  const [biometricSupported, setBiometricSupported] = useState(false);

  // ── Inicialización ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Restaurar email guardado
    const saved = localStorage.getItem('chrono_saved_email');
    if (saved) { setEmail(saved); setRememberMe(true); }

    // Session expired param
    const params = new URLSearchParams(window.location.search);
    if (params.get('session') === 'expired') {
      setError('⏰ Tu sesión ha expirado. Vuelve a iniciar sesión.');
    }

    setPlatformName(getPlatformName());

    // Comprobar soporte biométrico en background — sin bloquear el UI
    const hasPasskeyFlag = localStorage.getItem('chrono_has_passkey') === 'true';
    checkBiometricSupport().then((supported) => {
      setBiometricSupported(supported);
      // Solo mostrar overlay biométrico automático si:
      // 1. El dispositivo lo soporta
      // 2. El usuario ya registró una passkey en este dispositivo (flag)
      if (supported && hasPasskeyFlag && !biometricAborted.current) {
        triggerBiometric();
      }
    }).catch(() => {
      // Si falla la detección, el formulario ya está visible
    });

    return () => { biometricAborted.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Flujo biométrico ────────────────────────────────────────────────────────
  const triggerBiometric = useCallback(async () => {
    if (biometricAborted.current) return;
    setShowBiometricOverlay(true);
    setBiometricStatus('prompting');
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BIOMETRIC_API_TIMEOUT_MS);

    try {
      // 1. Obtener opciones
      const optRes = await fetch('/api/auth/passkey/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: null }),
        signal: controller.signal,
      });

      if (!optRes.ok) {
        // No hay ruta o error de server → cerrar overlay silenciosamente
        setShowBiometricOverlay(false);
        setBiometricStatus('idle');
        return;
      }

      const options = await optRes.json();
      clearTimeout(timeoutId);

      // 2. Disparar Face ID / Touch ID / Windows Hello
      const assertion = await startAuthentication({ optionsJSON: options });

      // 3. Verificar
      const verifyRes = await fetch('/api/auth/passkey/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: assertion }),
      });

      const result = await verifyRes.json();

      if (!verifyRes.ok || !result.verified) {
        throw new Error(result.error ?? 'Verificación fallida');
      }

      // 4. Crear sesión
      if (result.access_token && result.refresh_token) {
        await supabase.auth.setSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        });
        router.push('/dashboard');
        return;
      }
      if (result.action_link) {
        window.location.href = result.action_link;
        return;
      }
      router.push('/dashboard');

    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const name = err instanceof Error ? err.name : '';

      // El usuario canceló → cerrar overlay y mostrar formulario
      if (name === 'NotAllowedError' || name === 'AbortError') {
        setShowBiometricOverlay(false);
        setBiometricStatus('idle');
        return;
      }

      // Error de red / servidor → cerrar overlay
      if (name === 'TypeError') {
        setShowBiometricOverlay(false);
        setBiometricStatus('idle');
        return;
      }

      // Fallo de verificación → contar intento
      const newAttempts = biometricAttempts + 1;
      setBiometricAttempts(newAttempts);

      if (newAttempts >= MAX_BIOMETRIC_ATTEMPTS) {
        // Demasiados fallos → mostrar formulario
        setShowBiometricOverlay(false);
        setBiometricStatus('idle');
        // Limpiar el flag para que no vuelva a auto-dispararse
        localStorage.removeItem('chrono_has_passkey');
      } else {
        setBiometricStatus('failed');
      }
    }
  }, [biometricAttempts, router]);

  // ── Login con email/password ────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Evitar doble-submit
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;

      if (rememberMe) localStorage.setItem('chrono_saved_email', email.trim());
      else localStorage.removeItem('chrono_saved_email');

      // Detectar rol con timeout de 4s
      let rolId: number | null = null;
      try {
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
        const query = supabase
          .from('empleados_info')
          .select('rol_id')
          .eq('id', data.user.id)
          .single()
          .then(({ data: p }) => (p?.rol_id ?? null) as number | null);
        rolId = await Promise.race([query, timeout]);
      } catch {
        // Si falla la query de rol, va al dashboard por defecto
      }

      if (rolId === 1) router.push('/admin');
      else if (rolId === 3) router.push('/inspector');
      else router.push('/dashboard');

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
        setError('Email o contraseña incorrectos.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirma tu email antes de iniciar sesión.');
      } else {
        setError('No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
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
    <div className="container-fluid vh-100 overflow-hidden bg-white">
      <div className="row h-100">

        {/* Columna izquierda — solo desktop */}
        <div
          className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white"
          style={{ backgroundColor: '#0F172A' }}
        >
          <div className="mt-5">
            <h1 className="fw-bold display-4 mb-3">ChronoWork</h1>
            <div style={{ width: '80px', height: '6px', backgroundColor: '#2563EB', borderRadius: '4px' }} />
            <p className="mt-4 fs-4 fw-light text-white-50" style={{ maxWidth: '400px' }}>
              Gestión de presencia inteligente, segura y transparente.
            </p>
          </div>
          <div className="border-top border-secondary border-opacity-25 pt-4">
            <small className="text-white-50">LOOM S.L. © 2026 • Extremadura</small>
          </div>
        </div>

        {/* Columna derecha — formulario */}
        <div className="col-lg-6 d-flex flex-column align-items-center justify-content-center bg-white p-4 position-relative">

          {/* Header móvil */}
          <div className="d-lg-none text-center mb-5">
            <h2 className="fw-bold text-dark display-6 mb-1">ChronoWork</h2>
            <p className="text-secondary">Acceso de Empleado</p>
          </div>

          {/* ── OVERLAY BIOMÉTRICO (encima del formulario) ── */}
          {showBiometricOverlay && (
            <div
              className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
              style={{ background: 'rgba(255,255,255,0.97)', zIndex: 10 }}
            >
              <div
                className="mb-4 d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 96, height: 96,
                  background: 'linear-gradient(135deg, #0F172A, #1E3A5F)',
                  boxShadow: biometricStatus === 'prompting'
                    ? '0 0 0 12px rgba(37,99,235,0.15), 0 0 0 24px rgba(37,99,235,0.07)'
                    : '0 0 0 8px rgba(239,68,68,0.12)',
                  transition: 'box-shadow 0.5s ease',
                }}
              >
                {biometricStatus === 'failed' ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 9H9.01M15 9H15.01M9 15h6" />
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                  </svg>
                ) : (
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 9H9.01M15 9H15.01M9 15C9.83 15.67 10.83 16 12 16C13.17 16 14.17 15.67 15 15" />
                    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                  </svg>
                )}
              </div>

              <h3 className="fw-bold text-dark mb-1">
                {biometricStatus === 'failed' ? 'No reconocido' : 'Identifícate'}
              </h3>
              <p className="text-secondary small mb-4 text-center" style={{ maxWidth: 260 }}>
                {biometricStatus === 'failed'
                  ? `Intento ${biometricAttempts} de ${MAX_BIOMETRIC_ATTEMPTS}`
                  : `Usa ${platformName} para acceder`}
              </p>

              {biometricStatus === 'prompting' && (
                <div className="d-flex gap-1 mb-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="spinner-grow spinner-grow-sm text-primary" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              )}

              {biometricStatus === 'failed' && (
                <button
                  type="button"
                  onClick={triggerBiometric}
                  className="btn btn-dark rounded-pill px-4 py-2 fw-bold mb-3"
                >
                  Reintentar {platformName}
                </button>
              )}

              <button
                type="button"
                onClick={() => { setShowBiometricOverlay(false); setBiometricStatus('idle'); }}
                className="btn btn-link text-secondary text-decoration-none small"
              >
                Usar contraseña
              </button>
            </div>
          )}

          {/* ── FORMULARIO (siempre renderizado, solo cubierto por overlay) ── */}
          <div className="w-100" style={{ maxWidth: '420px' }}>
            <div className="d-none d-lg-block mb-4">
              <h2 className="fw-bold text-dark">Bienvenido de nuevo</h2>
              <p className="text-secondary">Introduce tus credenciales corporativas.</p>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 small py-2 rounded-3 mb-4" role="alert">
                <i className="bi bi-exclamation-circle-fill" aria-hidden="true" /> {error}
              </div>
            )}
            {successMsg && (
              <div className="alert alert-success d-flex align-items-center gap-2 small py-2 rounded-3 mb-4" role="alert">
                <i className="bi bi-check-circle-fill" aria-hidden="true" /> {successMsg}
              </div>
            )}

            <form onSubmit={handleLogin} noValidate>
              <div className="mb-4">
                <label className="form-label fw-bold small text-dark" htmlFor="email">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="form-control form-control-lg bg-light border-0 fs-6 py-3"
                  placeholder="ejemplo@loom.es"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold small text-dark" htmlFor="password">
                  Contraseña
                </label>
                <div className="position-relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="form-control form-control-lg bg-light border-0 fs-6 py-3 pe-5"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="btn position-absolute top-50 end-0 translate-middle-y text-secondary border-0"
                    style={{ paddingRight: '15px', zIndex: 2 }}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="form-check-label small text-secondary" htmlFor="remember">
                    Recordar usuario
                  </label>
                </div>
                <button
                  type="button"
                  disabled={resetLoading}
                  onClick={handleForgotPassword}
                  className="btn btn-link small text-primary fw-bold text-decoration-none p-0 border-0"
                >
                  {resetLoading ? 'Enviando...' : '¿Olvidaste la contraseña?'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn w-100 py-3 rounded-3 fw-bold mb-3"
                style={{ backgroundColor: '#0F172A', color: 'white', border: 'none' }}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Accediendo...</>
                  : 'Acceder al Panel'}
              </button>

              {/* Botón biométrico — solo visible si el dispositivo lo soporta */}
              {biometricSupported && (
                <button
                  type="button"
                  onClick={triggerBiometric}
                  className="btn btn-outline-secondary w-100 rounded-3 fw-semibold mb-4 d-flex align-items-center justify-content-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 9H9.01M15 9H15.01M9 15C9.83 15.67 10.83 16 12 16C13.17 16 14.17 15.67 15 15" />
                    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                  </svg>
                  Entrar con {platformName}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}