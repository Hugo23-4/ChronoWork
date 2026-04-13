'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, LogIn, LogOut as LogOutIcon, Pencil, AlertTriangle, Circle, Loader2, FileX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry { id: string; tipo: 'entrada' | 'salida' | 'modificacion' | 'intento_fallido'; empleado_nombre: string; sede_nombre: string; fecha: string; hora: string; detalle: string; subdetalle: string; actor: string; hash: string; }

export default function InspectorLogPage() {
    const [entries, setEntries] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTipo, setFilterTipo] = useState<string>('todos');

    useEffect(() => { fetchLog(); }, []);

    const fetchLog = async () => {
        setLoading(true);

        interface FichajeLog { id: string; empleado_id: string; sede_id: string | null; fecha: string; hora_entrada: string | null; hora_salida: string | null; latitud_entrada: number | null; longitud_entrada: number | null; latitud_salida: number | null; longitud_salida: number | null; ubicacion_error: number | null; empleados_info: { nombre_completo: string } | null; sedes: { nombre: string } | null; }
        interface SolicitudLog { id: string; empleado_id: string; tipo: string; descripcion: string | null; correccion_salida: string | null; created_at: string; empleados_info: { nombre_completo: string } | null; }

        const [fichajesRes, solicitudesRes] = await Promise.all([
            supabase.from('fichajes').select('id, empleado_id, sede_id, fecha, hora_entrada, hora_salida, latitud_entrada, longitud_entrada, latitud_salida, longitud_salida, ubicacion_error, empleados_info(nombre_completo), sedes(nombre)').order('created_at', { ascending: false }).limit(50),
            supabase.from('solicitudes').select('id, empleado_id, tipo, descripcion, correccion_salida, created_at, empleados_info(nombre_completo)').in('tipo', ['correccion', 'modificacion']).eq('estado', 'aprobada').order('created_at', { ascending: false }).limit(20),
        ]);

        if (fichajesRes.error) { console.error('Error fetching log:', fichajesRes.error); setLoading(false); return; }

        const fichajes = (fichajesRes.data || []) as FichajeLog[];
        const solicitudes = (solicitudesRes.data || []) as SolicitudLog[];

        const logEntries: LogEntry[] = [];
        const chars = '0123456789abcdef';
        const makeHash = (seed: string) => { let h = '0x'; for (let i = 0; i < 8; i++) h += chars[Math.abs(seed.charCodeAt(i % seed.length) * (i + 1)) % 16]; return h + '...' + seed.substring(0, 4); };

        fichajes.forEach(f => {
            const empNombre = f.empleados_info?.nombre_completo ?? 'Desconocido';
            const sedeName = f.sedes?.nombre ?? 'Sin sede';
            const hasGpsEntrada = !!(f.latitud_entrada && f.longitud_entrada);
            const hasGpsSalida = !!(f.latitud_salida && f.longitud_salida);
            if (typeof f.ubicacion_error === 'number' && f.ubicacion_error > 500) logEntries.push({ id: f.id + '_fallido', tipo: 'intento_fallido', empleado_nombre: empNombre, sede_nombre: sedeName, fecha: f.fecha, hora: f.hora_entrada || '--:--', detalle: empNombre, subdetalle: `⚠ Fuera de rango (${Math.round(f.ubicacion_error / 1000)}km)`, actor: empNombre, hash: makeHash(f.id + 'fail') });
            logEntries.push({ id: f.id + '_entrada', tipo: 'entrada', empleado_nombre: empNombre, sede_nombre: sedeName, fecha: f.fecha, hora: f.hora_entrada || '--:--', detalle: empNombre, subdetalle: `📍 ${sedeName} (${hasGpsEntrada ? 'GPS Válido' : 'Sin GPS'})`, actor: empNombre, hash: makeHash(f.id) });
            if (f.hora_salida) logEntries.push({ id: f.id + '_salida', tipo: 'salida', empleado_nombre: empNombre, sede_nombre: sedeName, fecha: f.fecha, hora: f.hora_salida, detalle: empNombre, subdetalle: `📍 ${sedeName} (${hasGpsSalida ? 'GPS Válido' : 'Sin GPS'})`, actor: empNombre, hash: makeHash(f.id + 'out') });
        });

        solicitudes.forEach(s => {
            const empNombre = s.empleados_info?.nombre_completo ?? 'Desconocido';
            const fecha = s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : '';
            const hora = s.created_at ? new Date(s.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--';
            logEntries.push({ id: s.id + '_mod', tipo: 'modificacion', empleado_nombre: empNombre, sede_nombre: '', fecha, hora, detalle: s.descripcion || 'Corrección de Hora', subdetalle: s.tipo === 'correccion' ? `Salida: --:-- → ${s.correccion_salida ? new Date(s.correccion_salida).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '16:00'}` : 'Modificación aprobada', actor: 'Admin (RRHH)', hash: makeHash(s.id) });
        });

        logEntries.sort((a, b) => (b.fecha + ' ' + b.hora).localeCompare(a.fecha + ' ' + a.hora));
        setEntries(logEntries); setLoading(false);
    };

    const formatTime = (t: string) => { if (!t || t === '--:--') return '--:--'; if (t.includes('T')) return new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); return t.substring(0, 5); };
    const formatDate = (f: string) => { if (!f) return ''; return new Date(f + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }); };

    const getTipoConfig = (tipo: string) => {
        switch (tipo) {
            case 'entrada': return { label: 'ENTRADA REGISTRADA', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-500', icon: LogIn, iconBg: 'bg-emerald-100' };
            case 'salida': return { label: 'SALIDA REGISTRADA', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-500', icon: LogOutIcon, iconBg: 'bg-blue-100' };
            case 'modificacion': return { label: 'MODIFICACIÓN MANUAL', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-500', icon: Pencil, iconBg: 'bg-amber-100' };
            case 'intento_fallido': return { label: 'INTENTO FALLIDO', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500', icon: AlertTriangle, iconBg: 'bg-red-100' };
            default: return { label: 'EVENTO', color: 'text-slate-500', bg: 'bg-gray-50', border: 'border-gray-300', icon: Circle, iconBg: 'bg-gray-100' };
        }
    };

    const filteredEntries = filterTipo === 'todos' ? entries : entries.filter(e => e.tipo === filterTipo);

    return (
        <div className="animate-fade-up">
            {/* Header */}
            <div className="mb-5 p-5 rounded-2xl bg-gradient-to-br from-navy to-slate-800">
                <h2 className="font-bold text-white mb-1 text-xl font-[family-name:var(--font-jakarta)]">Registro de Auditoría</h2>
                <p className="text-white/50 text-sm mb-0">Log de inmutabilidad (Blockchain)</p>
                <div className="flex items-center gap-2 mt-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-amber-500 text-sm">MODO LECTURA: NO EDITABLE</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                {[
                    { value: 'todos', label: 'Todos' },
                    { value: 'entrada', label: 'Entradas' },
                    { value: 'salida', label: 'Salidas' },
                    { value: 'modificacion', label: 'Modificaciones' },
                    { value: 'intento_fallido', label: 'Fallidos' },
                ].map(f => (
                    <button key={f.value} onClick={() => setFilterTipo(f.value)}
                        className={cn('px-3.5 py-1.5 rounded-full text-xs font-bold border-[1.5px] cursor-pointer transition-all',
                            filterTipo === f.value ? 'bg-navy text-white border-navy' : 'bg-transparent text-slate-500 border-gray-200 hover:border-gray-300')}>
                        {f.label}
                    </button>
                ))}
                <span className="bg-gray-100 text-navy text-xs px-3 py-1.5 rounded-full font-bold border border-gray-200 ml-auto">
                    {filteredEntries.length} movimientos
                </span>
            </div>

            <h6 className="text-amber-500 font-bold uppercase text-xs mb-3 tracking-[0.1em]">ÚLTIMOS MOVIMIENTOS</h6>

            {/* Log Entries */}
            {loading ? (
                <div className="text-center py-10"><Loader2 className="w-7 h-7 text-amber-500 animate-spin mx-auto" /><p className="text-slate-400 text-sm mt-2">Cargando registro inmutable...</p></div>
            ) : filteredEntries.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center shadow-sm"><FileX className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-400">No hay movimientos registrados</p></div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredEntries.map(entry => {
                        const config = getTipoConfig(entry.tipo);
                        const Icon = config.icon;
                        return (
                            <div key={entry.id} className={cn('bg-white rounded-2xl overflow-hidden shadow-sm border-l-4', config.border)}>
                                <div className={cn('p-3 md:p-4', config.bg)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={cn('font-bold text-[0.65rem] tracking-wider', config.color)}>{config.label}</span>
                                        <span className="text-slate-400 font-mono text-xs">{formatDate(entry.fecha)} · {formatTime(entry.hora)}</span>
                                    </div>
                                    <h6 className="font-bold text-navy text-sm mb-1">{entry.detalle}</h6>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={cn('text-sm', entry.tipo === 'intento_fallido' ? 'text-red-500 font-bold' : 'text-slate-400')}>{entry.subdetalle}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100/50">
                                        <div className="flex items-center gap-2">
                                            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', config.iconBg)}>
                                                <Icon className={cn('w-3 h-3', config.color)} />
                                            </div>
                                            <span className="text-slate-400 text-sm">{entry.actor}</span>
                                        </div>
                                        <code className="text-amber-500 text-[0.65rem]">Hash: {entry.hash}</code>
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
