'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
    });
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      alert('¡Contraseña actualizada correctamente!');
      router.push('/dashboard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) { setMessage('Error: ' + error.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-dvh bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-100">
        <div className="text-center mb-5">
          <h2 className="font-bold text-navy font-[family-name:var(--font-jakarta)]">Nueva Contraseña</h2>
          <p className="text-slate-400 text-sm">Introduce tu nueva clave de acceso.</p>
        </div>

        {message && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">{message}</div>
        )}

        <form onSubmit={handleUpdate}>
          <div className="mb-4">
            <label className="block text-xs font-bold text-navy mb-2 uppercase tracking-widest">Nueva Contraseña</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm"
                placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0 flex items-center">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-slate-400 text-xs mt-2 ml-1">Mínimo 6 caracteres.</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-navy text-white rounded-xl font-bold border-none cursor-pointer hover:bg-slate-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar Nueva Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}