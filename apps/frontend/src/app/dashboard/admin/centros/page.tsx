'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

// Importamos el mapa dinámicamente
const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="d-flex flex-column align-items-center justify-content-center h-100 bg-light text-muted rounded-4">
      <div className="spinner-border text-primary mb-2" role="status"></div>
      <small>Cargando Mapa...</small>
    </div>
  )
});

export default function CentrosTrabajoPage() {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sedes, setSedes] = useState<any[]>([]);
  const [showMobileMap, setShowMobileMap] = useState(false); // Controla la vista en móvil
  const [successMsg, setSuccessMsg] = useState(''); // Mensaje de éxito bonito

  // Estado del formulario
  const [formData, setFormData] = useState({
    id: null,
    nombre: '',
    direccion: '',
    lat: 40.4168,
    lng: -3.7038,
    radio: 100
  });

  // Cargar datos al iniciar
  useEffect(() => {
    fetchSedes();
  }, []);

  const fetchSedes = async () => {
    const { data } = await supabase.from('sedes').select('*').order('created_at', { ascending: false });
    if (data) setSedes(data);
    setLoading(false);
  };

  // --- MANEJADORES ---

  const handleNew = () => {
    setFormData({ id: null, nombre: '', direccion: '', lat: 40.4168, lng: -3.7038, radio: 100 });
    setSuccessMsg('');
    setShowMobileMap(true); // Cambiar a vista de mapa (móvil)
  };

  const handleEdit = (centro: any) => {
    setFormData({ 
        id: centro.id,
        nombre: centro.nombre, 
        direccion: centro.direccion || '', 
        lat: centro.latitud, 
        lng: centro.longitud, 
        radio: centro.radio_metros 
    });
    setSuccessMsg('');
    setShowMobileMap(true);
  };

  const handleSave = async () => {
    if (!formData.nombre) return alert("Por favor, ponle un nombre al centro.");
    
    setSaving(true);
    const payload = {
        nombre: formData.nombre,
        direccion: formData.direccion,
        latitud: formData.lat,
        longitud: formData.lng,
        radio_metros: formData.radio
    };

    let error;
    if (formData.id) {
        const { error: updateError } = await supabase.from('sedes').update(payload).eq('id', formData.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('sedes').insert(payload);
        error = insertError;
    }

    setSaving(false);

    if (error) {
        alert('Error: ' + error.message);
    } else {
        // Mostrar mensaje de éxito temporal
        setSuccessMsg(formData.id ? 'Cambios guardados correctamente' : 'Sede creada con éxito');
        fetchSedes();
        
        // Si es móvil, esperamos un poco y volvemos a la lista
        if (window.innerWidth < 992) {
             setTimeout(() => setShowMobileMap(false), 1500);
        } else if (!formData.id) {
             // Si es desktop y es nuevo, limpiamos formulario
             setFormData({ ...formData, nombre: '', direccion: '' });
        }
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Seguro que quieres eliminar este centro?')) return;
    await supabase.from('sedes').delete().eq('id', id);
    fetchSedes();
    // Si borramos el que estábamos editando, limpiamos el form
    if (formData.id === id) handleNew();
  };

  return (
    <div className="fade-in-up pb-5 h-100 d-flex flex-column">
      
      {/* --- HEADER SUPERIOR --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
           {/* Botón Volver (Solo Móvil cuando estás en el mapa) */}
           {showMobileMap && (
             <button 
                onClick={() => setShowMobileMap(false)} 
                className="btn btn-link text-dark p-0 text-decoration-none d-lg-none mb-2 fw-bold"
             >
                <i className="bi bi-chevron-left me-1"></i> Volver
             </button>
           )}
           
           <h6 className="text-primary fw-bold text-uppercase small mb-1 tracking-wide">
              Administración
           </h6>
           <h2 className="fw-bold text-dark mb-0">
               {showMobileMap ? (formData.id ? 'Editar Ubicación' : 'Nueva Ubicación') : 'Centros de Trabajo'}
           </h2>
           
           {/* Subtítulo solo en lista */}
           {!showMobileMap && (
               <p className="text-secondary mb-0 d-none d-lg-block mt-1">
                   Configura las zonas GPS permitidas para el fichaje.
               </p>
           )}
        </div>

        {/* Botón Nuevo (Desktop) */}
        <button 
            onClick={handleNew} 
            className="d-none d-lg-flex btn btn-dark rounded-pill px-4 fw-bold shadow-sm align-items-center gap-2 hover-scale"
        >
            <i className="bi bi-plus-lg"></i> Nuevo Centro
        </button>
      </div>

      <div className="row g-4 flex-grow-1">
        
        {/* =============================================
            COLUMNA IZQUIERDA: LISTA DE CENTROS
            (Oculta en móvil si estamos editando)
            =============================================
        */}
        <div className={`col-lg-4 order-2 order-lg-1 ${showMobileMap ? 'd-none d-lg-block' : 'd-block'}`}>
          
          <div className="d-flex justify-content-between align-items-center mb-3">
             <small className="text-secondary fw-bold bg-white px-2 py-1 rounded border">
                 {sedes.length} ACTIVOS
             </small>
          </div>
          
          <div className="d-grid gap-3 pb-5">
            {loading ? (
                // Skeleton Loader Sencillo
                [1,2,3].map(i => (
                    <div key={i} className="card border-0 shadow-sm p-3 rounded-4">
                        <div className="d-flex gap-3">
                            <div className="bg-light rounded-circle" style={{width: 40, height: 40}}></div>
                            <div className="flex-grow-1">
                                <div className="bg-light rounded w-50 mb-2" style={{height: 10}}></div>
                                <div className="bg-light rounded w-75" style={{height: 10}}></div>
                            </div>
                        </div>
                    </div>
                ))
            ) : sedes.length === 0 ? (
                <div className="text-center py-5">
                    <div className="mb-3 text-muted opacity-50">
                        <i className="bi bi-geo-alt fs-1"></i>
                    </div>
                    <h6 className="fw-bold">No hay centros creados</h6>
                    <p className="small text-secondary">Crea el primero para empezar.</p>
                </div>
            ) : (
                sedes.map((centro) => (
                  <div 
                    key={centro.id} 
                    className={`
                        card p-3 border-0 shadow-sm rounded-4 cursor-pointer position-relative overflow-hidden transition-all
                        ${formData.id === centro.id ? 'ring-2 ring-primary bg-light' : 'bg-white hover-shadow-lg hover-scale'}
                    `}
                    onClick={() => handleEdit(centro)}
                    style={{ transform: 'scale(1)', transition: '0.2s' }}
                  >
                    {/* Indicador lateral de selección */}
                    {formData.id === centro.id && (
                        <div className="position-absolute start-0 top-0 bottom-0 bg-primary" style={{width: '4px'}}></div>
                    )}

                    <div className="d-flex align-items-start gap-3">
                      <div className={`
                          rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm
                          ${formData.id === centro.id ? 'bg-primary text-white' : 'bg-white text-primary border'}
                      `} style={{ width: '48px', height: '48px' }}>
                        <i className="bi bi-building-fill fs-5"></i>
                      </div>
                      
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between align-items-start">
                            <h6 className="fw-bold mb-1 text-dark text-truncate pe-2">{centro.nombre}</h6>
                            <button 
                                onClick={(e) => handleDelete(centro.id, e)} 
                                className="btn btn-sm btn-light text-danger rounded-circle p-0 d-flex align-items-center justify-content-center"
                                style={{width: 30, height: 30}}
                                title="Eliminar"
                            >
                                <i className="bi bi-trash"></i>
                            </button>
                        </div>
                        <div className="d-flex align-items-center text-secondary small mb-2">
                            <i className="bi bi-pin-map me-1"></i>
                            <span className="text-truncate">{centro.direccion || 'Ubicación GPS'}</span>
                        </div>
                        <span className="badge bg-light text-dark border fw-normal rounded-pill px-3">
                            Radio: <strong>{centro.radio_metros}m</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* BOTÓN FLOTANTE (FAB) SOLO MÓVIL */}
          <button 
            onClick={handleNew}
            className="d-lg-none btn btn-primary position-fixed bottom-0 end-0 m-4 rounded-circle shadow-lg d-flex align-items-center justify-content-center text-white"
            style={{ width: '60px', height: '60px', zIndex: 1050 }}
          >
            <i className="bi bi-plus-lg fs-2"></i>
          </button>
        </div>

        {/* =============================================
            COLUMNA DERECHA: MAPA Y FORMULARIO
            (Visible en móvil solo si 'showMobileMap' es true)
            =============================================
        */}
        <div className={`col-lg-8 order-1 order-lg-2 h-100 ${!showMobileMap ? 'd-none d-lg-block' : 'd-block'}`}>
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative h-100 d-flex flex-column">
            
            {/* MAPA */}
            <div className="flex-grow-1 position-relative" style={{ minHeight: '300px' }}>
                <LocationPicker 
                    lat={formData.lat}
                    lng={formData.lng}
                    radio={formData.radio}
                    onLocationSelect={(lat, lng) => setFormData({...formData, lat, lng})}
                />
            </div>

            {/* FORMULARIO FLOTANTE (Desktop) o PANEL INFERIOR (Móvil) */}
            <div className={`
                bg-white p-4 
                d-lg-position-absolute position-relative 
                top-0 end-0 m-0 m-lg-4 
                rounded-0 rounded-lg-4 
                shadow-none shadow-lg
                border-top border-lg-0
            `} 
            style={{ width: '100%', maxWidth: '340px', zIndex: 1000 }}>
                
                {/* Mensaje de Éxito */}
                {successMsg && (
                    <div className="alert alert-success border-0 bg-success bg-opacity-10 py-2 small fw-bold mb-3 d-flex align-items-center animate__animated animate__fadeIn">
                        <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
                    </div>
                )}

                <h6 className="fw-bold mb-3 text-primary d-none d-lg-block border-bottom pb-2">
                    {formData.id ? '✏️ Editar Sede' : '✨ Nueva Sede'}
                </h6>
                
                <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary mb-1">NOMBRE DEL CENTRO</label>
                    <input 
                        type="text" 
                        className="form-control bg-light border-0 fw-bold" 
                        placeholder="Ej: Oficina Central"
                        value={formData.nombre}
                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary mb-1">DIRECCIÓN (OPCIONAL)</label>
                    <input 
                        type="text" 
                        className="form-control bg-light border-0" 
                        placeholder="Calle, número..."
                        value={formData.direccion}
                        onChange={e => setFormData({...formData, direccion: e.target.value})}
                    />
                </div>
                
                <div className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                        <label className="form-label small fw-bold text-secondary">RADIO DE FICHAJE</label>
                        <span className="badge bg-primary rounded-pill">{formData.radio}m</span>
                    </div>
                    <input 
                        type="range" className="form-range" 
                        min="20" max="500" step="10" 
                        value={formData.radio} 
                        onChange={(e) => setFormData({...formData, radio: Number(e.target.value)})} 
                    />
                    <div className="d-flex justify-content-between small text-muted px-1" style={{fontSize: '0.65rem'}}>
                        <span>Estricto (20m)</span>
                        <span>Amplio (500m)</span>
                    </div>
                </div>

                <div className="d-grid gap-2">
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="btn btn-dark w-100 fw-bold rounded-pill py-2 shadow-sm d-flex justify-content-center align-items-center gap-2"
                    >
                        {saving ? (
                            <>
                             <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                             Guardando...
                            </>
                        ) : (
                            formData.id ? 'Actualizar Cambios' : 'Guardar Ubicación'
                        )}
                    </button>
                    
                    {/* Botón Cancelar solo visible en móvil si estamos editando */}
                    <button 
                        onClick={() => setShowMobileMap(false)} 
                        className="btn btn-white border w-100 rounded-pill py-2 text-secondary fw-bold d-lg-none"
                    >
                        Cancelar
                    </button>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}