'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminMobileMenu from '@/components/admin/AdminMobileMenu';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAdminAccess();
    }, [user]);

    const checkAdminAccess = async () => {
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
            <div className="min-h-screen flex items-center justify-center bg-bg-body">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-chrono-blue animate-spin mx-auto" />
                    <p className="text-slate-400 text-sm mt-3">Verificando acceso...</p>
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

            {/* Contenido Principal */}
            <main className="flex-grow overflow-auto bg-bg-body relative">
                <div className="p-3 md:p-4">
                    {children}
                </div>
            </main>

            {/* Menu Mobile Admin */}
            <div className="lg:hidden">
                <AdminMobileMenu />
            </div>
        </div>
    );
}
