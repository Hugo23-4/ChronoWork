'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface MenuItem {
  name: string;
  href: string;
  icon: string;
  activeIconColor?: string;
}

export default function MobileMenu() {
  const pathname = usePathname();
  const { user } = useAuth();

  // IMPORTANTE: Solo mostrar menú de empleado
  // Si estamos en /dashboard, mostrar SIEMPRE menú de empleado
  // El admin tiene su propio portal en /admin con su propia navegación

  const employeeItems: MenuItem[] = [
    { name: 'Inicio', href: '/dashboard', icon: 'bi-house-door-fill', activeIconColor: 'text-dark' },
    { name: 'Fichajes', href: '/dashboard/fichajes', icon: 'bi-clock-history', activeIconColor: 'text-dark' },
    { name: 'Solicitudes', href: '/dashboard/solicitudes', icon: 'bi-file-earmark-text', activeIconColor: 'text-dark' },
    { name: 'Perfil', href: '/dashboard/perfil', icon: 'bi-person-circle', activeIconColor: 'text-dark' },
  ];

  return (
    <div className="d-lg-none fixed-bottom bg-light border-top border-secondary-subtle shadow-lg"
      style={{ zIndex: 1040, paddingBottom: 'env(safe-area-inset-bottom)' }}>

      <div className="d-flex justify-content-around align-items-end pt-2 pb-1">

        {employeeItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className="text-decoration-none d-flex flex-column align-items-center justify-content-center"
              style={{ width: '75px', height: '60px' }}
            >
              {/* PASTILLA ACTIVA */}
              <div
                className={`
                  d-flex align-items-center justify-content-center rounded-pill mb-1 transition-all
                  ${isActive ? 'bg-black shadow' : 'bg-transparent'} 
                `}
                style={{
                  width: isActive ? '42px' : '24px',
                  height: '32px',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                }}
              >
                <i
                  className={`bi ${item.icon} fs-5 ${isActive ? (item.activeIconColor || 'text-white') : 'text-secondary opacity-75'}`}
                ></i>
              </div>

              {/* TEXTO */}
              <span
                className="small fw-bold tracking-tight"
                style={{
                  fontSize: '10px',
                  color: isActive ? '#000' : '#888',
                  marginTop: '2px'
                }}
              >
                {item.name}
              </span>
            </Link>
          );
        })}

      </div>
    </div>
  );
}