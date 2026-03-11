'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function InspectorMobileMenu() {
    const pathname = usePathname();

    const items = [
        { name: 'Monitor', href: '/inspector', icon: 'bi-activity' },
        { name: 'Log', href: '/inspector/log', icon: 'bi-journal-text' },
        { name: 'Escanear', href: '/inspector/escanear', icon: 'bi-qr-code-scan' },
        { name: 'Exportar', href: '/inspector/exportar', icon: 'bi-file-earmark-arrow-down' },
        { name: 'Perfil', href: '/inspector/perfil', icon: 'bi-person-badge' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg"
            style={{ zIndex: 1040, paddingBottom: 'env(safe-area-inset-bottom)' }}>

            <div className="flex justify-around items-end pt-2 pb-1">
                {items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/inspector' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="no-underline flex flex-col items-center justify-center"
                            style={{ width: '60px', height: '55px' }}
                        >
                            <div
                                className={`
                                    flex items-center justify-center rounded-full mb-1
                                    ${isActive ? 'shadow-md' : 'bg-transparent'}
                                `}
                                style={{
                                    width: isActive ? '42px' : '24px',
                                    height: '32px',
                                    background: isActive ? '#0F172A' : 'transparent',
                                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                                }}
                            >
                                <i
                                    className={`bi ${item.icon} ${isActive ? 'text-white' : 'text-slate-500 opacity-75'}`}
                                    style={{ fontSize: isActive ? '1.1rem' : '1rem' }}
                                ></i>
                            </div>

                            <span
                                className="text-sm font-bold"
                                style={{
                                    fontSize: '9px',
                                    color: isActive ? '#F59E0B' : '#888',
                                    marginTop: '1px'
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
