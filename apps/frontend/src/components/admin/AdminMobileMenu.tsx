'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Clock, FileText, Users, ArrowLeftCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminItems: MenuItem[] = [
  { name: 'Panel', href: '/admin', icon: BarChart3 },
  { name: 'Fichajes', href: '/admin/fichajes', icon: Clock },
  { name: 'Solicitudes', href: '/admin/solicitudes', icon: FileText },
  { name: 'Equipo', href: '/admin/usuarios', icon: Users },
];

export default function AdminMobileMenu() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      {/* Botón Flotante "Volver a Empleado" - Solo Mobile */}
      <button
        onClick={() => router.push('/dashboard')}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[1050] bg-white shadow-lg rounded-full px-3 py-2 font-bold flex items-center gap-2 text-sm border-none cursor-pointer hover:shadow-xl transition-shadow"
      >
        <ArrowLeftCircle className="w-4 h-4" />
        Vista Empleado
      </button>

      {/* Menú Inferior */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-[1040]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-around items-end pt-2 pb-1">
          {adminItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="no-underline flex flex-col items-center justify-center w-[75px] h-[60px]"
              >
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
    </>
  );
}
