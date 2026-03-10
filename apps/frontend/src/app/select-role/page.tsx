'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function RoleSelectionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<'admin' | 'personal' | null>(null);

  useEffect(() => {
    checkRole();
  }, [user]);

  const checkRole = async () => {
    if (!user) { router.push('/login'); return; }

    const { data } = await supabase
      .from('empleados_info')
      .select('rol, rol_id, nombre_completo')
      .eq('id', user.id)
      .single();

    setUserName(data?.nombre_completo?.split(' ')[0] || 'Admin');

    if (data?.rol === 'admin' || data?.rol_id === 2) {
      setLoading(false);
    } else {
      localStorage.setItem('chronowork_view_mode', 'personal');
      router.push('/dashboard');
    }
  };

  const handleSelection = (mode: 'admin' | 'personal') => {
    setSelecting(mode);
    localStorage.setItem('chronowork_view_mode', mode);
    if (mode === 'admin') router.push('/admin');
    else router.push('/dashboard');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-border" style={{ color: '#3B82F6', width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F172A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Orbs decorativos */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div className="login-grid-lines" />

      {/* Logo + saludo */}
      <div className="text-center mb-5 anim-fade-up" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h1 style={{
          fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
          fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
          fontWeight: 800, color: 'white',
          letterSpacing: '-0.03em', marginBottom: 8,
        }}>
          Bienvenido{userName ? `, ${userName}` : ''}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem', margin: 0 }}>
          ¿Con qué perfil quieres acceder hoy?
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem', width: '100%', maxWidth: 680,
        position: 'relative', zIndex: 1,
      }}>

        {/* Admin */}
        <button
          onClick={() => handleSelection('admin')}
          disabled={selecting !== null}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '2rem',
            textAlign: 'left', cursor: selecting ? 'wait' : 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            backdropFilter: 'blur(16px)',
            opacity: selecting === 'personal' ? 0.4 : 1,
          }}
          className="anim-fade-up anim-delay-1"
          onMouseEnter={(e) => {
            if (!selecting) {
              e.currentTarget.style.background = 'rgba(37,99,235,0.15)';
              e.currentTarget.style.borderColor = 'rgba(37,99,235,0.5)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(37,99,235,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(37,99,235,0.15))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.25rem',
            border: '1px solid rgba(37,99,235,0.3)',
          }}>
            {selecting === 'admin'
              ? <div className="spinner-border spinner-border-sm" style={{ color: '#3B82F6' }} />
              : <i className="bi bi-shield-fill" style={{ fontSize: 22, color: '#60A5FA' }} />
            }
          </div>
          <h3 style={{
            fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
            fontSize: '1.125rem', fontWeight: 700, color: 'white',
            marginBottom: 8, letterSpacing: '-0.02em',
          }}>
            Panel de Administración
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Gestiona empleados, revisa fichajes de todo el equipo, aprueba solicitudes y configura el sistema.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Fichajes de todo el equipo', 'Aprobar solicitudes', 'Gestión de usuarios y centros'].map((item) => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }} />
                {item}
              </li>
            ))}
          </ul>
          <div style={{
            marginTop: '1.5rem', padding: '10px 16px', borderRadius: 10,
            background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)',
            color: '#93C5FD', fontSize: '0.875rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            Entrar como Admin
            <i className="bi bi-arrow-right" />
          </div>
        </button>

        {/* Empleado */}
        <button
          onClick={() => handleSelection('personal')}
          disabled={selecting !== null}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '2rem',
            textAlign: 'left', cursor: selecting ? 'wait' : 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            backdropFilter: 'blur(16px)',
            opacity: selecting === 'admin' ? 0.4 : 1,
          }}
          className="anim-fade-up anim-delay-2"
          onMouseEnter={(e) => {
            if (!selecting) {
              e.currentTarget.style.background = 'rgba(16,185,129,0.12)';
              e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(16,185,129,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.12))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.25rem',
            border: '1px solid rgba(16,185,129,0.25)',
          }}>
            {selecting === 'personal'
              ? <div className="spinner-border spinner-border-sm" style={{ color: '#10B981' }} />
              : <i className="bi bi-person-fill" style={{ fontSize: 22, color: '#34D399' }} />
            }
          </div>
          <h3 style={{
            fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
            fontSize: '1.125rem', fontWeight: 700, color: 'white',
            marginBottom: 8, letterSpacing: '-0.02em',
          }}>
            Mi Espacio Personal
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Ficha, consulta tu historial de horas, solicita vacaciones y revisa tu información personal.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Mis fichajes del día y semana', 'Solicitar vacaciones y bajas', 'Ver mi perfil y documentos'].map((item) => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
                {item}
              </li>
            ))}
          </ul>
          <div style={{
            marginTop: '1.5rem', padding: '10px 16px', borderRadius: 10,
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)',
            color: '#6EE7B7', fontSize: '0.875rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            Entrar como Empleado
            <i className="bi bi-arrow-right" />
          </div>
        </button>
      </div>

      <p className="anim-fade-up anim-delay-3" style={{
        marginTop: '2rem', color: 'rgba(255,255,255,0.2)',
        fontSize: '0.75rem', position: 'relative', zIndex: 1,
      }}>
        Puedes cambiar de modo en cualquier momento desde el menú
      </p>
    </div>
  );
}
