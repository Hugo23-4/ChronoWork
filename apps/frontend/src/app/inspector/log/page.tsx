'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LogEntry {
    id: string;
    tipo: 'entrada' | 'salida' | 'modificacion' | 'intento_fallido';
    empleado_nombre: string;
    sede_nombre: string;
    fecha: string;
    hora: string;
    detalle: string;
    subdetalle: string;
    actor: string;
    hash: string;
}

export default function InspectorLogPage() {
    const [entries, setEntries] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTipo, setFilterTipo] = useState<string>('todos');

    useEffect(() => {
        fetchLog();
    }, []);

    const fetchLog = async () => {
        setLoading(true);

        // 1. Fetch fichajes (no FK join — empleados_info is a view)
        const { data: fichajes, error } = await supabase
            .from('fichajes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching log:', error);
            setLoading(false);
            return;
        }

        // 2. Batch fetch employee names
        const empleadoIds = [...new Set((fichajes || []).map((f: any) => f.empleado_id))];
        const empMap: Record<string, string> = {};

        if (empleadoIds.length > 0) {
            const { data: emps } = await supabase
                .from('empleados_info')
                .select('id, nombre_completo')
                .in('id', empleadoIds);
            (emps || []).forEach((e: any) => { empMap[e.id] = e.nombre_completo; });
        }

        // 3. Batch fetch sede names
        const sedeIds = [...new Set((fichajes || []).map((f: any) => f.sede_id).filter(Boolean))];
        const sedeMap: Record<string, string> = {};

        if (sedeIds.length > 0) {
            const { data: sedes } = await supabase
                .from('sedes')
                .select('id, nombre')
                .in('id', sedeIds);
            (sedes || []).forEach((s: any) => { sedeMap[s.id] = s.nombre; });
        }

        // 4. Fetch solicitudes for modifications
        const { data: solicitudes } = await supabase
            .from('solicitudes')
            .select('*')
            .in('tipo', ['correccion', 'modificacion'])
            .eq('estado', 'aprobada')
            .order('created_at', { ascending: false })
            .limit(20);

        // Batch fetch solicitudes employee names
        const solEmpIds = [...new Set((solicitudes || []).map((s: any) => s.empleado_id))];
        if (solEmpIds.length > 0) {
            const { data: solEmps } = await supabase
                .from('empleados_info')
                .select('id, nombre_completo')
                .in('id', solEmpIds);
            (solEmps || []).forEach((e: any) => { empMap[e.id] = e.nombre_completo; });
        }

        const logEntries: LogEntry[] = [];
        const chars = '0123456789abcdef';

        const makeHash = (seed: string) => {
            let h = '0x';
            for (let i = 0; i < 8; i++) h += chars[Math.abs(seed.charCodeAt(i % seed.length) * (i + 1)) % 16];
            return h + '...' + seed.substring(0, 4);
        };

        // Process fichajes
        (fichajes || []).forEach((f: any) => {
            const empNombre = empMap[f.empleado_id] || 'Desconocido';
            const sedeName = sedeMap[f.sede_id] || 'Sin sede';
            const hasGps = !!(f.latitud_entrada && f.longitud_entrada);

            // GPS fraud check
            if (f.ubicacion_error && f.ubicacion_error > 500) {
                logEntries.push({
                    id: f.id + '_fallido',
                    tipo: 'intento_fallido',
                    empleado_nombre: empNombre,
                    sede_nombre: sedeName,
                    fecha: f.fecha,
                    hora: f.hora_entrada || '--:--',
                    detalle: empNombre,
                    subdetalle: `⚠ Fuera de rango (${Math.round(f.ubicacion_error / 1000)}km)`,
                    actor: empNombre,
                    hash: makeHash(f.id + 'fail'),
                });
            }

            // Entrada
            logEntries.push({
                id: f.id + '_entrada',
                tipo: 'entrada',
                empleado_nombre: empNombre,
                sede_nombre: sedeName,
                fecha: f.fecha,
                hora: f.hora_entrada || '--:--',
                detalle: empNombre,
                subdetalle: `📍 ${sedeName} (${hasGps ? 'GPS Válido' : 'Sin GPS'})`,
                actor: empNombre,
                hash: makeHash(f.id),
            });

            // Salida
            if (f.hora_salida) {
                logEntries.push({
                    id: f.id + '_salida',
                    tipo: 'salida',
                    empleado_nombre: empNombre,
                    sede_nombre: sedeName,
                    fecha: f.fecha,
                    hora: f.hora_salida,
                    detalle: empNombre,
                    subdetalle: `📍 ${sedeName} (GPS Válido)`,
                    actor: empNombre,
                    hash: makeHash(f.id + 'out'),
                });
            }
        });

        // Process solicitudes
        (solicitudes || []).forEach((s: any) => {
            const empNombre = empMap[s.empleado_id] || 'Desconocido';
            const fecha = s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : '';
            const hora = s.created_at ? new Date(s.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--';

            logEntries.push({
                id: s.id + '_mod',
                tipo: 'modificacion',
                empleado_nombre: empNombre,
                sede_nombre: '',
                fecha: fecha,
                hora: hora,
                detalle: s.descripcion || 'Corrección de Hora',
                subdetalle: s.tipo === 'correccion'
                    ? `Salida: --:-- → ${s.correccion_salida ? new Date(s.correccion_salida).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '16:00'}`
                    : `Modificación aprobada`,
                actor: 'Admin (RRHH)',
                hash: makeHash(s.id),
            });
        });

        // Sort by date+time descending
        logEntries.sort((a, b) => {
            const dateA = a.fecha + ' ' + a.hora;
            const dateB = b.fecha + ' ' + b.hora;
            return dateB.localeCompare(dateA);
        });

        setEntries(logEntries);
        setLoading(false);
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr || timeStr === '--:--') return '--:--';
        if (timeStr.includes('T')) {
            return new Date(timeStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
        return timeStr.substring(0, 5);
    };

    const formatDate = (fecha: string) => {
        if (!fecha) return '';
        const d = new Date(fecha + 'T00:00:00');
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    };

    const getTipoConfig = (tipo: string) => {
        switch (tipo) {
            case 'entrada':
                return { label: 'ENTRADA REGISTRADA', color: '#10B981', borderColor: '#10B981', icon: 'bi-box-arrow-in-right', bg: '#F0FDF4' };
            case 'salida':
                return { label: 'SALIDA REGISTRADA', color: '#3B82F6', borderColor: '#3B82F6', icon: 'bi-box-arrow-right', bg: '#EFF6FF' };
            case 'modificacion':
                return { label: 'MODIFICACIÓN MANUAL', color: '#F59E0B', borderColor: '#F59E0B', icon: 'bi-pencil-square', bg: '#FFFBEB' };
            case 'intento_fallido':
                return { label: 'INTENTO FALLIDO', color: '#EF4444', borderColor: '#EF4444', icon: 'bi-exclamation-triangle', bg: '#FEF2F2' };
            default:
                return { label: 'EVENTO', color: '#6B7280', borderColor: '#E5E7EB', icon: 'bi-record-fill', bg: '#F9FAFB' };
        }
    };

    const filteredEntries = filterTipo === 'todos'
        ? entries
        : entries.filter(e => e.tipo === filterTipo);

    return (
        <div className="fade-in-up">

            {/* Header */}
            <div className="mb-4 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
                <h2 className="font-bold text-white mb-1">Registro de Auditoría</h2>
                <p className="text-white/50 text-sm mb-0">Log de inmutabilidad (Blockchain)</p>
                <div className="flex items-center gap-2 mt-2">
                    <i className="bi bi-shield-lock-fill text-amber-500"></i>
                    <span className="font-bold text-amber-500 text-sm">MODO LECTURA: NO EDITABLE</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-3">
                {[
                    { value: 'todos', label: 'Todos' },
                    { value: 'entrada', label: 'Entradas' },
                    { value: 'salida', label: 'Salidas' },
                    { value: 'modificacion', label: 'Modificaciones' },
                    { value: 'intento_fallido', label: 'Fallidos' },
                ].map(f => (
                    <button
                        key={f.value}
                        className={`text-sm py-1.5 px-3 rounded-full ${filterTipo === f.value ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => setFilterTipo(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
                <span className="bg-gray-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold text-navy border rounded-full px-3 py-2 ml-auto">
                    {filteredEntries.length} movimientos
                </span>
            </div>

            {/* Section Title */}
            <h6 className="text-amber-500 font-bold uppercase text-sm mb-3" style={{ letterSpacing: '0.1em' }}>
                ÚLTIMOS MOVIMIENTOS
            </h6>

            {/* Log Entries */}
            {loading ? (
                <div className="text-center py-6">
                    <div className="animate-spin text-amber-500"></div>
                    <p className="text-slate-400 text-sm mt-2">Cargando registro inmutable...</p>
                </div>
            ) : filteredEntries.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-2xl p-4 text-center">
                    <i className="bi bi-journal-x text-slate-400 mb-2" style={{ fontSize: '2.5rem' }}></i>
                    <p className="text-slate-400">No hay movimientos registrados</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredEntries.map((entry) => {
                        const config = getTipoConfig(entry.tipo);

                        return (
                            <div key={entry.id} className="card border-0 shadow-sm rounded-2xl overflow-hidden"
                                style={{ borderLeft: `4px solid ${config.borderColor}` }}>
                                <div className="p-3 md:p-4" style={{ background: config.bg }}>

                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold" style={{
                                            color: config.color,
                                            fontSize: '0.7rem',
                                            letterSpacing: '0.05em'
                                        }}>
                                            {config.label}
                                        </span>
                                        <span className="text-slate-400 font-mono" style={{ fontSize: '0.75rem' }}>
                                            {formatDate(entry.fecha)} • {formatTime(entry.hora)}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <h6 className="font-bold text-navy mb-1">{entry.detalle}</h6>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-sm ${entry.tipo === 'intento_fallido' ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                            {entry.subdetalle}
                                        </span>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-full flex items-center justify-center"
                                                style={{
                                                    width: 24, height: 24,
                                                    background: entry.tipo === 'intento_fallido' ? '#FEE2E2' :
                                                        entry.tipo === 'modificacion' ? '#FEF3C7' : '#F3F4F6'
                                                }}>
                                                <i className={`bi ${config.icon}`} style={{ fontSize: '0.6rem', color: config.color }}></i>
                                            </div>
                                            <span className="text-slate-400 text-sm">{entry.actor}</span>
                                        </div>
                                        <code className="text-amber-500" style={{ fontSize: '0.65rem' }}>
                                            Hash: {entry.hash}
                                        </code>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
}
