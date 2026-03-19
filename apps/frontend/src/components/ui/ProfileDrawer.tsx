'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';
import { LogOut, ShieldCheck, UserCircle, Briefcase, Sun, Moon, Monitor } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody } from '@/components/ui/drawer';
import { m } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  currentView?: 'employee' | 'admin';
}

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30, bounce: 0 };

export function ProfileDrawer({ open, onClose, currentView = 'employee' }: ProfileDrawerProps) {
  const { profile, signOut } = useAuth();
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('empleados_info')
      .select('rol, rol_id')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data && (data.rol === 'admin' || data.rol_id === 2)) setIsAdmin(true);
      });
  }, [user]);

  const initials = profile?.nombre_completo
    ? profile.nombre_completo.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  const handleSwitch = (view: 'employee' | 'admin') => {
    onClose();
    setTimeout(() => router.push(view === 'admin' ? '/admin' : '/dashboard'), 150);
  };

  const handleSignOut = () => { onClose(); setTimeout(() => signOut(), 150); };

  const themeOptions = [
    { id: 'light',  label: 'Claro',   icon: Sun },
    { id: 'dark',   label: 'Oscuro',  icon: Moon },
    { id: 'system', label: 'Sistema', icon: Monitor },
  ] as const;

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="max-h-[80vh] dark:bg-zinc-950 dark:border-zinc-800">
        <DrawerHeader>
          <DrawerTitle className="dark:text-zinc-200">Mi cuenta</DrawerTitle>
        </DrawerHeader>

        <DrawerBody className="pb-6 space-y-6">
          {/* ── Avatar + info ── */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-chrono-blue to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/25 shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-bold text-navy dark:text-zinc-200 text-lg leading-tight">{profile?.nombre_completo || 'Empleado'}</p>
              <p className="text-slate-400 dark:text-zinc-500 text-sm mt-0.5">{profile?.email || ''}</p>
              <span className="inline-block mt-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
                {isAdmin ? 'Administrador' : 'Empleado'}
              </span>
            </div>
          </div>

          {/* ── View switcher (admin only) ── */}
          {isAdmin && (
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Vista actual</p>
              <div className="bg-gray-100 dark:bg-zinc-800 rounded-2xl p-1 flex gap-1">
                {[
                  { id: 'employee', label: 'Empleado',      icon: Briefcase },
                  { id: 'admin',    label: 'Administrador', icon: ShieldCheck },
                ].map(({ id, label, icon: Icon }) => {
                  const active = currentView === id;
                  return (
                    <m.button
                      key={id}
                      onClick={() => handleSwitch(id as 'employee' | 'admin')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-sm cursor-pointer border-none',
                        active
                          ? 'bg-white dark:bg-zinc-700 text-navy dark:text-zinc-200 shadow-sm'
                          : 'bg-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
                      )}
                      whileTap={{ scale: 0.97 }}
                      transition={SPRING}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </m.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Theme selector ── */}
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Apariencia</p>
            <div className="bg-gray-100 dark:bg-zinc-800 rounded-2xl p-1 flex gap-1">
              {themeOptions.map(({ id, label, icon: Icon }) => {
                const active = mounted ? theme === id : id === 'system';
                return (
                  <m.button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl font-semibold text-xs cursor-pointer border-none transition-colors',
                      active
                        ? 'bg-white dark:bg-zinc-700 text-navy dark:text-zinc-200 shadow-sm'
                        : 'bg-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
                    )}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING}
                    aria-pressed={active}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </m.button>
                );
              })}
            </div>
            {/* Live indicator */}
            {mounted && (
              <p className="text-[10px] text-slate-400 dark:text-zinc-600 text-center mt-2">
                Activo: <span className="font-semibold capitalize">{resolvedTheme === 'dark' ? 'Oscuro' : 'Claro'}</span>
              </p>
            )}
          </div>

          {/* ── Profile link ── */}
          <div className="space-y-1">
            <button
              onClick={() => { onClose(); router.push('/dashboard/perfil'); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-none bg-transparent text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                <UserCircle className="w-4 h-4 text-chrono-blue" />
              </div>
              <span className="font-semibold text-navy dark:text-zinc-200 text-sm">Mi Perfil</span>
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-gray-100 dark:border-zinc-800" />

          {/* ── Sign out ── */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer border-none bg-transparent text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center shrink-0 group-hover:bg-red-100 dark:group-hover:bg-red-950/80 transition-colors">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <span className="font-semibold text-red-500 text-sm">Cerrar sesión</span>
          </button>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
