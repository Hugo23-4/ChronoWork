'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

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
                className="d-none d-lg-flex position-fixed btn btn-dark shadow-lg rounded-pill px-4 py-2 fw-bold align-items-center gap-2"
                style={{
                    bottom: '24px',
                    right: '24px',
                    zIndex: 1050
                }}
            >
                <i className="bi bi-shield-lock-fill"></i>
                Panel Admin
            </button>

            {/* Botón Mobile - Top Right pequeño y discreto */}
            <button
                onClick={() => router.push('/admin')}
                className="d-lg-none position-fixed btn btn-dark shadow-sm rounded-circle d-flex align-items-center justify-content-center"
                style={{
                    top: '12px',
                    right: '12px',
                    zIndex: 1050,
                    width: '40px',
                    height: '40px',
                    padding: 0
                }}
                title="Panel Admin"
            >
                <i className="bi bi-shield-fill-check"></i>
            </button>
        </>
    );
}
