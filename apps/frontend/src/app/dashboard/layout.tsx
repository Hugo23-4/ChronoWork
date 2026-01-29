'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="min-vh-100 bg-light">
      {/* Componentes de Navegación */}
      <Sidebar />
      <MobileNav />

      {/* Contenedor Principal Ajustable */}
      <main className="transition-all">
        {/* Estilos dinámicos para el layout responsive */}
        <style jsx global>{`
          /* Por defecto (Móvil): Sin margen izq, padding abajo para el menú */
          main { 
            margin-left: 0; 
            padding-bottom: 90px; 
          }
          
          /* Pantallas MD y superiores (Escritorio/Tablet): Margen izq 280px, sin padding abajo */
          @media (min-width: 768px) {
            main { 
              margin-left: 280px !important; 
              padding-bottom: 20px !important; 
            }
          }
        `}</style>

        <div className="container-fluid p-4">
          {children}
        </div>
      </main>
    </div>
  );
}