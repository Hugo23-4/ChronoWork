'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Comprobar si soy admin al cargar el menú
  useEffect(() => {
    if (user) checkRole();
  }, [user]);

  const checkRole = async () => {
    // Usamos la comprobación robusta que ya sabemos que funciona
    const { data } = await supabase
      .from('empleados_info')
      .select('rol')
      .eq('id', user?.id)
      .single();
    
    if (data?.rol === 'admin') {
      setIsAdmin(true);
    }
  };

  const menuItems = [
    { icon: 'bi-grid-fill', label: 'Panel de Control', href: '/dashboard' },
    { icon: 'bi-clock-history', label: 'Mis Fichajes', href: '/dashboard/fichajes' },
    { icon: 'bi-file-text-fill', label: 'Solicitudes & Bajas', href: '/dashboard/solicitudes' },
  ];

  const adminItems = [
    { icon: 'bi-geo-alt-fill', label: 'Centros de Trabajo', href: '/dashboard/admin/centros' },
    // Aquí pondremos más cosas de admin luego (Empleados, Auditoría...)
  ];

  const configItems = [
    { icon: 'bi-person-badge-fill', label: 'Perfil y Contrato', href: '/dashboard/perfil' },
    { icon: 'bi-question-circle', label: 'Ayuda Legal', href: '/dashboard/ayuda' },
  ];

  return (
    <div className="d-flex flex-column h-100 bg-dark text-white p-3" style={{ width: '280px', minHeight: '100vh' }}>
      
      {/* LOGO */}
      <div className="mb-5 px-2 mt-2">
        <h4 className="fw-bold m-0 d-flex align-items-center gap-2">
          <div className="bg-primary rounded-circle" style={{width: 10, height: 10}}></div>
          ChronoWork
        </h4>
      </div>

      {/* MENÚ PRINCIPAL */}
      <small className="text-secondary fw-bold px-3 mb-2" style={{fontSize: '0.7rem'}}>MENÚ PRINCIPAL</small>
      <ul className="nav nav-pills flex-column mb-4 gap-1">
        {menuItems.map((item) => (
          <li className="nav-item" key={item.href}>
            <Link 
              href={item.href} 
              className={`nav-link d-flex align-items-center gap-3 px-3 ${pathname === item.href ? 'active bg-primary' : 'text-white-50 hover-light'}`}
            >
              <i className={`bi ${item.icon} fs-5`}></i>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* MENÚ ADMINISTRACIÓN (Solo si es Admin) */}
      {isAdmin && (
        <>
          <small className="text-secondary fw-bold px-3 mb-2" style={{fontSize: '0.7rem'}}>ADMINISTRACIÓN</small>
          <ul className="nav nav-pills flex-column mb-4 gap-1">
            {adminItems.map((item) => (
              <li className="nav-item" key={item.href}>
                <Link 
                  href={item.href} 
                  className={`nav-link d-flex align-items-center gap-3 px-3 ${pathname === item.href ? 'active bg-primary' : 'text-white-50 hover-light'}`}
                >
                  <i className={`bi ${item.icon} fs-5`}></i>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* MENÚ CONFIGURACIÓN */}
      <small className="text-secondary fw-bold px-3 mb-2" style={{fontSize: '0.7rem'}}>CONFIGURACIÓN</small>
      <ul className="nav nav-pills flex-column mb-auto gap-1">
        {configItems.map((item) => (
          <li className="nav-item" key={item.href}>
            <Link 
              href={item.href} 
              className={`nav-link d-flex align-items-center gap-3 px-3 ${pathname === item.href ? 'active bg-primary' : 'text-white-50 hover-light'}`}
            >
              <i className={`bi ${item.icon} fs-5`}></i>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* USUARIO ABAJO */}
      <div className="mt-4 pt-3 border-top border-secondary">
        <div className="d-flex align-items-center gap-3 px-2">
            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{width: 40, height: 40}}>
                {user?.email?.substring(0,2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
                <div className="fw-bold text-white text-truncate" style={{maxWidth: '120px'}}>Usuario</div>
                <small className="text-white-50 d-block" style={{fontSize: '0.75rem'}}>
                    {isAdmin ? 'Administrador' : 'Empleado'}
                </small>
            </div>
            <button onClick={signOut} className="btn btn-link text-white-50 ms-auto p-0" title="Cerrar sesión">
                <i className="bi bi-box-arrow-right fs-5"></i>
            </button>
        </div>
      </div>

    </div>
  );
}