'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import InspectorSidebar from '@/components/inspector/InspectorSidebar';
import InspectorMobileMenu from '@/components/inspector/InspectorMobileMenu';

const MAX_SESSIONS_PER_WEEK = 3;
const MAX_MINUTES_PER_SESSION = 60;

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const [isInspector, setIsInspector] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionError, setSessionError] = useState<string | null>(null);

    // Timer state
    const [remainingSeconds, setRemainingSeconds] = useState(MAX_MINUTES_PER_SESSION * 60);
    const [sessionsUsedThisWeek, setSessionsUsedThisWeek] = useState(0);
    const sessionIdRef = useRef<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Get Monday of current week
    const getMonday = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday.toISOString().split('T')[0];
    };

    // Check sessions this week
    const checkWeeklySessions = useCallback(async () => {
        if (!user) return 0;
        const monday = getMonday();

        const { data, error } = await supabase
            .from('inspector_sesiones')
            .select('id, fecha, duracion_minutos')
            .eq('inspector_id', user.id)
            .gte('fecha', monday);

        if (error) {
            console.error('Error checking sessions:', error);
            return 0;
        }

        return data?.length || 0;
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

    // End session
    const endSession = useCallback(async () => {
        if (!sessionIdRef.current) return;

        const elapsed = MAX_MINUTES_PER_SESSION * 60 - remainingSeconds;
        const minutes = Math.ceil(elapsed / 60);

        await supabase
            .from('inspector_sesiones')
            .update({
                hora_fin: new Date().toISOString(),
                duracion_minutos: minutes,
            })
            .eq('id', sessionIdRef.current);

        sessionIdRef.current = null;
    }, [remainingSeconds]);

    // Check access
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
                // Check weekly sessions
                const sessionsUsed = await checkWeeklySessions();
                setSessionsUsedThisWeek(sessionsUsed);

                if (sessionsUsed >= MAX_SESSIONS_PER_WEEK) {
                    setSessionError(`Has agotado tus ${MAX_SESSIONS_PER_WEEK} sesiones semanales. Vuelve el próximo lunes.`);
                    setLoading(false);
                    return;
                }

                // Start session and timer
                await startSession();
                setIsInspector(true);
                setLoading(false);
            } else {
                router.push('/dashboard');
            }
        };

        checkAccess();

        // Cleanup on unmount
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
                        router.push('/login?session=expired');
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

    // Format time
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0F172A' }}>
                <div className="animate-spin text-amber-500 mb-3"></div>
                <p className="text-white/50">Verificando acceso de inspector...</p>
            </div>
        );
    }

    if (sessionError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#0F172A' }}>
                <div className="text-center">
                    <i className="bi bi-lock-fill text-amber-500" style={{ fontSize: '4rem' }}></i>
                    <h3 className="text-white font-bold mt-3">Acceso Limitado</h3>
                    <p className="text-white/50 mb-4">{sessionError}</p>
                    <div className="flex gap-3 justify-center">
                        <div className="bg-navy rounded-2xl p-3 text-center border border-slate-500">
                            <div className="text-4xl font-bold text-amber-500">{sessionsUsedThisWeek}</div>
                            <small className="text-white/50">de {MAX_SESSIONS_PER_WEEK} sesiones usadas</small>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/login')}
                        className="bg-transparent text-white border border-white/30 px-4 py-2.5 rounded-xl font-semibold hover:bg-white/10 transition-colors cursor-pointer rounded-full px-4 mt-4"
                    >
                        <i className="bi bi-box-arrow-left mr-2"></i>
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    }

    if (!isInspector) return null;

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar Desktop */}
            <div className="hidden lg:block">
                <InspectorSidebar
                    remainingTime={formatTime(remainingSeconds)}
                    daysUsed={sessionsUsedThisWeek}
                    maxDays={MAX_SESSIONS_PER_WEEK}
                    minutesUsedToday={MAX_MINUTES_PER_SESSION - Math.floor(remainingSeconds / 60)}
                    maxMinutesPerDay={MAX_MINUTES_PER_SESSION}
                />
            </div>

            {/* Main Content */}
            <main className="flex-grow overflow-auto relative" style={{ background: '#FAFBFC' }}>
                {/* Timer Bar - Always visible */}
                <div
                    className="flex items-center justify-between px-3 py-2 border-b"
                    style={{
                        background: remainingSeconds < 300 ? '#FEF2F2' : '#FFFBEB',
                        borderColor: remainingSeconds < 300 ? '#FCA5A5' : '#FDE68A',
                    }}
                >
                    <div className="flex items-center gap-2">
                        <i className={`bi bi-shield-lock-fill ${remainingSeconds < 300 ? 'text-red-500' : 'text-amber-500'}`}></i>
                        <small className="font-bold" style={{ color: remainingSeconds < 300 ? '#DC2626' : '#92400E' }}>
                            MODO LECTURA: NO EDITABLE
                        </small>
                    </div>
                    <div className="flex items-center gap-2">
                        <i className={`bi bi-clock ${remainingSeconds < 300 ? 'text-red-500' : 'text-amber-500'}`}></i>
                        <span className="font-bold font-mono" style={{
                            color: remainingSeconds < 300 ? '#DC2626' : '#92400E',
                            fontSize: '0.9rem'
                        }}>
                            {formatTime(remainingSeconds)}
                        </span>
                        <small className="hidden md:inline text-slate-500">restante</small>
                    </div>
                </div>

                <div className="p-3 md:p-4 pb-6 mb-6">
                    {children}
                </div>
            </main>

            {/* Mobile Menu */}
            <div className="lg:hidden">
                <InspectorMobileMenu />
            </div>
        </div>
    );
}
