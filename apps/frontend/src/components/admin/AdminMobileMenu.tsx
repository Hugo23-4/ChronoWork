'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface MenuItem {
    name: string;
    href: string;
    icon: string;
}

export default function AdminMobileMenu() {
    const pathname = usePathname();
    const router = useRouter();

    const adminItems: MenuItem[] = [
        { name: 'Panel', href: '/admin', icon: 'bi-bar-chart-fill' },
        { name: 'Fichajes', href: '/admin/fichajes', icon: 'bi-clock-history' },
        { name: 'Solicitudes', href: '/admin/solicitudes', icon: 'bi-file-earmark-text' },
        { name: 'Equipo', href: '/admin/usuarios', icon: 'bi-people-fill' },
    ];

    return (
        <>
            {/* Botón Flotante "Volver a Empleado" - Solo Mobile */}
            <button
                onClick={() => router.push('/dashboard')}
                className="position-fixed btn btn-light shadow-lg rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-2"
                style={{
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1050,
                    fontSize: '0.85rem'
                }}
            >
                <i className="bi bi-arrow-left-circle"></i>
                Vista Empleado
            </button>

            {/* Menú Inferior */}
            <div className="fixed-bottom bg-light border-top border-secondary-subtle shadow-lg"
                style={{ zIndex: 1040, paddingBottom: 'env(safe-area-inset-bottom)' }}>

                <div className="d-flex justify-content-around align-items-end pt-2 pb-1">

                    {adminItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="text-decoration-none d-flex flex-column align-items-center justify-content-center"
                                style={{ width: '75px', height: '60px' }}
                            >
                                <div
                                    className={`
                    d-flex align-items-center justify-content-center rounded-pill mb-1 transition-all
                    ${isActive ? 'bg-black shadow' : 'bg-transparent'} 
                  `}
                                    style={{
                                        width: isActive ? '42px' : '24px',
                                        height: '32px',
                                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                                    }}
                                >
                                    <i
                                        className={`bi ${item.icon} fs-5 ${isActive ? 'text-white' : 'text-secondary opacity-75'}`}
                                    ></i>
                                </div>

                                <span
                                    className="small fw-bold tracking-tight"
                                    style={{
                                        fontSize: '10px',
                                        color: isActive ? '#000' : '#888',
                                        marginTop: '2px'
                                    }}
                                >
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}

                </div>
            </div>
        </>
    );
}
