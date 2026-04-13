'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import InspectorSidebar from '@/components/inspector/InspectorSidebar';
import InspectorMobileMenu from '@/components/inspector/InspectorMobileMenu';
import { Loader2, ShieldAlert, Clock, LogOut, Lock } from 'lucide-react';

const MAX_SESSIONS_PER_WEEK = 3;
const MAX_MINUTES_PER_SESSION = 60;
const LS_KEY = 'cw_inspector_session';

interface StoredSession { sessionId: string; startTimestamp: number; }

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const [isInspector, setIsInspector] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState(MAX_MINUTES_PER_SESSION * 60);
    const [sessionsUsedThisWeek, setSessionsUsedThisWeek] = useState(0);
    const sessionIdRef = useRef<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const remainingSecondsRef = useRef(MAX_MINUTES_PER_SESSION * 60);

    // Keep ref in sync so beforeunload closure always has the current value
    useEffect(() => { remainingSecondsRef.current = remainingSeconds; }, [remainingSeconds]);

    const getMonday = () => {
        const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff)); monday.setHours(0, 0, 0, 0); return monday.toISOString().split('T')[0];
    };

    const checkWeeklySessions = useCallback(async () => {
        if (!user) return 0;
        const { data, error } = await supabase.from('inspector_sesiones').select('id, fecha, duracion_minutos').eq('inspector_id', user.id).gte('fecha', getMonday());
        if (error) { console.error('Error checking sessions:', error); return 0; }
        return data?.length || 0;
    }, [user]);

    // Reconcile any session that was left open because beforeunload fired too fast
    const reconcileOrphanSession = useCallback(async () => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return;
            const stored: StoredSession = JSON.parse(raw);
            const elapsedMs = Date.now() - stored.startTimestamp;
            const durationMinutes = Math.max(1, Math.ceil(elapsedMs / 60000));
            await supabase.from('inspector_sesiones').update({ hora_fin: new Date().toISOString(), duracion_minutos: durationMinutes }).eq('id', stored.sessionId).is('hora_fin', null);
            localStorage.removeItem(LS_KEY);
        } catch { /* non-critical — ignore parse errors */ }
    }, []);

    const startSession = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase.from('inspector_sesiones').insert({ inspector_id: user.id, fecha: new Date().toISOString().split('T')[0], hora_inicio: new Date().toISOString() }).select('id').single();
        if (error) { console.error('Error starting session:', error); return; }
        if (data) {
            sessionIdRef.current = data.id;
            localStorage.setItem(LS_KEY, JSON.stringify({ sessionId: data.id, startTimestamp: Date.now() } satisfies StoredSession));
        }
    }, [user]);

    const endSession = useCallback(async () => {
        if (!sessionIdRef.current) return;
        const elapsed = MAX_MINUTES_PER_SESSION * 60 - remainingSecondsRef.current;
        localStorage.removeItem(LS_KEY);
        await supabase.from('inspector_sesiones').update({ hora_fin: new Date().toISOString(), duracion_minutos: Math.ceil(elapsed / 60) }).eq('id', sessionIdRef.current);
        sessionIdRef.current = null;
    }, []);

    useEffect(() => {
        const checkAccess = async () => {
            if (!user) { router.push('/login'); return; }
            // Close any session that was left open from a previous tab closure
            await reconcileOrphanSession();
            const { data } = await supabase.from('empleados_info').select('rol, rol_id').eq('id', user.id).single();
            if (data?.rol === 'inspector' || data?.rol_id === 3) {
                const sessionsUsed = await checkWeeklySessions(); setSessionsUsedThisWeek(sessionsUsed);
                if (sessionsUsed >= MAX_SESSIONS_PER_WEEK) { setSessionError(`Has agotado tus ${MAX_SESSIONS_PER_WEEK} sesiones semanales. Vuelve el próximo lunes.`); setLoading(false); return; }
                await startSession(); setIsInspector(true); setLoading(false);
            } else { router.push('/dashboard'); }
        };
        checkAccess();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [user]);

    useEffect(() => {
        if (!isInspector) return;
        timerRef.current = setInterval(() => {
            setRemainingSeconds(prev => {
                if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); endSession().then(() => router.push('/login?session=expired')); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isInspector]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (!sessionIdRef.current) return;
            const elapsed = MAX_MINUTES_PER_SESSION * 60 - remainingSecondsRef.current;
            const durationMinutes = Math.max(1, Math.ceil(elapsed / 60));
            // sendBeacon is guaranteed to complete even on tab close
            const sent = navigator.sendBeacon(
                '/api/inspector/end-session',
                new Blob([JSON.stringify({ sessionId: sessionIdRef.current, durationMinutes })], { type: 'application/json' })
            );
            // If beacon was queued successfully, clear localStorage to avoid double-close on next visit
            if (sent) localStorage.removeItem(LS_KEY);
            // If not sent (e.g. browser does not support or quota exceeded), localStorage entry
            // remains and reconcileOrphanSession will close the session on next mount.
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    const formatTime = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-navy">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-3" />
            <p className="text-white/50">Verificando acceso de inspector...</p>
        </div>
    );

    if (sessionError) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-navy">
            <div className="text-center">
                <Lock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h3 className="text-white font-bold mt-3 text-xl">Acceso Limitado</h3>
                <p className="text-white/50 mb-4">{sessionError}</p>
                <div className="flex gap-3 justify-center">
                    <div className="bg-navy rounded-2xl p-4 text-center border border-slate-600">
                        <div className="text-4xl font-bold text-amber-500">{sessionsUsedThisWeek}</div>
                        <small className="text-white/50">de {MAX_SESSIONS_PER_WEEK} sesiones</small>
                    </div>
                </div>
                <button onClick={() => router.push('/login')}
                    className="bg-transparent text-white border border-white/30 px-5 py-2.5 rounded-full font-semibold hover:bg-white/10 transition-colors cursor-pointer mt-6 flex items-center gap-2 mx-auto">
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
            </div>
        </div>
    );

    if (!isInspector) return null;

    return (
        <div className="flex h-screen overflow-hidden">
            <div className="hidden lg:block"><InspectorSidebar remainingSeconds={remainingSeconds} daysUsed={sessionsUsedThisWeek} maxDays={MAX_SESSIONS_PER_WEEK} maxMinutesPerDay={MAX_MINUTES_PER_SESSION} /></div>
            <main className="flex-grow overflow-auto relative bg-[#FAFBFC]">
                <div className={`flex items-center justify-between px-4 py-2 border-b ${remainingSeconds < 300 ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2">
                        <ShieldAlert className={`w-4 h-4 ${remainingSeconds < 300 ? 'text-red-500' : 'text-amber-500'}`} />
                        <small className={`font-bold ${remainingSeconds < 300 ? 'text-red-600' : 'text-amber-800'}`}>MODO LECTURA: NO EDITABLE</small>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${remainingSeconds < 300 ? 'text-red-500' : 'text-amber-500'}`} />
                        <span className={`font-bold font-mono ${remainingSeconds < 300 ? 'text-red-600' : 'text-amber-800'}`}>{formatTime(remainingSeconds)}</span>
                        <small className="hidden md:inline text-slate-500">restante</small>
                    </div>
                </div>
                <div className="p-3 md:p-4 pb-6 mb-6">{children}</div>
            </main>
            <div className="lg:hidden"><InspectorMobileMenu /></div>
        </div>
    );
}
