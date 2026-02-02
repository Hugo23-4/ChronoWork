'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Solicitud = {
  id: string;
  tipo: 'vacaciones' | 'baja' | 'asuntos';
  fecha_inicio: string;
  fecha_fin?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  comentario: string;
  created_at: string;
  archivo_url?: string;
};

export default function SolicitudesPage() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [diasDisponibles, setDiasDisponibles] = useState(22);
  const [loading, setLoading] = useState(true);

  // Estados del Modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'vacaciones' | 'baja'>('vacaciones');
  
  // Estados de Envío (NUEVO)
  const [isSubmitting, setIsSubmitting] = useState(false); // Para el botón de carga

  // Campos del Formulario
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [comentario, setComentario] = useState('');
  const [diasCalculados, setDiasCalculados] = useState(0);
  
  // Archivos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // Cálculo de días
  useEffect(() => {
    if (fechaInicio && fechaFin && modalType === 'vacaciones') {
      const start = new Date(fechaInicio);
      const end = new Date(fechaFin);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      setDiasCalculados(diffDays > 0 ? diffDays : 0);
    } else {
      setDiasCalculados(0);
    }
  }, [fechaInicio, fechaFin, modalType]);

  const fetchData = async () => {
    try {
      const { data: perfil } = await supabase.from('empleados_info').select('dias_vacaciones').eq('id', user?.id).single();
      if (perfil) setDiasDisponibles(perfil.dias_vacaciones);

      const { data: history } = await supabase.from('solicitudes').select('*').eq('empleado_id', user?.id).order('created_at', { ascending: false });
      if (history) setSolicitudes(history as Solicitud[]);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const openModal = (tipo: 'vacaciones' | 'baja') => {
    setModalType(tipo);
    setFechaInicio('');
    setFechaFin('');
    setComentario('');
    setFileName(null);
    setDiasCalculados(0);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  // --- LÓGICA DE ENVÍO MEJORADA (Debug) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("Error: Sesión no detectada. Recarga la página.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Objeto limpio para evitar enviar undefined
      const solicitudData = {
        empleado_id: user.id,
        tipo: modalType,
        fecha_inicio: fechaInicio,
        fecha_fin: modalType === 'vacaciones' ? fechaFin : null,
        estado: 'pendiente',
        comentario: comentario,
        archivo_url: fileName ? `docs/${fileName}` : null 
      };

      console.log("📤 Intentando enviar a Supabase:", solicitudData);

      const { data, error } = await supabase
        .from('solicitudes')
        .insert([solicitudData])
        .select();

      if (error) {
        // Truco: Supabase a veces devuelve el error como objeto JSON no estándar
        console.error("❌ Error Supabase Detallado:", JSON.stringify(error, null, 2));
        throw new Error(error.message || "Error desconocido al guardar en base de datos");
      }

      console.log("✅ Éxito:", data);
      
      setShowModal(false);
      
      // Limpiamos formulario
      setComentario('');
      setFechaInicio('');
      setFechaFin('');
      setFileName(null);
      
      fetchData(); // Recargar lista visualmente
      alert('Solicitud enviada correctamente.');

    } catch (error: any) {
      console.error("Catch Error:", error);
      alert('Hubo un problema al enviar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprobado': return 'success';
      case 'rechazado': return 'danger';
      default: return 'warning';
    }
  };

  return (
    <div className="fade-in-up pb-5 position-relative">
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
           <h2 className="fw-bold text-dark mb-1">Solicitudes</h2>
           <p className="text-secondary mb-0 d-none d-lg-block">Gestiona ausencias, vacaciones y justificantes.</p>
        </div>
        <button onClick={() => openModal('vacaciones')} className="btn btn-dark d-none d-lg-block rounded-3 px-4 fw-bold">
            + Crear Solicitud
        </button>
      </div>

      <div className="row g-4 mb-5">
        {/* ZONA SUPERIOR */}
        <div className="col-lg-4 d-none d-lg-block">
             <div className="card border-0 shadow-sm rounded-4 p-4 h-100 d-flex flex-column justify-content-center bg-white">
                 <small className="text-secondary fw-bold text-uppercase mb-2">DÍAS DE VACACIONES</small>
                 <div className="d-flex align-items-baseline gap-2">
                     <span className="display-1 fw-bold text-dark" style={{ letterSpacing: '-2px' }}>{diasDisponibles}</span>
                     <span className="text-secondary fs-5">días disponibles</span>
                 </div>
             </div>
        </div>

        <div className="col-lg-8 d-none d-lg-block">
             <div 
                className="card border-2 border-dashed border-primary border-opacity-25 bg-white rounded-4 p-4 h-100 d-flex flex-column align-items-center justify-content-center cursor-pointer hover-shadow transition-all"
                style={{ borderStyle: 'dashed', minHeight: '180px' }}
                onClick={() => openModal('baja')}
             >
                 <i className="bi bi-cloud-arrow-up-fill fs-1 text-primary mb-3 opacity-50"></i>
                 <h5 className="fw-bold text-dark">Arrastra aquí tu Baja Médica</h5>
                 <p className="text-secondary small">o haz clic para buscar en tu ordenador (PDF, JPG)</p>
             </div>
        </div>

        {/* MÓVIL */}
        <div className="col-12 d-lg-none">
            <div className="d-grid gap-3">
                <div onClick={() => openModal('baja')} className="card border-primary border-1 shadow-sm rounded-4 p-3 active-scale cursor-pointer bg-white">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-light rounded-circle p-3 d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                            <i className="bi bi-camera-fill fs-4 text-dark"></i>
                        </div>
                        <div>
                            <h6 className="fw-bold text-dark mb-1">Subir Baja Médica</h6>
                            <small className="text-secondary">Hacer foto al documento</small>
                        </div>
                    </div>
                </div>
                <div onClick={() => openModal('vacaciones')} className="card border-0 shadow-sm rounded-4 p-3 active-scale cursor-pointer bg-white">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-warning bg-opacity-10 rounded-circle p-3 d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                            <i className="bi bi-calendar-event-fill fs-4 text-warning"></i>
                        </div>
                        <div>
                            <h6 className="fw-bold text-dark mb-1">Solicitar Vacaciones</h6>
                            <small className="text-secondary">Tienes {diasDisponibles} días disponibles</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* LISTADO */}
      <h5 className="fw-bold mb-3 px-1">Historial Reciente</h5>
      <div className="d-grid gap-3">
         {solicitudes.length === 0 && <p className="text-muted text-center py-4">No hay solicitudes registradas.</p>}
         {solicitudes.map((sol) => (
             <div key={sol.id} className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative bg-white">
                 <div className={`position-absolute top-0 start-0 bottom-0 d-lg-none`} 
                      style={{ width: '6px', backgroundColor: sol.estado === 'pendiente' ? '#fd7e14' : sol.estado === 'aprobado' ? '#198754' : '#dc3545' }}>
                 </div>
                 <div className="card-body p-3 ps-4 ps-lg-4 d-flex justify-content-between align-items-center">
                     <div className="d-flex align-items-center gap-3">
                         <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 
                             ${sol.tipo === 'vacaciones' ? 'bg-warning bg-opacity-10 text-warning' : 'bg-primary bg-opacity-10 text-primary'}`} 
                             style={{ width: '48px', height: '48px' }}>
                             <i className={`bi ${sol.tipo === 'vacaciones' ? 'bi-umbrella-fill' : 'bi-file-earmark-medical-fill'} fs-5`}></i>
                         </div>
                         <div>
                             <h6 className="fw-bold text-dark mb-0 text-capitalize">
                                 {sol.tipo === 'vacaciones' ? 'Vacaciones' : 'Baja Médica'}
                             </h6>
                             <small className="text-secondary d-block">
                                 {sol.tipo === 'vacaciones' && sol.fecha_fin
                                    ? `Del ${new Date(sol.fecha_inicio).toLocaleDateString()} al ${new Date(sol.fecha_fin).toLocaleDateString()}`
                                    : `Fecha: ${new Date(sol.fecha_inicio).toLocaleDateString()}`
                                 }
                             </small>
                             <small className="text-muted fst-italic" style={{fontSize: '0.8rem'}}>"{sol.comentario}"</small>
                         </div>
                     </div>
                     <div className="d-none d-lg-block">
                         <span className={`badge rounded-pill px-3 py-2 bg-${getStatusColor(sol.estado)} bg-opacity-10 text-${getStatusColor(sol.estado)}`}>
                             {sol.estado.toUpperCase()}
                         </span>
                     </div>
                 </div>
             </div>
          ))}
      </div>

      {/* MODAL CON BOTÓN DE CARGA */}
      {showModal && (
        <>
            <div className="modal-backdrop fade show" onClick={() => !isSubmitting && setShowModal(false)}></div>
            <div className="modal fade show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content rounded-4 border-0 shadow">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold">
                                {modalType === 'vacaciones' ? '🌴 Solicitar Vacaciones' : '⚕️ Subir Baja Médica'}
                            </h5>
                            <button type="button" className="btn-close" onClick={() => setShowModal(false)} disabled={isSubmitting}></button>
                        </div>
                        <div className="modal-body pt-4">
                            <form onSubmit={handleSubmit}>
                                
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-dark">
                                        {modalType === 'vacaciones' ? 'Desde (Primer día)' : 'Fecha de la Baja'}
                                    </label>
                                    <input 
                                        type="date" 
                                        className="form-control bg-light border-0 py-3" 
                                        required 
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {modalType === 'vacaciones' && (
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small text-dark">Hasta (Último día)</label>
                                        <input 
                                            type="date" 
                                            className="form-control bg-light border-0 py-3" 
                                            required 
                                            value={fechaFin}
                                            onChange={(e) => setFechaFin(e.target.value)}
                                            min={fechaInicio}
                                            disabled={isSubmitting}
                                        />
                                        {diasCalculados > 0 && (
                                            <div className="mt-2 small text-primary fw-bold">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Solicitas {diasCalculados} días de vacaciones.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-dark">
                                        {modalType === 'vacaciones' ? 'Motivo' : 'Observaciones'}
                                    </label>
                                    <textarea 
                                        className="form-control bg-light border-0" 
                                        rows={2} 
                                        placeholder="Escribe aquí..."
                                        value={comentario}
                                        onChange={(e) => setComentario(e.target.value)}
                                        required
                                        disabled={isSubmitting}
                                    ></textarea>
                                </div>

                                {modalType === 'baja' && (
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small text-dark">Adjuntar Parte Médico</label>
                                        <div 
                                            className={`border-2 border-dashed rounded-3 p-4 text-center cursor-pointer transition-all ${fileName ? 'border-success bg-success bg-opacity-10' : 'border-secondary border-opacity-25 bg-light'}`}
                                            onClick={() => !isSubmitting && fileInputRef.current?.click()}
                                        >
                                            {fileName ? (
                                                <>
                                                    <i className="bi bi-file-earmark-check-fill fs-3 text-success"></i>
                                                    <p className="mb-0 small fw-bold text-success mt-2">{fileName}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-cloud-upload fs-3 text-secondary"></i>
                                                    <p className="mb-0 small text-muted mt-2">Clic para subir archivo</p>
                                                </>
                                            )}
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="d-none" 
                                                accept="image/*,.pdf"
                                                onChange={handleFileChange}
                                                disabled={isSubmitting}
                                            /> 
                                        </div>
                                    </div>
                                )}

                                <div className="d-grid mt-4">
                                    {/* BOTÓN CON ESTADO DE CARGA */}
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary py-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2" 
                                        style={{ backgroundColor: '#0F172A' }}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                Enviando...
                                            </>
                                        ) : (
                                            modalType === 'vacaciones' ? 'Confirmar Solicitud' : 'Enviar Parte Médico'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
      )}

    </div>
  );
}