'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function InspectorMobileMenu() {
    const pathname = usePathname();

    const items = [
        { name: 'Log', href: '/inspector', icon: 'bi-journal-text' },
        { name: 'Escanear', href: '/inspector/escanear', icon: 'bi-qr-code-scan' },
        { name: 'Exportar', href: '/inspector/exportar', icon: 'bi-file-earmark-arrow-down' },
        { name: 'Perfil', href: '/inspector/perfil', icon: 'bi-person-badge' },
    ];

    return (
        <div className="fixed-bottom bg-white border-top shadow-lg"
            style={{ zIndex: 1040, paddingBottom: 'env(safe-area-inset-bottom)' }}>

            <div className="d-flex justify-content-around align-items-end pt-2 pb-1">
                {items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/inspector' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="text-decoration-none d-flex flex-column align-items-center justify-content-center"
                            style={{ width: '75px', height: '60px' }}
                        >
                            <div
                                className={`
                                    d-flex align-items-center justify-content-center rounded-pill mb-1
                                    ${isActive ? 'shadow' : 'bg-transparent'}
                                `}
                                style={{
                                    width: isActive ? '42px' : '24px',
                                    height: '32px',
                                    background: isActive ? '#0F172A' : 'transparent',
                                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                                }}
                            >
                                <i
                                    className={`bi ${item.icon} fs-5 ${isActive ? 'text-white' : 'text-secondary opacity-75'}`}
                                ></i>
                            </div>

                            <span
                                className="small fw-bold"
                                style={{
                                    fontSize: '10px',
                                    color: isActive ? '#F59E0B' : '#888',
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
    );
}
