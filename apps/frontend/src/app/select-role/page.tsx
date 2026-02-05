'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function RoleSelectionPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkRole();
    }, [user]);

    const checkRole = async () => {
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
            // No es admin, redirigir directo a dashboard empleado
            localStorage.setItem('chronowork_view_mode', 'personal');
            router.push('/dashboard');
        }
    };

    const handleSelection = (mode: 'admin' | 'personal') => {
        localStorage.setItem('chronowork_view_mode', mode);

        // Admin → fichajes, Personal → dashboard
        if (mode === 'admin') {
            router.push('/dashboard/fichajes');
        } else {
            router.push('/dashboard');
        }
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="spinner-border text-primary"></div>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>

            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-10 col-lg-8">

                        {/* Header */}
                        <div className="text-center mb-5">
                            <h1 className="text-white fw-bold display-5 mb-3">
                                ¡Bienvenido, Administrador! 👋
                            </h1>
                            <p className="text-white-50 fs-5">
                                Selecciona cómo deseas acceder hoy
                            </p>
                        </div>

                        {/* Tarjetas de selección */}
                        <div className="row g-4">

                            {/* Opción 1: Admin */}
                            <div className="col-12 col-md-6">
                                <div
                                    onClick={() => handleSelection('admin')}
                                    className="card border-0 shadow-lg rounded-4 p-4 h-100 hover-scale cursor-pointer position-relative overflow-hidden"
                                    style={{
                                        transition: 'all 0.3s',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    {/* Decoración */}
                                    <div className="position-absolute top-0 end-0 m-3 opacity-10">
                                        <i className="bi bi-shield-fill" style={{ fontSize: '120px' }}></i>
                                    </div>

                                    <div className="position-relative">
                                        <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                            style={{ width: '80px', height: '80px' }}>
                                            <i className="bi bi-shield-fill text-primary" style={{ fontSize: '40px' }}></i>
                                        </div>

                                        <h3 className="fw-bold text-dark mb-3">
                                            Gestión Administrativa
                                        </h3>

                                        <p className="text-secondary mb-4">
                                            Accede como <strong>administrador</strong> para gestionar empleados,
                                            fichajes, solicitudes y configuración del sistema.
                                        </p>

                                        <ul className="list-unstyled text-secondary small">
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Ver todos los fichajes del personal
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Aprobar solicitudes de vacaciones
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Gestionar empleados y centros
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Exportar reportes y estadísticas
                                            </li>
                                        </ul>

                                        <button className="btn btn-primary w-100 rounded-pill fw-bold py-3 mt-3">
                                            <i className="bi bi-arrow-right-circle me-2"></i>
                                            Entrar como Admin
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Opción 2: Empleado */}
                            <div className="col-12 col-md-6">
                                <div
                                    onClick={() => handleSelection('personal')}
                                    className="card border-0 shadow-lg rounded-4 p-4 h-100 hover-scale cursor-pointer position-relative overflow-hidden"
                                    style={{
                                        transition: 'all 0.3s',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    {/* Decoración */}
                                    <div className="position-absolute top-0 end-0 m-3 opacity-10">
                                        <i className="bi bi-person-fill" style={{ fontSize: '120px' }}></i>
                                    </div>

                                    <div className="position-relative">
                                        <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                            style={{ width: '80px', height: '80px' }}>
                                            <i className="bi bi-person-fill text-success" style={{ fontSize: '40px' }}></i>
                                        </div>

                                        <h3 className="fw-bold text-dark mb-3">
                                            Mi Espacio Personal
                                        </h3>

                                        <p className="text-secondary mb-4">
                                            Accede como <strong>empleado</strong> para fichar,
                                            consultar tus horarios y solicitar vacaciones.
                                        </p>

                                        <ul className="list-unstyled text-secondary small">
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Ver solo mis fichajes personales
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Solicitar vacaciones y bajas
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Consultar mi perfil y contrato
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Cambiar a modo admin cuando quieras
                                            </li>
                                        </ul>

                                        <button className="btn btn-success w-100 rounded-pill fw-bold py-3 mt-3">
                                            <i className="bi bi-arrow-right-circle me-2"></i>
                                            Entrar como Empleado
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="text-center mt-5">
                            <small className="text-white-50">
                                <i className="bi bi-info-circle me-1"></i>
                                Podrás cambiar de modo en cualquier momento
                            </small>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    );
}
