'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clock, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { m, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

const items: { href: string; icon: LucideIcon; label: string }[] = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  { href: '/dashboard/fichajes', icon: Clock, label: 'Fichajes' },
  { href: '/dashboard/perfil', icon: User, label: 'Perfil' },
  { href: '/dashboard/ajustes', icon: Settings, label: 'Ajustes' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-[1040]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Floating glassmorphism pill */}
      <div className="mx-3 mb-3 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_8px_32px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div className="flex justify-around items-center px-2 py-2">
          {items.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="no-underline flex flex-col items-center justify-center flex-1 py-1 group"
              >
                {/* Framer pill container (relative so layoutId works correctly) */}
                <div className="relative flex items-center justify-center w-10 h-9 mb-1">
                  {/* Sliding background pill via layoutId */}
                  <AnimatePresence>
                    {active && (
                      <m.div
                        layoutId="employee-nav-pill"
                        className="absolute inset-0 bg-navy rounded-xl shadow-md shadow-navy/25"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                  {/* Icon — above the background via z-10 */}
                  <m.div
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="relative z-10"
                  >
                    <Icon className={cn(
                      'w-5 h-5 transition-colors duration-200',
                      active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    )} />
                  </m.div>
                </div>
                <span className={cn(
                  'text-[9px] font-bold tracking-tight transition-colors duration-200',
                  active ? 'text-navy' : 'text-slate-400'
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}