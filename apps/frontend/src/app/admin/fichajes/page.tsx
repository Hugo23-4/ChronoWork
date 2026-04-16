'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Search, Clock, CheckCircle, PlayCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProcessedFichaje = {
  id: string;
  empleado_nombre: string;
  date: string;
  entry: string;
  exit: string;
  total: string;
  status: 'valid' | 'progress' | 'incident';
};

function formatDateRange() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 30);
  return { start: start.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
}

const FETCH_LIMIT = 200;

export default function AdminFichajesPage() {
  const { profile } = useAuth();
  const [fichajes, setFichajes] = useState<ProcessedFichaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [truncated, setTruncated] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'incident' | 'progress'>('all');
  const [dateFrom, setDateFrom] = useState(formatDateRange().start);
  const [dateTo, setDateTo] = useState(formatDateRange().end);

  const fetchFichajes = useCallback(async () => {
    if (!profile?.empresa_id) return;
    setLoading(true); setTruncated(false);
    try {
      const { data, error } = await supabase.from('fichajes').select('*')
        .eq('empresa_id', profile.empresa_id)
        .gte('fecha', dateFrom).lte('fecha', dateTo)
        .order('created_at', { ascending: false }).limit(FETCH_LIMIT);
      if (error) throw error;

      if ((data?.length ?? 0) >= FETCH_LIMIT) setTruncated(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const empIds = [...new Set((data || []).map((f: any) => f.empleado_id).filter(Boolean))];
      const empMap: Record<string, string> = {};
      if (empIds.length > 0) {
        const { data: emps } = await supabase.from('empleados_info').select('id, nombre_completo').eq('empresa_id', profile.empresa_id).in('id', empIds);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (emps || []).forEach((e: any) => { empMap[e.id] = e.nombre_completo; });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enriched = (data || []).map((f: any) => ({
        ...f, empleados_info: { nombre_completo: empMap[f.empleado_id] || 'Sin nombre' },
      }));
      if (enriched) setFichajes(processFichajes(enriched));
    } catch (err) { console.error('Error cargando fichajes:', err); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchFichajes(); }, [fetchFichajes, profile?.empresa_id]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processFichajes = (data: any[]): ProcessedFichaje[] => {
    return data.map((f) => {
      try {
        let start: Date;
        if (f.hora_entrada?.includes('T') || f.hora_entrada?.includes('Z')) start = new Date(f.hora_entrada);
        else { const [h, m, s] = (f.hora_entrada || '00:00:00').split(':').map(Number); start = new Date(f.fecha); start.setHours(h, m, s || 0); }

        let end: Date | null = null;
        if (f.hora_salida) {
          if (f.hora_salida.includes('T') || f.hora_salida.includes('Z')) end = new Date(f.hora_salida);
          else { const [h, m, s] = f.hora_salida.split(':').map(Number); end = new Date(f.fecha); end.setHours(h, m, s || 0); }
        }

        const now = new Date();
        const ok = !isNaN(start.getTime());
        const dateStr = ok ? start.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : f.fecha;
        const entryTime = ok ? start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : f.hora_entrada;
        const exitTime = end && !isNaN(end.getTime()) ? end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : f.hora_salida || '--:--';

        let duration = '--h --m';
        if (end && !isNaN(end.getTime()) && ok) { const d = end.getTime() - start.getTime(); duration = `${Math.floor(d / 3600000)}h ${Math.floor((d % 3600000) / 60000).toString().padStart(2, '0')}m`; }
        else if (!f.hora_salida && ok && start.toDateString() === now.toDateString()) { const d = now.getTime() - start.getTime(); duration = `↑ ${Math.floor(d / 3600000)}h ${Math.floor((d % 3600000) / 60000)}m`; }

        let status: ProcessedFichaje['status'] = 'valid';
        if (!f.hora_salida && ok) status = start.toDateString() === now.toDateString() ? 'progress' : 'incident';

        return { id: f.id, empleado_nombre: f.empleados_info?.nombre_completo || 'Sin nombre', date: dateStr.charAt(0).toUpperCase() + dateStr.slice(1), entry: entryTime, exit: exitTime, total: duration, status };
      } catch {
        return { id: f.id, empleado_nombre: f.empleados_info?.nombre_completo || 'Sin nombre', date: f.fecha || '-', entry: f.hora_entrada || '-', exit: f.hora_salida || '--:--', total: '--h --m', status: 'incident' as const };
      }
    });
  };

  const filtered = fichajes.filter(f => {
    const matchSearch = !search || f.empleado_nombre.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusConfig = {
    valid:    { label: 'Válido', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, dot: 'bg-emerald-500' },
    incident: { label: 'Incidencia', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertCircle, dot: 'bg-red-500' },
    progress: { label: 'En curso', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: PlayCircle, dot: 'bg-chrono-blue' },
  };

  const stats = {
    total: filtered.length, valid: filtered.filter(f => f.status === 'valid').length,
    incident: filtered.filter(f => f.status === 'incident').length, progress: filtered.filter(f => f.status === 'progress').length,
  };

  const statCards = [
    { label: 'Total fichajes', value: stats.total, icon: Clock, color: 'text-chrono-blue', bg: 'bg-blue-50' },
    { label: 'Válidos', value: stats.valid, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'En curso', value: stats.progress, icon: PlayCircle, color: 'text-chrono-blue', bg: 'bg-blue-50' },
    { label: 'Incidencias', value: stats.incident, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-5 gap-3">
        <div>
          <p className="text-chrono-blue font-bold uppercase text-xs mb-1 tracking-widest">Admin</p>
          <h2 className="font-bold text-navy dark:text-zinc-100 text-2xl font-[family-name:var(--font-jakarta)]">Fichajes del Personal</h2>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 dark:text-zinc-100 text-sm outline-none focus:border-chrono-blue" />
          <span className="text-slate-400 dark:text-zinc-500 text-sm">–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 dark:text-zinc-100 text-sm outline-none focus:border-chrono-blue" />
        </div>
      </div>

      {/* Truncation warning */}
      {truncated && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Mostrando solo los primeros {FETCH_LIMIT} resultados. Ajusta el rango de fechas para ver más.</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[0.7rem] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{s.label}</span>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.bg)}>
                  <Icon className={cn('w-4 h-4', s.color)} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-navy dark:text-zinc-100 tracking-tight">{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 mb-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input type="text" placeholder="Buscar empleado..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-chrono-blue/20 border-none" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'valid', 'progress', 'incident'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn('px-3.5 py-1.5 rounded-full text-xs font-bold border-[1.5px] cursor-pointer transition-all',
                filterStatus === s ? 'bg-navy text-white border-navy' : 'bg-transparent text-slate-500 dark:text-zinc-400 border-gray-200 hover:border-gray-300')}>
              {s === 'all' ? 'Todos' : statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-chrono-blue animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border-[1.5px] border-dashed border-gray-200">
          <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h5 className="font-bold text-slate-500 dark:text-zinc-400 mb-1">No hay fichajes</h5>
          <p className="text-slate-400 dark:text-zinc-500 text-sm">Ajusta el rango de fechas o los filtros.</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-zinc-800">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800">
                  {['Empleado', 'Fecha', 'Entrada', 'Salida', 'Total', 'Estado'].map(h => (
                    <th key={h} className="py-3.5 px-5 text-left text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                {filtered.map(f => {
                  const sc = statusConfig[f.status];
                  return (
                    <tr key={f.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[0.65rem] font-bold shrink-0"
                            style={{ background: `hsl(${f.empleado_nombre.charCodeAt(0) * 7 % 360}, 55%, 45%)` }}>
                            {getInitials(f.empleado_nombre)}
                          </div>
                          <span className="font-semibold text-navy dark:text-zinc-100 text-sm">{f.empleado_nombre}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 dark:text-zinc-400 text-sm">{f.date}</td>
                      <td className="py-3.5 px-5 font-bold text-navy dark:text-zinc-100 text-sm">{f.entry}</td>
                      <td className="py-3.5 px-5 font-bold text-navy dark:text-zinc-100 text-sm">{f.exit}</td>
                      <td className="py-3.5 px-5 text-slate-500 dark:text-zinc-400 text-sm font-medium">{f.total}</td>
                      <td className="py-3.5 px-5">
                        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-bold border', sc.bg, sc.text, sc.border)}>
                          <div className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
                          {sc.label.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-5 py-3 bg-gray-50/50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <span className="text-xs text-slate-400 dark:text-zinc-500">Mostrando {filtered.length} de {fichajes.length} registros</span>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden grid gap-3">
            {filtered.map(f => {
              const sc = statusConfig[f.status];
              return (
                <div key={f.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: `hsl(${f.empleado_nombre.charCodeAt(0) * 7 % 360}, 55%, 45%)` }}>
                        {getInitials(f.empleado_nombre)}
                      </div>
                      <div>
                        <div className="font-bold text-navy dark:text-zinc-100 text-sm">{f.empleado_nombre}</div>
                        <div className="text-xs text-slate-400 dark:text-zinc-500">{f.date}</div>
                      </div>
                    </div>
                    <span className={cn('px-2.5 py-0.5 rounded-full text-[0.6rem] font-bold border', sc.bg, sc.text, sc.border)}>
                      {sc.label.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[['Entrada', f.entry], ['Salida', f.exit], ['Total', f.total]].map(([l, v]) => (
                      <div key={l}>
                        <div className="text-[0.6rem] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">{l}</div>
                        <div className="font-bold text-navy dark:text-zinc-100 text-sm">{v}</div>
                      </div>
                    ))}
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
