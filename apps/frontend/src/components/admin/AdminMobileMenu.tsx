'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Clock, FileText, Users, MapPin, Calendar, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { m, AnimatePresence } from 'framer-motion';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminItems: MenuItem[] = [
  { name: 'Panel',       href: '/admin',             icon: BarChart3 },
  { name: 'Fichajes',    href: '/admin/fichajes',    icon: Clock },
  { name: 'Solicitudes', href: '/admin/solicitudes', icon: FileText },
  { name: 'Equipo',      href: '/admin/usuarios',    icon: Users },
  { name: 'Centros',     href: '/admin/centros',     icon: MapPin },
  { name: 'Turnos',      href: '/admin/turnos',      icon: Calendar },
  { name: 'Pausas',      href: '/admin/pausas',      icon: Coffee },
];

export default function AdminMobileMenu() {
  const pathname = usePathname();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[1040]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mobile-bottom-nav mx-3 mb-3 bg-white/85 dark:bg-zinc-900/92 backdrop-blur-2xl border border-white/60 dark:border-white/[0.06] rounded-[22px] shadow-[0_8px_32px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex justify-around items-center px-2 py-2">
          {adminItems.map(({ name, href, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link key={name} href={href} className="no-underline flex flex-col items-center justify-center flex-1 py-1">
                <div className="relative flex items-center justify-center w-11 h-9 mb-0.5">
                  <AnimatePresence>
                    {active && (
                      <m.div
                        layoutId="admin-tab-pill"
                        className="absolute inset-0 bg-red-500 rounded-[14px] shadow-sm shadow-red-500/25"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30, bounce: 0 }}
                      />
                    )}
                  </AnimatePresence>
                  <m.div className="relative z-10" whileTap={{ scale: 0.85 }} transition={{ type: 'spring', stiffness: 400, damping: 30, bounce: 0 }}>
                    <Icon className={cn(
                      'w-[18px] h-[18px] transition-colors duration-150',
                      active ? 'text-white' : 'text-slate-400 dark:text-zinc-500'
                    )} />
                  </m.div>
                </div>
                <span className={cn(
                  'text-[9px] font-semibold tracking-tight',
                  active ? 'text-red-500' : 'text-slate-400 dark:text-zinc-500'
                )}>
                  {name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
