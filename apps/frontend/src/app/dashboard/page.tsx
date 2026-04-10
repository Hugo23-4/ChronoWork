'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import TimerDisplay from '@/components/dashboard/TimerDisplay';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyHours, setWeeklyHours] = useState(0);
  const weeklyGoal = 40;

  useEffect(() => {
    if (!user?.id) return;
    // Promise.all keeps independent fetches parallel as more are added here
    Promise.all([calculateWeeklyHours()]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
    } finally {
      setLoading(false);
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
    <div className="animate-fade-up">

      {/* iOS-style large title header */}
      <div className="mb-8 pt-14 lg:pt-0">
        <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-widest">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="font-extrabold text-[#0F172A] dark:text-zinc-200 text-[2.2rem] leading-[1.1] tracking-tight font-[family-name:var(--font-jakarta)]">
          Hola, {(profile?.nombre_completo ?? 'Compañero').split(' ')[0]} <span className="text-2xl">👋</span>
        </h1>
        <p className="text-slate-400 dark:text-zinc-500 text-base mt-2">Estado de tu jornada laboral</p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Timer */}
        <div className="lg:col-span-2">
          <TimerDisplay userId={user?.id || ''} />
        </div>

        {/* Weekly goal */}
        <div>
          <div className="bg-white/60 dark:bg-zinc-900/80 backdrop-blur-sm h-full rounded-3xl shadow-[0_2px_20px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.4)] border border-gray-100/80 dark:border-zinc-800/60 p-7">
            <h2 className="font-bold text-[1.1rem] mb-5 text-[#0F172A] dark:text-zinc-200 tracking-tight font-[family-name:var(--font-jakarta)]">
              Objetivo Semanal
            </h2>
            <div className="flex flex-col items-center justify-center relative my-3">
              <svg width="180" height="180" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="7" className="text-slate-100 dark:text-zinc-700" />
                <circle
                  cx="50" cy="50" r={radius}
                  fill="transparent" stroke="#2563EB" strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={isNaN(strokeDashoffset) ? circumference : strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }}
                />
              </svg>
              <div className="absolute text-center" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="font-black text-[#0F172A] dark:text-zinc-200 text-4xl leading-none tracking-tight font-[family-name:var(--font-jakarta)]">{weeklyHours}h</div>
                <div className="text-slate-400 dark:text-zinc-500 text-xs mt-1">de {weeklyGoal}h</div>
              </div>
            </div>
            <div className="text-center mt-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-amber-400/80 bg-amber-50 dark:bg-amber-950/30 rounded-full px-3 py-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                {Math.max(0, weeklyGoal - weeklyHours)}h restantes
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}