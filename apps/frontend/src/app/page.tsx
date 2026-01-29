'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="container-fluid p-0 vh-100 bg-white d-flex flex-column">
      {/* Navbar con estilo corporativo */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm py-3">
        <div className="container">
          <span className="navbar-brand fw-bold text-primary fs-3">ChronoWork</span>
          <Link href="/login" className="btn btn-primary fw-bold px-4 rounded-pill">
            Acceso Empleados
          </Link>
        </div>
      </nav>

      {/* Hero Section centralizado */}
      <div className="container flex-grow-1 d-flex align-items-center justify-content-center text-center">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <h1 className="display-1 fw-bold text-dark mb-4">
              Cada segundo <span className="text-primary">cuenta</span>.
            </h1>
            <p className="lead text-secondary mb-5 fs-4 px-md-5">
              La plataforma de registro de jornada diseñada para garantizar la 
              <strong> integridad del dato</strong>, la transparencia y el cumplimiento legal.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Link href="/login" className="btn btn-primary btn-lg px-5 py-3 shadow">
                Comenzar Fichaje
              </Link>
              <button className="btn btn-outline-secondary btn-lg px-5 py-3">
                Saber más
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="py-4 border-top bg-light text-center">
        <small className="text-muted">© 2026 ChronoWork - Sistema de Integridad Horaria</small>
      </footer>
    </main>
  );
}