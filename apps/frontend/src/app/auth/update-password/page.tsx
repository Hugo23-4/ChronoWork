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
    <div className="container flex items-center justify-center h-screen bg-gray-50">
      <div className="card border-0 shadow-lg rounded-2xl p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-4">
          <h2 className="font-bold text-navy">Nueva Contraseña</h2>
          <p className="text-slate-400 text-sm">Introduce tu nueva clave de acceso.</p>
        </div>

        {message && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm text-sm">{message}</div>}

        <form onSubmit={handleUpdate}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-bold text-sm text-navy">Nueva Contraseña</label>
            
            {/* INPUT CON BOTÓN DE OJO */}
            <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm form-control-lg bg-gray-50 border-0 pe-5" // pe-5 deja espacio al botón
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button 
                  type="button"
                  className="btn absolute top-1/2 right-0 -translate-y-1/2 text-slate-500 border-0 z-1"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ paddingRight: '15px' }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-lg`}></i>
                </button>
            </div>
            <div className="form-text text-sm mt-2 ml-1">
               Mínimo 6 caracteres.
            </div>
          </div>

          <button 
            type="submit" 
            className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none w-full py-3 rounded-lg font-bold mb-3"
            disabled={loading}
            style={{ backgroundColor: '#0F172A', borderColor: '#0F172A' }}
          >
            {loading ? (
                <span><span className="animate-spin animate-spin w-4 h-4 mr-2"></span>Guardando...</span>
            ) : 'Guardar Nueva Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}