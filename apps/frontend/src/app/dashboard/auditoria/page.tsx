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
    <div className="fade-in-up pb-6">
      
      {/* BANNER DE SEGURIDAD */}
      <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 text-sm border-warning border-opacity-25 flex items-center gap-3 shadow-sm rounded-lg mb-4" role="alert">
        <i className="bi bi-lock-fill text-xl"></i>
        <div>
            <strong className="block uppercase text-sm" style={{ letterSpacing: '1px' }}>Modo Auditoría: Solo Lectura</strong>
            <small className="opacity-75">Los datos mostrados provienen del log inmutable. No pueden ser modificados.</small>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold mb-0 text-navy">Registro de Integridad</h2>
        <button className="btn btn-outline-dark hidden md:block">
            <i className="bi bi-shield-check mr-2"></i> Verificar Firmas
        </button>
      </div>

      {/* VISTA ESCRITORIO: TABLA HASH */}
      <div className="hidden md:block card shadow-sm border-0 rounded-2xl overflow-hidden">
        <div className="table-responsive">
          <table className="w-full table-hover align-middle mb-0">
            <thead className="bg-gray-50">
              <tr className="text-slate-500 text-sm uppercase font-mono" style={{ fontSize: '0.75rem' }}>
                <th className="py-3 ps-4">Timestamp (UTC)</th>
                <th>Acción / Evento</th>
                <th>Actor</th>
                <th>Integridad (Hash)</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className={log.tipo === 'modificacion' ? 'bg-amber-500 bg-opacity-10' : ''}>
                  <td className="ps-4 font-mono text-slate-500 text-sm">{log.timestamp}</td>
                  <td>
                    <div className="font-bold text-navy">{log.titulo}</div>
                    <small className="text-slate-500 block">
                        {log.detalle.valorAntiguo && (
                            <span className="text-decoration-line-through text-red-500 mr-2">
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
                    <div className="flex items-center gap-2">
                        <span className={`badge rounded-full p-1 ${log.actor.includes('Admin') ? 'bg-red-500' : 'bg-chrono-blue'}`}> </span>
                        {log.actor}
                    </div>
                  </td>
                  <td className="font-mono text-sm text-slate-400">
                    {log.hash}
                    {/* Barra de progreso visual debajo del hash como en el diseño */}
                    <div className="progress mt-1" style={{ height: '2px' }}>
                        <div className={`h-full ${log.tipo === 'entrada' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: '40%' }}></div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge rounded-full px-3 py-1 uppercase text-sm font-bold 
                        ${log.tipo === 'entrada' ? 'bg-emerald-500 bg-opacity-10 text-emerald-500' : 
                          log.tipo === 'modificacion' ? 'bg-amber-500 bg-opacity-25 text-warning-emphasis' : 
                          'bg-red-500 bg-opacity-10 text-red-500'}`}>
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
        <h6 className="text-slate-500 uppercase mb-3 px-1 text-sm font-bold">Últimos Movimientos</h6>
        {auditLogs.map((log) => (
          <AuditCard key={log.id} data={log} />
        ))}
      </div>

    </div>
  );
}