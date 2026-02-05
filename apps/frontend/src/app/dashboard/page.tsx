'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import TimerDisplay from '@/components/dashboard/TimerDisplay';

export default function DashboardPage() {
  const { user } = useAuth();
  const [userName, setUserName] = useState('Compañero');
  const [loading, setLoading] = useState(true);
  const [weeklyHours, setWeeklyHours] = useState(0);
  const weeklyGoal = 40;

  useEffect(() => {
    if (user) {
      fetchUserData();
      calculateWeeklyHours();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const { data } = await supabase
        .from('empleados_info')
        .select('nombre_completo')
        .eq('id', user?.id)
        .single();

      if (data?.nombre_completo) {
        setUserName(data.nombre_completo);
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyHours = async () => {
    try {
      // Obtener lunes de esta semana
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const mondayStr = monday.toISOString().split('T')[0]; // YYYY-MM-DD

      const { data, error } = await supabase
        .from('fichajes')
        .select('hora_entrada, hora_salida')
        .eq('empleado_id', user?.id)
        .gte('fecha', mondayStr)
        .not('hora_salida', 'is', null);

      if (error) {
        console.error('Error fetching fichajes:', error);
        return;
      }

      if (data && data.length > 0) {
        // Calcular horas trabajadas - Los campos son TEXT, así que los parseamos
        const totalMinutes = data.reduce((acc, fichaje) => {
          try {
            if (fichaje.hora_entrada && fichaje.hora_salida) {
              // Parsear TEXT a Date
              const start = new Date(fichaje.hora_entrada);
              const end = new Date(fichaje.hora_salida);

              // Verificar que las fechas son válidas
              if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const diff = end.getTime() - start.getTime();
                return acc + (diff / (1000 * 60)); // minutos
              }
            }
          } catch (err) {
            console.error('Error parsing fichaje:', err);
          }
          return acc;
        }, 0);

        const hours = Math.floor(totalMinutes / 60);
        setWeeklyHours(hours);
      } else {
        // No hay fichajes esta semana
        setWeeklyHours(0);
      }
    } catch (error) {
      console.error('Error calculando horas:', error);
      setWeeklyHours(0); // Fallback seguro
    }
  };

  // Cálculos para el círculo de progreso
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
    <div className="fade-in-up pb-5">

      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">
          Hola, {userName} <span className="fs-3">👋</span>
        </h2>
        <p className="text-secondary">Aquí tienes el estado de tu jornada laboral hoy.</p>
      </div>

      {/* Contenido Principal */}
      <div className="row g-4">

        {/* Timer */}
        <div className="col-lg-8">
          <TimerDisplay userId={user?.id || ''} />
        </div>

        {/* Objetivo Semanal */}
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
                  strokeDashoffset={isNaN(strokeDashoffset) ? circumference : strokeDashoffset}
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
  );
}