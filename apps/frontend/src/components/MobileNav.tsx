'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const NavItem = ({ href, icon, label }: { href: string, icon: string, label: string }) => (
    <Link href={href} className="text-decoration-none flex-fill">
      <div className={`d-flex flex-column align-items-center justify-content-center py-3 transition-all
        ${isActive(href) ? 'text-white' : 'text-secondary'}`}
      >
        <i className={`bi ${icon} fs-4 mb-1 ${isActive(href) ? 'text-info' : ''}`}></i>
        <span style={{ fontSize: '0.7rem', fontWeight: isActive(href) ? 600 : 400 }}>
          {label}
        </span>
      </div>
    </Link>
  );

  return (
    // NOTA: 'd-md-none' lo oculta en pantallas medianas y grandes
    <div className="d-md-none fixed-bottom shadow-lg" 
         style={{ backgroundColor: '#0F172A', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="d-flex justify-content-between align-items-center px-2">
        <NavItem href="/dashboard" icon="bi-house-door-fill" label="Inicio" />
        <NavItem href="/dashboard/fichajes" icon="bi-clock-history" label="Fichajes" />
        <NavItem href="/dashboard/perfil" icon="bi-person-fill" label="Perfil" />
        <NavItem href="/dashboard/ajustes" icon="bi-gear-fill" label="Ajustes" />
      </div>
    </div>
  );
}