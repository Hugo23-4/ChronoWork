'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link'; // Importante para la navegación
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import TimerDisplay from '@/components/TimerDisplay';

export default function DashboardPage() {
  const { user } = useAuth();
  const [userName, setUserName] = useState('Compañero');
  const [weeklyHours, setWeeklyHours] = useState(0);
  const weeklyGoal = 40; // Objetivo de 40h semanales

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      calculateWeeklyHours();
    }
  }, [user]);

  // 1. Obtener Nombre Real desde Supabase
  const fetchUserProfile = async () => {
    try {
      const { data } = await supabase
        .from('empleados_info')
        .select('nombre')
        .eq('id', user?.id)
        .single();
        
      if (data?.nombre) setUserName(data.nombre);
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    }
  };

  // 2. Calcular Horas Semanales (Sumando fichajes de la semana)
  const calculateWeeklyHours = async () => {
    try {
      // Obtenemos los fichajes completados (que tienen salida)
      const { data } = await supabase
        .from('fichajes')
        .select('*')
        .eq('empleado_id', user?.id)
        .not('timestamp_salida', 'is', null); // Solo los terminados

      if (data) {
        let totalMs = 0;
        data.forEach(f => {
          const entrada = new Date(f.timestamp_entrada).getTime();
          const salida = new Date(f.timestamp_salida).getTime();
          totalMs += (salida - entrada);
        });
        // Convertir milisegundos a horas redondeadas
        setWeeklyHours(Math.round(totalMs / (1000 * 60 * 60)));
      }
    } catch (error) {
      console.error('Error calculando horas:', error);
    }
  };

  // Cálculo visual para el círculo SVG (Dasharray)
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  // Limitamos el progreso a 1 (100%) para que no se rompa el gráfico si haces horas extra
  const progress = Math.min(weeklyHours / weeklyGoal, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="fade-in-up pb-5">
      
      {/* HEADER: SALUDO PERSONALIZADO */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">
          Hola, {userName} <span className="fs-3">👋</span>
        </h2>
        <p className="text-secondary">Aquí tienes el estado de tu jornada laboral hoy.</p>
      </div>

      <div className="row g-4">
        
        {/* ZONA 1: CRONÓMETRO (Ocupa más espacio) */}
        <div className="col-lg-8">
          <TimerDisplay />
        </div>

        {/* ZONA 2: OBJETIVO SEMANAL (Gráfica) */}
        <div className="col-lg-4">
          <div className="card h-100 border-0 shadow-sm rounded-4 p-4 bg-white">
            <h6 className="fw-bold mb-4">Tu Objetivo Semanal</h6>
            
            <div className="d-flex flex-column align-items-center justify-content-center position-relative my-3">
              {/* SVG Ring Chart */}
              <svg width="180" height="180" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                {/* Círculo Fondo (Gris) */}
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#E5E7EB" strokeWidth="8" />
                
                {/* Círculo Progreso (Azul Loom) */}
                <circle 
                  cx="50" cy="50" r={radius} 
                  fill="transparent" 
                  stroke="#2563EB" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              
              {/* Texto Central */}
              <div className="position-absolute text-center" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <h2 className="fw-bold mb-0 text-dark display-6">{weeklyHours}h</h2>
                <small className="text-muted">de {weeklyGoal}h</small>
              </div>
            </div>

            <div className="text-center mt-3">
               <small className="fw-bold text-dark">
                 <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                 Te faltan {Math.max(0, weeklyGoal - weeklyHours)}h para cumplir contrato
               </small>
            </div>
          </div>
        </div>

        {/* ZONA 3: INFO CONVENIO (Solo Desktop - Visible lg+) */}
        <div className="col-12 d-none d-lg-block">
          <div className="alert alert-info border-0 bg-info bg-opacity-10 rounded-4 p-4">
            <div className="d-flex gap-3">
               <i className="bi bi-info-circle-fill text-info fs-4"></i>
               <div>
                  <h6 className="fw-bold text-info mb-1">Información de Convenio</h6>
                  <p className="small text-secondary mb-1">Estás bajo el Convenio de Construcción (Extremadura). Recuerda que mañana es festivo local.</p>
                  <a href="#" className="small fw-bold text-info text-decoration-none">Días de vacaciones disponibles: 14 días</a>
               </div>
            </div>
          </div>
        </div>

        {/* ZONA 4: GESTIÓN RÁPIDA (Solo Móvil - Visible <lg) */}
        <div className="col-12 d-lg-none mt-2">
            <h6 className="fw-bold mb-3 px-1">Gestión Rápida</h6>
            <div className="row g-3">
                
                {/* Botón Vacaciones -> Redirige a Solicitudes */}
                <div className="col-6">
                    <Link href="/dashboard/solicitudes" className="text-decoration-none text-dark">
                        <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-column gap-2 h-100">
                            <div className="bg-light rounded-3 p-2 w-auto d-inline-block text-center" style={{ width: '40px' }}>
                               <i className="bi bi-calendar-event text-danger"></i>
                            </div>
                            <span className="fw-bold small">Vacaciones</span>
                        </div>
                    </Link>
                </div>

                {/* Botón Baja -> Redirige a Solicitudes */}
                <div className="col-6">
                     <Link href="/dashboard/solicitudes" className="text-decoration-none text-dark">
                        <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-column gap-2 h-100">
                            <div className="bg-light rounded-3 p-2 w-auto d-inline-block text-center" style={{ width: '40px' }}>
                               <i className="bi bi-paperclip text-primary"></i>
                            </div>
                            <span className="fw-bold small">Subir Baja</span>
                        </div>
                    </Link>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
}