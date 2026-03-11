'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import TimerDisplay from '@/components/dashboard/TimerDisplay';
import { AlertTriangle, Loader2 } from 'lucide-react';

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
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const mondayStr = monday.toISOString().split('T')[0];

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
        const totalMinutes = data.reduce((acc, fichaje) => {
          try {
            if (fichaje.hora_entrada && fichaje.hora_salida) {
              const start = new Date(fichaje.hora_entrada);
              const end = new Date(fichaje.hora_salida);
              if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const diff = end.getTime() - start.getTime();
                return acc + (diff / (1000 * 60));
              }
            }
          } catch {
            // Skip invalid entries
          }
          return acc;
        }, 0);

        const hours = Math.floor(totalMinutes / 60);
        setWeeklyHours(hours);
      } else {
        setWeeklyHours(0);
      }
    } catch (error) {
      console.error('Error calculando horas:', error);
      setWeeklyHours(0);
    }
  };

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(weeklyHours / weeklyGoal, 1);
  const strokeDashoffset = circumference - progress * circumference;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-chrono-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up pb-6">

      {/* Header */}
      <div className="mb-4">
        <h2 className="font-bold text-navy text-2xl font-[family-name:var(--font-jakarta)] mb-1">
          Hola, {userName} <span className="text-xl">👋</span>
        </h2>
        <p className="text-slate-400">Aquí tienes el estado de tu jornada laboral hoy.</p>
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Timer */}
        <div className="lg:col-span-2">
          <TimerDisplay userId={user?.id || ''} />
        </div>

        {/* Objetivo Semanal */}
        <div>
          <div className="bg-white h-full rounded-2xl shadow-sm p-6">
            <h6 className="font-bold mb-4 text-navy font-[family-name:var(--font-jakarta)]">Tu Objetivo Semanal</h6>
            <div className="flex flex-col items-center justify-center relative my-3">
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
              <div className="absolute text-center" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <h2 className="font-bold text-navy text-4xl mb-0">{weeklyHours}h</h2>
                <small className="text-slate-400">de {weeklyGoal}h</small>
              </div>
            </div>
            <div className="text-center mt-3">
              <small className="font-bold text-navy flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Te faltan {Math.max(0, weeklyGoal - weeklyHours)}h para cumplir
              </small>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}