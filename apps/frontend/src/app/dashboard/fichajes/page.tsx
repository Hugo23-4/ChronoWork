'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Loader2, CheckCircle, AlertTriangle, RotateCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProcessedFichaje = {
  id: string;
  date: string;
  entry: string;
  exit: string;
  total: string;
  status: 'valid' | 'progress' | 'incident';
};

export default function FichajesPage() {
  const { user } = useAuth();
  const [fichajes, setFichajes] = useState<ProcessedFichaje[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchFichajes();
  }, [user]);

  const fetchFichajes = async () => {
    try {
      const { data, error } = await supabase
        .from('fichajes')
        .select('*')
        .eq('empleado_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) setFichajes(processFichajes(data));
    } catch (err) {
      console.error('Error cargando fichajes:', err);
    } finally {
      setLoading(false);
    }
  };

  const processFichajes = (data: Record<string, unknown>[]) => {
    return data.map((f) => {
      try {
        const horaEntrada = f.hora_entrada as string;
        const horaSalida = f.hora_salida as string | null;
        const fecha = f.fecha as string;

        let start: Date;
        if (horaEntrada.includes('T') || horaEntrada.includes('Z')) {
          start = new Date(horaEntrada);
        } else {
          const [hours, minutes, seconds] = horaEntrada.split(':').map(Number);
          start = new Date(fecha);
          start.setHours(hours, minutes, seconds || 0);
        }

        let end: Date | null = null;
        if (horaSalida) {
          if (horaSalida.includes('T') || horaSalida.includes('Z')) {
            end = new Date(horaSalida);
          } else {
            const [hours, minutes, seconds] = horaSalida.split(':').map(Number);
            end = new Date(fecha);
            end.setHours(hours, minutes, seconds || 0);
          }
        }

        const now = new Date();

        const dateStr = isNaN(start.getTime())
          ? fecha
          : start.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

        const entryTime = isNaN(start.getTime())
          ? horaEntrada
          : start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        const exitTime = !end || isNaN(end.getTime())
          ? (horaSalida || '--:--')
          : end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        let duration = '--h --m';
        if (end && !isNaN(end.getTime()) && !isNaN(start.getTime())) {
          const diff = end.getTime() - start.getTime();
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          duration = `${h}h ${m.toString().padStart(2, '0')}m`;
        } else if (!horaSalida && !isNaN(start.getTime())) {
          const isToday = start.toDateString() === now.toDateString();
          if (isToday) {
            const diff = now.getTime() - start.getTime();
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            duration = `${h}h ${m}m`;
          }
        }

        let status: 'valid' | 'progress' | 'incident' = 'valid';
        if (!horaSalida && !isNaN(start.getTime())) {
          const isToday = start.toDateString() === now.toDateString();
          status = isToday ? 'progress' : 'incident';
        }

        return {
          id: f.id as string,
          date: dateStr.charAt(0).toUpperCase() + dateStr.slice(1),
          entry: entryTime,
          exit: exitTime,
          total: duration,
          status
        };
      } catch {
        return {
          id: f.id as string,
          date: (f.fecha as string) || '-',
          entry: (f.hora_entrada as string) || '-',
          exit: (f.hora_salida as string) || '--:--',
          total: '--h --m',
          status: 'incident' as const
        };
      }
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'valid': return { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle, label: 'COMPLETO' };
      case 'incident': return { bg: 'bg-red-50 text-red-600 border-red-200', icon: AlertTriangle, label: 'INCIDENCIA' };
      case 'progress': return { bg: 'bg-blue-50 text-chrono-blue border-blue-200', icon: RotateCw, label: 'EN CURSO' };
      default: return { bg: 'bg-gray-100 text-gray-500 border-gray-200', icon: Clock, label: '-' };
    }
  };

  return (
    <div className="animate-fade-up pb-20 lg:pb-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-5 gap-3">
        <div>
          <h2 className="font-bold text-navy dark:text-zinc-100 text-2xl font-[family-name:var(--font-jakarta)] mb-1">Mis Fichajes</h2>
          <p className="text-slate-400 dark:text-zinc-400 text-sm hidden md:block">Histórico de entradas y salidas</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-chrono-blue animate-spin mx-auto" />
        </div>
      ) : fichajes.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-2xl p-10 text-center">
          <Clock className="w-16 h-16 text-slate-200 dark:text-zinc-600 mx-auto mb-4" />
          <h5 className="font-bold text-slate-400 dark:text-zinc-400 mb-2">Sin fichajes todavía</h5>
          <p className="text-slate-400 dark:text-zinc-400 text-sm">Tus fichajes aparecerán aquí cuando registres entradas</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-2xl overflow-hidden hidden md:block">
            <table className="w-full">
              <thead className="bg-gray-50/80 dark:bg-zinc-700/50">
                <tr>
                  <th className="py-3.5 px-5 text-left text-slate-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-wider">Fecha</th>
                  <th className="py-3.5 px-5 text-left text-slate-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-wider">Entrada</th>
                  <th className="py-3.5 px-5 text-left text-slate-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-wider">Salida</th>
                  <th className="py-3.5 px-5 text-left text-slate-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-wider">Total</th>
                  <th className="py-3.5 px-5 text-left text-slate-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                {fichajes.map((f) => {
                  const cfg = getStatusConfig(f.status);
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={f.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-700/50 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-navy dark:text-zinc-100">{f.date}</td>
                      <td className="py-3.5 px-5 font-mono font-bold text-emerald-500">{f.entry}</td>
                      <td className="py-3.5 px-5 font-mono font-bold text-red-400">{f.exit}</td>
                      <td className="py-3.5 px-5 font-semibold text-navy dark:text-zinc-100">{f.total}</td>
                      <td className="py-3.5 px-5">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border', cfg.bg)}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden grid gap-3">
            {fichajes.map((f) => {
              const cfg = getStatusConfig(f.status);
              const StatusIcon = cfg.icon;
              return (
                <div key={f.id} className="bg-white dark:bg-zinc-800 shadow-sm rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-bold text-navy dark:text-zinc-100">{f.date}</div>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border', cfg.bg)}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-slate-400 dark:text-zinc-400 mb-1 text-xs">Entrada</div>
                      <div className="font-bold text-emerald-500 font-mono">{f.entry}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 dark:text-zinc-400 mb-1 text-xs">Salida</div>
                      <div className="font-bold text-red-400 font-mono">{f.exit}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 dark:text-zinc-400 mb-1 text-xs">Total</div>
                      <div className="font-bold text-navy dark:text-zinc-100">{f.total}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}