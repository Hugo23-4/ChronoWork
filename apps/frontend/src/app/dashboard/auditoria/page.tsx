'use client';

import AuditCard from '@/components/AuditCard';

export default function AuditoriaPage() {
  
  // Datos Mock basados en Frame-1.png (Desktop) y Frame-4.png (Móvil)
  const auditLogs = [
    {
      id: 1,
      timestamp: '2026-10-26 08:00:05',
      fechaCorta: '26 Oct • 08:00',
      tipo: 'entrada' as const,
      titulo: 'Hugo Pérez',
      detalle: { label: 'Loc:', valorNuevo: '38.91, -6.34 (Valid)' },
      actor: 'Hugo Pérez',
      hash: '0x7f8a...9c21',
      estado: 'VERIFICADO'
    },
    {
      id: 2,
      timestamp: '2026-10-25 19:42:10',
      fechaCorta: '25 Oct • 19:42',
      tipo: 'modificacion' as const,
      titulo: 'Corrección de Hora',
      detalle: { label: 'Salida:', valorAntiguo: '--:--', valorNuevo: '16:00' },
      actor: 'Admin (RRHH)',
      hash: '0x3b1d...a8f4',
      estado: 'INTERVENIDO'
    },
    {
      id: 3,
      timestamp: '2026-10-25 08:05:00',
      fechaCorta: '25 Oct • 08:05',
      tipo: 'error' as const,
      titulo: 'Ana Martínez',
      detalle: { label: 'Error:', valorNuevo: 'Fuera de rango (5km)' },
      actor: 'Ana Martínez',
      hash: '0xe2a1...00f1',
      estado: 'RECHAZADO'
    }
  ];

  return (
    <div className="fade-in-up pb-5">
      
      {/* BANNER DE SEGURIDAD */}
      <div className="alert alert-warning border-warning border-opacity-25 d-flex align-items-center gap-3 shadow-sm rounded-3 mb-4" role="alert">
        <i className="bi bi-lock-fill fs-4"></i>
        <div>
            <strong className="d-block text-uppercase small" style={{ letterSpacing: '1px' }}>Modo Auditoría: Solo Lectura</strong>
            <small className="opacity-75">Los datos mostrados provienen del log inmutable. No pueden ser modificados.</small>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">Registro de Integridad</h2>
        <button className="btn btn-outline-dark d-none d-md-block">
            <i className="bi bi-shield-check me-2"></i> Verificar Firmas
        </button>
      </div>

      {/* VISTA ESCRITORIO: TABLA HASH */}
      <div className="d-none d-md-block card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr className="text-secondary small text-uppercase font-monospace" style={{ fontSize: '0.75rem' }}>
                <th className="py-3 ps-4">Timestamp (UTC)</th>
                <th>Acción / Evento</th>
                <th>Actor</th>
                <th>Integridad (Hash)</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className={log.tipo === 'modificacion' ? 'bg-warning bg-opacity-10' : ''}>
                  <td className="ps-4 font-monospace text-secondary small">{log.timestamp}</td>
                  <td>
                    <div className="fw-bold text-dark">{log.titulo}</div>
                    <small className="text-secondary d-block">
                        {log.detalle.valorAntiguo && (
                            <span className="text-decoration-line-through text-danger me-2">
                                {log.detalle.label} {log.detalle.valorAntiguo}
                            </span>
                        )}
                        <span>
                            {log.detalle.valorAntiguo && <i className="bi bi-arrow-right-short"></i>}
                            {!log.detalle.valorAntiguo && log.detalle.label} {log.detalle.valorNuevo}
                        </span>
                    </small>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                        <span className={`badge rounded-circle p-1 ${log.actor.includes('Admin') ? 'bg-danger' : 'bg-primary'}`}> </span>
                        {log.actor}
                    </div>
                  </td>
                  <td className="font-monospace small text-muted">
                    {log.hash}
                    {/* Barra de progreso visual debajo del hash como en el diseño */}
                    <div className="progress mt-1" style={{ height: '2px' }}>
                        <div className={`progress-bar ${log.tipo === 'entrada' ? 'bg-success' : 'bg-warning'}`} style={{ width: '40%' }}></div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge rounded-pill px-3 py-1 text-uppercase small fw-bold 
                        ${log.tipo === 'entrada' ? 'bg-success bg-opacity-10 text-success' : 
                          log.tipo === 'modificacion' ? 'bg-warning bg-opacity-25 text-warning-emphasis' : 
                          'bg-danger bg-opacity-10 text-danger'}`}>
                      {log.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VISTA MÓVIL: TARJETAS LOG */}
      <div className="d-md-none mt-3">
        <h6 className="text-secondary text-uppercase mb-3 px-1 small fw-bold">Últimos Movimientos</h6>
        {auditLogs.map((log) => (
          <AuditCard key={log.id} data={log} />
        ))}
      </div>

    </div>
  );
}