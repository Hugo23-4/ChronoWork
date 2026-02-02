'use client';

// Definimos la interfaz exacta de lo que le vamos a pasar desde la página
interface HistoryCardProps {
  date: string;       // "Lun, 26 Oct"
  fullDate: string;   // "2026-10-26" (para orden o key)
  entryTime: string;  // "08:00"
  exitTime: string;   // "16:00" o "--:--"
  location: string;   // "Mérida"
  duration: string;   // "8h 00m"
  status: 'valid' | 'progress' | 'incident'; // Estados lógicos
}

export default function HistoryCard({ data }: { data: HistoryCardProps }) {
  
  // 1. Estilos Dinámicos según el Estado
  const getStyles = () => {
    switch (data.status) {
      case 'progress': // HOY (En curso) -> Azul
        return {
          card: 'border-primary border-2 shadow-sm bg-primary bg-opacity-10',
          badge: 'bg-primary text-white',
          text: 'EN CURSO'
        };
      case 'incident': // ERROR (Olvido) -> Rojo
        return {
          card: 'border-danger border-opacity-25 bg-danger bg-opacity-10',
          badge: 'bg-danger bg-opacity-10 text-danger',
          text: 'OLVIDO'
        };
      default: // VÁLIDO -> Blanco/Verde
        return {
          card: 'border-0 shadow-sm bg-white',
          badge: 'bg-success bg-opacity-10 text-success',
          text: 'VÁLIDO'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`card mb-3 p-3 rounded-4 ${styles.card}`}>
      {/* Cabecera: Título y Badge */}
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div>
          {/* Si es hoy, ponemos "Hoy", si no la fecha */}
          <h5 className="fw-bold mb-0 text-dark">
            {new Date(data.fullDate).toDateString() === new Date().toDateString() ? 'Hoy' : 
             new Date(data.fullDate).getDate() === new Date().getDate() - 1 ? 'Ayer' : 
             data.date.split(',')[0]} {/* Ej: "Jueves" */}
          </h5>
          <small className="text-secondary">{data.date}</small>
        </div>
        <span className={`badge rounded-pill px-3 py-1 fw-bold ${styles.badge}`}>
          {styles.text}
        </span>
      </div>

      {/* Cuerpo: Horas y Ubicación */}
      <div className="d-flex justify-content-between align-items-end mt-2">
        <div>
          <p className="mb-0 text-secondary" style={{ fontSize: '0.9rem' }}>
            Entrada: {data.entryTime} • {data.location}
          </p>
          
          {/* Mensaje de error solo si es incidencia */}
          {data.status === 'incident' && (
            <small className="text-danger fw-bold d-flex align-items-center gap-1 mt-2">
              <i className="bi bi-exclamation-triangle-fill"></i> No se registró salida
            </small>
          )}
        </div>
        
        {/* Total de Horas */}
        <div className="text-end">
          <span className={`fs-3 fw-bold ${data.status === 'incident' ? 'text-danger' : 'text-dark'}`}>
            {data.duration}
          </span>
        </div>
      </div>
    </div>
  );
}