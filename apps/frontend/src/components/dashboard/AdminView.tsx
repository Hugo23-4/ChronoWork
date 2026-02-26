'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import AdminMobileHeader from './AdminMobileHeader';
import CreateSedeModal from '@/components/admin/CreateSedeModal';
import SedeListModal from '@/components/admin/SedeListModal';

// Carga dinámica del mapa (Leaflet no soporta SSR)
const AdminLocationMap = dynamic(() => import('@/components/admin/AdminLocationMap'), {
    ssr: false,
    loading: () => (
        <div className="d-flex flex-column align-items-center justify-content-center h-100 bg-light rounded-4">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <small className="text-muted">Cargando mapa...</small>
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
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            // 1. ACTIVOS EN TURNO HOY (fichajes con hora_entrada hoy y sin hora_salida)
            const { count: activosHoy } = await supabase
                .from('fichajes')
                .select('*', { count: 'exact', head: true })
                .eq('fecha', today)
                .is('hora_salida', null);

            // 2. RETRASOS HOY (fichajes donde hora_entrada > 09:00:00)
            const { data: fichajesHoy } = await supabase
                .from('fichajes')
                .select('hora_entrada')
                .eq('fecha', today);

            let retrasosCount = 0;
            if (fichajesHoy) {
                fichajesHoy.forEach((f: any) => {
                    try {
                        // Parsear hora_entrada (puede ser ISO o HH:MM:SS)
                        let horaEntrada: Date;
                        if (f.hora_entrada.includes('T') || f.hora_entrada.includes('Z')) {
                            horaEntrada = new Date(f.hora_entrada);
                        } else {
                            const [hours, minutes] = f.hora_entrada.split(':').map(Number);
                            horaEntrada = new Date();
                            horaEntrada.setHours(hours, minutes, 0, 0);
                        }

                        // Comparar con 09:00 (consideramos retraso si entrada > 09:00)
                        const limite = new Date();
                        limite.setHours(9, 0, 0, 0);

                        if (horaEntrada > limite) {
                            retrasosCount++;
                        }
                    } catch (err) {
                        console.error('Error parsing hora_entrada:', err);
                    }
                });
            }

            // 3. SOLICITUDES PENDIENTES
            const { count: solicitudesPendientes } = await supabase
                .from('solicitudes')
                .select('*', { count: 'exact', head: true })
                .eq('estado', 'pendiente');

            // 4. TOTAL DE EMPLEADOS
            const { count: totalEmpleados } = await supabase
                .from('empleados_info')
                .select('*', { count: 'exact', head: true });

            // 5. ÚLTIMAS SOLICITUDES PARA ACTIVIDAD RECIENTE
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

            // Formatear actividad reciente
            const actividadFormateada: ActivityItem[] = (ultimasSolicitudes || []).map((sol: any) => ({
                id: sol.id,
                tipo: 'solicitud',
                titulo: sol.tipo === 'vacaciones' ? 'Solicitud de Vacaciones' : 'Solicitud de Baja',
                descripcion: `${sol.empleados_info?.nombre_completo || 'Empleado'}: ${sol.tipo}`,
                tiempo: formatTiempo(sol.created_at),
                color: sol.estado === 'pendiente' ? 'bg-warning' : sol.estado === 'aprobado' ? 'bg-success' : 'bg-secondary'
            }));

            setActividad(actividadFormateada);
        } catch (error) {
            console.error('❌ Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Formatear tiempo relativo
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

    return (
        <div className="fade-in-up pb-5">

            {/* HEADER MÓVIL */}
            <AdminMobileHeader />

            {/* HEADER DESKTOP */}
            <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                    <h6 className="text-primary fw-bold text-uppercase small mb-1 tracking-wide">Estado Actual</h6>
                    <h2 className="fw-bold text-dark mb-0">Hola, {userName || 'Admin'}</h2>
                </div>
                <div className="d-none d-lg-block">
                    <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill">
                        {new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}
                    </span>
                </div>
            </div>

            {/* ESTADÍSTICAS - Mejorado con gradientes y animaciones */}
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mb-4">

                {/* Card 1: Activos con gradiente verde */}
                <div className="col">
                    <div className="card h-100 border-0 shadow rounded-4 p-3 position-relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', transition: 'transform 0.3s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <h6 className="text-white small fw-bold mb-2 opacity-90">ACTIVOS HOY</h6>
                        <div className="d-flex align-items-baseline gap-1">
                            <span className="display-4 fw-bold text-white">
                                {loading ? '...' : stats.activos}
                            </span>
                        </div>
                        <small className="text-white fw-bold d-flex align-items-center gap-1 mt-2">
                            <i className="bi bi-people-fill"></i>
                            En turno activo
                        </small>
                        {/* Icono decorativo */}
                        <i className="bi bi-person-check-fill position-absolute opacity-10"
                            style={{ fontSize: '5rem', right: '-20px', bottom: '-20px' }}></i>
                    </div>
                </div>

                {/* Card 2: Alertas con gradiente rojo */}
                <div className="col">
                    <div className="card h-100 border-0 shadow rounded-4 p-3 position-relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', transition: 'transform 0.3s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <h6 className="text-white small fw-bold mb-2 opacity-90">RETRASOS HOY</h6>
                        <div className="d-flex align-items-baseline gap-1">
                            <span className="display-4 fw-bold text-white">
                                {loading ? '...' : stats.alertas}
                            </span>
                        </div>
                        <small className="text-white fw-bold d-flex align-items-center gap-1 mt-2">
                            <i className="bi bi-clock-history"></i>
                            Entraron tarde
                        </small>
                        <i className="bi bi-exclamation-circle-fill position-absolute opacity-10"
                            style={{ fontSize: '5rem', right: '-20px', bottom: '-20px' }}></i>
                    </div>
                </div>

                {/* Card 3: Pendientes con gradiente azul (solo desktop) */}
                <div className="col d-none d-lg-block">
                    <div className="card h-100 border-0 shadow rounded-4 p-3 position-relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', transition: 'transform 0.3s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <h6 className="text-white small fw-bold mb-2 opacity-90">PENDIENTES</h6>
                        <div className="d-flex align-items-baseline gap-1">
                            <span className="display-4 fw-bold text-white">
                                {loading ? '...' : stats.pendientes}
                            </span>
                        </div>
                        <small className="text-white fw-bold d-flex align-items-center gap-1 mt-2">
                            <i className="bi bi-clock-history"></i>
                            Solicitudes
                        </small>
                        <i className="bi bi-hourglass-split position-absolute opacity-10"
                            style={{ fontSize: '5rem', right: '-20px', bottom: '-20px' }}></i>
                    </div>
                </div>

                {/* Card 4: Total con gradiente oscuro (solo desktop) */}
                <div className="col d-none d-lg-block">
                    <div className="card h-100 border-0 shadow rounded-4 p-3 position-relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', transition: 'transform 0.3s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <h6 className="text-white small fw-bold mb-2 opacity-90">EQUIPO TOTAL</h6>
                        <div className="d-flex align-items-baseline gap-1">
                            <span className="display-4 fw-bold text-white">
                                {loading ? '...' : stats.total}
                            </span>
                        </div>
                        <small className="text-white fw-bold d-flex align-items-center gap-1 mt-2">
                            <i className="bi bi-people"></i>
                            Empleados
                        </small>
                        <i className="bi bi-building position-absolute opacity-10"
                            style={{ fontSize: '5rem', right: '-20px', bottom: '-20px' }}></i>
                    </div>
                </div>
            </div>

            {/* --- MAPA Y ACTIVIDAD --- */}
            <div className="row g-4">

                {/* MAPA */}
                <div className="col-12 col-lg-8">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold mb-0">Ubicación de Personal</h5>
                        <div className="d-flex gap-2">
                            <button
                                onClick={() => setShowCreateSedeModal(true)}
                                className="btn btn-primary btn-sm rounded-pill d-flex align-items-center gap-2 px-3"
                            >
                                <i className="bi bi-plus-lg"></i>
                                <span className="d-none d-md-inline">Nueva Sede</span>
                            </button>
                            <button
                                onClick={() => setShowSedeListModal(true)}
                                className="btn btn-outline-secondary btn-sm rounded-pill d-flex align-items-center gap-2 px-3"
                            >
                                <i className="bi bi-list"></i>
                                <span className="d-none d-md-inline">Ver Todas</span>
                            </button>
                        </div>
                    </div>
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative" style={{ height: '320px' }}>
                        <AdminLocationMap />
                    </div>
                </div>

                {/* ACTIVIDAD */}
                <div className="col-12 col-lg-4">
                    <h5 className="fw-bold mb-3">Actividad Reciente</h5>
                    <div className="d-flex flex-column gap-3">

                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                    <span className="visually-hidden">Cargando...</span>
                                </div>
                            </div>
                        ) : actividad.length === 0 ? (
                            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
                                <small className="text-muted">No hay actividad reciente</small>
                            </div>
                        ) : (
                            actividad.map((item) => (
                                <div key={item.id} className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                                    <div className="d-flex gap-3">
                                        <div className="mt-2">
                                            <span className={`d-block rounded-circle ${item.color}`} style={{ width: '10px', height: '10px' }}></span>
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-0 text-dark">{item.titulo}</h6>
                                            <p className="text-muted small mb-0">{item.descripcion}</p>
                                            <small className="text-secondary opacity-75" style={{ fontSize: '11px' }}>{item.tiempo}</small>
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