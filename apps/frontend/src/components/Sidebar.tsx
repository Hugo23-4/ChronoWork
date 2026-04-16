'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Clock, FileText, UserSquare, HelpCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Panel de Control', section: 'main' },
  { href: '/dashboard/fichajes', icon: Clock, label: 'Mis Fichajes', section: 'main' },
  { href: '/dashboard/solicitudes', icon: FileText, label: 'Solicitudes & Bajas', section: 'main' },
  { href: '/dashboard/perfil', icon: UserSquare, label: 'Perfil y Contrato', section: 'config' },
  { href: '/dashboard/ayuda', icon: HelpCircle, label: 'Ayuda Legal', section: 'config' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const isActive = (path: string) => pathname === path;

  return (
    <div className="hidden md:flex flex-col h-dvh fixed top-0 left-0 p-3 bg-navy w-[280px] z-[1040]">
      {/* Brand */}
      <div className="mb-6 px-2">
        <h4 className="text-white font-bold mb-0 font-[family-name:var(--font-jakarta)]">ChronoWork</h4>
        <div className="bg-chrono-blue mt-2 h-1 w-10 rounded-sm" />
      </div>

      {/* Nav */}
      <div className="flex-grow flex flex-col gap-1">
        <small className="uppercase text-slate-500 font-bold px-3 mb-2 text-[0.65rem] tracking-widest">Menú Principal</small>
        {navItems.filter(i => i.section === 'main').map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline transition-all relative',
              isActive(href) ? 'bg-chrono-blue/20 text-white font-bold' : 'text-slate-500 hover:text-white/80 hover:bg-white/5')}>
            {isActive(href) && <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-chrono-blue rounded-r-sm w-1 h-[60%]" />}
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </Link>
        ))}

        <div className="my-3" />
        <small className="uppercase text-slate-500 font-bold px-3 mb-2 text-[0.65rem] tracking-widest">Configuración</small>
        {navItems.filter(i => i.section === 'config').map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline transition-all relative',
              isActive(href) ? 'bg-chrono-blue/20 text-white font-bold' : 'text-slate-500 hover:text-white/80 hover:bg-white/5')}>
            {isActive(href) && <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-chrono-blue rounded-r-sm w-1 h-[60%]" />}
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-slate-500/25">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-chrono-blue rounded-full flex items-center justify-center text-white font-bold w-10 h-10 shrink-0">
            {profile?.nombre_completo?.charAt(0) || 'U'}
          </div>
          <div className="flex-grow overflow-hidden">
            <p className="text-white mb-0 truncate font-medium text-sm">{profile?.nombre_completo || 'Cargando...'}</p>
            <p className="text-slate-500 mb-0 text-xs truncate">{profile?.roles?.nombre || 'Empleado'}</p>
          </div>
          <button onClick={signOut} className="bg-transparent border-none cursor-pointer text-slate-500 hover:text-white transition-colors p-0" title="Cerrar sesión">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}