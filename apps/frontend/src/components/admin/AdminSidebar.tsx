'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Gauge, Users, Clock, FileText, MapPin, Calendar, Coffee, ArrowLeftCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminMenuItems = [
  { icon: Gauge, label: 'Panel de Control', href: '/admin' },
  { icon: Users, label: 'Gestión de Empleados', href: '/admin/usuarios' },
  { icon: Clock, label: 'Fichajes del Personal', href: '/admin/fichajes' },
  { icon: FileText, label: 'Gestión de Solicitudes', href: '/admin/solicitudes' },
  { icon: MapPin, label: 'Centros de Trabajo', href: '/admin/centros' },
  { icon: Calendar, label: 'Turnos y Horarios', href: '/admin/turnos' },
  { icon: Coffee, label: 'Pausas y Descansos', href: '/admin/pausas' },
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
    <div className="flex flex-col h-full text-white p-3 w-[280px] bg-navy">

      {/* Logo + Badge */}
      <div className="mb-4 px-2 mt-2">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-lg m-0 font-[family-name:var(--font-jakarta)]">ChronoWork</h4>
          <span className="bg-red-500 text-white text-[0.65rem] px-2 py-0.5 rounded-full font-bold">
            ADMIN
          </span>
        </div>
      </div>

      {/* Menú Admin */}
      <span className="text-slate-500 dark:text-zinc-400 uppercase font-bold px-3 mb-2 text-[0.7rem] tracking-wide">
        Panel de Administración
      </span>
      <ul className="flex flex-col mb-4 gap-1">
        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href} className="list-none">
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg relative no-underline transition-colors',
                  isActive(item.href)
                    ? 'bg-blue-600/25 text-white font-bold'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                )}
              >
                {isActive(item.href) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-red-500 rounded-r-sm w-1 h-[60%]" />
                )}
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Botón Volver a Empleado */}
      <div className="mb-3">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full rounded-full border border-white/30 bg-transparent text-white/80 hover:bg-white/10 hover:text-white py-2 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm font-medium"
        >
          <ArrowLeftCircle className="w-4 h-4" />
          <span>Volver a Vista Empleado</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-grow" />

      {/* Usuario */}
      <div className="mt-4 pt-3 border-t border-slate-700/25">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-red-500 rounded-full flex items-center justify-center text-white font-bold w-10 h-10 text-sm">
            {profile?.nombre_completo?.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'AD'}
          </div>
          <div className="overflow-hidden flex-grow">
            <div className="font-bold text-white truncate max-w-[130px]">
              {profile?.nombre_completo || 'Administrador'}
            </div>
            <small className="text-white/50 block text-xs">
              Administrador
            </small>
          </div>
          <button onClick={signOut} className="text-white/50 hover:text-white transition-colors p-0 bg-transparent border-none cursor-pointer" title="Cerrar sesión">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  );
}
