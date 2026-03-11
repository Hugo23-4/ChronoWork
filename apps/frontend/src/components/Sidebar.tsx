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
    flex items-center gap-3 px-3 py-3 rounded-lg no-underline transition-all
    ${isActive(path) 
      ? 'bg-chrono-blue bg-opacity-50 text-white font-bold border-start border-4 border-info' 
      : 'text-slate-500 hover-text-white'}
  `;

  // NOTA: Usamos 'hidden md:flex' según tu instrucción del PASO 2
  return (
    <div className="hidden md:flex flex-col h-screen fixed top-0 left-0 p-3" 
         style={{ width: '280px', backgroundColor: '#0F172A', zIndex: 1040 }}>
      
      {/* Brand */}
      <div className="mb-6 px-2">
        <h4 className="text-white font-bold mb-0">ChronoWork</h4>
        <div className="bg-chrono-blue mt-2" style={{ height: '4px', width: '40px' }}></div>
      </div>

      {/* Navegación */}
      <div className="flex-grow flex flex-col gap-2">
        <small className="uppercase text-slate-500 font-bold px-3 mb-2" style={{ fontSize: '0.75rem' }}>Menú Principal</small>
        
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

        <small className="uppercase text-slate-500 font-bold px-3 mb-2" style={{ fontSize: '0.75rem' }}>Configuración</small>
        <Link href="/dashboard/perfil" className={linkClass('/dashboard/perfil')}>
          <i className="bi bi-person-badge"></i> Perfil y Contrato
        </Link>
        <Link href="/dashboard/ayuda" className={linkClass('/dashboard/ayuda')}>
          <i className="bi bi-question-circle"></i> Ayuda Legal
        </Link>
      </div>

      {/* Footer Usuario */}
      <div className="mt-auto pt-3 border-t border-slate-500 border-opacity-25">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-chrono-blue rounded-full flex items-center justify-center text-white font-bold" 
               style={{ width: '40px', height: '40px' }}>
            {profile?.nombre_completo?.charAt(0) || 'U'}
          </div>
          <div className="flex-grow overflow-hidden">
            <p className="text-white mb-0 truncate fw-medium text-sm">
              {profile?.nombre_completo || 'Cargando...'}
            </p>
            <p className="text-slate-500 mb-0 text-sm truncate" style={{ fontSize: '0.75rem' }}>
              {profile?.roles?.nombre || 'Empleado'}
            </p>
          </div>
          <button onClick={signOut} className="bg-transparent border-none cursor-pointer text-slate-500 p-0">
            <i className="bi bi-box-arrow-right text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
}