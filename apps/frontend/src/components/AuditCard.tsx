'use client';

interface AuditLogProps {
  id: number;
  timestamp: string;
  fechaCorta: string; 
  tipo: 'entrada' | 'modificacion' | 'error';
  titulo: string;
  detalle: {
    label: string;
    valorAntiguo?: string;
    valorNuevo: string;
  };
  actor: string;
  hash: string;
  estado: string;
}

export default function AuditCard({ data }: { data: AuditLogProps }) {
  
  const getCardStyle = () => {
    switch (data.tipo) {
      case 'modificacion':
        return 'border-warning border-2 bg-amber-500 bg-opacity-10'; 
      case 'error':
        return 'border-danger border-opacity-25 bg-red-500 bg-opacity-10'; 
      default:
        return 'border-0 shadow-sm bg-white'; 
    }
  };

  const getTitleColor = () => {
    switch (data.tipo) {
      case 'modificacion': return 'text-warning-emphasis'; 
      case 'error': return 'text-red-500';
      default: return 'text-emerald-500';
    }
  };

  return (
    <div className={`card mb-3 p-3 rounded-2xl ${getCardStyle()}`}>
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-2">
        <span className={`text-sm font-bold uppercase ${getTitleColor()}`} style={{ fontSize: '0.75rem' }}>
          {data.tipo === 'modificacion' ? 'MODIFICACIÓN MANUAL' : 
           data.tipo === 'error' ? 'INTENTO FALLIDO' : 'ENTRADA REGISTRADA'}
        </span>
        <small className="text-slate-400 font-mono">{data.fechaCorta}</small>
      </div>

      <h5 className="font-bold mb-2 text-navy">{data.titulo}</h5>

      {/* CORRECCIÓN AQUI: Usamos data.detalle.valorAntiguo en lugar de data.valorAntiguo */}
      <div className="mb-3">
        {data.detalle.valorAntiguo && (
          <span className="text-decoration-line-through text-red-500 mr-2 opacity-75">
            {data.detalle.label} {data.detalle.valorAntiguo}
          </span>
        )}
        <span className="font-bold text-navy">
           {/* También corregimos aquí la condición */}
           {data.detalle.valorAntiguo && <i className="bi bi-arrow-right-short mx-1"></i>}
           
           {!data.detalle.valorAntiguo && data.detalle.label + ' '} 
           {data.detalle.valorNuevo}
        </span>
      </div>

      <hr className="opacity-25 my-2" />

      {/* Footer */}
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-2">
            <div className={`rounded-full ${data.tipo === 'modificacion' ? 'bg-red-500' : 'bg-chrono-blue'}`} 
                 style={{ width: '10px', height: '10px' }}></div>
            <small className="font-bold text-navy">{data.actor}</small>
        </div>
        <small className="font-mono text-warning-emphasis" style={{ fontSize: '0.7rem' }}>
          Hash: {data.hash.substring(0, 10)}...
        </small>
      </div>
    </div>
  );
}