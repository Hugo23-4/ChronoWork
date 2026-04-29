'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Gauge, Users, Clock, FileText, MapPin, Calendar, Coffee, ArrowLeftCircle, LogOut, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ui/ThemeToggle';

const adminMenuItems = [
  { icon: Gauge, label: 'Panel de control', href: '/admin' },
  { icon: Users, label: 'Empleados', href: '/admin/usuarios' },
  { icon: Clock, label: 'Fichajes', href: '/admin/fichajes' },
  { icon: FileText, label: 'Solicitudes', href: '/admin/solicitudes' },
  { icon: MapPin, label: 'Centros de trabajo', href: '/admin/centros' },
  { icon: Calendar, label: 'Turnos y horarios', href: '/admin/turnos' },
  { icon: Coffee, label: 'Pausas', href: '/admin/pausas' },
  { icon: UserCircle, label: 'Mi perfil', href: '/dashboard/perfil' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin') return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <div
      className="flex flex-col h-full px-3 py-4 w-[260px] bg-white/72 dark:bg-[#1c1c1e]/72 backdrop-blur-xl border-r border-[--color-separator] dark:border-white/8"
      style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
    >

      {/* Logo + Badge */}
      <div className="mb-5 px-2 mt-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-[17px] m-0 tracking-tight text-[--color-label-primary] dark:text-white font-[family-name:var(--font-jakarta)]">
            ChronoWork
          </h4>
          <span className="bg-systemGray-5 dark:bg-white/10 text-[--color-label-secondary] dark:text-[#aeaeb2] text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide">
            ADMIN
          </span>
        </div>
      </div>

      {/* Section heading */}
      <span className="text-[11px] font-medium uppercase tracking-[0.06em] px-3 mb-2 text-[--color-label-tertiary] dark:text-[#8e8e93]">
        Administración
      </span>

      {/* Menú */}
      <ul className="flex flex-col mb-4 gap-0.5 list-none p-0">
        {adminMenuItems.map((item) => {
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

      {/* Volver a empleado */}
      <button
        onClick={() => router.push('/dashboard')}
        className="w-full rounded-[10px] bg-systemGray-6 dark:bg-white/6 hover:bg-systemGray-5 dark:hover:bg-white/10 text-[--color-label-primary] dark:text-[#E5E5EA] py-2 px-3 flex items-center justify-center gap-2 transition-colors cursor-pointer text-[13px] font-medium border-none mb-3"
      >
        <ArrowLeftCircle className="w-4 h-4" />
        <span>Vista empleado</span>
      </button>

      {/* Tema */}
      <div className="px-1">
        <ThemeToggle compact />
      </div>

      <div className="flex-grow" />

      {/* Usuario */}
      <div className="mt-4 pt-3 border-t border-[--color-separator] dark:border-white/8">
        <div className="flex items-center gap-3 px-1">
          <div className="bg-gradient-to-br from-ios-blue to-[#5856D6] rounded-full flex items-center justify-center text-white font-semibold w-9 h-9 text-[13px]">
            {profile?.nombre_completo?.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'AD'}
          </div>
          <div className="overflow-hidden flex-grow min-w-0">
            <div className="font-semibold text-[13px] text-[--color-label-primary] dark:text-white truncate">
              {profile?.nombre_completo || 'Administrador'}
            </div>
            <small className="text-[--color-label-secondary] dark:text-[#aeaeb2] block text-[11px]">
              Administrador
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
