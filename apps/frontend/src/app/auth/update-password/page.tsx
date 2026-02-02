'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // NUEVO: Estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);

  // Verificamos si el usuario ha llegado aquí autenticado (via link de correo)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Si no hay sesión, es que el link caducó o no es válido
        router.push('/login');
      }
    });
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      alert('¡Contraseña actualizada correctamente!');
      router.push('/dashboard'); 
      
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card border-0 shadow-lg rounded-4 p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold text-dark">Nueva Contraseña</h2>
          <p className="text-muted small">Introduce tu nueva clave de acceso.</p>
        </div>

        {message && <div className="alert alert-danger small">{message}</div>}

        <form onSubmit={handleUpdate}>
          <div className="mb-4">
            <label className="form-label fw-bold small text-dark">Nueva Contraseña</label>
            
            {/* INPUT CON BOTÓN DE OJO */}
            <div className="position-relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-control form-control-lg bg-light border-0 pe-5" // pe-5 deja espacio al botón
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button 
                  type="button"
                  className="btn position-absolute top-50 end-0 translate-middle-y text-secondary border-0 z-1"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ paddingRight: '15px' }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} fs-5`}></i>
                </button>
            </div>
            <div className="form-text small mt-2 ms-1">
               Mínimo 6 caracteres.
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-3 rounded-3 fw-bold mb-3"
            disabled={loading}
            style={{ backgroundColor: '#0F172A', borderColor: '#0F172A' }}
          >
            {loading ? (
                <span><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</span>
            ) : 'Guardar Nueva Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}