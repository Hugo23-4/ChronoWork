'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BookOpen, QrCode, FileDown, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
    { name: 'Monitor', href: '/inspector', icon: Activity },
    { name: 'Log', href: '/inspector/log', icon: BookOpen },
    { name: 'Escanear', href: '/inspector/escanear', icon: QrCode },
    { name: 'Exportar', href: '/inspector/exportar', icon: FileDown },
    { name: 'Perfil', href: '/inspector/perfil', icon: UserCircle },
];

export default function InspectorMobileMenu() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-[1040]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex justify-around items-end pt-2 pb-1">
                {items.map(item => {
                    const isActive = pathname === item.href || (item.href !== '/inspector' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link key={item.name} href={item.href}
                            className="no-underline flex flex-col items-center justify-center w-[60px] h-[55px]">
                            <div className={cn(
                                'flex items-center justify-center rounded-full mb-1 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] h-8',
                                isActive ? 'bg-navy shadow-md w-[42px]' : 'bg-transparent w-6'
                            )}>
                                <Icon className={cn('w-5 h-5 transition-colors', isActive ? 'text-white' : 'text-slate-400')} />
                            </div>
                            <span className={cn('text-[9px] font-bold tracking-tight mt-0.5',
                                isActive ? 'text-amber-500' : 'text-slate-400')}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
