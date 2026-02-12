'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import InspectorSidebar from '@/components/inspector/InspectorSidebar';
import InspectorMobileMenu from '@/components/inspector/InspectorMobileMenu';

const MAX_DAYS_PER_WEEK = 3;        // 3 días a la semana
const MAX_MINUTES_PER_DAY = 60;     // 60 minutos por día

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const [isInspector, setIsInspector] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionError, setSessionError] = useState<string | null>(null);

    // Timer state
    const [remainingSeconds, setRemainingSeconds] = useState(MAX_MINUTES_PER_DAY * 60);
    const [daysUsedThisWeek, setDaysUsedThisWeek] = useState(0);
    const [minutesUsedToday, setMinutesUsedToday] = useState(0);
    const sessionIdRef = useRef<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Get Monday of current week (ISO format)
    const getMonday = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday.toISOString().split('T')[0];
    };

    const today = new Date().toISOString().split('T')[0];

    // Check weekly sessions and calculate remaining time
    const checkWeeklyUsage = useCallback(async () => {
        if (!user) return { daysUsed: 0, minutesToday: 0 };
        const monday = getMonday();

        const { data, error } = await supabase
            .from('inspector_sesiones')
            .select('id, fecha, duracion_minutos')
            .eq('inspector_id', user.id)
            .gte('fecha', monday);

        if (error) {
            console.error('Error checking sessions:', error);
            return { daysUsed: 0, minutesToday: 0 };
        }

        if (!data || data.length === 0) {
            return { daysUsed: 0, minutesToday: 0 };
        }

        // Count DISTINCT days used this week
        const distinctDays = new Set(data.map((s: any) => s.fecha));
        const daysUsed = distinctDays.size;

        // Sum minutes used TODAY (could be from multiple sessions)
        const todayStr = new Date().toISOString().split('T')[0];
        const minutesToday = data
            .filter((s: any) => s.fecha === todayStr)
            .reduce((sum: number, s: any) => sum + (s.duracion_minutos || 0), 0);

        return { daysUsed, minutesToday };
    }, [user]);

    // Start a new session
    const startSession = useCallback(async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('inspector_sesiones')
            .insert({
                inspector_id: user.id,
                fecha: new Date().toISOString().split('T')[0],
                hora_inicio: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error starting session:', error);
            return;
        }

        if (data) {
            sessionIdRef.current = data.id;
        }
    }, [user]);

    // End session and save duration
    const endSession = useCallback(async () => {
        if (!sessionIdRef.current) return;

        const elapsed = (MAX_MINUTES_PER_DAY * 60 - remainingSeconds);
        const minutes = Math.max(1, Math.ceil(elapsed / 60));

        await supabase
            .from('inspector_sesiones')
            .update({
                hora_fin: new Date().toISOString(),
                duracion_minutos: minutes,
            })
            .eq('id', sessionIdRef.current);

        sessionIdRef.current = null;
    }, [remainingSeconds]);

    // Check access and sessions
    useEffect(() => {
        const checkAccess = async () => {
            if (!user) {
                router.push('/login');
                return;
            }

            const { data } = await supabase
                .from('empleados_info')
                .select('rol, rol_id')
                .eq('id', user.id)
                .single();

            if (data?.rol === 'inspector' || data?.rol_id === 3) {
                const { daysUsed, minutesToday } = await checkWeeklyUsage();
                setDaysUsedThisWeek(daysUsed);
                setMinutesUsedToday(minutesToday);

                const todayStr = new Date().toISOString().split('T')[0];

                // Check if all 60 minutes used today
                if (minutesToday >= MAX_MINUTES_PER_DAY) {
                    setSessionError(`Has agotado tus ${MAX_MINUTES_PER_DAY} minutos de inspección para hoy. Vuelve mañana.`);
                    setLoading(false);
                    return;
                }

                // Check if this is a new day and all days used
                const mondayStr = getMonday();
                const { data: weekData } = await supabase
                    .from('inspector_sesiones')
                    .select('fecha')
                    .eq('inspector_id', user.id)
                    .gte('fecha', mondayStr);

                const distinctDays = new Set((weekData || []).map((s: any) => s.fecha));
                const hasUsedToday = distinctDays.has(todayStr);

                if (!hasUsedToday && distinctDays.size >= MAX_DAYS_PER_WEEK) {
                    setSessionError(`Has agotado tus ${MAX_DAYS_PER_WEEK} días de inspección esta semana. Vuelve el próximo lunes.`);
                    setDaysUsedThisWeek(distinctDays.size);
                    setLoading(false);
                    return;
                }

                // Calculate remaining seconds for today
                const remainingMinutesToday = MAX_MINUTES_PER_DAY - minutesToday;
                setRemainingSeconds(remainingMinutesToday * 60);

                // Update days count (including today if not counted yet)
                const totalDays = hasUsedToday ? distinctDays.size : distinctDays.size + 1;
                setDaysUsedThisWeek(totalDays);

                // Start session and timer
                await startSession();
                setIsInspector(true);
                setLoading(false);
            } else {
                router.push('/dashboard');
            }
        };

        checkAccess();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [user]);

    // Timer countdown
    useEffect(() => {
        if (!isInspector) return;

        timerRef.current = setInterval(() => {
            setRemainingSeconds(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    endSession().then(() => {
                        alert('⏰ Has agotado tu tiempo de inspección para hoy (60 minutos). Serás redirigido.');
                        router.push('/login');
                    });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isInspector]);

    // End session on page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            endSession();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [endSession]);

    // Format time mm:ss
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center" style={{ background: '#0F172A' }}>
                <div className="spinner-border text-warning mb-3"></div>
                <p className="text-white-50">Verificando acceso de inspector...</p>
            </div>
        );
    }

    if (sessionError) {
        const isTimeError = sessionError.includes('minutos');
        return (
            <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-4" style={{ background: '#0F172A' }}>
                <div className="text-center" style={{ maxWidth: '420px' }}>
                    <i className={`bi ${isTimeError ? 'bi-hourglass-bottom' : 'bi-calendar-x'} text-warning`} style={{ fontSize: '4rem' }}></i>
                    <h3 className="text-white fw-bold mt-3">
                        {isTimeError ? 'Tiempo Agotado Hoy' : 'Días Agotados'}
                    </h3>
                    <p className="text-white-50 mb-4">{sessionError}</p>

                    {/* Info card */}
                    <div className="rounded-4 p-4 mb-4" style={{ background: '#1E293B', border: '1px solid #334155' }}>
                        <div className="row g-3">
                            <div className="col-6">
                                <div className="text-center">
                                    <div className="display-6 fw-bold text-warning">{daysUsedThisWeek}</div>
                                    <small className="text-white-50">de {MAX_DAYS_PER_WEEK} días usados</small>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="text-center">
                                    <div className="display-6 fw-bold text-warning">{minutesUsedToday}</div>
                                    <small className="text-white-50">de {MAX_MINUTES_PER_DAY} min hoy</small>
                                </div>
                            </div>
                        </div>
                        {/* Day progress */}
                        <div className="mt-3">
                            <small className="text-white-50 d-block mb-1" style={{ fontSize: '0.7rem' }}>DÍAS ESTA SEMANA</small>
                            <div className="d-flex gap-1">
                                {Array.from({ length: MAX_DAYS_PER_WEEK }).map((_, i) => (
                                    <div key={i} className="flex-grow-1 rounded-pill" style={{
                                        height: '6px',
                                        background: i < daysUsedThisWeek ? '#F59E0B' : 'rgba(255,255,255,0.1)'
                                    }}></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Info text */}
                    <div className="rounded-3 p-3 mb-4 text-start" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <small className="text-warning">
                            <i className="bi bi-info-circle me-2"></i>
                            Tienes acceso a {MAX_DAYS_PER_WEEK} días por semana, {MAX_MINUTES_PER_DAY} minutos cada día. Los minutos se acumulan entre sesiones del mismo día.
                        </small>
                    </div>

                    <button
                        onClick={() => router.push('/login')}
                        className="btn btn-outline-light rounded-pill px-4"
                    >
                        <i className="bi bi-box-arrow-left me-2"></i>
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    }

    if (!isInspector) return null;

    return (
        <div className="d-flex vh-100 overflow-hidden">
            {/* Sidebar Desktop */}
            <div className="d-none d-lg-block">
                <InspectorSidebar
                    remainingTime={formatTime(remainingSeconds)}
                    daysUsed={daysUsedThisWeek}
                    maxDays={MAX_DAYS_PER_WEEK}
                    minutesUsedToday={minutesUsedToday}
                    maxMinutesPerDay={MAX_MINUTES_PER_DAY}
                />
            </div>

            {/* Main Content */}
            <main className="flex-grow-1 overflow-auto position-relative" style={{ background: '#FAFBFC' }}>
                {/* Timer Bar */}
                <div
                    className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom"
                    style={{
                        background: remainingSeconds < 300 ? '#FEF2F2' : '#FFFBEB',
                        borderColor: remainingSeconds < 300 ? '#FCA5A5' : '#FDE68A',
                    }}
                >
                    <div className="d-flex align-items-center gap-2">
                        <i className={`bi bi-shield-lock-fill ${remainingSeconds < 300 ? 'text-danger' : 'text-warning'}`}></i>
                        <small className="fw-bold" style={{ color: remainingSeconds < 300 ? '#DC2626' : '#92400E' }}>
                            MODO LECTURA
                        </small>
                        <span className="badge rounded-pill px-2 py-1" style={{
                            background: remainingSeconds < 300 ? '#FEE2E2' : '#FEF3C7',
                            color: remainingSeconds < 300 ? '#DC2626' : '#92400E',
                            fontSize: '0.65rem'
                        }}>
                            Día {daysUsedThisWeek}/{MAX_DAYS_PER_WEEK}
                        </span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <i className={`bi bi-clock ${remainingSeconds < 300 ? 'text-danger' : 'text-warning'}`}></i>
                        <span className="fw-bold font-monospace" style={{
                            color: remainingSeconds < 300 ? '#DC2626' : '#92400E',
                            fontSize: '0.9rem'
                        }}>
                            {formatTime(remainingSeconds)}
                        </span>
                        <small className="d-none d-md-inline text-secondary">restante hoy</small>
                    </div>
                </div>

                <div className="p-3 p-md-4 pb-5 mb-5">
                    {children}
                </div>
            </main>

            {/* Mobile Menu */}
            <div className="d-lg-none">
                <InspectorMobileMenu />
            </div>
        </div>
    );
}
