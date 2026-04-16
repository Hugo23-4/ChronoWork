'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Shield, User, ArrowRight, Loader2 } from 'lucide-react';

export default function RoleSelectionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<'admin' | 'personal' | null>(null);

  useEffect(() => { checkRole(); }, [user]);

  const checkRole = async () => {
    if (!user) { router.push('/login'); return; }
    const { data } = await supabase.from('empleados_info').select('rol, rol_id, nombre_completo').eq('id', user.id).single();
    setUserName(data?.nombre_completo?.split(' ')[0] || 'Admin');
    if (data?.rol === 'admin' || data?.rol_id === 2) { setLoading(false); }
    else { localStorage.setItem('chronowork_view_mode', 'personal'); router.push('/dashboard'); }
  };

  const handleSelection = (mode: 'admin' | 'personal') => {
    setSelecting(mode);
    localStorage.setItem('chronowork_view_mode', mode);
    if (mode === 'admin') router.push('/admin');
    else router.push('/dashboard');
  };

  if (loading) return (
    <div className="min-h-dvh bg-navy flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-chrono-blue animate-spin" />
    </div>
  );

  return (
    <div className="min-h-dvh bg-navy flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
      <div className="login-grid-lines" />

      {/* Logo */}
      <div className="text-center mb-8 relative z-10 anim-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chrono-blue to-blue-700 flex items-center justify-center mx-auto mb-5" style={{ boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h1 className="text-white font-extrabold text-3xl md:text-4xl mb-2 font-[family-name:var(--font-jakarta)] tracking-tight">
          Bienvenido{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-white/45">¿Con qué perfil quieres acceder hoy?</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-[680px] relative z-10">
        {/* Admin */}
        <button onClick={() => handleSelection('admin')} disabled={selecting !== null}
          className="p-8 rounded-2xl text-left cursor-pointer transition-all duration-200 anim-fade-up anim-delay-1 group"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', opacity: selecting === 'personal' ? 0.4 : 1 }}
          onMouseEnter={e => { if (!selecting) { e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.5)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(37,99,235,0.2)'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center mb-5" style={{ width: 52, height: 52, background: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(37,99,235,0.15))', border: '1px solid rgba(37,99,235,0.3)' }}>
            {selecting === 'admin' ? <Loader2 className="w-5 h-5 text-blue-400 animate-spin" /> : <Shield className="w-6 h-6 text-blue-400" />}
          </div>
          <h3 className="text-white font-bold text-lg mb-2 font-[family-name:var(--font-jakarta)] tracking-tight">Panel de Administración</h3>
          <p className="text-white/45 text-sm leading-relaxed mb-5">Gestiona empleados, revisa fichajes de todo el equipo, aprueba solicitudes y configura el sistema.</p>
          <ul className="space-y-1.5 mb-6">
            {['Fichajes de todo el equipo', 'Aprobar solicitudes', 'Gestión de usuarios y centros'].map(item => (
              <li key={item} className="flex items-center gap-2 text-white/50 text-[0.8125rem]">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />{item}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-sm text-blue-300" style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)' }}>
            Entrar como Admin <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* Empleado */}
        <button onClick={() => handleSelection('personal')} disabled={selecting !== null}
          className="p-8 rounded-2xl text-left cursor-pointer transition-all duration-200 anim-fade-up anim-delay-2"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', opacity: selecting === 'admin' ? 0.4 : 1 }}
          onMouseEnter={e => { if (!selecting) { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(16,185,129,0.15)'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div className="flex items-center justify-center mb-5" style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.12))', border: '1px solid rgba(16,185,129,0.25)' }}>
            {selecting === 'personal' ? <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" /> : <User className="w-6 h-6 text-emerald-400" />}
          </div>
          <h3 className="text-white font-bold text-lg mb-2 font-[family-name:var(--font-jakarta)] tracking-tight">Mi Espacio Personal</h3>
          <p className="text-white/45 text-sm leading-relaxed mb-5">Ficha, consulta tu historial de horas, solicita vacaciones y revisa tu información personal.</p>
          <ul className="space-y-1.5 mb-6">
            {['Mis fichajes del día y semana', 'Solicitar vacaciones y bajas', 'Ver mi perfil y documentos'].map(item => (
              <li key={item} className="flex items-center gap-2 text-white/50 text-[0.8125rem]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />{item}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-sm text-emerald-300" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
            Entrar como Empleado <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      <p className="mt-8 text-white/20 text-xs relative z-10 anim-fade-up anim-delay-3">
        Puedes cambiar de modo en cualquier momento desde el menú
      </p>
    </div>
  );
}
