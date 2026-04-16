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


const AdminLocationMap = dynamic(() => import('@/components/admin/AdminLocationMap'), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center h-full bg-slate-50 rounded-2xl">
            <Loader2 className="w-6 h-6 text-chrono-blue animate-spin mb-2" />
            <small className="text-slate-400 dark:text-zinc-500">Cargando mapa...</small>
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
        label: 'Activos Ahora',
        value: stats.activos,
        subtext: 'en turno activo',
        icon: Users,
        gradient: 'from-emerald-500 via-emerald-400 to-teal-400',
        glow: 'shadow-emerald-500/25',
        trend: TrendingUp,
        trendColor: 'text-emerald-200',
        bg: 'bg-emerald-500',
        hideOnMobile: false,
    },
    {
        label: 'Retrasos Hoy',
        value: stats.alertas,
        subtext: 'llegadas tardías',
        icon: AlertCircle,
        gradient: 'from-rose-500 via-red-500 to-orange-500',
        glow: 'shadow-rose-500/25',
        trend: stats.alertas > 0 ? TrendingUp : Minus,
        trendColor: 'text-rose-200',
        bg: 'bg-rose-500',
        hideOnMobile: false,
    },
    {
        label: 'Peticiones',
        value: stats.pendientes,
        subtext: 'pendientes de aprobar',
        icon: Hourglass,
        gradient: 'from-violet-600 via-purple-500 to-indigo-500',
        glow: 'shadow-violet-500/25',
        trend: TrendingDown,
        trendColor: 'text-violet-200',
        bg: 'bg-violet-500',
        hideOnMobile: true,
    },
    {
        label: 'Equipo',
        value: stats.total,
        subtext: 'empleados totales',
        icon: Building2,
        gradient: 'from-slate-700 via-slate-800 to-navy',
        glow: 'shadow-slate-700/25',
        trend: Minus,
        trendColor: 'text-slate-400 dark:text-zinc-500',
        bg: 'bg-slate-700',
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
            <div className="flex justify-between items-end mb-8 hidden lg:flex">
                <div>
                    <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium mb-2 uppercase tracking-widest">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 className="font-extrabold text-[#0F172A] dark:text-zinc-200 text-[2.2rem] leading-[1.1] font-[family-name:var(--font-jakarta)] tracking-tight">
                        Hola, <span className="text-chrono-blue">{userName || 'Admin'}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm px-4 py-2 rounded-full text-sm text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {currentTime && <span className="font-bold text-[#0F172A] dark:text-zinc-200">{currentTime}</span>}
                    </div>
                </div>
            </div>

            {/* MOBILE HEADER — iOS large title */}
            <div className="mb-6 lg:hidden">
                <p className="text-slate-400 dark:text-zinc-500 text-xs font-medium mb-1 uppercase tracking-widest">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <h1 className="font-extrabold text-[#0F172A] dark:text-zinc-200 text-[1.9rem] leading-[1.1] font-[family-name:var(--font-jakarta)] tracking-tight">
                    Panel Admin
                </h1>
            </div>

            {/* ── STAT CARDS GRID ─────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map((card) => {
                    const Icon = card.icon;
                    const Trend = card.trend;
                    return (
                        <div key={card.label} className={cn(card.hideOnMobile && 'hidden lg:block')}>
                            <m.div
                                className={cn(
                                    'relative overflow-hidden rounded-2xl p-5 cursor-default',
                                    'bg-gradient-to-br', card.gradient,
                                    'shadow-xl', card.glow,
                                    'group'
                                )}
                                whileHover={{ y: -8, scale: 1.02, boxShadow: '0 28px 60px rgba(15,23,42,0.18)' }}
                                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                            >
                                {/* Header row */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="bg-white/15 rounded-xl p-2">
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                                        <Trend className={cn('w-3 h-3', card.trendColor)} />
                                        <span className="text-white/70 text-[0.6rem] font-bold">HOY</span>
                                    </div>
                                </div>

                                {/* Value */}
                                <div className="mb-1">
                                    <span className="text-5xl font-extrabold text-white font-[family-name:var(--font-jakarta)] leading-none tracking-tight">
                                        {loading ? (
                                            <span className="inline-block w-8 h-10 bg-white/20 rounded-lg animate-pulse" />
                                        ) : card.value}
                                    </span>
                                </div>

                                {/* Labels */}
                                <p className="text-white font-bold text-xs uppercase tracking-wide mb-0 mt-2">{card.label}</p>
                                <p className="text-white/60 text-[0.7rem] mt-0.5">{card.subtext}</p>

                                {/* Decorative blob */}
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors duration-300" />
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5" />

                                {/* Highlight edge */}
                                <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)' }} />
                            </m.div>
                        </div>
                    );
                })}
            </div>

            {/* ── MAP + ACTIVITY ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* MAP */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-3">
                        <h5 className="font-bold text-navy dark:text-zinc-100 font-[family-name:var(--font-jakarta)]">
                            Ubicación en Tiempo Real
                        </h5>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCreateSedeModal(true)}
                                className="bg-navy text-white text-xs font-semibold rounded-full flex items-center gap-1.5 px-3 py-1.5 border-none cursor-pointer hover:bg-slate-800 transition-all hover:shadow-md active:scale-95"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Nueva Sede</span>
                            </button>
                            <button
                                onClick={() => setShowSedeListModal(true)}
                                className="bg-white text-navy dark:text-zinc-100 text-xs font-semibold rounded-full flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-zinc-700 cursor-pointer hover:bg-gray-50 transition-all hover:shadow-sm active:scale-95"
                            >
                                <List className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Ver Todas</span>
                            </button>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden relative h-80">
                        <AdminLocationMap />
                    </div>
                </div>

                {/* ACTIVITY FEED */}
                <div>
                    <h5 className="font-bold text-navy dark:text-zinc-100 mb-3 font-[family-name:var(--font-jakarta)]">Actividad Reciente</h5>
                    <div className="flex flex-col gap-2">
                        {loading ? (
                            <div className="flex flex-col gap-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
                                        <div className="skeleton w-9 h-9 rounded-full shrink-0" />
                                        <div className="flex-grow">
                                            <div className="skeleton h-3 w-3/4 rounded mb-2" />
                                            <div className="skeleton h-2.5 w-1/2 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : actividad.length === 0 ? (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 text-center border border-gray-100 dark:border-zinc-800">
                                <Clock className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                                <small className="text-slate-400 dark:text-zinc-500">Sin actividad reciente</small>
                            </div>
                        ) : (
                            actividad.map((item) => (
                                <div key={item.id}
                                    className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-3.5 hover:shadow-md hover:-translate-y-px transition-all duration-200 cursor-default group">
                                    <div className="flex gap-3 items-start">
                                        {/* Avatar */}
                                        <div
                                            className="rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 w-9 h-9 shadow-sm"
                                            style={{ backgroundColor: item.actorColor }}
                                        >
                                            {item.actorInitials}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h6 className="font-bold text-navy dark:text-zinc-100 text-xs m-0 truncate">{item.titulo}</h6>
                                                <span className="text-slate-300 text-[10px] shrink-0 ml-2">{item.tiempo}</span>
                                            </div>
                                            <p className="text-slate-400 dark:text-zinc-500 text-xs m-0 truncate">{item.descripcion}</p>
                                        </div>
                                        {/* Status dot */}
                                        <div className={cn('w-2 h-2 rounded-full shrink-0 mt-1.5', item.color)} />
                                    </div>
                                </div>
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