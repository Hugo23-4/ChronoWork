'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import CreateSedeModal from '@/components/admin/CreateSedeModal';
import SedeListModal from '@/components/admin/SedeListModal';
import { Users, AlertCircle, Clock, Hourglass, Building2, Plus, List, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { m } from 'framer-motion';
import { staggerContainer, staggerItem, springSoft } from '@/lib/motion';


const AdminLocationMap = dynamic(() => import('@/components/admin/AdminLocationMap'), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center h-full bg-systemGray-6 dark:bg-white/3 rounded-[24px]">
            <Loader2 className="w-6 h-6 text-ios-blue animate-spin mb-2" />
            <small className="text-[--color-label-secondary] dark:text-[#aeaeb2]">Cargando mapa…</small>
        </div>
    )
});

interface AdminViewProps {
    userName?: string;
}

interface ActivityItem {
    id: string;
    tipo: 'alerta' | 'solicitud' | 'fichaje';
    titulo: string;
    descripcion: string;
    tiempo: string;
    color: string;
    actorInitials?: string;
    actorColor?: string;
}

const statCards = (stats: { activos: number; total: number; alertas: number; retrasos: number; pendientes: number }) => [
    {
        label: 'Activos ahora',
        value: stats.activos,
        subtext: 'en turno activo',
        icon: Users,
        accent: '#34C759',
        trend: TrendingUp,
        hideOnMobile: false,
    },
    {
        label: 'Retrasos hoy',
        value: stats.alertas,
        subtext: 'llegadas tardías',
        icon: AlertCircle,
        accent: '#FF3B30',
        trend: stats.alertas > 0 ? TrendingUp : Minus,
        hideOnMobile: false,
    },
    {
        label: 'Peticiones',
        value: stats.pendientes,
        subtext: 'pendientes de aprobar',
        icon: Hourglass,
        accent: '#AF52DE',
        trend: TrendingDown,
        hideOnMobile: true,
    },
    {
        label: 'Equipo',
        value: stats.total,
        subtext: 'empleados totales',
        icon: Building2,
        accent: '#007AFF',
        trend: Minus,
        hideOnMobile: true,
    },
];

export default function AdminView({ userName }: AdminViewProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ activos: 0, total: 0, alertas: 0, retrasos: 0, pendientes: 0 });
    const [actividad, setActividad] = useState<ActivityItem[]>([]);
    const [showCreateSedeModal, setShowCreateSedeModal] = useState(false);
    const [showSedeListModal, setShowSedeListModal] = useState(false);
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        if (!profile?.empresa_id) return;
        fetchDashboardData();
        const tick = () => setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
        tick();
        const interval = setInterval(tick, 60000);
        return () => clearInterval(interval);
    }, [profile?.empresa_id]);

    const fetchDashboardData = async () => {
        if (!profile?.empresa_id) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            const eid = profile.empresa_id;
            // dia_semana: 0=Lun … 4=Vie (same encoding as turnos table)
            const jsDay = new Date().getDay(); // 0=Sun,1=Mon…6=Sat
            const diaSemana = jsDay === 0 ? -1 : jsDay - 1; // -1 = weekend, no turnos

            const [
                { count: activosHoy },
                { data: fichajesHoy },
                { count: solicitudesPendientes },
                { count: totalEmpleados },
                { data: ultimasSolicitudes },
                { data: turnosHoy },
            ] = await Promise.all([
                supabase.from('fichajes').select('*', { count: 'exact', head: true }).eq('empresa_id', eid).eq('fecha', today).is('hora_salida', null),
                supabase.from('fichajes').select('empleado_id, hora_entrada').eq('empresa_id', eid).eq('fecha', today),
                supabase.from('solicitudes').select('*', { count: 'exact', head: true }).eq('empresa_id', eid).eq('estado', 'pendiente'),
                supabase.from('empleados_info').select('*', { count: 'exact', head: true }).eq('empresa_id', eid),
                supabase.from('solicitudes').select('*, empleados_info(nombre_completo)').eq('empresa_id', eid).order('created_at', { ascending: false }).limit(5),
                diaSemana >= 0
                    ? supabase.from('turnos').select('empleado_id, hora_inicio').eq('empresa_id', eid).eq('dia_semana', diaSemana)
                    : Promise.resolve({ data: [] }),
            ]);

            // Build map: empleado_id → expected start time (minutes from midnight)
            const turnoMap: Record<string, number> = {};
            (turnosHoy || []).forEach((t: Record<string, string>) => {
                const [h, m] = (t.hora_inicio || '').split(':').map(Number);
                if (!isNaN(h)) turnoMap[t.empleado_id] = h * 60 + (m || 0);
            });

            let retrasosCount = 0;
            (fichajesHoy || []).forEach((f: Record<string, string>) => {
                try {
                    // Only count retraso if employee has a turno today
                    if (!(f.empleado_id in turnoMap)) return;
                    let horaEntrada: Date;
                    if (f.hora_entrada.includes('T') || f.hora_entrada.includes('Z')) {
                        horaEntrada = new Date(f.hora_entrada);
                    } else {
                        const [hours, minutes] = f.hora_entrada.split(':').map(Number);
                        horaEntrada = new Date();
                        horaEntrada.setHours(hours, minutes, 0, 0);
                    }
                    const entradaMinutos = horaEntrada.getHours() * 60 + horaEntrada.getMinutes();
                    // Retraso = más de 5 min tarde respecto al turno asignado
                    if (entradaMinutos > turnoMap[f.empleado_id] + 5) retrasosCount++;
                } catch { /* skip */ }
            });

            setStats({ activos: activosHoy || 0, total: totalEmpleados || 0, alertas: retrasosCount, retrasos: retrasosCount, pendientes: solicitudesPendientes || 0 });

            const actividadFormateada: ActivityItem[] = (ultimasSolicitudes || []).map((sol: Record<string, unknown>) => {
                const info = (sol.empleados_info as Record<string, string>) ?? {};
                const nombre = info.nombre_completo || 'Empleado';
                return {
                    id: sol.id as string,
                    tipo: 'solicitud' as const,
                    titulo: sol.tipo === 'vacaciones' ? 'Solicitud de Vacaciones' : sol.tipo === 'baja' ? 'Baja Médica' : String(sol.tipo),
                    descripcion: nombre,
                    tiempo: formatTiempo(sol.created_at as string),
                    color: sol.estado === 'pendiente' ? 'bg-amber-400' : sol.estado === 'aprobado' ? 'bg-emerald-500' : 'bg-red-400',
                    actorInitials: nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase(),
                    actorColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][nombre.charCodeAt(0) % 5],
                };
            });

            setActividad(actividadFormateada);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTiempo = (fecha: string) => {
        const diffMins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
        const diffHoras = Math.floor(diffMins / 60);
        const diffDias = Math.floor(diffHoras / 24);
        if (diffMins < 60) return `hace ${diffMins}m`;
        if (diffHoras < 24) return `hace ${diffHoras}h`;
        return `hace ${diffDias}d`;
    };

    const cards = statCards(stats);

    return (
        <div className="animate-fade-up pb-8">

            {/* Mobile top spacer — AdminMobileHeader is fixed, rendered by admin layout */}
            <div className="pt-14 lg:pt-0" />

            {/* DESKTOP HEADER — iOS large title style */}
            <div className="hidden lg:flex justify-between items-end mb-8">
                <div>
                    <p className="text-[12px] font-medium text-[--color-label-secondary] dark:text-[#aeaeb2] mb-2 capitalize">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 className="cw-title-1 text-[--color-label-primary] dark:text-white">
                        Hola, <span className="text-ios-blue">{userName || 'Admin'}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2 cw-surface px-3.5 py-2 !rounded-full">
                    <div className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
                    {currentTime && <span className="cw-numeric font-semibold text-[14px] text-[--color-label-primary] dark:text-white">{currentTime}</span>}
                </div>
            </div>

            {/* MOBILE HEADER — iOS large title */}
            <div className="mb-6 lg:hidden">
                <p className="text-[12px] font-medium text-[--color-label-secondary] dark:text-[#aeaeb2] mb-1 capitalize">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <h1 className="cw-title-1 text-[--color-label-primary] dark:text-white">
                    Panel admin
                </h1>
            </div>

            {/* ── STAT CARDS GRID ─────────────────────────────────── */}
            <m.div
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {cards.map((card) => {
                    const Icon = card.icon;
                    const Trend = card.trend;
                    return (
                        <m.div
                            key={card.label}
                            variants={staggerItem}
                            whileHover={{ y: -2 }}
                            transition={springSoft}
                            className={cn(
                                'cw-surface p-5 cursor-default relative overflow-hidden',
                                card.hideOnMobile && 'hidden lg:block'
                            )}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: `${card.accent}1F` }}
                                >
                                    <Icon className="w-[18px] h-[18px]" style={{ color: card.accent }} />
                                </div>
                                <div className="flex items-center gap-1">
                                    <Trend className="w-3 h-3" style={{ color: card.accent }} />
                                </div>
                            </div>

                            <div className="cw-numeric leading-none tracking-tight font-semibold text-[40px] sm:text-[44px] text-[--color-label-primary] dark:text-white">
                                {loading ? (
                                    <span className="inline-block w-10 h-10 bg-systemGray-6 dark:bg-white/8 rounded-lg animate-pulse" />
                                ) : card.value}
                            </div>

                            <p className="text-[14px] font-medium text-[--color-label-primary] dark:text-white mt-2 mb-0">{card.label}</p>
                            <p className="text-[12px] text-[--color-label-secondary] dark:text-[#aeaeb2] mt-0.5">{card.subtext}</p>
                        </m.div>
                    );
                })}
            </m.div>

            {/* ── MAP + ACTIVITY ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* MAP */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="cw-title-2 text-[--color-label-primary] dark:text-white">
                            Ubicación en tiempo real
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCreateSedeModal(true)}
                                className="bg-ios-blue text-white text-[13px] font-semibold rounded-full flex items-center gap-1.5 px-3 h-9 border-none cursor-pointer hover:bg-[#0066D9] active:scale-[0.97] transition-all"
                                style={{ boxShadow: '0 4px 14px rgba(0,122,255,0.25)' }}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Nueva sede</span>
                            </button>
                            <button
                                onClick={() => setShowSedeListModal(true)}
                                className="bg-systemGray-6 dark:bg-white/8 text-[--color-label-primary] dark:text-white text-[13px] font-medium rounded-full flex items-center gap-1.5 px-3 h-9 border-0 cursor-pointer hover:bg-systemGray-5 dark:hover:bg-white/12 active:scale-[0.97] transition-all"
                            >
                                <List className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Ver todas</span>
                            </button>
                        </div>
                    </div>
                    <div className="cw-surface overflow-hidden relative h-80 !p-0">
                        <AdminLocationMap />
                    </div>
                </div>

                {/* ACTIVITY FEED */}
                <div>
                    <h2 className="cw-title-2 text-[--color-label-primary] dark:text-white mb-3">Actividad reciente</h2>
                    <div className="flex flex-col gap-2">
                        {loading ? (
                            <div className="flex flex-col gap-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="cw-surface p-3.5 flex items-center gap-3">
                                        <div className="skeleton w-9 h-9 rounded-full shrink-0" />
                                        <div className="flex-grow">
                                            <div className="skeleton h-3 w-3/4 rounded mb-2" />
                                            <div className="skeleton h-2.5 w-1/2 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : actividad.length === 0 ? (
                            <div className="cw-surface p-6 text-center">
                                <Clock className="w-7 h-7 text-[--color-label-tertiary] mx-auto mb-2" />
                                <small className="text-[--color-label-secondary] dark:text-[#aeaeb2]">Sin actividad reciente.</small>
                            </div>
                        ) : (
                            actividad.map((item) => (
                                <m.div
                                    key={item.id}
                                    whileHover={{ y: -2 }}
                                    transition={springSoft}
                                    className="cw-surface p-3.5 cursor-default"
                                >
                                    <div className="flex gap-3 items-start">
                                        <div
                                            className="rounded-full flex items-center justify-center text-white font-semibold text-[11px] shrink-0 w-9 h-9"
                                            style={{ backgroundColor: item.actorColor }}
                                        >
                                            {item.actorInitials}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h6 className="font-semibold text-[13px] text-[--color-label-primary] dark:text-white m-0 truncate">{item.titulo}</h6>
                                                <span className="text-[--color-label-tertiary] text-[11px] shrink-0 ml-2">{item.tiempo}</span>
                                            </div>
                                            <p className="text-[--color-label-secondary] dark:text-[#aeaeb2] text-[12px] m-0 truncate">{item.descripcion}</p>
                                        </div>
                                        <div className={cn('w-2 h-2 rounded-full shrink-0 mt-1.5', item.color)} />
                                    </div>
                                </m.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CreateSedeModal isOpen={showCreateSedeModal} onClose={() => setShowCreateSedeModal(false)} onSave={() => setShowCreateSedeModal(false)} />
            <SedeListModal isOpen={showSedeListModal} onClose={() => setShowSedeListModal(false)} />
        </div>
    );
}