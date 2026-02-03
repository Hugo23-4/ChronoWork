'use client';

import Link from 'next/link';

interface AdminViewProps {
    userName?: string;
}

export default function AdminView({ userName }: AdminViewProps) {
  
  const stats = {
    activos: 42,
    total: 50,
    alertas: 5,
    retrasos: 3,
    pendientes: 8
  };

  return (
    <div className="fade-in-up pb-5">
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
            <h6 className="text-primary fw-bold text-uppercase small mb-1 tracking-wide">Visión General</h6>
            <h2 className="fw-bold text-dark mb-0">Hola, {userName || 'Admin'}</h2>
        </div>
        <div className="d-none d-lg-block">
            <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill">
                {new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}
            </span>
        </div>
      </div>

      {/* --- GRID DE ESTADÍSTICAS (2 columnas móvil / 4 escritorio) --- */}
      <div className="row row-cols-2 row-cols-lg-4 g-3 mb-4">
        
        {/* ACTIVOS */}
        <div className="col">
            <div className="card h-100 border-0 shadow-sm rounded-4 p-3 position-relative overflow-hidden bg-white">
                <h6 className="text-secondary small fw-bold mb-2">ACTIVOS</h6>
                <div className="d-flex align-items-baseline gap-1">
                    <span className="display-6 fw-bold text-dark">{stats.activos}</span>
                    <small className="text-success fw-bold">● En turno</small>
                </div>
                <div className="progress mt-2 bg-light" style={{ height: '4px' }}>
                    <div className="progress-bar bg-success" style={{ width: `${(stats.activos/stats.total)*100}%` }}></div>
                </div>
            </div>
        </div>

        {/* ALERTAS */}
        <div className="col">
            <div className="card h-100 border-0 shadow-sm rounded-4 p-3 bg-danger bg-opacity-10">
                <h6 className="text-danger small fw-bold mb-2">ALERTAS</h6>
                <div className="d-flex align-items-baseline gap-1">
                    <span className="display-6 fw-bold text-danger">{stats.alertas}</span>
                </div>
                <small className="text-danger fw-bold">Requieren acción</small>
            </div>
        </div>

        {/* RETRASOS */}
        <div className="col">
            <div className="card h-100 border-0 shadow-sm rounded-4 p-3 bg-white">
                <h6 className="text-secondary small fw-bold mb-2">RETRASOS</h6>
                <div className="d-flex align-items-baseline gap-1">
                    <span className="display-6 fw-bold text-warning">{stats.retrasos}</span>
                </div>
                <small className="text-muted">Empleados tarde</small>
            </div>
        </div>

        {/* PENDIENTES */}
        <div className="col">
            <div className="card h-100 border-0 shadow-sm rounded-4 p-3 bg-dark text-white">
                <h6 className="text-white-50 small fw-bold mb-2">SOLICITUDES</h6>
                <div className="d-flex align-items-baseline gap-1">
                    <span className="display-6 fw-bold">{stats.pendientes}</span>
                </div>
                <Link href="/dashboard/solicitudes" className="text-white small text-decoration-underline stretched-link opacity-75 hover-opacity-100">
                    Revisar &rarr;
                </Link>
            </div>
        </div>
      </div>

      {/* --- MAPA Y ACTIVIDAD --- */}
      <div className="row g-4">
        
        {/* MAPA */}
        <div className="col-12 col-lg-8">
            <h5 className="fw-bold mb-3">Ubicación de Personal</h5>
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative" style={{ height: '280px', backgroundColor: '#e9ecef' }}>
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                    <i className="bi bi-map-fill fs-1 opacity-25 mb-2"></i>
                    <small className="fw-bold opacity-50">Mapa en tiempo real</small>
                </div>
                {/* Botón flotante simulado como en tu diseño */}
                <div className="position-absolute bottom-0 end-0 m-3">
                    <button className="btn btn-white shadow-sm rounded-circle p-2" style={{width: 40, height: 40}}>
                        <i className="bi bi-arrows-angle-expand"></i>
                    </button>
                </div>
            </div>
        </div>

        {/* ACTIVIDAD */}
        <div className="col-12 col-lg-4">
             <h5 className="fw-bold mb-3">Actividad Reciente</h5>
             <div className="d-flex flex-column gap-3">
                
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                    <div className="d-flex gap-3">
                        <div className="mt-2">
                            <span className="d-block rounded-circle bg-danger animate__animated animate__pulse animate__infinite" style={{width: '10px', height: '10px'}}></span>
                        </div>
                        <div>
                            <h6 className="fw-bold mb-0 text-dark">Posible Fraude GPS</h6>
                            <p className="text-muted small mb-0">Empleado #884 - Ubicación sospechosa</p>
                            <small className="text-secondary opacity-75" style={{fontSize: '11px'}}>Hace 5m</small>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                    <div className="d-flex gap-3">
                        <div className="mt-2">
                            <span className="d-block rounded-circle bg-primary" style={{width: '10px', height: '10px'}}></span>
                        </div>
                        <div>
                            <h6 className="fw-bold mb-0 text-dark">Solicitud Recibida</h6>
                            <p className="text-muted small mb-0">Hugo Pérez: Vacaciones (5 días)</p>
                            <small className="text-secondary opacity-75" style={{fontSize: '11px'}}>Hace 1h</small>
                        </div>
                    </div>
                </div>

             </div>
        </div>

      </div>

    </div>
  );
}