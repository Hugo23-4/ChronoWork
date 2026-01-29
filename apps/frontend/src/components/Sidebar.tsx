'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const isActive = (path: string) => pathname === path;

  // Clases para enlaces (Estado activo vs inactivo)
  const linkClass = (path: string) => `
    d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none transition-all
    ${isActive(path) 
      ? 'bg-primary bg-opacity-50 text-white fw-bold border-start border-4 border-info' 
      : 'text-secondary hover-text-white'}
  `;

  // NOTA: Usamos 'd-none d-md-flex' según tu instrucción del PASO 2
  return (
    <div className="d-none d-md-flex flex-column vh-100 position-fixed top-0 start-0 p-3" 
         style={{ width: '280px', backgroundColor: '#0F172A', zIndex: 1040 }}>
      
      {/* Brand */}
      <div className="mb-5 px-2">
        <h4 className="text-white fw-bold mb-0">ChronoWork</h4>
        <div className="bg-primary mt-2" style={{ height: '4px', width: '40px' }}></div>
      </div>

      {/* Navegación */}
      <div className="flex-grow-1 d-flex flex-column gap-2">
        <small className="text-uppercase text-secondary fw-bold px-3 mb-2" style={{ fontSize: '0.75rem' }}>Menú Principal</small>
        
        <Link href="/dashboard" className={linkClass('/dashboard')}>
          <i className="bi bi-grid-fill"></i> Panel de Control
        </Link>
        <Link href="/dashboard/fichajes" className={linkClass('/dashboard/fichajes')}>
          <i className="bi bi-clock-history"></i> Mis Fichajes
        </Link>
        <Link href="/dashboard/solicitudes" className={linkClass('/dashboard/solicitudes')}>
          <i className="bi bi-file-earmark-text"></i> Solicitudes & Bajas
        </Link>

        <div className="my-3"></div>

        <small className="text-uppercase text-secondary fw-bold px-3 mb-2" style={{ fontSize: '0.75rem' }}>Configuración</small>
        <Link href="/dashboard/perfil" className={linkClass('/dashboard/perfil')}>
          <i className="bi bi-person-badge"></i> Perfil y Contrato
        </Link>
        <Link href="/dashboard/ayuda" className={linkClass('/dashboard/ayuda')}>
          <i className="bi bi-question-circle"></i> Ayuda Legal
        </Link>
      </div>

      {/* Footer Usuario */}
      <div className="mt-auto pt-3 border-top border-secondary border-opacity-25">
        <div className="d-flex align-items-center gap-3 px-2">
          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" 
               style={{ width: '40px', height: '40px' }}>
            {profile?.nombre_completo?.charAt(0) || 'U'}
          </div>
          <div className="flex-grow-1 overflow-hidden">
            <p className="text-white mb-0 text-truncate fw-medium small">
              {profile?.nombre_completo || 'Cargando...'}
            </p>
            <p className="text-secondary mb-0 small text-truncate" style={{ fontSize: '0.75rem' }}>
              {profile?.roles?.nombre || 'Empleado'}
            </p>
          </div>
          <button onClick={signOut} className="btn btn-link text-secondary p-0">
            <i className="bi bi-box-arrow-right fs-5"></i>
          </button>
        </div>
      </div>
    </div>
  );
}