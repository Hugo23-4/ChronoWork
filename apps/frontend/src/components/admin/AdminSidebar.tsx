'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, signOut } = useAuth();

    const isActive = (path: string) => {
        if (path === '/admin') return pathname === path;
        return pathname.startsWith(path);
    };

    const linkClass = (path: string) => `
    nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 position-relative
    ${isActive(path)
            ? 'bg-primary bg-opacity-25 text-white fw-bold'
            : 'text-white-50'}
  `;

    const adminMenuItems = [
        { icon: 'bi-speedometer2', label: 'Panel de Control', href: '/admin' },
        { icon: 'bi-people-fill', label: 'Gestión de Empleados', href: '/admin/usuarios' },
        { icon: 'bi-clock-history', label: 'Fichajes del Personal', href: '/admin/fichajes' },
        { icon: 'bi-file-text-fill', label: 'Gestión de Solicitudes', href: '/admin/solicitudes' },
        { icon: 'bi-geo-alt-fill', label: 'Centros de Trabajo', href: '/admin/centros' },
        { icon: 'bi-calendar3', label: 'Turnos y Horarios', href: '/admin/turnos' },
    ];

    return (
        <div className="d-flex flex-column h-100 text-white p-3" style={{ width: '280px', backgroundColor: '#0F172A' }}>

            {/* Logo + Badge */}
            <div className="mb-4 px-2 mt-2">
                <div className="d-flex align-items-center gap-2">
                    <h4 className="fw-bold m-0">ChronoWork</h4>
                    <span className="badge bg-danger rounded-pill px-2 py-1" style={{ fontSize: '0.65rem' }}>
                        ADMIN
                    </span>
                </div>
            </div>

            {/* Menú Admin */}
            <small className="text-secondary text-uppercase fw-bold px-3 mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                Panel de Administración
            </small>
            <ul className="nav nav-pills flex-column mb-4 gap-1">
                {adminMenuItems.map((item) => (
                    <li className="nav-item" key={item.href}>
                        <Link href={item.href} className={linkClass(item.href)}>
                            {isActive(item.href) && (
                                <div className="position-absolute start-0 top-50 translate-middle-y bg-danger rounded-end"
                                    style={{ width: '4px', height: '60%' }}></div>
                            )}
                            <i className={`bi ${item.icon} fs-5`}></i>
                            <span>{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>

            {/* Botón Volver a Empleado */}
            <div className="mb-3">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="btn btn-outline-light w-100 rounded-pill d-flex align-items-center justify-content-center gap-2"
                >
                    <i className="bi bi-arrow-left-circle"></i>
                    <span>Volver a Vista Empleado</span>
                </button>
            </div>

            {/* Spacer */}
            <div className="flex-grow-1"></div>

            {/* Usuario */}
            <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-3 px-2">
                    <div className="bg-danger rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{ width: 40, height: 40, fontSize: '0.9rem' }}>
                        {profile?.nombre_completo?.substring(0, 2).toUpperCase() || 'AD'}
                    </div>
                    <div className="overflow-hidden flex-grow-1">
                        <div className="fw-bold text-white text-truncate" style={{ maxWidth: '130px' }}>
                            {profile?.nombre_completo || 'Administrador'}
                        </div>
                        <small className="text-white-50 d-block" style={{ fontSize: '0.75rem' }}>
                            Administrador
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
