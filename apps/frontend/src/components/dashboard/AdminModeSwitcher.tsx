'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck } from 'lucide-react';

export default function AdminModeSwitcher() {
    const router = useRouter();
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkRole = async () => {
            if (!user) return;

            const { data } = await supabase
                .from('empleados_info')
                .select('rol, rol_id')
                .eq('id', user.id)
                .single();

            if (data && (data.rol === 'admin' || data.rol_id === 2)) {
                setIsAdmin(true);
            }
        };

        checkRole();
    }, [user]);

    if (!isAdmin) return null;

    return (
        <>
            {/* Botón Desktop - Bottom Right */}
            <button
                onClick={() => router.push('/admin')}
                className="hidden lg:flex fixed bottom-6 right-6 z-[1050] bg-navy text-white shadow-lg rounded-full px-4 py-2.5 font-bold items-center gap-2 border-none cursor-pointer hover:bg-slate-dark hover:-translate-y-0.5 hover:shadow-xl transition-all"
            >
                <ShieldCheck className="w-4 h-4" />
                Panel Admin
            </button>

            {/* Botón Mobile - Top Right pequeño y discreto */}
            <button
                onClick={() => router.push('/admin')}
                className="lg:hidden fixed top-3 right-3 z-[1050] bg-navy text-white shadow-sm rounded-full w-10 h-10 flex items-center justify-center border-none cursor-pointer hover:bg-slate-dark transition-colors"
                title="Panel Admin"
            >
                <ShieldCheck className="w-4 h-4" />
            </button>
        </>
    );
}
