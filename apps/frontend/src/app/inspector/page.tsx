'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import useSWR from 'swr';
import { RefreshCcw, Clock, MapPin, Loader2, FileX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FichajeMonitor { id: string; empleado_id: string; nombre_completo: string; sede_nombre: string; fecha: string; hora_entrada: string; hora_salida: string | null; has_gps: boolean; hash: string; }

const generateHash = (id: string) => { const c = '0123456789abcdef'; let h = '0x'; for (let i = 0; i < 8; i++) h += c[Math.abs(id.charCodeAt(i % id.length) * (i + 3)) % 16]; return h + '...' + id.substring(0, 4); };

const fetchFichajesData = async ([, date, status]: [string, string, string]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = supabase.from('fichajes').select('*').eq('fecha', date).order('hora_entrada', { ascending: false });
    if (status === 'activos') query = query.is('hora_salida', null);
    else if (status === 'completados') query = query.not('hora_salida', 'is', null);
    const { data: raw, error } = await query;
    if (error) throw error;
    const fichData = raw || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const empIds = [...new Set(fichData.map((f: any) => f.empleado_id))];
    const empMap: Record<string, string> = {};
    if (empIds.length > 0) { const { data: emps } = await supabase.from('empleados_info').select('id, nombre_completo').in('id', empIds); (emps || []).forEach((e: any) => { empMap[e.id] = e.nombre_completo; }); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sedeIds = [...new Set(fichData.map((f: any) => f.sede_id).filter(Boolean))];
    const sedeMap: Record<string, string> = {};
    if (sedeIds.length > 0) { const { data: sedes } = await supabase.from('sedes').select('id, nombre').in('id', sedeIds); (sedes || []).forEach((s: any) => { sedeMap[s.id] = s.nombre; }); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return fichData.map((f: any) => ({ id: f.id, empleado_id: f.empleado_id, nombre_completo: empMap[f.empleado_id] || 'Desconocido', sede_nombre: sedeMap[f.sede_id] || 'Sin sede', fecha: f.fecha, hora_entrada: f.hora_entrada, hora_salida: f.hora_salida, has_gps: !!(f.latitud_entrada && f.longitud_entrada), hash: generateHash(f.id) }));
};

export default function InspectorMonitorPage() {
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterStatus, setFilterStatus] = useState<'todos' | 'activos' | 'completados'>('todos');
    const [isLive, setIsLive] = useState(false);
    const lastUpdateRef = useRef<Date>(new Date());

    const { data: fichajes, error, mutate, isValidating } = useSWR(
        ['fichajes', filterDate, filterStatus], fetchFichajesData,
        { refreshInterval: 0, revalidateOnFocus: false, dedupingInterval: 2000, onSuccess: () => { lastUpdateRef.current = new Date(); } }
    );
    const loading = !fichajes && !error;
    const items = fichajes || [];

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        if (filterDate !== today) { setIsLive(false); return; }
        setIsLive(true);
        const channel = supabase.channel('inspector-fichajes-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'fichajes', filter: `fecha=eq.${today}` }, () => { mutate(); }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [filterDate, mutate]);

    const formatTime = (t: string | null) => { if (!t) return '--:--'; if (t.includes('T')) return new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); return t.substring(0, 5); };
    const getStatus = (f: FichajeMonitor) => !f.hora_salida ? { label: 'EN TURNO', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' } : { label: 'COMPLETADO', dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-gray-100' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeCount = items.filter((f: any) => !f.hora_salida).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completedCount = items.filter((f: any) => f.hora_salida).length;

    return (
        <div className="animate-fade-up">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start mb-5">
                <div>
                    <h6 className="text-amber-500 font-bold uppercase text-xs mb-1 tracking-widest">MINISTERIO DE TRABAJO</h6>
                    <h2 className="font-bold text-navy text-2xl font-[family-name:var(--font-jakarta)]">Monitor en Tiempo Real</h2>
                    <p className="text-slate-400 text-sm">Vista de todos los fichajes del sistema · Solo lectura</p>
                </div>
                {isLive && (
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.3)] animate-pulse" />
                        <span className="text-sm font-bold text-emerald-500">EN VIVO</span>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                    <div className="text-3xl font-extrabold text-navy">{items.length}</div>
                    <small className="text-slate-400 font-bold text-xs">TOTAL</small>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm border-l-[3px] border-emerald-500">
                    <div className="text-3xl font-extrabold text-emerald-500">{activeCount}</div>
                    <small className="text-slate-400 font-bold text-xs">ACTIVOS</small>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm border-l-[3px] border-slate-400">
                    <div className="text-3xl font-extrabold text-slate-500">{completedCount}</div>
                    <small className="text-slate-400 font-bold text-xs">COMPLETADOS</small>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-3">
                <input type="date" className="px-3 py-2 bg-white rounded-full shadow-sm text-sm outline-none border-none focus:ring-2 focus:ring-amber-200 max-w-[180px]"
                    value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                <div className="flex gap-1.5">
                    {(['todos', 'activos', 'completados'] as const).map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={cn('px-3.5 py-1.5 rounded-full text-xs font-bold border-[1.5px] cursor-pointer transition-all',
                                filterStatus === s ? 'bg-navy text-white border-navy' : 'bg-transparent text-slate-500 border-gray-200 hover:border-gray-300')}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
                <button onClick={() => mutate()} disabled={isValidating}
                    className="ml-auto px-3.5 py-1.5 rounded-full text-xs font-bold border-[1.5px] border-amber-300 text-amber-600 bg-transparent cursor-pointer hover:bg-amber-50 transition-colors flex items-center gap-1 disabled:opacity-50">
                    <RefreshCcw className={cn('w-3.5 h-3.5', isValidating && 'animate-spin')} /> Actualizar
                </button>
            </div>

            {/* Last Update */}
            <div className="flex items-center gap-1 mb-3">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400 text-[0.7rem]">Última actualización: {lastUpdateRef.current.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                {isValidating && !loading && <span className="text-amber-500 text-xs ml-2">(Actualizando...)</span>}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-navy">
                                <tr>
                                    {['EMPLEADO', 'SEDE', 'ENTRADA', 'SALIDA', 'STATUS', 'GPS', 'HASH'].map(h => (
                                        <th key={h} className="text-white/50 text-xs font-bold py-3 px-4">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-10"><Loader2 className="w-7 h-7 text-amber-500 animate-spin mx-auto" /><p className="text-slate-400 text-sm mt-2">Cargando registros...</p></td></tr>
                                ) : items.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-10"><FileX className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-400 text-sm">No hay registros para esta fecha</p></td></tr>
                                ) : items.map((f: FichajeMonitor) => {
                                    const st = getStatus(f);
                                    return (
                                        <tr key={f.id} className={cn(!f.hora_salida && 'bg-emerald-50/50')}>
                                            <td className="px-4 py-3"><div className="flex items-center gap-2">{!f.hora_salida && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.3)]" />}<span className="font-bold text-navy text-sm">{f.nombre_completo}</span></div></td>
                                            <td className="px-4 py-3 text-slate-400 text-sm"><div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{f.sede_nombre}</div></td>
                                            <td className="px-4 py-3 font-mono font-bold text-sm">{formatTime(f.hora_entrada)}</td>
                                            <td className="px-4 py-3 font-mono font-bold text-sm">{formatTime(f.hora_salida)}</td>
                                            <td className="px-4 py-3"><span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-bold', st.bg, st.text)}><div className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />{st.label}</span></td>
                                            <td className="px-4 py-3"><span className={cn('font-bold text-xs', f.has_gps ? 'text-emerald-500' : 'text-red-500')}>{f.has_gps ? '✓ GPS OK' : '✗ SIN GPS'}</span></td>
                                            <td className="px-4 py-3"><code className="text-amber-500 text-[0.7rem]">{f.hash}</code></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-3">
                {loading ? (
                    <div className="text-center py-10"><Loader2 className="w-7 h-7 text-amber-500 animate-spin mx-auto" /></div>
                ) : items.length === 0 ? (
                    <div className="bg-white rounded-2xl p-6 text-center shadow-sm"><FileX className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-400 text-sm">No hay registros para esta fecha</p></div>
                ) : items.map((f: FichajeMonitor) => {
                    const isActive = !f.hora_salida;
                    return (
                        <div key={f.id} className={cn('bg-white rounded-2xl overflow-hidden shadow-sm border-l-4', isActive ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200')}>
                            <div className="p-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {isActive && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                        <span className={cn('text-[0.65rem] font-bold tracking-wider', isActive ? 'text-emerald-500' : 'text-slate-400')}>{isActive ? 'EN TURNO ACTIVO' : 'COMPLETADO'}</span>
                                    </div>
                                    <span className="text-slate-400 text-xs">{formatTime(f.hora_entrada)}</span>
                                </div>
                                <h6 className="font-bold text-navy text-sm mb-1">{f.nombre_completo}</h6>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-slate-400 text-sm">📍 {f.sede_nombre}</span>
                                    <span className={cn('text-[0.65rem] font-bold', f.has_gps ? 'text-emerald-500' : 'text-red-500')}>({f.has_gps ? 'GPS OK' : 'SIN GPS'})</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                    <span className="text-slate-400 text-sm">{formatTime(f.hora_entrada)} → {formatTime(f.hora_salida)}</span>
                                    <code className="text-amber-500 text-[0.6rem]">{f.hash}</code>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
