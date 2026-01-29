'use client';

import { useAuth } from '@/context/AuthContext';
import TimerDisplay from '@/components/TimerDisplay';

export default function DashboardPage() {
  const { profile } = useAuth();
  const fechaHoy = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fade-in-up pb-5">
      
      {/* HEADER: Saludo y Fecha */}
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h1 className="fw-bold mb-1 text-dark">
            Hola, {profile?.nombre_completo?.split(' ')[0] || 'Hugo'} 👋
          </h1>
          <p className="text-secondary mb-0">
            Aquí tienes el estado de tu jornada laboral hoy.
          </p>
        </div>
        <div className="d-none d-lg-block">
          <span className="fw-bold text-dark fs-5">📅 {fechaHoy}</span>
        </div>
      </div>

      {/* GRID SYSTEM: Estructura Principal */}
      <div className="row g-4">
        
        {/* COLUMNA 1: El Cronómetro (8 columnas en PC) */}
        <div className="col-12 col-lg-8">
          <TimerDisplay />
        </div>

        {/* COLUMNA 2: Widget Objetivo Semanal (4 columnas en PC) */}
        <div className="col-12 col-lg-4">
          <div className="card h-100 p-4 border-0 shadow-sm rounded-4">
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <h5 className="fw-bold text-start mb-4">Tu Objetivo Semanal</h5>
              
              {/* Gráfico Donut (SVG Puro) */}
              <div className="position-relative d-inline-flex justify-content-center align-items-center mb-4 align-self-center">
                <svg width="180" height="180" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#E2E8F0" strokeWidth="14" />
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#2563EB" strokeWidth="14" 
                          strokeDasharray="440" strokeDashoffset="110" strokeLinecap="round" />
                </svg>
                <div className="position-absolute text-center">
                  <span className="display-4 fw-bold d-block text-dark">32h</span>
                  <small className="text-muted fw-bold">de 40h</small>
                </div>
              </div>

              <div className="alert border-0 bg-transparent p-0 mt-2">
                <p className="fw-bold small mb-0 text-dark">
                  <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                  Te faltan 8h para cumplir contrato
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET: Banner Convenio (Debajo de todo) */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4" style={{ backgroundColor: '#F0F9FF', borderLeft: '5px solid #2563EB' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-start gap-3">
                <i className="bi bi-info-square-fill fs-4 text-primary"></i>
                <div>
                  <h6 className="fw-bold mb-1" style={{ color: '#0c4a6e' }}>Información de Convenio</h6>
                  <p className="text-secondary mb-2 small">
                    Estás bajo el Convenio de Construcción (Extremadura). Recuerda que mañana es festivo local.
                  </p>
                  <p className="fw-bold mb-0 small" style={{ color: '#0c4a6e' }}>
                    Días de vacaciones disponibles: <span className="text-primary">14 días</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET MÓVIL: Gestión Rápida */}
        {/* d-lg-none asegura que esto NO se vea en el ordenador, solo en el móvil */}
        <div className="col-12 d-lg-none mt-4">
          <h6 className="fw-bold mb-3">Gestión Rápida</h6>
          <div className="row g-3">
            <div className="col-6">
              <div className="card border-0 shadow-sm p-3 rounded-4 h-100">
                <div className="card-body p-2">
                  <i className="bi bi-calendar-event fs-3 text-danger mb-2 d-block"></i>
                  <span className="fw-bold small">Vacaciones</span>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card border-0 shadow-sm p-3 rounded-4 h-100">
                <div className="card-body p-2">
                  <i className="bi bi-paperclip fs-3 text-primary mb-2 d-block"></i>
                  <span className="fw-bold small">Subir Baja</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}