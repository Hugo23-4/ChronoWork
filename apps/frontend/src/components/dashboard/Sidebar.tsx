'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutGrid, Clock, FileText, UserCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutGrid, label: 'Mi Panel', href: '/dashboard' },
  { icon: Clock, label: 'Mis Fichajes', href: '/dashboard/fichajes' },
  { icon: FileText, label: 'Mis Solicitudes', href: '/dashboard/solicitudes' },
  { icon: UserCircle, label: 'Mi Perfil', href: '/dashboard/perfil' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-full text-white p-3 w-[280px] min-h-screen bg-navy">

      {/* LOGO */}
      <div className="mb-4 px-2 mt-2">
        <h4 className="font-bold text-lg m-0 font-[family-name:var(--font-jakarta)]">ChronoWork</h4>
      </div>

      {/* MENÚ PERSONAL */}
      <span className="text-slate-500 uppercase font-bold px-3 mb-2 text-[0.7rem] tracking-wide">
        Mi Espacio
      </span>
      <ul className="flex flex-col mb-4 gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
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
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-sky-400 rounded-r-sm w-1 h-[60%]" />
                )}
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* SPACER */}
      <div className="flex-grow" />

      {/* USUARIO */}
      <div className="mt-4 pt-3 border-t border-slate-700/25">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-blue-600 rounded-full flex items-center justify-center text-white font-bold w-10 h-10 text-sm">
            {profile?.nombre_completo?.substring(0, 2).toUpperCase() || 'EM'}
          </div>
          <div className="overflow-hidden flex-grow">
            <div className="font-bold text-white truncate max-w-[130px]">
              {profile?.nombre_completo || 'Empleado'}
            </div>
            <small className="text-white/50 block text-xs">
              Empleado
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
