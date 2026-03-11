'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import AdminMobileHeader from './AdminMobileHeader';
import CreateSedeModal from '@/components/admin/CreateSedeModal';
import SedeListModal from '@/components/admin/SedeListModal';
import { Users, AlertCircle, Clock, Hourglass, Building2, Plus, List, Loader2 } from 'lucide-react';

const AdminLocationMap = dynamic(() => import('@/components/admin/AdminLocationMap'), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center h-full bg-bg-subtle rounded-2xl">
            <Loader2 className="w-6 h-6 text-chrono-blue animate-spin mb-2" />
            <small className="text-slate-400">Cargando mapa...</small>
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
}

export default function AdminView({ userName }: AdminViewProps) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activos: 0,
        total: 0,
        alertas: 0,
        retrasos: 0,
        pendientes: 0
    });
    const [actividad, setActividad] = useState<ActivityItem[]>([]);
    const [showCreateSedeModal, setShowCreateSedeModal] = useState(false);
    const [showSedeListModal, setShowSedeListModal] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { count: activosHoy } = await supabase
                .from('fichajes')
                .select('*', { count: 'exact', head: true })
                .eq('fecha', today)
                .is('hora_salida', null);

            const { data: fichajesHoy } = await supabase
                .from('fichajes')
                .select('hora_entrada')
                .eq('fecha', today);

            let retrasosCount = 0;
            if (fichajesHoy) {
                fichajesHoy.forEach((f: Record<string, string>) => {
                    try {
                        let horaEntrada: Date;
                        if (f.hora_entrada.includes('T') || f.hora_entrada.includes('Z')) {
                            horaEntrada = new Date(f.hora_entrada);
                        } else {
                            const [hours, minutes] = f.hora_entrada.split(':').map(Number);
                            horaEntrada = new Date();
                            horaEntrada.setHours(hours, minutes, 0, 0);
                        }
                        const limite = new Date();
                        limite.setHours(9, 0, 0, 0);
                        if (horaEntrada > limite) {
                            retrasosCount++;
                        }
                    } catch {
                        // Skip invalid entries
                    }
                });
            }

            const { count: solicitudesPendientes } = await supabase
                .from('solicitudes')
                .select('*', { count: 'exact', head: true })
                .eq('estado', 'pendiente');

            const { count: totalEmpleados } = await supabase
                .from('empleados_info')
                .select('*', { count: 'exact', head: true });

            const { data: ultimasSolicitudes } = await supabase
                .from('solicitudes')
                .select('*, empleados_info(nombre_completo)')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                activos: activosHoy || 0,
                total: totalEmpleados || 0,
                alertas: retrasosCount || 0,
                retrasos: retrasosCount || 0,
                pendientes: solicitudesPendientes || 0
            });

            const actividadFormateada: ActivityItem[] = (ultimasSolicitudes || []).map((sol: Record<string, unknown>) => ({
                id: sol.id as string,
                tipo: 'solicitud' as const,
                titulo: sol.tipo === 'vacaciones' ? 'Solicitud de Vacaciones' : 'Solicitud de Baja',
                descripcion: `${(sol.empleados_info as Record<string, string>)?.nombre_completo || 'Empleado'}: ${sol.tipo}`,
                tiempo: formatTiempo(sol.created_at as string),
                color: sol.estado === 'pendiente' ? 'bg-amber-500' : sol.estado === 'aprobado' ? 'bg-emerald-500' : 'bg-gray-400'
            }));

            setActividad(actividadFormateada);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTiempo = (fecha: string) => {
        const ahora = new Date();
        const fechaSol = new Date(fecha);
        const diffMs = ahora.getTime() - fechaSol.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHoras = Math.floor(diffMins / 60);
        const diffDias = Math.floor(diffHoras / 24);

        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHoras < 24) return `Hace ${diffHoras}h`;
        return `Hace ${diffDias}d`;
    };

    const statCards = [
        {
            label: 'ACTIVOS HOY',
            value: stats.activos,
            subtext: 'En turno activo',
            icon: Users,
            subIcon: Users,
            gradient: 'from-emerald-500 to-emerald-600',
        },
        {
            label: 'RETRASOS HOY',
            value: stats.alertas,
            subtext: 'Entraron tarde',
            icon: AlertCircle,
            subIcon: Clock,
            gradient: 'from-red-500 to-red-600',
        },
        {
            label: 'PENDIENTES',
            value: stats.pendientes,
            subtext: 'Solicitudes',
            icon: Hourglass,
            subIcon: Clock,
            gradient: 'from-blue-500 to-blue-600',
            hideOnMobile: true,
        },
        {
            label: 'EQUIPO TOTAL',
            value: stats.total,
            subtext: 'Empleados',
            icon: Building2,
            subIcon: Users,
            gradient: 'from-slate-800 to-navy',
            hideOnMobile: true,
        },
    ];

    return (
        <div className="animate-fade-up pb-6">

            {/* HEADER MÓVIL */}
            <AdminMobileHeader />

            {/* HEADER DESKTOP */}
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h6 className="text-chrono-blue font-bold uppercase text-xs mb-1 tracking-wide">Estado Actual</h6>
                    <h2 className="font-bold text-navy text-2xl font-[family-name:var(--font-jakarta)]">Hola, {userName || 'Admin'}</h2>
                </div>
                <div className="hidden lg:block">
                    <span className="bg-bg-subtle text-slate-500 border border-gray-200 px-3 py-2 rounded-full text-sm">
                        {new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}
                    </span>
                </div>
            </div>

            {/* ESTADÍSTICAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {statCards.map((card) => {
                    const DecorIcon = card.icon;
                    const SubIcon = card.subIcon;
                    return (
                        <div
                            key={card.label}
                            className={`${card.hideOnMobile ? 'hidden lg:block' : ''}`}
                        >
                            <div
                                className={`relative overflow-hidden rounded-2xl p-4 shadow-md bg-gradient-to-br ${card.gradient} hover:-translate-y-1 transition-transform duration-300 cursor-default`}
                            >
                                <h6 className="text-white/90 text-xs font-bold mb-2 uppercase tracking-wide">{card.label}</h6>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-bold text-white">
                                        {loading ? '...' : card.value}
                                    </span>
                                </div>
                                <small className="text-white font-bold flex items-center gap-1 mt-2">
                                    <SubIcon className="w-3.5 h-3.5" />
                                    {card.subtext}
                                </small>
                                {/* Icono decorativo */}
                                <DecorIcon className="absolute -right-3 -bottom-3 w-20 h-20 text-white/10" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- MAPA Y ACTIVIDAD --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* MAPA */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-3">
                        <h5 className="font-bold text-lg font-[family-name:var(--font-jakarta)]">Ubicación de Personal</h5>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCreateSedeModal(true)}
                                className="bg-navy text-white text-sm rounded-full flex items-center gap-2 px-3 py-1.5 border-none cursor-pointer hover:bg-slate-dark transition-colors font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden md:inline">Nueva Sede</span>
                            </button>
                            <button
                                onClick={() => setShowSedeListModal(true)}
                                className="bg-white text-navy text-sm rounded-full flex items-center gap-2 px-3 py-1.5 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors font-medium"
                            >
                                <List className="w-4 h-4" />
                                <span className="hidden md:inline">Ver Todas</span>
                            </button>
                        </div>
                    </div>
                    <div className="bg-white border-none shadow-sm rounded-2xl overflow-hidden relative h-80">
                        <AdminLocationMap />
                    </div>
                </div>

                {/* ACTIVIDAD */}
                <div>
                    <h5 className="font-bold text-lg mb-3 font-[family-name:var(--font-jakarta)]">Actividad Reciente</h5>
                    <div className="flex flex-col gap-3">

                        {loading ? (
                            <div className="text-center py-4">
                                <Loader2 className="w-5 h-5 text-chrono-blue animate-spin mx-auto" />
                            </div>
                        ) : actividad.length === 0 ? (
                            <div className="bg-white shadow-sm rounded-2xl p-3 text-center border-none">
                                <small className="text-slate-400">No hay actividad reciente</small>
                            </div>
                        ) : (
                            actividad.map((item) => (
                                <div key={item.id} className="bg-white shadow-sm rounded-2xl p-3 border-none hover:shadow-md transition-shadow">
                                    <div className="flex gap-3">
                                        <div className="mt-2">
                                            <span className={`block rounded-full w-2.5 h-2.5 ${item.color}`} />
                                        </div>
                                        <div>
                                            <h6 className="font-bold text-navy text-sm m-0">{item.titulo}</h6>
                                            <p className="text-slate-400 text-xs m-0">{item.descripcion}</p>
                                            <small className="text-slate-300 text-[11px]">{item.tiempo}</small>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                    </div>
                </div>

            </div>

            {/* Modal crear sede */}
            <CreateSedeModal
                isOpen={showCreateSedeModal}
                onClose={() => setShowCreateSedeModal(false)}
                onSave={() => {
                    setShowCreateSedeModal(false);
                }}
            />

            {/* Modal ver lista de sedes */}
            <SedeListModal
                isOpen={showSedeListModal}
                onClose={() => setShowSedeListModal(false)}
            />

        </div>
    );
}