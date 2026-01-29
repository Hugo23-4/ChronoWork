'use client';

import HistoryCard from '@/components/HistoryCard';

export default function FichajesPage() {
  // Datos simulados IDÉNTICOS a tus capturas (Frame-3 y Frame-3movil)
  const fichajes = [
    { 
      id: 1, 
      fecha: 'Hoy', diaSemana: 'Lun, 26 Oct', 
      entrada: '08:00', salida: '...', ubicacion: 'Mérida - Obra A', 
      total: '6h 42m', estado: 'en_curso' as const 
    },
    { 
      id: 2, 
      fecha: 'Ayer', diaSemana: 'Dom, 25 Oct', 
      entrada: '08:00', salida: '16:00', ubicacion: 'Mérida', 
      total: '8h 00m', estado: 'valido' as const 
    },
    { 
      id: 3, 
      fecha: 'Jueves', diaSemana: '22 Oct', 
      entrada: '08:00', salida: '--:--', ubicacion: 'Mérida - Obra A', 
      total: '--h --m', estado: 'incidencia' as const 
    },
    { 
      id: 4, 
      fecha: 'Viernes', diaSemana: '23 Oct', 
      entrada: '08:15', salida: '16:15', ubicacion: 'Badajoz - Sede', 
      total: '8h 00m', estado: 'modificado' as const 
    }
  ];

  // Función auxiliar para estilos de badges en la tabla (Escritorio)
  const getBadgeClassTable = (estado: string) => {
    switch (estado) {
      case 'valido': return 'bg-success bg-opacity-10 text-success';
      case 'modificado': return 'bg-warning bg-opacity-10 text-warning';
      case 'incidencia': return 'bg-danger bg-opacity-10 text-danger';
      case 'en_curso': return 'bg-white border border-primary text-primary'; // Estilo sutil para tabla
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="fade-in-up pb-5">
      
      {/* 1. HEADER COMPARTIDO */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <h2 className="fw-bold mb-0 text-dark">
          <span className="d-none d-md-inline">Historial de Jornada</span>
          <span className="d-md-none">Mis Fichajes</span> {/* Título cambia en móvil */}
        </h2>
        
        <div className="d-flex gap-2 w-100 w-md-auto">
            {/* Select de Mes */}
            <select className="form-select fw-bold border-0 shadow-sm rounded-pill px-4" style={{ width: 'auto', minWidth: '180px' }}>
                <option>📅 Octubre 2026</option>
                <option>Septiembre 2026</option>
            </select>
            
            {/* Botón Descargar (Solo visible en Desktop) */}
            <button className="btn btn-outline-primary fw-bold rounded-pill px-4 d-none d-md-block">
                <i className="bi bi-download me-2"></i> Descargar PDF
            </button>
        </div>
      </div>

      {/* 2. VISTA ESCRITORIO: TABLA (Visible md+) */}
      <div className="d-none d-md-block card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light border-bottom">
              <tr className="text-secondary small text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                <th className="py-4 ps-4 border-0">Fecha</th>
                <th className="py-4 border-0">Entrada</th>
                <th className="py-4 border-0">Salida</th>
                <th className="py-4 border-0">Ubicación</th>
                <th className="py-4 border-0">Total</th>
                <th className="py-4 border-0">Estado</th>
              </tr>
            </thead>
            <tbody>
              {fichajes.map((f) => (
                <tr key={f.id} style={{ height: '70px' }}>
                  <td className="ps-4 fw-bold text-dark">{f.diaSemana}</td>
                  <td className="text-secondary">{f.entrada}</td>
                  <td className={f.salida === '--:--' ? 'text-danger fw-bold' : 'text-secondary'}>{f.salida}</td>
                  <td className="text-secondary">{f.ubicacion}</td>
                  <td className={`fw-bold ${f.estado === 'incidencia' ? 'text-danger' : 'text-dark'}`}>{f.total}</td>
                  <td>
                    <span className={`badge rounded-pill px-3 py-2 ${getBadgeClassTable(f.estado)}`}>
                      {f.estado === 'incidencia' ? 'INCIDENCIA' : f.estado.toUpperCase().replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. VISTA MÓVIL: TARJETAS (Visible solo en sm/xs) */}
      <div className="d-md-none">
        <div className="d-flex justify-content-end mb-3 px-1">
             <small className="text-secondary fw-bold">Total horas: 142h</small>
        </div>
        {fichajes.map((f) => (
          <HistoryCard key={f.id} data={f} />
        ))}
      </div>
      
    </div>
  );
}