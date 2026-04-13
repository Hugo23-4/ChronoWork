'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Activity, BookOpen, QrCode, FileBarChart, UserCircle, Clock, Info, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InspectorSidebarProps {
    remainingSeconds: number;
    daysUsed: number;
    maxDays: number;
    maxMinutesPerDay: number;
}

const menuItems = [
    { icon: Activity, label: 'Monitor en Tiempo Real', href: '/inspector' },
    { icon: BookOpen, label: 'Registro de Auditoría (Log)', href: '/inspector/log' },
    { icon: QrCode, label: 'Escanear / Verificar', href: '/inspector/escanear' },
    { icon: FileBarChart, label: 'Exportar Informe Legal', href: '/inspector/exportar' },
    { icon: UserCircle, label: 'Perfil', href: '/inspector/perfil' },
];

// > 5 min: show "X min" to reduce noise; ≤ 5 min: show MM:SS with urgency styling
const formatTimer = (secs: number): string => {
    if (secs > 300) return `${Math.ceil(secs / 60)} min`;
    return `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
};

const getInitials = (nombre?: string | null): string => {
    if (!nombre) return 'INS';
    return nombre.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
};

export default function InspectorSidebar({ remainingSeconds, daysUsed, maxDays, maxMinutesPerDay }: InspectorSidebarProps) {
    const pathname = usePathname();
    const { profile, signOut } = useAuth();

    const isActive = (path: string) => path === '/inspector' ? pathname === path : pathname.startsWith(path);
    const isUrgent = remainingSeconds <= 300;
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    const usagePercent = Math.round(((maxMinutesPerDay - remainingMinutes) / maxMinutesPerDay) * 100);

    return (
        <div className="flex flex-col h-full text-white p-3 w-[280px] bg-navy">
            {/* Logo */}
            <div className="mb-4 px-2 mt-2">
                <div className="flex items-baseline gap-1">
                    <h4 className="font-bold m-0 text-lg font-[family-name:var(--font-jakarta)]">ChronoWork</h4>
                    <span className="text-amber-500 font-bold text-[0.7rem]">AUDIT</span>
                </div>
                <div className="w-10 h-[3px] bg-amber-500 rounded-sm mt-2" />
            </div>

            {/* Menu */}
            <small className="text-slate-500 uppercase font-bold px-3 mb-2 text-[0.65rem] tracking-widest">Herramientas</small>
            <ul className="flex flex-col gap-1 mb-4">
                {menuItems.map(item => {
                    const Icon = item.icon;
                    return (
                        <li key={item.href} className="list-none">
                            <Link href={item.href}
                                className={cn('flex items-center gap-3 px-3 py-2 rounded-lg relative no-underline transition-colors',
                                    isActive(item.href) ? 'bg-amber-500/15 text-white font-bold' : 'text-white/50 hover:text-white/80 hover:bg-white/5')}>
                                {isActive(item.href) && <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-amber-500 rounded-r-sm w-1 h-[60%]" />}
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {/* Session Info Card */}
            <div className={cn('rounded-2xl p-3 mb-3 border', isUrgent ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/20')}>
                <div className="flex items-center gap-2 mb-2">
                    <Clock className={cn('w-4 h-4', isUrgent ? 'text-red-400' : 'text-amber-500')} />
                    <small className={cn('font-bold', isUrgent ? 'text-red-400' : 'text-amber-500')}>
                        {isUrgent ? '⚠ TIEMPO AGOTÁNDOSE' : 'SESIÓN ACTIVA'}
                    </small>
                </div>
                <div className={cn(
                    'font-mono font-bold text-2xl mb-1',
                    isUrgent ? 'text-red-400 animate-pulse' : 'text-white',
                    !isUrgent && 'font-sans' // minutes view doesn't need monospace
                )}>
                    {formatTimer(remainingSeconds)}
                </div>
                <small className="text-white/50">Tiempo restante</small>

                {/* Progress bar */}
                <div className="mt-2 mb-2">
                    <div className="rounded-full overflow-hidden h-1 bg-white/10">
                        <div className="rounded-full h-full transition-all duration-1000"
                            style={{ width: `${usagePercent}%`, background: isUrgent ? '#EF4444' : '#F59E0B' }} />
                    </div>
                </div>

                {/* Days indicator */}
                <div className="mt-2">
                    <small className="text-white/50 block mb-1 text-[0.65rem]">DÍAS ESTA SEMANA</small>
                    <div className="flex gap-1">
                        {Array.from({ length: maxDays }).map((_, i) => (
                            <div key={i} className={cn('flex-grow rounded-full h-1.5', i < daysUsed ? 'bg-amber-500' : 'bg-white/10')} />
                        ))}
                    </div>
                    <small className="text-white/50 block mt-1 text-[0.7rem]">{daysUsed} de {maxDays} días usados</small>
                </div>
            </div>

            {/* Usage rules */}
            <div className="rounded-lg p-2 mb-3 text-center bg-white/[0.03]">
                <small className="text-white/50 text-[0.6rem] leading-snug flex items-center justify-center gap-1">
                    <Info className="w-3 h-3 shrink-0" />
                    {maxDays} días/semana · {maxMinutesPerDay} min/día
                </small>
            </div>

            <div className="flex-grow" />

            {/* Inspector Badge */}
            <div className="mt-4 pt-3 border-t border-slate-700/25">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-navy text-xs">
                        {getInitials(profile?.nombre_completo)}
                    </div>
                    <div className="overflow-hidden flex-grow">
                        <div className="font-bold text-white truncate max-w-[130px]">{profile?.nombre_completo || 'Inspector'}</div>
                        <small className="text-amber-500 block text-[0.7rem]">Acceso Inspector</small>
                    </div>
                    <button onClick={signOut} className="bg-transparent border-none cursor-pointer text-white/50 hover:text-white transition-colors p-0" title="Cerrar sesión">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
