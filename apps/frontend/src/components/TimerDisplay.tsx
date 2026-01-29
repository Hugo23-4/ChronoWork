'use client';

import { useState, useEffect } from 'react';

export default function TimerDisplay() {
  const [isWorking, setIsWorking] = useState(true); // Estado simulado
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
      <div className="card-body d-flex flex-column justify-content-center align-items-center text-center p-4 p-lg-5">
        
        {/* Badge de Estado (Verde = Activo) */}
        <span className={`badge rounded-pill px-3 py-2 mb-3 d-flex align-items-center gap-2
          ${isWorking ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
          <i className="bi bi-circle-fill small"></i>
          {isWorking ? 'JORNADA ACTIVA' : 'JORNADA PAUSADA'}
        </span>

        {/* Cronómetro Gigante */}
        <h2 className="display-1 fw-bold mb-2 text-dark" style={{ letterSpacing: '-2px', fontVariantNumeric: 'tabular-nums' }}>
          {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </h2>
        
        <p className="text-secondary mb-5 fw-medium">
          Inicio registrado: 08:00 AM • Sede Central
        </p>

        {/* Botón de Acción Responsive */}
        <button 
          className={`btn btn-lg w-100 py-3 fw-bold rounded-3 shadow-sm transition-all
            ${isWorking ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => setIsWorking(!isWorking)}
        >
          {isWorking ? 'FINALIZAR TURNO' : 'REGISTRAR ENTRADA'}
        </button>

        {/* Ubicación (Solo visible en móvil) */}
        <div className="mt-4 d-lg-none">
          <small className="text-muted opacity-75">Ubicación detectada: Madrid HQ</small>
        </div>
      </div>
    </div>
  );
}