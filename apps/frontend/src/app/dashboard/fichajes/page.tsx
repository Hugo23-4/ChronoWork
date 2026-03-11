'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

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

  const processFichajes = (data: any[]) => {
    return data.map((f) => {
      try {
        // Parsear hora_entrada
        let start: Date;
        if (f.hora_entrada.includes('T') || f.hora_entrada.includes('Z')) {
          start = new Date(f.hora_entrada);
        } else {
          const [hours, minutes, seconds] = f.hora_entrada.split(':').map(Number);
          start = new Date(f.fecha);
          start.setHours(hours, minutes, seconds || 0);
        }

        // Parsear hora_salida
        let end: Date | null = null;
        if (f.hora_salida) {
          if (f.hora_salida.includes('T') || f.hora_salida.includes('Z')) {
            end = new Date(f.hora_salida);
          } else {
            const [hours, minutes, seconds] = f.hora_salida.split(':').map(Number);
            end = new Date(f.fecha);
            end.setHours(hours, minutes, seconds || 0);
          }
        }

        const now = new Date();

        const dateStr = isNaN(start.getTime())
          ? f.fecha
          : start.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

        const entryTime = isNaN(start.getTime())
          ? f.hora_entrada
          : start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        const exitTime = !end || isNaN(end.getTime())
          ? (f.hora_salida || '--:--')
          : end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        let duration = '--h --m';
        if (end && !isNaN(end.getTime()) && !isNaN(start.getTime())) {
          const diff = end.getTime() - start.getTime();
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          duration = `${h}h ${m.toString().padStart(2, '0')}m`;
        } else if (!f.hora_salida && !isNaN(start.getTime())) {
          const isToday = start.toDateString() === now.toDateString();
          if (isToday) {
            const diff = now.getTime() - start.getTime();
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            duration = `${h}h ${m}m`;
          }
        }

        let status: 'valid' | 'progress' | 'incident' = 'valid';
        if (!f.hora_salida && !isNaN(start.getTime())) {
          const isToday = start.toDateString() === now.toDateString();
          status = isToday ? 'progress' : 'incident';
        }

        return {
          id: f.id,
          date: dateStr.charAt(0).toUpperCase() + dateStr.slice(1),
          entry: entryTime,
          exit: exitTime,
          total: duration,
          status: status
        };
      } catch (parseError) {
        console.error('Error parsing fichaje:', parseError, f);
        return {
          id: f.id,
          date: f.fecha || '-',
          entry: f.hora_entrada || '-',
          exit: f.hora_salida || '--:--',
          total: '--h --m',
          status: 'incident' as const
        };
      }
    });
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-emerald-500 bg-opacity-10 text-emerald-500 border border-success';
      case 'incident': return 'bg-red-500 bg-opacity-10 text-red-500 border border-danger';
      case 'progress': return 'bg-chrono-blue bg-opacity-10 text-chrono-blue border border-primary';
      default: return 'bg-slate-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'valid': return 'COMPLETO';
      case 'incident': return 'INCIDENCIA';
      case 'progress': return 'EN CURSO';
      default: return '-';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return 'bi-check-circle-fill';
      case 'incident': return 'bi-exclamation-triangle-fill';
      case 'progress': return 'bi-arrow-clockwise';
      default: return 'bi-dash-circle';
    }
  };

  return (
    <div className="fade-in-up pb-6">

      {/* HEADER */}
      <div className="flex flex-col flex-md-row justify-between align-items-md-center mb-4 gap-3">
        <h2 className="font-bold mb-0 text-navy">Mis Fichajes</h2>

        <div className="flex gap-2 w-full w-md-auto">
          <select className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 outline-none transition-colors text-sm font-bold border-0 shadow-sm rounded-full px-4" style={{ width: 'auto', minWidth: '160px' }}>
            <option>📅 Febrero 2026</option>
            <option>Enero 2026</option>
            <option>Diciembre 2025</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6">
          <div className="animate-spin text-chrono-blue"></div>
        </div>
      ) : fichajes.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-2xl p-6 text-center">
          <i className="bi bi-clock-history text-7xl text-slate-400 opacity-25"></i>
          <h5 className="mt-3 text-slate-400">Sin fichajes todavía</h5>
          <p className="text-slate-400 text-sm">Tus fichajes aparecerán aquí cuando registres entradas</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card border-0 shadow-sm rounded-2xl overflow-hidden hidden md:block">
            <div className="table-responsive">
              <table className="w-full table-hover mb-0">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 text-slate-500 text-sm uppercase font-bold">Fecha</th>
                    <th className="py-3 text-slate-500 text-sm uppercase font-bold">Entrada</th>
                    <th className="py-3 text-slate-500 text-sm uppercase font-bold">Salida</th>
                    <th className="py-3 text-slate-500 text-sm uppercase font-bold">Total</th>
                    <th className="py-3 text-slate-500 text-sm uppercase font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {fichajes.map((f) => (
                    <tr key={f.id}>
                      <td className="py-3 font-semibold">{f.date}</td>
                      <td className="py-3 font-mono font-bold text-emerald-500">{f.entry}</td>
                      <td className="py-3 font-mono font-bold text-red-500">{f.exit}</td>
                      <td className="py-3 font-semibold">{f.total}</td>
                      <td className="py-3">
                        <span className={`badge rounded-full px-3 py-1 ${getBadgeClass(f.status)}`}>
                          <i className={`bi ${getStatusIcon(f.status)} mr-1`}></i>
                          {getStatusLabel(f.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="d-md-none">
            <div className="grid gap-3">
              {fichajes.map((f) => (
                <div key={f.id} className="card border-0 shadow-sm rounded-2xl p-3">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-bold text-navy">{f.date}</div>
                    <span className={`badge rounded-full px-2 py-1 text-sm ${getBadgeClass(f.status)}`}>
                      <i className={`bi ${getStatusIcon(f.status)} mr-1`}></i>
                      {getStatusLabel(f.status)}
                    </span>
                  </div>

                  <div className="row g-2 text-sm">
                    <div className="col-4">
                      <div className="text-slate-400 mb-1">Entrada</div>
                      <div className="font-bold text-emerald-500 font-mono">{f.entry}</div>
                    </div>
                    <div className="col-4">
                      <div className="text-slate-400 mb-1">Salida</div>
                      <div className="font-bold text-red-500 font-mono">{f.exit}</div>
                    </div>
                    <div className="col-4">
                      <div className="text-slate-400 mb-1">Total</div>
                      <div className="font-bold">{f.total}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}