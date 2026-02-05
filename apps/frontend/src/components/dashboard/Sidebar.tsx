'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === path;
    return pathname.startsWith(path);
  };

  const linkClass = (path: string) => `
    nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 position-relative
    ${isActive(path)
      ? 'bg-primary bg-opacity-25 text-white fw-bold'
      : 'text-white-50'}
  `;

  const menuItems = [
    { icon: 'bi-grid-fill', label: 'Mi Panel', href: '/dashboard' },
    { icon: 'bi-clock-history', label: 'Mis Fichajes', href: '/dashboard/fichajes' },
    { icon: 'bi-file-text-fill', label: 'Mis Solicitudes', href: '/dashboard/solicitudes' },
    { icon: 'bi-person-badge-fill', label: 'Mi Perfil', href: '/dashboard/perfil' },
  ];

  return (
    <div className="d-flex flex-column h-100 text-white p-3" style={{ width: '280px', minHeight: '100vh', backgroundColor: '#0F172A' }}>

      {/* LOGO */}
      <div className="mb-4 px-2 mt-2">
        <h4 className="fw-bold m-0">ChronoWork</h4>
      </div>

      {/* MENÚ PERSONAL */}
      <small className="text-secondary text-uppercase fw-bold px-3 mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
        Mi Espacio
      </small>
      <ul className="nav nav-pills flex-column mb-4 gap-1">
        {menuItems.map((item) => (
          <li className="nav-item" key={item.href}>
            <Link href={item.href} className={linkClass(item.href)}>
              {isActive(item.href) && (
                <div className="position-absolute start-0 top-50 translate-middle-y bg-info rounded-end"
                  style={{ width: '4px', height: '60%' }}></div>
              )}
              <i className={`bi ${item.icon} fs-5`}></i>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* SPACER */}
      <div className="flex-grow-1"></div>

      {/* USUARIO */}
      <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
        <div className="d-flex align-items-center gap-3 px-2">
          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
            style={{ width: 40, height: 40, fontSize: '0.9rem' }}>
            {profile?.nombre_completo?.substring(0, 2).toUpperCase() || 'EM'}
          </div>
          <div className="overflow-hidden flex-grow-1">
            <div className="fw-bold text-white text-truncate" style={{ maxWidth: '130px' }}>
              {profile?.nombre_completo || 'Empleado'}
            </div>
            <small className="text-white-50 d-block" style={{ fontSize: '0.75rem' }}>
              Empleado
            </small>
          </div>
          <button onClick={signOut} className="btn btn-link text-white-50 p-0" title="Cerrar sesión">
            <i className="bi bi-box-arrow-right fs-5"></i>
          </button>
        </div>
      </div>

    </div>
  );
}
