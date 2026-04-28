'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutGrid, Clock, FileText, UserCircle, LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutGrid, label: 'Mi panel', href: '/dashboard' },
  { icon: Clock, label: 'Mis fichajes', href: '/dashboard/fichajes' },
  { icon: FileText, label: 'Mis solicitudes', href: '/dashboard/solicitudes' },
  { icon: UserCircle, label: 'Mi perfil', href: '/dashboard/perfil' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === path;
    return pathname.startsWith(path);
  };

  const isAdmin = profile?.rol === 'admin' || profile?.rol_id === 2;

  return (
    <div
      className="flex flex-col h-full px-3 py-4 w-[260px] min-h-dvh bg-white/72 dark:bg-[#1c1c1e]/72 backdrop-blur-xl border-r border-[--color-separator] dark:border-white/8"
      style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
    >

      {/* LOGO */}
      <div className="mb-5 px-2 mt-1">
        <h4 className="font-semibold text-[17px] m-0 tracking-tight text-[--color-label-primary] dark:text-white font-[family-name:var(--font-jakarta)]">
          ChronoWork
        </h4>
      </div>

      <span className="text-[11px] font-medium uppercase tracking-[0.06em] px-3 mb-2 text-[--color-label-tertiary] dark:text-[#8e8e93]">
        Mi espacio
      </span>

      <ul className="flex flex-col mb-3 gap-0.5 list-none p-0">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <li key={item.href} className="list-none">
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-[10px] no-underline text-[14px] font-medium transition-colors',
                  active
                    ? 'bg-ios-blue/12 text-ios-blue dark:bg-ios-blue-dark/15 dark:text-ios-blue-dark'
                    : 'text-[--color-label-primary] dark:text-[#E5E5EA] hover:bg-systemGray-6 dark:hover:bg-white/6'
                )}
              >
                <Icon className={cn('w-[18px] h-[18px] shrink-0', active ? '' : 'text-[--color-label-secondary] dark:text-[#aeaeb2]')} />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Toggle Panel Admin (si user es admin) */}
      {isAdmin && (
        <button
          onClick={() => router.push('/admin')}
          className="w-full rounded-[12px] bg-ios-blue/12 hover:bg-ios-blue/18 text-ios-blue dark:bg-ios-blue-dark/15 dark:hover:bg-ios-blue-dark/22 dark:text-ios-blue-dark py-2.5 px-3 flex items-center justify-center gap-2 transition-colors cursor-pointer text-[13px] font-semibold border-none"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Panel administración</span>
        </button>
      )}

      {/* SPACER */}
      <div className="flex-grow" />

      {/* USUARIO */}
      <div className="mt-4 pt-3 border-t border-[--color-separator] dark:border-white/8">
        <div className="flex items-center gap-3 px-1">
          <div className="bg-gradient-to-br from-ios-blue to-[#5856D6] rounded-full flex items-center justify-center text-white font-semibold w-9 h-9 text-[13px] shrink-0">
            {profile?.nombre_completo?.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'EM'}
          </div>
          <div className="overflow-hidden flex-grow min-w-0">
            <div className="font-semibold text-[13px] text-[--color-label-primary] dark:text-white truncate">
              {profile?.nombre_completo || 'Empleado'}
            </div>
            <small className="text-[--color-label-secondary] dark:text-[#aeaeb2] block text-[11px]">
              {isAdmin ? 'Administrador' : 'Empleado'}
            </small>
          </div>
          <button
            onClick={signOut}
            className="text-[--color-label-secondary] hover:text-[--color-label-primary] dark:text-[#aeaeb2] dark:hover:text-white transition-colors p-1.5 rounded-md hover:bg-systemGray-6 dark:hover:bg-white/6 bg-transparent border-none cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
