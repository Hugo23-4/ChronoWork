'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import MobileMenu from '@/components/dashboard/MobileMenu';
import AdminModeSwitcher from '@/components/dashboard/AdminModeSwitcher';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar Desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Contenido Principal */}
      <main className="flex-grow overflow-auto bg-bg-body relative">
        <div className="p-3 md:p-4">
          {children}
        </div>
      </main>

      {/* Menu Móvil */}
      <div className="lg:hidden">
        <MobileMenu />
      </div>

      {/* Botón Admin (solo visible para admins) */}
      <AdminModeSwitcher />

    </div>
  );
}