'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileMenu from '@/components/dashboard/MobileMenu';
import AdminModeSwitcher from '@/components/dashboard/AdminModeSwitcher';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="d-flex vh-100 overflow-hidden">

      {/* Sidebar Desktop */}
      <div className="d-none d-lg-block">
        <Sidebar />
      </div>

      {/* Contenido Principal */}
      <main className="flex-grow-1 overflow-auto bg-light position-relative">
        <div className="p-3 p-md-4">
          {children}
        </div>
      </main>

      {/* Menu Móvil */}
      <div className="d-lg-none">
        <MobileMenu />
      </div>

      {/* Botón Admin (solo visible para admins) */}
      <AdminModeSwitcher />

    </div>
  );
}