'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface SessionInfo {
    id: string;
    fecha: string;
    hora_inicio: string;
    duracion_minutos: number;
}

export default function InspectorPerfilPage() {
    const { user, profile, signOut } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalSessions, setTotalSessions] = useState(0);

    const MAX_SESSIONS_PER_WEEK = 3;

    useEffect(() => {
        fetchSessions();
    }, [user]);

    const getMonday = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday.toISOString().split('T')[0];
    };

    const fetchSessions = async () => {
        if (!user) return;

        const monday = getMonday();

        const { data, error } = await supabase
            .from('inspector_sesiones')
            .select('*')
            .eq('inspector_id', user.id)
            .gte('fecha', monday)
            .order('hora_inicio', { ascending: false });

        if (!error && data) {
            setSessions(data.map((s: any) => ({
                id: s.id,
                fecha: s.fecha,
                hora_inicio: s.hora_inicio,
                duracion_minutos: s.duracion_minutos || 0,
            })));
            setTotalSessions(data.length);
        }

        setLoading(false);
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    const remainingSessions = Math.max(0, MAX_SESSIONS_PER_WEEK - totalSessions);

    return (
        <div className="fade-in-up">

            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">

                    {/* Profile Card */}
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                        <div className="text-center py-4 px-3" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
                            <div className="rounded-circle mx-auto d-flex align-items-center justify-content-center fw-bold text-dark mb-3"
                                style={{ width: 72, height: 72, background: '#F59E0B', fontSize: '1.2rem' }}>
                                INS
                            </div>
                            <h4 className="fw-bold text-white mb-1">{profile?.nombre_completo || 'Inspector'}</h4>
                            <p className="text-white-50 small mb-0">{user?.email || 'inspector@chronowork.es'}</p>
                            <span className="badge rounded-pill px-3 py-1 mt-2" style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                                <i className="bi bi-shield-check me-1"></i>
                                Inspector de Trabajo
                            </span>
                        </div>

                        <div className="p-4">
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted small">Rol</span>
                                <span className="fw-bold small text-dark">Inspector</span>
                            </div>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted small">Acceso</span>
                                <span className="fw-bold small text-dark">Solo lectura</span>
                            </div>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted small">Permisos</span>
                                <span className="fw-bold small text-dark">Auditoría & Exportar</span>
                            </div>
                            <div className="d-flex justify-content-between py-2">
                                <span className="text-muted small">Sistema</span>
                                <span className="fw-bold small text-dark">ChronoWork AUDIT v1.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Session Limits Card */}
                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                        <h6 className="fw-bold text-dark mb-3">
                            <i className="bi bi-clock-history text-warning me-2"></i>
                            Control de Sesiones
                        </h6>

                        {/* Progress */}
                        <div className="mb-3">
                            <div className="d-flex justify-content-between mb-2">
                                <small className="text-muted">Sesiones esta semana</small>
                                <small className="fw-bold">{totalSessions} / {MAX_SESSIONS_PER_WEEK}</small>
                            </div>
                            <div className="progress rounded-pill" style={{ height: '8px', background: '#F1F5F9' }}>
                                <div
                                    className="progress-bar rounded-pill"
                                    style={{
                                        width: `${(totalSessions / MAX_SESSIONS_PER_WEEK) * 100}%`,
                                        background: totalSessions >= MAX_SESSIONS_PER_WEEK ? '#EF4444' : '#F59E0B'
                                    }}
                                ></div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="row g-2 mb-3">
                            <div className="col-4">
                                <div className="rounded-3 p-3 text-center" style={{ background: '#ECFDF5' }}>
                                    <div className="fw-bold text-dark" style={{ fontSize: '1.3rem' }}>{totalSessions}</div>
                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>Usadas</small>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="rounded-3 p-3 text-center" style={{ background: '#FFFBEB' }}>
                                    <div className="fw-bold text-dark" style={{ fontSize: '1.3rem' }}>{remainingSessions}</div>
                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>Restantes</small>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="rounded-3 p-3 text-center" style={{ background: '#F1F5F9' }}>
                                    <div className="fw-bold text-dark" style={{ fontSize: '1.3rem' }}>60m</div>
                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>Por sesión</small>
                                </div>
                            </div>
                        </div>

                        {/* Session History */}
                        {loading ? (
                            <div className="text-center py-3">
                                <div className="spinner-border spinner-border-sm text-warning"></div>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-3">
                                <small className="text-muted">No hay sesiones registradas esta semana</small>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>
                                    Historial esta semana
                                </small>
                                {sessions.map((s) => (
                                    <div key={s.id} className="d-flex justify-content-between align-items-center rounded-3 p-2" style={{ background: '#F8FAFC' }}>
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="bi bi-clock text-warning small"></i>
                                            <span className="small text-dark">
                                                {new Date(s.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <span className="small text-muted font-monospace">
                                            {s.duracion_minutos > 0 ? `${s.duracion_minutos}min` : 'En curso'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sign Out */}
                    <button
                        onClick={handleSignOut}
                        className="btn btn-outline-danger w-100 py-3 rounded-pill fw-bold mb-5"
                    >
                        <i className="bi bi-box-arrow-left me-2"></i>
                        Cerrar Sesión
                    </button>

                </div>
            </div>
        </div>
    );
}
