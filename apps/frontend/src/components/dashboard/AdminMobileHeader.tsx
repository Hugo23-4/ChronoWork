'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProfileDrawer } from '@/components/ui/ProfileDrawer';
import { m } from 'framer-motion';

export default function AdminMobileHeader() {
    const { profile } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);

    const initials = profile?.nombre_completo
        ? profile.nombre_completo.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'AD';

    return (
        <>
            <div
                className="mobile-header-bar lg:hidden fixed top-0 left-0 right-0 z-[1035] bg-white/85 dark:bg-zinc-950/88 backdrop-blur-2xl border-b border-white/40 dark:border-white/5"
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
                <div className="flex items-center justify-between px-5 h-14">
                    <div className="flex items-center gap-2">
                        <span className="font-extrabold text-navy dark:text-zinc-200 text-[1.05rem] font-[family-name:var(--font-jakarta)] tracking-tight">
                            ChronoWork
                        </span>
                        <span className="bg-red-500/10 text-red-500 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                            Admin
                        </span>
                    </div>
                    <m.button
                        onClick={() => setProfileOpen(true)}
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xs cursor-pointer border-none shadow-md shadow-red-500/25"
                        whileTap={{ scale: 0.92 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30, bounce: 0 }}
                        aria-label="Abrir perfil"
                    >
                        {initials}
                    </m.button>
                </div>
            </div>

            <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} currentView="admin" />
        </>
    );
}
