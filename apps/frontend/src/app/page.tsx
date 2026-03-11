'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="container-fluid p-0 h-screen bg-white flex flex-col">
      {/* Navbar con estilo corporativo */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-b shadow-sm py-3">
        <div className="container">
          <span className="navbar-brand font-bold text-chrono-blue text-2xl">ChronoWork</span>
          <Link href="/login" className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none font-bold px-4 rounded-full">
            Acceso Empleados
          </Link>
        </div>
      </nav>

      {/* Hero Section centralizado */}
      <div className="container flex-grow flex items-center justify-center text-center">
        <div className="row justify-center">
          <div className="col-lg-10">
            <h1 className="text-7xl font-bold text-navy mb-4">
              Cada segundo <span className="text-chrono-blue">cuenta</span>.
            </h1>
            <p className="lead text-slate-500 mb-6 text-xl px-md-5">
              La plataforma de registro de jornada diseñada para garantizar la 
              <strong> integridad del dato</strong>, la transparencia y el cumplimiento legal.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/login" className="btn btn-action btn-lg px-6 py-3 shadow-md hover-scale">
                Comenzar Fichaje
              </Link>
              <button className="bg-white text-navy border border-gray-200 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer btn-lg px-6 py-3">
                Saber más
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="py-4 border-t bg-gray-50 text-center">
        <small className="text-slate-400">© 2026 ChronoWork - Sistema de Integridad Horaria</small>
      </footer>
    </main>
  );
}