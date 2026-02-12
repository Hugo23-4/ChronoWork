'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface InspectorSidebarProps {
    remainingTime: string;
    daysUsed: number;
    maxDays: number;
    minutesUsedToday: number;
    maxMinutesPerDay: number;
}

export default function InspectorSidebar({ remainingTime, daysUsed, maxDays, minutesUsedToday, maxMinutesPerDay }: InspectorSidebarProps) {
    const pathname = usePathname();
    const { profile, signOut } = useAuth();

    const isActive = (path: string) => {
        if (path === '/inspector') return pathname === path;
        return pathname.startsWith(path);
    };

    const linkClass = (path: string) => `
        nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 position-relative
        ${isActive(path)
            ? 'text-white fw-bold'
            : 'text-white-50'}
    `;

    const menuItems = [
        { icon: 'bi-activity', label: 'Monitor en Tiempo Real', href: '/inspector' },
        { icon: 'bi-journal-text', label: 'Registro Inmutable (Log)', href: '/inspector/log' },
        { icon: 'bi-qr-code-scan', label: 'Escanear / Verificar', href: '/inspector/escanear' },
        { icon: 'bi-file-earmark-bar-graph', label: 'Exportar Informe Legal', href: '/inspector/exportar' },
    ];

    // Parse remaining time to get minutes for progress bar
    const timeParts = remainingTime.split(':');
    const remainingMinutes = parseInt(timeParts[0]) + (parseInt(timeParts[1]) > 0 ? 1 : 0);
    const usagePercent = Math.round(((maxMinutesPerDay - remainingMinutes) / maxMinutesPerDay) * 100);

    return (
        <div className="d-flex flex-column h-100 text-white p-3" style={{ width: '280px', backgroundColor: '#0F172A' }}>

            {/* Logo */}
            <div className="mb-4 px-2 mt-2">
                <div className="d-flex align-items-baseline gap-1">
                    <h4 className="fw-bold m-0">ChronoWork</h4>
                    <span className="text-warning fw-bold" style={{ fontSize: '0.7rem' }}>AUDIT</span>
                </div>
                <div style={{ width: '40px', height: '3px', background: '#F59E0B', borderRadius: '2px', marginTop: '8px' }}></div>
            </div>

            {/* Menu */}
            <small className="text-secondary text-uppercase fw-bold px-3 mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}>
                Herramientas
            </small>
            <ul className="nav nav-pills flex-column mb-4 gap-1">
                {menuItems.map((item) => (
                    <li className="nav-item" key={item.href}>
                        <Link href={item.href} className={linkClass(item.href)}>
                            {isActive(item.href) && (
                                <div className="position-absolute start-0 top-50 translate-middle-y bg-warning rounded-end"
                                    style={{ width: '4px', height: '60%' }}></div>
                            )}
                            <i className={`bi ${item.icon} fs-5`}></i>
                            <span>{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>

            {/* Session Info Card */}
            <div className="rounded-4 p-3 mb-3" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-clock text-warning"></i>
                    <small className="text-warning fw-bold">SESIÓN ACTIVA</small>
                </div>

                {/* Timer */}
                <div className="font-monospace fw-bold text-white mb-1" style={{ fontSize: '1.5rem' }}>
                    {remainingTime}
                </div>
                <small className="text-white-50">Tiempo restante hoy</small>

                {/* Today progress bar */}
                <div className="mt-2 mb-2">
                    <div className="rounded-pill overflow-hidden" style={{ height: '4px', background: 'rgba(255,255,255,0.1)' }}>
                        <div className="rounded-pill" style={{
                            height: '100%',
                            width: `${usagePercent}%`,
                            background: usagePercent > 80 ? '#EF4444' : '#F59E0B',
                            transition: 'width 1s ease'
                        }}></div>
                    </div>
                </div>

                {/* Days indicator */}
                <div className="mt-2">
                    <small className="text-white-50 d-block mb-1" style={{ fontSize: '0.65rem' }}>DÍAS ESTA SEMANA</small>
                    <div className="d-flex gap-1">
                        {Array.from({ length: maxDays }).map((_, i) => (
                            <div key={i} className="flex-grow-1 rounded-pill" style={{
                                height: '6px',
                                background: i < daysUsed ? '#F59E0B' : 'rgba(255,255,255,0.1)'
                            }}></div>
                        ))}
                    </div>
                    <small className="text-white-50 d-block mt-1" style={{ fontSize: '0.7rem' }}>
                        {daysUsed} de {maxDays} días usados
                    </small>
                </div>
            </div>

            {/* Usage rules */}
            <div className="rounded-3 p-2 mb-3 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <small className="text-white-50" style={{ fontSize: '0.6rem', lineHeight: '1.3' }}>
                    <i className="bi bi-info-circle me-1"></i>
                    {maxDays} días/semana • {maxMinutesPerDay} min/día<br />
                    Los minutos se acumulan entre sesiones
                </small>
            </div>

            {/* Spacer */}
            <div className="flex-grow-1"></div>

            {/* Inspector Badge */}
            <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-3 px-2">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark"
                        style={{ width: 40, height: 40, fontSize: '0.75rem', background: '#F59E0B' }}>
                        INS
                    </div>
                    <div className="overflow-hidden flex-grow-1">
                        <div className="fw-bold text-white text-truncate" style={{ maxWidth: '130px' }}>
                            {profile?.nombre_completo || 'Inspector'}
                        </div>
                        <small className="text-warning d-block" style={{ fontSize: '0.7rem' }}>
                            Acceso Inspector
                        </small>
                    </div>
                    <button onClick={signOut} className="btn btn-link text-white-50 p-0" title="Cerrar sesión">
                        <i className="bi bi-box-arrow-right fs-5"></i>
                    </button>
                </div>
            </div>

        </div>
    );
}
