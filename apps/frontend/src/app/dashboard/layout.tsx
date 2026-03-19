'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import MobileMenu from '@/components/dashboard/MobileMenu';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar Desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-grow overflow-auto bg-white dark:bg-black relative">
        <div className="p-5 md:p-8 pt-20 lg:pt-8 pb-28 md:pb-8 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile nav */}
      <div className="lg:hidden">
        <MobileMenu />
      </div>

    </div>
  );
}