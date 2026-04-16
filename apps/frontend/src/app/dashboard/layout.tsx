'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileMenu from '@/components/dashboard/MobileMenu';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-chrono-blue" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-dvh overflow-hidden">

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