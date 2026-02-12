'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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

export default function InspectorMonitorPage() {
    const [fichajes, setFichajes] = useState<FichajeMonitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterStatus, setFilterStatus] = useState<'todos' | 'activos' | 'completados'>('todos');
    const [isLive, setIsLive] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Generate simulated hash
    const generateHash = (id: string) => {
        const chars = '0123456789abcdef';
        let hash = '0x';
        for (let i = 0; i < 8; i++) {
            hash += chars[Math.abs(id.charCodeAt(i % id.length) * (i + 3)) % 16];
        }
        return hash + '...' + id.substring(0, 4);
    };

    const processFichajes = useCallback((data: any[]): FichajeMonitor[] => {
        return data.map((f: any) => ({
            id: f.id,
            empleado_id: f.empleado_id,
            nombre_completo: f.empleados_info?.nombre_completo || 'Desconocido',
            sede_nombre: f.sedes?.nombre || 'Sin sede',
            fecha: f.fecha,
            hora_entrada: f.hora_entrada,
            hora_salida: f.hora_salida,
            has_gps: !!(f.latitud_entrada && f.longitud_entrada),
            hash: generateHash(f.id),
        }));
    }, []);

    const fetchFichajes = useCallback(async () => {
        setLoading(true);

        let query = supabase
            .from('fichajes')
            .select('*, empleados_info(nombre_completo), sedes(nombre)')
            .eq('fecha', filterDate)
            .order('hora_entrada', { ascending: false });

        if (filterStatus === 'activos') {
            query = query.is('hora_salida', null);
        } else if (filterStatus === 'completados') {
            query = query.not('hora_salida', 'is', null);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching fichajes:', error);
            setFichajes([]);
        } else {
            setFichajes(processFichajes(data || []));
        }

        setLastUpdate(new Date());
        setLoading(false);
    }, [filterDate, filterStatus, processFichajes]);

    // Initial fetch
    useEffect(() => {
        fetchFichajes();
    }, [fetchFichajes]);

    // Supabase Realtime subscription
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        // Only subscribe to realtime if viewing today's data
        if (filterDate !== today) {
            setIsLive(false);
            return;
        }

        setIsLive(true);

        const channel = supabase
            .channel('inspector-fichajes-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'fichajes',
                    filter: `fecha=eq.${today}`,
                },
                () => {
                    // Refetch on any change
                    fetchFichajes();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [filterDate, fetchFichajes]);

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

    const activeCount = fichajes.filter(f => !f.hora_salida).length;
    const completedCount = fichajes.filter(f => f.hora_salida).length;

    return (
        <div className="fade-in-up">

            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-start mb-4">
                <div>
                    <h6 className="text-warning fw-bold text-uppercase small mb-1" style={{ letterSpacing: '0.05em' }}>
                        MINISTERIO DE TRABAJO
                    </h6>
                    <h2 className="fw-bold text-dark mb-0">Monitor en Tiempo Real</h2>
                    <p className="text-muted small mb-0">Vista de todos los fichajes del sistema • Solo lectura</p>
                </div>
                {isLive && (
                    <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
                        <div style={{
                            width: 10, height: 10,
                            borderRadius: '50%',
                            background: '#10B981',
                            boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.3)',
                            animation: 'pulse 2s infinite'
                        }}></div>
                        <span className="small fw-bold" style={{ color: '#10B981' }}>EN VIVO</span>
                        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 text-center">
                        <div className="display-6 fw-bold" style={{ color: '#0F172A' }}>{fichajes.length}</div>
                        <small className="text-muted fw-bold">TOTAL</small>
                    </div>
                </div>
                <div className="col-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 text-center" style={{ borderLeft: '3px solid #10B981' }}>
                        <div className="display-6 fw-bold" style={{ color: '#10B981' }}>{activeCount}</div>
                        <small className="text-muted fw-bold">ACTIVOS</small>
                    </div>
                </div>
                <div className="col-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 text-center" style={{ borderLeft: '3px solid #6B7280' }}>
                        <div className="display-6 fw-bold text-secondary">{completedCount}</div>
                        <small className="text-muted fw-bold">COMPLETADOS</small>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="d-flex flex-wrap gap-2 mb-4">
                <input
                    type="date"
                    className="form-control form-control-sm rounded-pill border-0 shadow-sm"
                    style={{ maxWidth: '180px', background: '#fff' }}
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                />
                <div className="btn-group">
                    {(['todos', 'activos', 'completados'] as const).map(status => (
                        <button
                            key={status}
                            className={`btn btn-sm rounded-pill ${filterStatus === status ? 'btn-dark' : 'btn-outline-secondary'}`}
                            onClick={() => setFilterStatus(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
                <button
                    className="btn btn-sm btn-outline-warning rounded-pill ms-auto"
                    onClick={fetchFichajes}
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Actualizar
                </button>
            </div>

            {/* Last Update Time */}
            <div className="d-flex align-items-center gap-1 mb-3">
                <i className="bi bi-clock text-muted" style={{ fontSize: '0.7rem' }}></i>
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                    Última actualización: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            </div>

            {/* Desktop Table */}
            <div className="d-none d-md-block">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead style={{ background: '#0F172A' }}>
                                <tr>
                                    <th className="text-white-50 small fw-bold py-3 ps-4">EMPLEADO</th>
                                    <th className="text-white-50 small fw-bold py-3">SEDE</th>
                                    <th className="text-white-50 small fw-bold py-3">ENTRADA</th>
                                    <th className="text-white-50 small fw-bold py-3">SALIDA</th>
                                    <th className="text-white-50 small fw-bold py-3">STATUS</th>
                                    <th className="text-white-50 small fw-bold py-3">GPS</th>
                                    <th className="text-white-50 small fw-bold py-3 pe-4">HASH</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            <div className="spinner-border spinner-border-sm text-warning"></div>
                                            <p className="text-muted small mt-2 mb-0">Cargando registros...</p>
                                        </td>
                                    </tr>
                                ) : fichajes.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            <i className="bi bi-journal-x text-muted" style={{ fontSize: '2rem' }}></i>
                                            <p className="text-muted small mt-2 mb-0">No hay registros para esta fecha</p>
                                        </td>
                                    </tr>
                                ) : fichajes.map((f) => {
                                    const status = getStatus(f);
                                    return (
                                        <tr key={f.id} style={!f.hora_salida ? { background: '#F0FDF4' } : {}}>
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center gap-2">
                                                    {!f.hora_salida && (
                                                        <div style={{
                                                            width: 8, height: 8, borderRadius: '50%',
                                                            background: '#10B981',
                                                            boxShadow: '0 0 0 2px rgba(16,185,129,0.3)'
                                                        }}></div>
                                                    )}
                                                    <span className="fw-bold text-dark">{f.nombre_completo}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-muted small">
                                                    <i className="bi bi-geo-alt me-1"></i>{f.sede_nombre}
                                                </span>
                                            </td>
                                            <td className="font-monospace fw-bold">{formatTime(f.hora_entrada)}</td>
                                            <td className="font-monospace fw-bold">{formatTime(f.hora_salida)}</td>
                                            <td>
                                                <span className="badge rounded-pill px-3 py-1 fw-bold"
                                                    style={{ color: status.color, background: status.bg, fontSize: '0.7rem' }}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="fw-bold small" style={{ color: f.has_gps ? '#10B981' : '#EF4444' }}>
                                                    {f.has_gps ? '✓ GPS OK' : '✗ SIN GPS'}
                                                </span>
                                            </td>
                                            <td className="pe-4">
                                                <code className="text-warning small" style={{ fontSize: '0.7rem' }}>
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
            <div className="d-md-none d-flex flex-column gap-3">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-warning"></div>
                    </div>
                ) : fichajes.length === 0 ? (
                    <div className="card border-0 shadow-sm rounded-4 p-4 text-center">
                        <i className="bi bi-journal-x text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                        <p className="text-muted small mb-0">No hay registros para esta fecha</p>
                    </div>
                ) : fichajes.map((f) => {
                    const status = getStatus(f);
                    const isActive = !f.hora_salida;

                    return (
                        <div key={f.id} className="card border-0 shadow-sm rounded-4 overflow-hidden"
                            style={isActive ? { background: '#F0FDF4' } : {}}>
                            <div style={{ borderLeft: `4px solid ${isActive ? '#10B981' : '#E5E7EB'}` }}>
                                <div className="p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            {isActive && (
                                                <div style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: '#10B981',
                                                    animation: 'pulse 2s infinite'
                                                }}></div>
                                            )}
                                            <span className="fw-bold small" style={{
                                                color: isActive ? '#10B981' : '#6B7280',
                                                fontSize: '0.7rem', letterSpacing: '0.05em'
                                            }}>
                                                {isActive ? 'EN TURNO ACTIVO' : 'COMPLETADO'}
                                            </span>
                                        </div>
                                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                            {formatTime(f.hora_entrada)}
                                        </span>
                                    </div>

                                    <h6 className="fw-bold text-dark mb-1">{f.nombre_completo}</h6>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <span className="text-muted small">📍 {f.sede_nombre}</span>
                                        <span className="small fw-bold" style={{
                                            color: f.has_gps ? '#10B981' : '#EF4444',
                                            fontSize: '0.7rem'
                                        }}>
                                            ({f.has_gps ? 'GPS OK' : 'SIN GPS'})
                                        </span>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                        <span className="text-muted small">
                                            {formatTime(f.hora_entrada)} → {formatTime(f.hora_salida)}
                                        </span>
                                        <code className="text-warning" style={{ fontSize: '0.65rem' }}>
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
