'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// Importamos los componentes correctos
import TimerDisplay from '@/components/dashboard/TimerDisplay'; 
import AdminView from '@/components/dashboard/AdminView';

export default function DashboardPage() {
  const { user } = useAuth();
  
  // --- ESTADOS GLOBALES ---
  const [userName, setUserName] = useState('Compañero');
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE ROL Y VISTA ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<'admin' | 'employee'>('employee'); 

  // --- ESTADOS DE EMPLEADO ---
  const [weeklyHours, setWeeklyHours] = useState(0);
  const weeklyGoal = 40; 

  useEffect(() => {
    if (user) {
      fetchUserData();
      calculateWeeklyHours();
    }
  }, [user]);

  // 1. OBTENER PERFIL
  const fetchUserData = async () => {
    try {
      const { data } = await supabase
        .from('empleados_info')
        .select('nombre_completo, rol, rol_id') 
        .eq('id', user?.id)
        .single();
      
      if (data) {
        if (data.nombre_completo) setUserName(data.nombre_completo);
        
        // Detecta si es admin (texto) O si el rol_id es 2 (número)
        if (data.rol === 'admin' || data.rol_id === 2) {
            setIsAdmin(true);
            setViewMode('admin'); 
        } else {
            setIsAdmin(false);
            setViewMode('employee');
        }
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. CALCULAR HORAS
  const calculateWeeklyHours = async () => {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); 
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff)).toISOString().split('T')[0];

      const { data } = await supabase
        .from('fichajes')
        .select('*')
        .eq('empleado_id', user?.id)
        .gte('fecha', monday) 
        .not('hora_salida', 'is', null);

      if (data) {
        setWeeklyHours(22); // Dato simulado por ahora
      }
    } catch (error) {
      console.error('Error calculando horas:', error);
    }
  };

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(weeklyHours / weeklyGoal, 1);
  const strokeDashoffset = circumference - progress * circumference;

  if (loading) {
    return (
        <div className="d-flex justify-content-center align-items-center min-vh-50 py-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
            </div>
        </div>
    );
  }

  return (
    <div className="position-relative">

      {/* BOTÓN FLOTANTE */}
      {isAdmin && (
        <div className="position-fixed bottom-0 end-0 m-4 z-3 d-none d-lg-block animate__animated animate__fadeInUp">
            <div className="bg-white p-1 rounded-pill shadow border d-flex">
                <button 
                    className={`btn btn-sm fw-bold px-3 rounded-pill transition-all ${viewMode === 'admin' ? 'btn-dark' : 'btn-white text-secondary'}`}
                    onClick={() => setViewMode('admin')}
                >
                    <i className="bi bi-shield-lock-fill me-2"></i>Admin
                </button>
                <button 
                    className={`btn btn-sm fw-bold px-3 rounded-pill transition-all ${viewMode === 'employee' ? 'btn-dark' : 'btn-white text-secondary'}`}
                    onClick={() => setViewMode('employee')}
                >
                    <i className="bi bi-clock-fill me-2"></i>Mi Fichaje
                </button>
            </div>
        </div>
      )}

      {/* RENDERIZADO CONDICIONAL */}
      {viewMode === 'admin' ? (
          
          /* ✅ CORRECCIÓN AQUÍ: Pasamos el userName al componente */
          <AdminView userName={userName} />

      ) : (
          <div className="fade-in-up pb-5">
            <div className="mb-4">
              <h2 className="fw-bold text-dark mb-1">
                Hola, {userName} <span className="fs-3">👋</span>
              </h2>
              <p className="text-secondary">Aquí tienes el estado de tu jornada laboral hoy.</p>
            </div>

            <div className="row g-4">
              <div className="col-lg-8">
                <TimerDisplay userId={user?.id || ''} />
              </div>

              <div className="col-lg-4">
                <div className="card h-100 border-0 shadow-sm rounded-4 p-4 bg-white">
                  <h6 className="fw-bold mb-4">Tu Objetivo Semanal</h6>
                  <div className="d-flex flex-column align-items-center justify-content-center position-relative my-3">
                    <svg width="180" height="180" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#E5E7EB" strokeWidth="8" />
                      <circle 
                        cx="50" cy="50" r={radius} 
                        fill="transparent" stroke="#2563EB" strokeWidth="8" 
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                      />
                    </svg>
                    <div className="position-absolute text-center" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                      <h2 className="fw-bold mb-0 text-dark display-6">{weeklyHours}h</h2>
                      <small className="text-muted">de {weeklyGoal}h</small>
                    </div>
                  </div>
                  <div className="text-center mt-3">
                      <small className="fw-bold text-dark">
                        <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                        Te faltan {Math.max(0, weeklyGoal - weeklyHours)}h para cumplir
                      </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}