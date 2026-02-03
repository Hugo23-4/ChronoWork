import { ReactNode } from 'react';
import MobileMenu from '@/components/dashboard/MobileMenu';
import Sidebar from '@/components/Sidebar'; // Asegúrate que esta ruta es correcta en tu proyecto

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="d-flex min-vh-100 bg-light">
      
      {/* SIDEBAR (Escritorio) */}
      <div className="d-none d-lg-block flex-shrink-0" style={{ width: '280px' }}>
         <div className="fixed-top h-100" style={{ width: '280px' }}>
            <Sidebar />
         </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        {/* pb-5 y mb-5 extra en móvil para dejar sitio al menú */}
        <main className="flex-grow-1 p-3 p-lg-4 pb-5 mb-5 mb-lg-0">
            {children}
        </main>
      </div>

      {/* MENÚ MÓVIL */}
      <MobileMenu />
      
    </div>
  );
}