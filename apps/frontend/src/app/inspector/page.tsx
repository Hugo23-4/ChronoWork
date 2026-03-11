'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import useSWR from 'swr';

interface FichajeMonitor {
    id: string;
    empleado_id: string;
    nombre_completo: string;
    sede_nombre: string;
    fecha: string;
    hora_entrada: string;
    hora_salida: string | null;
    has_gps: boolean;
    hash: string;
}

// Helper: Generate simulated hash
const generateHash = (id: string) => {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 8; i++) {
        hash += chars[Math.abs(id.charCodeAt(i % id.length) * (i + 3)) % 16];
    }
    return hash + '...' + id.substring(0, 4);
};

// SWR Fetcher Key
const getKey = (filterDate: string, filterStatus: string) => ['fichajes', filterDate, filterStatus];

// Main Fetcher Function
const fetchFichajesData = async ([, date, status]: [string, string, string]) => {
    // 1. Fetch fichajes (no FK join with empleados_info since it's a view)
    let query = supabase
        .from('fichajes')
        .select('*')
        .eq('fecha', date)
        .order('hora_entrada', { ascending: false });

    if (status === 'activos') {
        query = query.is('hora_salida', null);
    } else if (status === 'completados') {
        query = query.not('hora_salida', 'is', null);
    }

    const { data: rawFichajes, error } = await query;

    if (error) throw error;
    const fichData = rawFichajes || [];

    // 2. Batch fetch employee names
    const empleadoIds = [...new Set(fichData.map((f: any) => f.empleado_id))];
    const empMap: Record<string, string> = {};

    if (empleadoIds.length > 0) {
        const { data: emps } = await supabase
            .from('empleados_info')
            .select('id, nombre_completo')
            .in('id', empleadoIds);

        (emps || []).forEach((e: any) => { empMap[e.id] = e.nombre_completo; });
    }

    // 3. Batch fetch sede names
    const sedeIds = [...new Set(fichData.map((f: any) => f.sede_id).filter(Boolean))];
    const sedeMap: Record<string, string> = {};

    if (sedeIds.length > 0) {
        const { data: sedes } = await supabase
            .from('sedes')
            .select('id, nombre')
            .in('id', sedeIds);

        (sedes || []).forEach((s: any) => { sedeMap[s.id] = s.nombre; });
    }

    // 4. Combine
    return fichData.map((f: any) => ({
        id: f.id,
        empleado_id: f.empleado_id,
        nombre_completo: empMap[f.empleado_id] || 'Desconocido',
        sede_nombre: sedeMap[f.sede_id] || 'Sin sede',
        fecha: f.fecha,
        hora_entrada: f.hora_entrada,
        hora_salida: f.hora_salida,
        has_gps: !!(f.latitud_entrada && f.longitud_entrada),
        hash: generateHash(f.id),
    }));
};

export default function InspectorMonitorPage() {
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterStatus, setFilterStatus] = useState<'todos' | 'activos' | 'completados'>('todos');
    const [isLive, setIsLive] = useState(false);
    const lastUpdateRef = useRef<Date>(new Date());

    // Use SWR for data fetching
    const { data: fichajes, error, mutate, isValidating } = useSWR(
        getKey(filterDate, filterStatus),
        fetchFichajesData,
        {
            refreshInterval: 0, // We rely on Realtime
            revalidateOnFocus: false,
            dedupingInterval: 2000, // Prevent spam fetching
            onSuccess: () => {
                lastUpdateRef.current = new Date();
            }
        }
    );

    const loading = !fichajes && !error;
    const items = fichajes || [];

    // Supabase Realtime (Debounced)
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        if (filterDate !== today) {
            setIsLive(false);
            return;
        }
        setIsLive(true);

        const channel = supabase
            .channel('inspector-fichajes-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'fichajes', filter: `fecha=eq.${today}` },
                () => {
                    // Debounce using mutate (SWR handles deduping with dedupingInterval)
                    mutate();
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [filterDate, mutate]);

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '--:--';
        if (timeStr.includes('T')) {
            return new Date(timeStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
        return timeStr.substring(0, 5);
    };

    const getStatus = (f: FichajeMonitor) => {
        if (!f.hora_salida) return { label: 'EN TURNO', color: '#10B981', bg: '#ECFDF5' };
        return { label: 'COMPLETADO', color: '#6B7280', bg: '#F3F4F6' };
    };

    const activeCount = items.filter((f: any) => !f.hora_salida).length;
    const completedCount = items.filter((f: any) => f.hora_salida).length;

    return (
        <div className="fade-in-up">

            {/* Header */}
            <div className="flex flex-wrap justify-between items-start mb-4">
                <div>
                    <h6 className="text-amber-500 font-bold uppercase text-sm mb-1" style={{ letterSpacing: '0.05em' }}>
                        MINISTERIO DE TRABAJO
                    </h6>
                    <h2 className="font-bold text-navy mb-0">Monitor en Tiempo Real</h2>
                    <p className="text-slate-400 text-sm mb-0">Vista de todos los fichajes del sistema • Solo lectura</p>
                </div>
                {isLive && (
                    <div className="flex items-center gap-2 mt-2 mt-md-0">
                        <div style={{
                            width: 10, height: 10,
                            borderRadius: '50%',
                            background: '#10B981',
                            boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.3)',
                            animation: 'pulse 2s infinite'
                        }}></div>
                        <span className="text-sm font-bold" style={{ color: '#10B981' }}>EN VIVO</span>
                        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="row gap-3 mb-4">
                <div className="col-4">
                    <div className="card border-0 shadow-sm rounded-2xl p-3 text-center">
                        <div className="text-4xl font-bold" style={{ color: '#0F172A' }}>{items.length}</div>
                        <small className="text-slate-400 font-bold">TOTAL</small>
                    </div>
                </div>
                <div className="col-4">
                    <div className="card border-0 shadow-sm rounded-2xl p-3 text-center" style={{ borderLeft: '3px solid #10B981' }}>
                        <div className="text-4xl font-bold" style={{ color: '#10B981' }}>{activeCount}</div>
                        <small className="text-slate-400 font-bold">ACTIVOS</small>
                    </div>
                </div>
                <div className="col-4">
                    <div className="card border-0 shadow-sm rounded-2xl p-3 text-center" style={{ borderLeft: '3px solid #6B7280' }}>
                        <div className="text-4xl font-bold text-slate-500">{completedCount}</div>
                        <small className="text-slate-400 font-bold">COMPLETADOS</small>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm form-control-sm rounded-full border-0 shadow-sm"
                    style={{ maxWidth: '180px', background: '#fff' }}
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                />
                <div className="btn-group">
                    {(['todos', 'activos', 'completados'] as const).map(status => (
                        <button
                            key={status}
                            className={`text-sm py-1.5 px-3 rounded-full ${filterStatus === status ? 'btn-dark' : 'btn-outline-secondary'}`}
                            onClick={() => setFilterStatus(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
                <button
                    className="text-sm py-1.5 px-3 btn-outline-warning rounded-full ml-auto"
                    onClick={() => mutate()}
                    disabled={isValidating}
                >
                    <i className={`bi bi-arrow-clockwise mr-1 ${isValidating ? 'spin' : ''}`}></i>
                    Actualizar
                </button>
                <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>

            {/* Last Update */}
            <div className="flex items-center gap-1 mb-3">
                <i className="bi bi-clock text-slate-400" style={{ fontSize: '0.7rem' }}></i>
                <span className="text-slate-400" style={{ fontSize: '0.7rem' }}>
                    Última actualización: {lastUpdateRef.current.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                {isValidating && !loading && <span className="text-amber-500 text-sm ml-2">(Actualizando...)</span>}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
                <div className="card border-0 shadow-sm rounded-2xl overflow-hidden">
                    <div className="table-responsive">
                        <table className="w-full table-hover mb-0 align-middle">
                            <thead style={{ background: '#0F172A' }}>
                                <tr>
                                    <th className="text-white/50 text-sm font-bold py-3 ps-4">EMPLEADO</th>
                                    <th className="text-white/50 text-sm font-bold py-3">SEDE</th>
                                    <th className="text-white/50 text-sm font-bold py-3">ENTRADA</th>
                                    <th className="text-white/50 text-sm font-bold py-3">SALIDA</th>
                                    <th className="text-white/50 text-sm font-bold py-3">STATUS</th>
                                    <th className="text-white/50 text-sm font-bold py-3">GPS</th>
                                    <th className="text-white/50 text-sm font-bold py-3 pe-4">HASH</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-6">
                                            <div className="animate-spin animate-spin w-4 h-4 text-amber-500"></div>
                                            <p className="text-slate-400 text-sm mt-2 mb-0">Cargando registros...</p>
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-6">
                                            <i className="bi bi-journal-x text-slate-400" style={{ fontSize: '2rem' }}></i>
                                            <p className="text-slate-400 text-sm mt-2 mb-0">No hay registros para esta fecha</p>
                                        </td>
                                    </tr>
                                ) : items.map((f: any) => {
                                    const status = getStatus(f);
                                    return (
                                        <tr key={f.id} style={!f.hora_salida ? { background: '#F0FDF4' } : {}}>
                                            <td className="ps-4">
                                                <div className="flex items-center gap-2">
                                                    {!f.hora_salida && (
                                                        <div style={{
                                                            width: 8, height: 8, borderRadius: '50%',
                                                            background: '#10B981',
                                                            boxShadow: '0 0 0 2px rgba(16,185,129,0.3)'
                                                        }}></div>
                                                    )}
                                                    <span className="font-bold text-navy">{f.nombre_completo}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-slate-400 text-sm">
                                                    <i className="bi bi-geo-alt mr-1"></i>{f.sede_nombre}
                                                </span>
                                            </td>
                                            <td className="font-mono font-bold">{formatTime(f.hora_entrada)}</td>
                                            <td className="font-mono font-bold">{formatTime(f.hora_salida)}</td>
                                            <td>
                                                <span className="badge rounded-full px-3 py-1 font-bold"
                                                    style={{ color: status.color, background: status.bg, fontSize: '0.7rem' }}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="font-bold text-sm" style={{ color: f.has_gps ? '#10B981' : '#EF4444' }}>
                                                    {f.has_gps ? '✓ GPS OK' : '✗ SIN GPS'}
                                                </span>
                                            </td>
                                            <td className="pe-4">
                                                <code className="text-amber-500 text-sm" style={{ fontSize: '0.7rem' }}>
                                                    {f.hash}
                                                </code>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="d-md-none flex flex-col gap-3">
                {loading ? (
                    <div className="text-center py-6">
                        <div className="animate-spin text-amber-500"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="card border-0 shadow-sm rounded-2xl p-4 text-center">
                        <i className="bi bi-journal-x text-slate-400 mb-2" style={{ fontSize: '2rem' }}></i>
                        <p className="text-slate-400 text-sm mb-0">No hay registros para esta fecha</p>
                    </div>
                ) : items.map((f: any) => {
                    const status = getStatus(f);
                    const isActive = !f.hora_salida;

                    return (
                        <div key={f.id} className="card border-0 shadow-sm rounded-2xl overflow-hidden"
                            style={isActive ? { background: '#F0FDF4' } : {}}>
                            <div style={{ borderLeft: `4px solid ${isActive ? '#10B981' : '#E5E7EB'}` }}>
                                <div className="p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {isActive && (
                                                <div style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: '#10B981',
                                                    animation: 'pulse 2s infinite'
                                                }}></div>
                                            )}
                                            <span className="font-bold text-sm" style={{
                                                color: isActive ? '#10B981' : '#6B7280',
                                                fontSize: '0.7rem', letterSpacing: '0.05em'
                                            }}>
                                                {isActive ? 'EN TURNO ACTIVO' : 'COMPLETADO'}
                                            </span>
                                        </div>
                                        <span className="text-slate-400" style={{ fontSize: '0.75rem' }}>
                                            {formatTime(f.hora_entrada)}
                                        </span>
                                    </div>

                                    <h6 className="font-bold text-navy mb-1">{f.nombre_completo}</h6>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-slate-400 text-sm">📍 {f.sede_nombre}</span>
                                        <span className="text-sm font-bold" style={{
                                            color: f.has_gps ? '#10B981' : '#EF4444',
                                            fontSize: '0.7rem'
                                        }}>
                                            ({f.has_gps ? 'GPS OK' : 'SIN GPS'})
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <span className="text-slate-400 text-sm">
                                            {formatTime(f.hora_entrada)} → {formatTime(f.hora_salida)}
                                        </span>
                                        <code className="text-amber-500" style={{ fontSize: '0.65rem' }}>
                                            {f.hash}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
