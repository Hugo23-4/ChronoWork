'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const NavItem = ({ href, icon, label }: { href: string, icon: string, label: string }) => (
    <Link href={href} className="no-underline flex-1">
      <div className={`flex flex-col items-center justify-center py-3 transition-all
        ${isActive(href) ? 'text-white' : 'text-slate-500'}`}
      >
        <i className={`bi ${icon} text-xl mb-1 ${isActive(href) ? 'text-sky-500' : ''}`}></i>
        <span style={{ fontSize: '0.7rem', fontWeight: isActive(href) ? 600 : 400 }}>
          {label}
        </span>
      </div>
    </Link>
  );

  return (
    // NOTA: 'd-md-none' lo oculta en pantallas medianas y grandes
    <div className="d-md-none fixed bottom-0 left-0 right-0 shadow-lg" 
         style={{ backgroundColor: '#0F172A', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex justify-between items-center px-2">
        <NavItem href="/dashboard" icon="bi-house-door-fill" label="Inicio" />
        <NavItem href="/dashboard/fichajes" icon="bi-clock-history" label="Fichajes" />
        <NavItem href="/dashboard/perfil" icon="bi-person-fill" label="Perfil" />
        <NavItem href="/dashboard/ajustes" icon="bi-gear-fill" label="Ajustes" />
      </div>
    </div>
  );
}