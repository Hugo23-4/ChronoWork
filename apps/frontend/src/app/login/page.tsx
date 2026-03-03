'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { startAuthentication } from '@simplewebauthn/browser';

// Cuántos fallos biométricos antes de mostrar el formulario directamente
const MAX_BIOMETRIC_ATTEMPTS = 2;

type BiometricState = 'checking' | 'prompting' | 'failed' | 'show-form';

export default function LoginPage() {
  const router = useRouter();

  // ── Biometría ──────────────────────────────────────────────────────────
  const [biometricState, setBiometricState] = useState<BiometricState>('checking');
  const [biometricAttempts, setBiometricAttempts] = useState(0);
  const [hasPasskey, setHasPasskey] = useState(false);

  // ── Formulario ─────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ── Intentar autenticación biométrica ──────────────────────────────────
  const attemptBiometric = useCallback(async () => {
    setBiometricState('prompting');
    try {
      const optRes = await fetch('/api/auth/passkey/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: null }),
      });
      if (!optRes.ok) throw new Error('options-failed');
      const options = await optRes.json();

      // Lanza el diálogo nativo de Face ID / Huella
      const assertion = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch('/api/auth/passkey/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: assertion }),
      });
      const result = await verifyRes.json();
      if (!verifyRes.ok || !result.verified) {
        throw new Error(result.error ?? 'Verificación biométrica fallida');
      }

      // Éxito — Supabase devuelve un action_link (magic link del admin)
      // Redirigir a él crea la sesión real sin necesidad de email
      if (result.action_link) {
        window.location.href = result.action_link;
      } else {
        // Fallback: ir al dashboard (layouts redirigirán si no hay sesión)
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : '';
      const message = err instanceof Error ? err.message : '';

      const newAttempts = biometricAttempts + 1;
      setBiometricAttempts(newAttempts);

      // El usuario canceló voluntariamente → ir al formulario
      if (name === 'NotAllowedError') {
        setBiometricState('show-form');
        return;
      }

      // No hay passkeys registradas → ir al formulario silenciosamente
      if (message === 'options-failed' || message.includes('404') || message.includes('no credentials')) {
        setBiometricState('show-form');
        return;
      }

      // Máximo de intentos alcanzado → formulario
      if (newAttempts >= MAX_BIOMETRIC_ATTEMPTS) {
        setBiometricState('show-form');
      } else {
        setBiometricState('failed');
      }
    }
  }, [biometricAttempts, router]);

  // ── Al montar: detectar soporte y disparar automáticamente ─────────────
  useEffect(() => {
    const savedEmail = localStorage.getItem('chrono_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('session') === 'expired') {
      setError('⏰ Tu sesión ha expirado. Vuelve a iniciar sesión.');
      setBiometricState('show-form');
      return;
    }

    // ¿El dispositivo soporta WebAuthn con autenticador de plataforma?
    const tryBiometric = async () => {
      if (
        typeof window === 'undefined' ||
        !window.PublicKeyCredential ||
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function'
      ) {
        setBiometricState('show-form');
        return;
      }

      const available = await window.PublicKeyCredential
        .isUserVerifyingPlatformAuthenticatorAvailable()
        .catch(() => false);

      // Comprobamos si hay passkey guardada en localStorage (set al registrar)
      const savedPasskey = localStorage.getItem('chrono_has_passkey') === 'true';

      if (available && savedPasskey) {
        setHasPasskey(true);
        await attemptBiometric();
      } else {
        setBiometricState('show-form');
      }
    };

    tryBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login con email/password ────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (rememberMe) {
        localStorage.setItem('chrono_saved_email', email);
      } else {
        localStorage.removeItem('chrono_saved_email');
      }

      const { data: profile } = await supabase
        .from('empleados_info')
        .select('rol_id')
        .eq('id', data.user.id)
        .single();

      const rolId = profile?.rol_id;
      if (rolId === 1) router.push('/admin');
      else if (rolId === 3) router.push('/inspector');
      else router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
        setError('Email o contraseña incorrectos. Comprueba tus credenciales.');
      } else {
        setError('No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Introduce tu email primero para recuperar la contraseña.');
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccessMsg(`✅ Hemos enviado un enlace de recuperación a ${email}.`);
    } catch {
      setError('No hemos podido enviar el correo. Comprueba que el email es correcto.');
    } finally {
      setResetLoading(false);
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid vh-100 overflow-hidden bg-white">
      <div className="row h-100">

        {/* ── COLUMNA IZQUIERDA DESKTOP ── */}
        <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white"
          style={{ backgroundColor: '#0F172A' }}>
          <div className="mt-5">
            <h1 className="fw-bold display-4 mb-3">ChronoWork</h1>
            <div style={{ width: '80px', height: '6px', backgroundColor: '#2563EB', borderRadius: '4px' }}></div>
            <p className="mt-4 fs-4 fw-light text-white-50" style={{ maxWidth: '400px' }}>
              Gestión de presencia inteligente, segura y transparente.
            </p>
          </div>
          <div className="border-top border-secondary border-opacity-25 pt-4">
            <small className="text-white-50">LOOM S.L. © 2026 • Extremadura</small>
          </div>
        </div>

        {/* ── COLUMNA DERECHA ── */}
        <div className="col-lg-6 d-flex flex-column align-items-center justify-content-center bg-white p-4 position-relative">

          {/* Header Móvil */}
          <div className="d-lg-none text-center mb-5">
            <h2 className="fw-bold text-dark display-6 mb-1">ChronoWork</h2>
            <p className="text-secondary">Acceso de Empleado</p>
          </div>

          <div className="w-100" style={{ maxWidth: '420px' }}>

            {/* ── PANTALLA BIOMÉTRICA (auto-trigger) ── */}
            {(biometricState === 'checking' || biometricState === 'prompting') && (
              <div className="text-center py-4 animate__animated animate__fadeIn">
                {/* Icono animado */}
                <div
                  className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: 96, height: 96,
                    background: 'linear-gradient(135deg, #0F172A, #1E3A5F)',
                    boxShadow: biometricState === 'prompting'
                      ? '0 0 0 12px rgba(37,99,235,0.15), 0 0 0 24px rgba(37,99,235,0.07)'
                      : 'none',
                    transition: 'box-shadow 0.6s ease',
                  }}
                >
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white"
                    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 9H9.01M15 9H15.01M9 15C9.83 15.67 10.83 16 12 16C13.17 16 14.17 15.67 15 15" />
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  </svg>
                </div>

                <h2 className="fw-bold text-dark mb-1">
                  {biometricState === 'checking' ? 'Comprobando...' : 'Identificación biométrica'}
                </h2>
                <p className="text-secondary small mb-4">
                  {biometricState === 'checking'
                    ? 'Detectando dispositivo'
                    : 'Usa Face ID o tu huella dactilar para entrar'}
                </p>

                {biometricState === 'prompting' && (
                  <div className="d-flex justify-content-center mb-4">
                    <div className="spinner-grow spinner-grow-sm text-primary me-1" style={{ animationDelay: '0s' }}></div>
                    <div className="spinner-grow spinner-grow-sm text-primary me-1" style={{ animationDelay: '0.15s' }}></div>
                    <div className="spinner-grow spinner-grow-sm text-primary" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setBiometricState('show-form')}
                  className="btn btn-link text-secondary text-decoration-none small"
                >
                  Usar contraseña en su lugar
                </button>
              </div>
            )}

            {/* ── PANTALLA FALLO BIOMÉTRICO (con reintento) ── */}
            {biometricState === 'failed' && (
              <div className="text-center py-4 animate__animated animate__fadeIn">
                <div
                  className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 96, height: 96, background: '#FEF2F2' }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 9H9.01M15 9H15.01M9 15C9.83 15.67 10.83 16 12 16C13.17 16 14.17 15.67 15 15" />
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  </svg>
                </div>
                <h2 className="fw-bold text-dark mb-1">No reconocido</h2>
                <p className="text-secondary small mb-4">
                  Intento {biometricAttempts} de {MAX_BIOMETRIC_ATTEMPTS}. Vuelve a intentarlo.
                </p>
                <button
                  type="button"
                  onClick={attemptBiometric}
                  className="btn btn-dark rounded-pill px-4 py-2 fw-bold mb-3 w-100"
                >
                  Reintentar
                </button>
                <button
                  type="button"
                  onClick={() => setBiometricState('show-form')}
                  className="btn btn-link text-secondary text-decoration-none small d-block"
                >
                  Usar contraseña
                </button>
              </div>
            )}

            {/* ── FORMULARIO EMAIL/PASSWORD ── */}
            {biometricState === 'show-form' && (
              <div className="animate__animated animate__fadeIn">
                {/* Títulos Desktop */}
                <div className="d-none d-lg-block mb-4">
                  <h2 className="fw-bold text-dark">Bienvenido de nuevo</h2>
                  <p className="text-secondary">Introduce tus credenciales corporativas.</p>
                </div>

                {/* Alertas */}
                {error && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 small py-2 rounded-3 mb-4 animate__animated animate__shakeX">
                    <i className="bi bi-exclamation-circle-fill" aria-hidden="true"></i> {error}
                  </div>
                )}
                {successMsg && (
                  <div className="alert alert-success d-flex align-items-center gap-2 small py-2 rounded-3 mb-4">
                    <i className="bi bi-check-circle-fill" aria-hidden="true"></i> {successMsg}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="mb-4">
                    <label className="form-label fw-bold small text-dark">Correo Electrónico</label>
                    <input
                      type="email"
                      className="form-control form-control-lg bg-light border-0 fs-6 py-3"
                      placeholder="ejemplo@loom.es"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold small text-dark">Contraseña</label>
                    <div className="position-relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control form-control-lg bg-light border-0 fs-6 py-3 pe-5"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="btn position-absolute top-50 end-0 translate-middle-y text-secondary border-0 z-1"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ paddingRight: '15px' }}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <label className="form-check-label small text-secondary cursor-pointer" htmlFor="remember">
                        Recordar usuario
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="btn btn-link small text-primary fw-bold text-decoration-none p-0 border-0"
                      disabled={resetLoading}
                    >
                      {resetLoading ? 'Enviando...' : '¿Olvidaste la contraseña?'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-3 rounded-3 fw-bold mb-3"
                    disabled={loading}
                    style={{ backgroundColor: '#0F172A', borderColor: '#0F172A' }}
                  >
                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Acceder al Panel'}
                  </button>

                  {/* Botón volver a biometría si falló */}
                  {hasPasskey && (
                    <button
                      type="button"
                      onClick={attemptBiometric}
                      className="btn btn-outline-secondary w-100 rounded-3 fw-bold mb-4 d-flex align-items-center justify-content-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 9H9.01M15 9H15.01M9 15C9.83 15.67 10.83 16 12 16C13.17 16 14.17 15.67 15 15" />
                        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                      </svg>
                      Usar Face ID / Huella
                    </button>
                  )}

                  {/* Badge SSL */}
                  <div className="d-none d-lg-flex alert alert-info bg-opacity-10 border-info border-opacity-25 align-items-center gap-3 rounded-3">
                    <i className="bi bi-lock-fill text-info fs-5" aria-hidden="true"></i>
                    <div className="small text-secondary" style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>
                      <strong className="d-block text-info">Acceso Seguro SSL</strong>
                      Tus datos están protegidos por normativa RGPD.
                    </div>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}