'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminMobileMenu from '@/components/admin/AdminMobileMenu';
import AdminMobileHeader from '@/components/dashboard/AdminMobileHeader';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAdminAccess();
    }, [user, authLoading]);

    const checkAdminAccess = async () => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const { data } = await supabase
            .from('empleados_info')
            .select('rol, rol_id')
            .eq('id', user.id)
            .single();

        if (data?.rol === 'admin' || data?.rol_id === 2) {
            setIsAdmin(true);
            setLoading(false);
        } else {
            setLoading(false);
            router.push('/dashboard');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-chrono-blue animate-spin mx-auto" />
                    <p className="text-slate-400 dark:text-zinc-500 text-sm mt-3">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar Desktop */}
            <div className="hidden lg:block">
                <AdminSidebar />
            </div>

            {/* Main content */}
            <main className="flex-grow overflow-auto bg-white dark:bg-black relative">
                <div className="p-5 md:p-8 pt-14 lg:pt-8 pb-20 md:pb-8 lg:pb-8">
                    {children}
                </div>
            </main>

            {/* Menu Mobile Admin */}
            <div className="lg:hidden">
                <AdminMobileMenu />
            </div>

            {/* Fixed top header — mobile only */}
            <AdminMobileHeader />
        </div>
    );
}
