'use client';

// Definimos la estructura de datos que recibe la tarjeta
interface FichajeProps {
  fecha: string;
  diaSemana: string;
  entrada: string;
  salida: string;
  ubicacion: string;
  total: string;
  estado: 'valido' | 'modificado' | 'incidencia' | 'en_curso';
}

export default function HistoryCard({ data }: { data: FichajeProps }) {
  
  // Lógica de estilos según el estado (Basado en Frame-3movil.png)
  const getCardStyle = () => {
    switch (data.estado) {
      case 'en_curso':
        // Borde Azul para el día de hoy
        return 'border-primary border-2 shadow-sm bg-primary bg-opacity-10'; 
      case 'incidencia':
        // Fondo Rojo Claro para errores/olvidos
        return 'border-danger border-opacity-25 bg-danger bg-opacity-10'; 
      default:
        // Tarjeta blanca estándar
        return 'border-0 shadow-sm bg-white'; 
    }
  };

  const getBadgeStyle = () => {
    switch (data.estado) {
      case 'valido': return 'bg-success bg-opacity-10 text-success';
      case 'modificado': return 'bg-warning bg-opacity-10 text-warning';
      case 'incidencia': return 'bg-danger bg-opacity-25 text-danger';
      case 'en_curso': return 'bg-primary text-white';
      default: return 'bg-secondary';
    }
  };

  const getEstadoLabel = () => {
    switch (data.estado) {
      case 'valido': return 'VÁLIDO';
      case 'modificado': return 'MODIFICADO';
      case 'incidencia': return 'OLVIDO'; // Texto específico de tu diseño móvil
      case 'en_curso': return 'EN CURSO';
    }
  };

  return (
    <div className={`card mb-3 p-3 rounded-4 ${getCardStyle()}`}>
      {/* Cabecera: Fecha y Badge */}
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div>
          <h5 className="fw-bold mb-0 text-dark">{data.fecha}</h5>
          <small className="text-secondary">{data.diaSemana}</small>
        </div>
        <span className={`badge rounded-pill px-3 py-1 fw-bold ${getBadgeStyle()}`}>
          {getEstadoLabel()}
        </span>
      </div>

      {/* Cuerpo: Horas y Ubicación */}
      <div className="d-flex justify-content-between align-items-end mt-2">
        <div>
          <p className="mb-0 text-secondary" style={{ fontSize: '0.9rem' }}>
            {data.entrada} - {data.salida}
          </p>
          <small className="text-muted d-block opacity-75">{data.ubicacion}</small>
          
          {/* Mensaje de error solo si es incidencia */}
          {data.estado === 'incidencia' && (
            <small className="text-danger fw-bold d-flex align-items-center gap-1 mt-2">
              <i className="bi bi-exclamation-triangle-fill"></i> No se registró salida
            </small>
          )}
        </div>
        
        {/* Total de Horas */}
        <div className="text-end">
          <span className={`fs-3 fw-bold ${data.estado === 'incidencia' ? 'text-danger' : 'text-dark'}`}>
            {data.total}
          </span>
        </div>
      </div>
    </div>
  );
}