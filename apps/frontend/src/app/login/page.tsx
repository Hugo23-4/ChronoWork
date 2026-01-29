'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Lógica del ojito
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        
        {/* =========================================================
            SECCIÓN IZQUIERDA (SOLO ESCRITORIO - BRANDING)
            Basado en Frame-1.png
           ========================================================= */}
        <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white" 
             style={{ backgroundColor: 'var(--loom-navy)' }}>
          
          {/* Logo y Tagline */}
          <div className="mt-5 pt-5 px-4">
            <h1 className="display-4 fw-bold mb-0">ChronoWork</h1>
            <div className="bg-primary mb-4 mt-2" style={{ height: '6px', width: '80px', borderRadius: '3px' }}></div>
            <p className="lead fs-4 fw-light opacity-75" style={{ maxWidth: '400px' }}>
              Gestión de presencia inteligente, segura y transparente.
            </p>
          </div>

          {/* Footer Corporativo */}
          <div className="px-4 mb-4 opacity-50 small">
            <div className="border-top border-light border-opacity-25 pt-4">
              <p className="mb-0 fw-bold">LOOM S.L. © 2026 • Extremadura</p>
              <p className="mb-0 font-monospace" style={{ fontSize: '0.75rem' }}>v2.0.1 Stable</p>
            </div>
          </div>
        </div>

        {/* =========================================================
            SECCIÓN DERECHA (FORMULARIO)
            Basado en Frame-1.png (Derecha) y Frame-1movil.png
           ========================================================= */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white position-relative">
          
          {/* Logo visible solo en Móvil */}
          <div className="d-lg-none position-absolute top-0 start-0 w-100 p-4 text-center">
             <h3 className="fw-bold text-primary">ChronoWork</h3>
          </div>

          <div className="w-100 p-4" style={{ maxWidth: '480px' }}>
            
            {/* Cabecera del Formulario */}
            <div className="mb-5">
              <h2 className="fw-bold text-dark mb-2">Bienvenido de nuevo</h2>
              <p className="text-secondary">Introduce tus credenciales corporativas para acceder.</p>
            </div>

            <form onSubmit={handleLogin}>
              {/* Input Email */}
              <div className="mb-4">
                <label className="form-label fw-bold small text-dark">Correo Electrónico</label>
                <input 
                  type="email" 
                  className="form-control form-control-lg bg-light border-0" 
                  placeholder="ejemplo@loom.es"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ fontSize: '0.95rem', padding: '12px 16px' }}
                  required 
                />
              </div>

              {/* Input Password con Ojo */}
              <div className="mb-4">
                <label className="form-label fw-bold small text-dark">Contraseña</label>
                <div className="input-group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="form-control form-control-lg bg-light border-0" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ fontSize: '0.95rem', padding: '12px 16px' }}
                    required 
                  />
                  <button 
                    className="btn btn-light border-0 text-secondary" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                  </button>
                </div>
              </div>

              {/* Checkbox y Olvidé contraseña */}
              <div className="d-flex justify-content-between align-items-center mb-5">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="rememberMe" />
                  <label className="form-check-label small text-secondary" htmlFor="rememberMe">
                    Recordar este dispositivo
                  </label>
                </div>
                <Link href="/recuperar" className="small fw-bold text-primary text-decoration-none">
                  ¿Olvidaste la contraseña?
                </Link>
              </div>

              {/* Mensaje de Error */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 p-2 small rounded-3">
                  <i className="bi bi-exclamation-octagon-fill"></i> {error}
                </div>
              )}

              {/* Botón Principal (Loom Navy) */}
              <button 
                type="submit" 
                className="btn btn-primary w-100 py-3 fw-bold mb-4 shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <span><span className="spinner-border spinner-border-sm me-2"></span>Accediendo...</span>
                ) : (
                  'Acceder al Panel'
                )}
              </button>

              {/* Badge SSL (Copia exacta de Frame-1.png) */}
              <div className="alert alert-info border-0 d-flex align-items-center gap-3 py-3 rounded-3" 
                   style={{ backgroundColor: '#F0F9FF', color: '#0369A1' }}>
                <i className="bi bi-shield-lock-fill fs-4"></i>
                <div style={{ lineHeight: '1.2' }}>
                  <small className="fw-bold d-block">Acceso Seguro SSL</small>
                  <small className="opacity-75" style={{ fontSize: '0.7rem' }}>
                    Tus datos están protegidos por normativa RGPD.
                  </small>
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}