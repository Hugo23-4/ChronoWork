'use client';

import { useState } from 'react';

export default function CentrosTrabajoPage() {
  // Estado para simular la interactividad del radio (Geovalla)
  const [radius, setRadius] = useState(150); // Valor inicial en metros (simulado en px)
  const [activeCenter, setActiveCenter] = useState(1);

  // Datos simulados de las obras
  const centros = [
    { id: 1, nombre: 'Obra Residencial Norte', direccion: 'Av. de la Libertad, 45, Mérida', radio: 150, empleados: 12, tipo: 'obra' },
    { id: 2, nombre: 'Sede Central LOOM', direccion: 'Polígono Industrial El Prado', radio: 50, empleados: 45, tipo: 'oficina' },
    { id: 3, nombre: 'Almacén Logístico', direccion: 'Ctra. Madrid km 300', radio: 200, empleados: 5, tipo: 'almacen' },
  ];

  return (
    <div className="fade-in-up pb-5">
      
      {/* HEADER ADMIN */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
           <h6 className="text-primary fw-bold text-uppercase small mb-1">Administración</h6>
           <h2 className="fw-bold text-dark mb-0">Configuración de Geofencing</h2>
        </div>
        <button className="btn btn-dark d-flex align-items-center gap-2 rounded-3 px-4">
            <i className="bi bi-plus-lg"></i> <span className="d-none d-md-inline">Nuevo Centro</span>
        </button>
      </div>

      <div className="row g-4 h-100">
        
        {/* COLUMNA IZQUIERDA: LISTADO (Desktop) / ABAJO (Móvil) */}
        <div className="col-lg-4 order-2 order-lg-1">
          <div className="d-flex justify-content-between align-items-center mb-3">
             <small className="text-secondary fw-bold">CENTROS ACTIVOS ({centros.length})</small>
          </div>
          
          <div className="d-grid gap-3">
            {centros.map((centro) => (
              <div 
                key={centro.id} 
                className={`card p-3 cursor-pointer transition-all ${activeCenter === centro.id ? 'border-primary border-2 shadow-sm bg-primary bg-opacity-10' : 'border-0 shadow-sm hover-shadow'}`}
                onClick={() => { setActiveCenter(centro.id); setRadius(centro.radio); }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${activeCenter === centro.id ? 'bg-primary text-white' : 'bg-light text-secondary'}`} 
                       style={{ width: '48px', height: '48px' }}>
                    <i className={`bi ${centro.tipo === 'obra' ? 'bi-geo-alt-fill' : 'bi-building-fill'} fs-5`}></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1 text-dark">{centro.nombre}</h6>
                    <small className="text-muted d-block mb-2">{centro.direccion}</small>
                    <div className="d-flex gap-3 small">
                        <span className="badge bg-white text-dark border">Radio: {centro.radio}m</span>
                        <span className="text-secondary"><i className="bi bi-people-fill me-1"></i> {centro.empleados}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: MAPA SIMULADO */}
        <div className="col-lg-8 order-1 order-lg-2">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative" style={{ height: '600px' }}>
            
            {/* 1. EL MAPA (Fondo Simulado) */}
            <div className="w-100 h-100 position-relative bg-light" 
                 style={{ 
                   backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)', 
                   backgroundSize: '40px 40px' 
                 }}>
              
              {/* Calles simuladas (divs blancos rotados) */}
              <div className="position-absolute bg-white shadow-sm" style={{ top: '-10%', left: '30%', width: '40px', height: '120%', transform: 'rotate(15deg)' }}></div>
              <div className="position-absolute bg-white shadow-sm" style={{ top: '40%', left: '-10%', width: '120%', height: '30px', transform: 'rotate(-5deg)' }}></div>

              {/* 2. LA GEOVALLA (Círculo Azul Interactivo) */}
              <div className="position-absolute top-50 start-50 translate-middle rounded-circle border border-primary border-2 bg-primary transition-all d-flex align-items-center justify-content-center"
                   style={{ 
                     width: `${radius * 2}px`, // El tamaño reacciona al slider
                     height: `${radius * 2}px`, 
                     backgroundColor: 'rgba(37, 99, 235, 0.2)', // Azul semitransparente
                     boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.1)'
                   }}>
                 {/* Pin Central */}
                 <div className="bg-primary border border-white border-2 rounded-circle shadow" style={{ width: '16px', height: '16px' }}></div>
                 
                 {/* Etiqueta flotante del radio */}
                 <div className="position-absolute top-0 start-50 translate-middle-x mt-n4 badge bg-primary">
                    {radius} metros
                 </div>
              </div>
            </div>

            {/* 3. TARJETA FLOTANTE DE EDICIÓN (Solo Desktop) */}
            <div className="d-none d-lg-block position-absolute top-0 end-0 m-4 card p-3 shadow border-0" style={{ width: '300px' }}>
                <h6 className="fw-bold mb-3">Editar Geovalla</h6>
                
                <label className="form-label small fw-bold text-secondary">RADIO (METROS)</label>
                <input 
                  type="range" 
                  className="form-range" 
                  min="50" max="300" step="10" 
                  value={radius} 
                  onChange={(e) => setRadius(Number(e.target.value))} 
                />
                <div className="d-flex justify-content-between small text-muted mb-3">
                    <span>50m</span>
                    <span className="fw-bold text-primary">{radius}m</span>
                    <span>300m</span>
                </div>

                <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">COORDENADAS</label>
                    <input type="text" className="form-control font-monospace small bg-light" value="Lat: 38.9184 | Lon: -6.3431" readOnly />
                </div>

                <button className="btn btn-primary w-100 fw-bold btn-sm">Guardar Cambios</button>
            </div>

            {/* 4. BOTÓN FLOTANTE MÓVIL */}
            <div className="d-lg-none position-absolute bottom-0 start-50 translate-middle-x mb-4">
                <button className="btn btn-dark rounded-pill px-4 py-2 shadow-lg fw-bold d-flex align-items-center gap-2">
                    <i className="bi bi-crosshair"></i> Usar mi ubicación
                </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}