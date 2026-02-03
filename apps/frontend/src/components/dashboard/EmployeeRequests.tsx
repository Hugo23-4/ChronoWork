'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function EmployeeRequests() {
  const { user } = useAuth();
  
  // Estados para controlar los modales y la carga
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<'vacaciones' | 'baja' | null>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  // Datos del formulario de Vacaciones
  const [vacationData, setVacationData] = useState({ start: '', end: '', comment: '' });
  
  // Datos del formulario de Baja
  const [bajaData, setBajaData] = useState({ date: '', comment: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) fetchMyHistory();
  }, [user]);

  // 1. CARGAR HISTORIAL (Solo mis solicitudes)
  const fetchMyHistory = async () => {
    try {
        const { data } = await supabase
        .from('solicitudes')
        .select('*')
        .eq('empleado_id', user?.id)
        .order('created_at', { ascending: false });
        
        if (data) setMyRequests(data);
    } catch (error) {
        console.error("Error cargando historial", error);
    }
  };

  // 2. ENVIAR VACACIONES
  const submitVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const { error } = await supabase.from('solicitudes').insert({
            empleado_id: user?.id,
            tipo: 'vacaciones',
            fecha_inicio: vacationData.start,
            fecha_fin: vacationData.end,
            comentario: vacationData.comment,
            estado: 'pendiente'
        });
        if (error) throw error;
        
        setActiveModal(null);
        fetchMyHistory(); // Recargar lista al instante
        alert('Solicitud enviada correctamente');
    } catch (err: any) {
        alert('Error: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  // 3. ENVIAR BAJA (CON ARCHIVO ADJUNTO)
  const submitBaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return alert('Por favor, adjunta el parte médico.');
    
    setLoading(true);
    try {
        // A. Subir archivo al Storage de Supabase ('justificantes')
        // Usamos timestamp para que el nombre sea único
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`; 
        
        const { error: uploadError } = await supabase.storage
            .from('justificantes')
            .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        // B. Guardar registro en Base de Datos con la ruta del archivo
        const { error: dbError } = await supabase.from('solicitudes').insert({
            empleado_id: user?.id,
            tipo: 'baja',
            fecha_inicio: bajaData.date,
            comentario: bajaData.comment,
            archivo_path: fileName, // Guardamos la referencia para que el admin la vea
            estado: 'pendiente'
        });

        if (dbError) throw dbError;

        setActiveModal(null);
        fetchMyHistory();
        alert('Baja tramitada correctamente');
    } catch (err: any) {
        console.error(err);
        alert('Error al subir: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div>
        {/* --- BOTONES PRINCIPALES (TARJETAS GRANDES) --- */}
        <div className="row g-3 mb-4">
            <div className="col-md-6">
                <button 
                    onClick={() => setActiveModal('vacaciones')} 
                    className="btn btn-white border w-100 p-4 rounded-4 shadow-sm text-start d-flex align-items-center gap-3 hover-scale bg-white"
                    style={{ transition: 'transform 0.2s' }}
                >
                    <div className="bg-warning bg-opacity-10 p-3 rounded-circle text-warning">
                        <i className="bi bi-sun-fill fs-4"></i>
                    </div>
                    <div>
                        <h6 className="fw-bold mb-0 text-dark">Solicitar Vacaciones</h6>
                        <small className="text-muted">Pide días libres</small>
                    </div>
                </button>
            </div>
            <div className="col-md-6">
                <button 
                    onClick={() => setActiveModal('baja')} 
                    className="btn btn-white border w-100 p-4 rounded-4 shadow-sm text-start d-flex align-items-center gap-3 hover-scale bg-white"
                    style={{ transition: 'transform 0.2s' }}
                >
                    <div className="bg-danger bg-opacity-10 p-3 rounded-circle text-danger">
                        <i className="bi bi-bandaid-fill fs-4"></i>
                    </div>
                    <div>
                        <h6 className="fw-bold mb-0 text-dark">Subir Baja Médica</h6>
                        <small className="text-muted">Adjunta el parte médico</small>
                    </div>
                </button>
            </div>
        </div>

        {/* --- LISTA HISTORIAL --- */}
        <h6 className="fw-bold mb-3">Mis Solicitudes Recientes</h6>
        <div className="card border-0 shadow-sm rounded-4">
            <div className="list-group list-group-flush rounded-4">
                {myRequests.length === 0 ? (
                    <div className="p-4 text-center text-muted">No has enviado ninguna solicitud aún.</div>
                ) : (
                    myRequests.map((req) => (
                        <div key={req.id} className="list-group-item p-3 d-flex justify-content-between align-items-center">
                            <div className="d-flex gap-3 align-items-center">
                                {req.tipo === 'vacaciones' ? 
                                    <i className="bi bi-calendar-check text-warning fs-5"></i> : 
                                    <i className="bi bi-file-medical text-danger fs-5"></i>
                                }
                                <div>
                                    <div className="fw-bold text-dark text-capitalize">
                                        {req.tipo === 'baja' ? 'Baja Médica' : 'Vacaciones'}
                                    </div>
                                    <small className="text-muted">{new Date(req.created_at).toLocaleDateString()}</small>
                                </div>
                            </div>
                            <span className={`badge rounded-pill ${
                                req.estado === 'pendiente' ? 'bg-warning text-dark' : 
                                req.estado === 'aprobado' ? 'bg-success' : 'bg-danger'
                            }`}>
                                {req.estado.toUpperCase()}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* --- MODAL VACACIONES --- */}
        {activeModal === 'vacaciones' && (
            <>
                <div className="modal-backdrop fade show"></div>
                <div className="modal fade show d-block" tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content rounded-4 border-0 shadow">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">🌴 Solicitar Vacaciones</h5>
                                <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
                            </div>
                            <form onSubmit={submitVacation}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Desde</label>
                                        <input type="date" className="form-control" required onChange={e => setVacationData({...vacationData, start: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Hasta</label>
                                        <input type="date" className="form-control" required onChange={e => setVacationData({...vacationData, end: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Motivo (Opcional)</label>
                                        <textarea className="form-control" rows={2} onChange={e => setVacationData({...vacationData, comment: e.target.value})}></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="submit" className="btn btn-dark w-100 rounded-pill" disabled={loading}>
                                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </>
        )}

        {/* --- MODAL BAJA MÉDICA --- */}
        {activeModal === 'baja' && (
            <>
                <div className="modal-backdrop fade show"></div>
                <div className="modal fade show d-block" tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content rounded-4 border-0 shadow">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">🤒 Subir Baja Médica</h5>
                                <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
                            </div>
                            <form onSubmit={submitBaja}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Fecha de la Baja</label>
                                        <input type="date" className="form-control" required onChange={e => setBajaData({...bajaData, date: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Adjuntar Parte Médico (Foto/PDF)</label>
                                        <input 
                                            type="file" 
                                            className="form-control" 
                                            accept="image/*,.pdf" 
                                            required 
                                            onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} 
                                        />
                                        <div className="form-text small">Solo visible por Administración.</div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Observaciones</label>
                                        <textarea className="form-control" rows={2} onChange={e => setBajaData({...bajaData, comment: e.target.value})}></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="submit" className="btn btn-dark w-100 rounded-pill" disabled={loading}>
                                        {loading ? 'Subiendo Documento...' : 'Tramitar Baja'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </>
        )}
    </div>
  );
}