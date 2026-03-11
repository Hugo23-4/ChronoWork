'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, Clock, FileText, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const employeeItems: MenuItem[] = [
  { name: 'Inicio', href: '/dashboard', icon: Home },
  { name: 'Fichajes', href: '/dashboard/fichajes', icon: Clock },
  { name: 'Solicitudes', href: '/dashboard/solicitudes', icon: FileText },
  { name: 'Perfil', href: '/dashboard/perfil', icon: UserCircle },
];

export default function MobileMenu() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-[1040]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-end pt-2 pb-1">
        {employeeItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="no-underline flex flex-col items-center justify-center w-[75px] h-[60px]"
            >
              {/* PASTILLA ACTIVA */}
              <div
                className={cn(
                  'flex items-center justify-center rounded-full mb-1 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]',
                  isActive ? 'bg-black shadow-md w-[42px]' : 'bg-transparent w-6'
                )}
                style={{ height: '32px' }}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-white' : 'text-gray-400'
                  )}
                />
              </div>

              {/* TEXTO */}
              <span
                className={cn(
                  'text-[10px] font-bold tracking-tight mt-0.5',
                  isActive ? 'text-black' : 'text-gray-400'
                )}
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