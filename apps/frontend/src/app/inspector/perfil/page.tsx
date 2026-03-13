'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Clock, LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionInfo { id: string; fecha: string; hora_inicio: string; duracion_minutos: number; }

export default function InspectorPerfilPage() {
    const { user, profile, signOut } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalSessions, setTotalSessions] = useState(0);
    const MAX_SESSIONS_PER_WEEK = 3;

    useEffect(() => { fetchSessions(); }, [user]);

    const getMonday = () => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const mon = new Date(d.setDate(diff)); mon.setHours(0, 0, 0, 0); return mon.toISOString().split('T')[0]; };

    const fetchSessions = async () => {
        if (!user) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await supabase.from('inspector_sesiones').select('*').eq('inspector_id', user.id).gte('fecha', getMonday()).order('hora_inicio', { ascending: false });
        if (!error && data) { setSessions(data.map((s: any) => ({ id: s.id, fecha: s.fecha, hora_inicio: s.hora_inicio, duracion_minutos: s.duracion_minutos || 0 }))); setTotalSessions(data.length); }
        setLoading(false);
    };

    const handleSignOut = async () => { await signOut(); router.push('/login'); };
    const remainingSessions = Math.max(0, MAX_SESSIONS_PER_WEEK - totalSessions);

    return (
        <div className="animate-fade-up">
            <div className="flex justify-center">
                <div className="w-full max-w-lg">
                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl overflow-hidden mb-4 shadow-sm border border-gray-100">
                        <div className="text-center py-6 px-4 bg-gradient-to-br from-navy to-slate-800">
                            <div className="w-[72px] h-[72px] rounded-full mx-auto flex items-center justify-center font-bold text-navy mb-3 bg-amber-500 text-lg">INS</div>
                            <h4 className="font-bold text-white mb-1 text-lg">{profile?.nombre_completo || 'Inspector'}</h4>
                            <p className="text-white/50 text-sm mb-2">{user?.email || 'inspector@chronowork.es'}</p>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mt-1 bg-amber-500/20 text-amber-500 text-xs font-bold">
                                <ShieldCheck className="w-3.5 h-3.5" /> Inspector de Trabajo
                            </span>
                        </div>
                        <div className="p-4">
                            {[
                                { label: 'Rol', value: 'Inspector' },
                                { label: 'Acceso', value: 'Solo lectura' },
                                { label: 'Permisos', value: 'Auditoría & Exportar' },
                                { label: 'Sistema', value: 'ChronoWork AUDIT v1.0' },
                            ].map((item, i) => (
                                <div key={item.label} className={cn('flex justify-between py-2.5', i < 3 && 'border-b border-gray-100')}>
                                    <span className="text-slate-400 text-sm">{item.label}</span>
                                    <span className="font-bold text-sm text-navy">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Session Limits */}
                    <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
                        <h6 className="font-bold text-navy mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" /> Control de Sesiones
                        </h6>
                        <div className="mb-3">
                            <div className="flex justify-between mb-2"><small className="text-slate-400">Sesiones esta semana</small><small className="font-bold">{totalSessions} / {MAX_SESSIONS_PER_WEEK}</small></div>
                            <div className="rounded-full overflow-hidden h-2 bg-slate-100">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(totalSessions / MAX_SESSIONS_PER_WEEK) * 100}%`, background: totalSessions >= MAX_SESSIONS_PER_WEEK ? '#EF4444' : '#F59E0B' }} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="rounded-lg p-3 text-center bg-emerald-50"><div className="font-bold text-navy text-xl">{totalSessions}</div><small className="text-slate-400 text-[0.7rem]">Usadas</small></div>
                            <div className="rounded-lg p-3 text-center bg-amber-50"><div className="font-bold text-navy text-xl">{remainingSessions}</div><small className="text-slate-400 text-[0.7rem]">Restantes</small></div>
                            <div className="rounded-lg p-3 text-center bg-slate-50"><div className="font-bold text-navy text-xl">60m</div><small className="text-slate-400 text-[0.7rem]">Por sesión</small></div>
                        </div>
                        {loading ? (
                            <div className="text-center py-3"><Loader2 className="w-5 h-5 text-amber-500 animate-spin mx-auto" /></div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-3"><small className="text-slate-400">No hay sesiones registradas esta semana</small></div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <small className="text-slate-400 font-bold uppercase text-[0.65rem]">Historial esta semana</small>
                                {sessions.map(s => (
                                    <div key={s.id} className="flex justify-between items-center rounded-lg p-2.5 bg-slate-50">
                                        <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-amber-500" /><span className="text-sm text-navy">{new Date(s.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}</span></div>
                                        <span className="text-sm text-slate-400 font-mono">{s.duracion_minutos > 0 ? `${s.duracion_minutos}min` : 'En curso'}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sign Out */}
                    <button onClick={handleSignOut}
                        className="w-full py-3 rounded-full font-bold mb-6 border-2 border-red-400 text-red-500 bg-transparent cursor-pointer hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm">
                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
