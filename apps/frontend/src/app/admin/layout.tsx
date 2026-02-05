'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminMobileMenu from '@/components/admin/AdminMobileMenu';

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
            // No es admin, redirigir a dashboard empleado
            router.push('/dashboard');
        }
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary"></div>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="d-flex vh-100 overflow-hidden">
            {/* Sidebar Desktop */}
            <div className="d-none d-lg-block">
                <AdminSidebar />
            </div>

            {/* Contenido Principal */}
            <main className="flex-grow-1 overflow-auto bg-light position-relative">
                <div className="p-3 p-md-4">
                    {children}
                </div>
            </main>

            {/* Menu Mobile Admin */}
            <div className="d-lg-none">
                <AdminMobileMenu />
            </div>
        </div>
    );
}
