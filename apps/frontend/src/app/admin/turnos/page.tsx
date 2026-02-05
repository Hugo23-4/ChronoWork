'use client';

export default function TurnosPage() {
    return (
        <div className="fade-in-up pb-5">

            {/* HEADER */}
            <div className="mb-4">
                <h6 className="text-primary fw-bold text-uppercase small mb-1 tracking-wide">Gestión</h6>
                <h2 className="fw-bold text-dark mb-0">Turnos y Horarios</h2>
                <p className="text-secondary mt-2">Configura los horarios de trabajo de tu equipo.</p>
            </div>

            {/* PLACEHOLDER CONTENT */}
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                <div className="py-5">
                    <div className="mb-4">
                        <i className="bi bi-calendar3 display-1 text-muted opacity-25"></i>
                    </div>
                    <h4 className="fw-bold text-dark mb-2">Próximamente</h4>
                    <p className="text-secondary mb-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
                        Esta sección te permitirá crear y gestionar turnos de trabajo,
                        asignar horarios a empleados y visualizar el calendario del equipo.
                    </p>
                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                        <div className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                            <i className="bi bi-clock me-1"></i> Gestión de Turnos
                        </div>
                        <div className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                            <i className="bi bi-calendar-week me-1"></i> Calendario
                        </div>
                        <div className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                            <i className="bi bi-people me-1"></i> Asignaciones
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
