'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, Clock, FileText, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { m, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ProfileDrawer } from '@/components/ui/ProfileDrawer';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const employeeItems: MenuItem[] = [
  { name: 'Inicio',      href: '/dashboard',            icon: Home },
  { name: 'Fichajes',    href: '/dashboard/fichajes',   icon: Clock },
  { name: 'Solicitudes', href: '/dashboard/solicitudes',icon: FileText },
  { name: 'Perfil',      href: '/dashboard/perfil',     icon: UserCircle },
];

export default function MobileMenu() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = profile?.nombre_completo
    ? profile.nombre_completo.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  return (
    <>
      {/* ── Fixed top iOS header ── */}
      <div
        className="mobile-header-bar lg:hidden fixed top-0 left-0 right-0 z-[1035] bg-white/85 dark:bg-zinc-950/88 backdrop-blur-2xl border-b border-white/40 dark:border-white/5"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-5 h-14">
          <span className="font-extrabold text-navy dark:text-zinc-200 text-[1.05rem] font-[family-name:var(--font-jakarta)] tracking-tight">
            ChronoWork
          </span>
          <m.button
            onClick={() => setProfileOpen(true)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-chrono-blue to-blue-700 flex items-center justify-center text-white font-bold text-xs cursor-pointer border-none shadow-md shadow-blue-500/20"
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, bounce: 0 }}
            aria-label="Abrir perfil"
          >
            {initials}
          </m.button>
        </div>
      </div>

      {/* ── Floating glassmorphism bottom nav ── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[1040]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mobile-bottom-nav mx-3 mb-3 bg-white/85 dark:bg-zinc-900/92 backdrop-blur-2xl border border-white/60 dark:border-white/[0.06] rounded-[22px] shadow-[0_8px_32px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex justify-around items-center px-2 py-2">
            {employeeItems.map(({ name, href, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
              return (
                <Link key={name} href={href} className="no-underline flex flex-col items-center justify-center flex-1 py-1">
                  <div className="relative flex items-center justify-center w-11 h-9 mb-0.5">
                    <AnimatePresence>
                      {active && (
                        <m.div
                          layoutId="employee-tab-pill"
                          className="absolute inset-0 bg-navy dark:bg-white rounded-[14px] shadow-sm shadow-navy/20 dark:shadow-white/10"
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
                        active ? 'text-white dark:text-navy' : 'text-slate-400 dark:text-zinc-500'
                      )} />
                    </m.div>
                  </div>
                  <span className={cn(
                    'text-[9px] font-semibold tracking-tight',
                    active ? 'text-navy dark:text-zinc-200' : 'text-slate-400 dark:text-zinc-500'
                  )}>
                    {name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} currentView="employee" />
    </>
  );
}