'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  // Estados del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Estados de interfaz (UI)
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // 1. EFECTO: AL CARGAR, MIRAR SI HAY EMAIL GUARDADO
  useEffect(() => {
    const savedEmail = localStorage.getItem('chrono_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // 2. FUNCIÓN DE LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Intentamos iniciar sesión
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // LÓGICA DE RECORDAR USUARIO
      if (rememberMe) {
        localStorage.setItem('chrono_saved_email', email);
      } else {
        localStorage.removeItem('chrono_saved_email');
      }

      // Check role to redirect properly
      const { data: empData } = await supabase
        .from('empleados_info')
        .select('rol, rol_id')
        .eq('id', data.user?.id)
        .single();

      if (empData?.rol === 'inspector' || empData?.rol_id === 3) {
        // Inspector goes to inspector portal
        router.push('/inspector');
      } else {
        // Everyone else goes to employee dashboard
        localStorage.setItem('chronowork_view_mode', 'personal');
        router.push('/dashboard');
      }

    } catch (err: any) {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  // 3. FUNCIÓN DE "OLVIDÉ MI CONTRASEÑA"
  const handleForgotPassword = async () => {
    // Validamos que haya escrito algo en el correo
    if (!email) {
      setError('Por favor, escribe tu correo electrónico en el campo de arriba para poder recuperarla.');
      return;
    }

    setResetLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setSuccessMsg(`✅ Hemos enviado un enlace de recuperación a ${email}. Revisa tu bandeja de entrada.`);
    } catch (err: any) {
      setError('Error al enviar recuperación: ' + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 overflow-hidden bg-white">
      <div className="row h-100">

        {/* =======================================================
            COLUMNA IZQUIERDA (SOLO DESKTOP)
           ======================================================= */}
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

        {/* =======================================================
            COLUMNA DERECHA (LOGIN FORM)
           ======================================================= */}
        <div className="col-lg-6 d-flex flex-column align-items-center justify-content-center bg-white p-4 position-relative">

          {/* Header Móvil */}
          <div className="d-lg-none text-center mb-5">
            <h2 className="fw-bold text-dark display-6 mb-1">ChronoWork</h2>
            <p className="text-secondary">Acceso de Empleado</p>
          </div>

          <div className="w-100" style={{ maxWidth: '420px' }}>

            {/* Títulos Desktop */}
            <div className="d-none d-lg-block mb-4">
              <h2 className="fw-bold text-dark">Bienvenido de nuevo</h2>
              <p className="text-secondary">Introduce tus credenciales corporativas.</p>
            </div>

            {/* ALERTAS DE ESTADO */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 small py-2 rounded-3 mb-4 animate__animated animate__shakeX">
                <i className="bi bi-exclamation-circle-fill"></i> {error}
              </div>
            )}

            {successMsg && (
              <div className="alert alert-success d-flex align-items-center gap-2 small py-2 rounded-3 mb-4">
                <i className="bi bi-check-circle-fill"></i> {successMsg}
              </div>
            )}

            <form onSubmit={handleLogin}>
              {/* Input Email */}
              <div className="mb-4">
                <label className="form-label fw-bold small text-dark">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-control form-control-lg bg-light border-0 fs-6 py-3"
                  placeholder="ejemplo@loom.es"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Input Contraseña */}
              <div className="mb-4">
                <label className="form-label fw-bold small text-dark">Contraseña</label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control form-control-lg bg-light border-0 fs-6 py-3 pe-5"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn position-absolute top-50 end-0 translate-middle-y text-secondary border-0 z-1"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ paddingRight: '15px' }}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                  </button>
                </div>
              </div>

              {/* Opciones Extra: Recordar y Olvido */}
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

                {/* Botón funcional de Olvidé contraseña */}
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="btn btn-link small text-primary fw-bold text-decoration-none p-0 border-0"
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Enviando...' : '¿Olvidaste la contraseña?'}
                </button>
              </div>

              {/* Botón Principal */}
              <button
                type="submit"
                className="btn btn-primary w-100 py-3 rounded-3 fw-bold mb-4"
                disabled={loading}
                style={{ backgroundColor: '#0F172A', borderColor: '#0F172A' }}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Acceder al Panel'}
              </button>

              {/* FACE ID (Solo visual Móvil) */}
              <div className="d-lg-none text-center mb-4">
                <button type="button" className="btn btn-link text-decoration-none d-flex flex-column align-items-center gap-1 mx-auto text-secondary">
                  <i className="bi bi-person-bounding-box fs-3 text-warning"></i>
                  <small className="fw-bold text-primary">Usar Face ID</small>
                </button>
              </div>

              {/* Badge de Seguridad */}
              <div className="d-none d-lg-flex alert alert-info bg-opacity-10 border-info border-opacity-25 align-items-center gap-3 rounded-3">
                <i className="bi bi-lock-fill text-info fs-5"></i>
                <div className="small text-secondary" style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>
                  <strong className="d-block text-info">Acceso Seguro SSL</strong>
                  Tus datos están protegidos por normativa RGPD.
                </div>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}