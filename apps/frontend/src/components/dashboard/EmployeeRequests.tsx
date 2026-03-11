'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function EmployeeRequests() {
  const { user } = useAuth();
  
  // Estados para controlar los modales y la carga
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<'vacaciones' | 'baja' | 'parcial' | null>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  // Datos del formulario de Vacaciones
  const [vacationData, setVacationData] = useState({ start: '', end: '', comment: '' });
  
  // Datos del formulario de Baja
  const [bajaData, setBajaData] = useState({ date: '', comment: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Datos del formulario de Ausencia Parcial
  const TIPOS_AUSENCIA = [
    { value: 'consulta_propia', label: 'Consulta médica propia', icon: '🏥' },
    { value: 'urgencia_propia', label: 'Urgencia médica propia', icon: '🚑' },
    { value: 'acompanar_hijo', label: 'Acompañar hijo/a menor', icon: '👶' },
    { value: 'acompanar_padre', label: 'Acompañar padre/madre', icon: '👨‍👩‍👦' },
    { value: 'acompanar_conyuge', label: 'Acompañar cónyuge/pareja', icon: '💑' },
  ];
  const [parcialData, setParcialData] = useState({
    date: '', tipo: 'consulta_propia', horas: '1', horaSalida: '', horaRegreso: '', comment: ''
  });

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

  // 4. ENVIAR AUSENCIA PARCIAL
  const submitParcial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const relacion = parcialData.tipo.startsWith('acompanar_') ? parcialData.tipo.replace('acompanar_', '') : null;
      const { error } = await supabase.from('solicitudes').insert({
        empleado_id: user?.id,
        tipo: 'baja',
        fecha_inicio: parcialData.date,
        comentario: `${TIPOS_AUSENCIA.find(t => t.value === parcialData.tipo)?.label || parcialData.tipo}${parcialData.comment ? ' - ' + parcialData.comment : ''}`,
        estado: 'pendiente',
        es_parcial: true,
        horas_ausencia: parseFloat(parcialData.horas),
        familiar_relacion: relacion,
        hora_salida_prevista: parcialData.horaSalida || null,
        hora_regreso_prevista: parcialData.horaRegreso || null,
      });
      if (error) throw error;
      setActiveModal(null);
      fetchMyHistory();
      alert('Ausencia parcial registrada correctamente');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
        {/* --- BOTONES PRINCIPALES (TARJETAS GRANDES) --- */}
        <div className="row gap-3 mb-4">
            <div className="md:col-span-6">
                <button 
                    onClick={() => setActiveModal('vacaciones')} 
                    className="btn btn-white border w-full p-4 rounded-2xl shadow-sm text-left flex items-center gap-3 hover-scale bg-white"
                    style={{ transition: 'transform 0.2s' }}
                >
                    <div className="bg-amber-500 bg-opacity-10 p-3 rounded-full text-amber-500">
                        <i className="bi bi-sun-fill text-xl"></i>
                    </div>
                    <div>
                        <h6 className="font-bold mb-0 text-navy">Solicitar Vacaciones</h6>
                        <small className="text-slate-400">Pide días libres</small>
                    </div>
                </button>
            </div>
            <div className="md:col-span-6">
                <button 
                    onClick={() => setActiveModal('baja')} 
                    className="btn btn-white border w-full p-4 rounded-2xl shadow-sm text-left flex items-center gap-3 hover-scale bg-white"
                    style={{ transition: 'transform 0.2s' }}
                >
                    <div className="bg-red-500 bg-opacity-10 p-3 rounded-full text-red-500">
                        <i className="bi bi-bandaid-fill text-xl"></i>
                    </div>
                    <div>
                        <h6 className="font-bold mb-0 text-navy">Subir Baja Médica</h6>
                        <small className="text-slate-400">Adjunta el parte médico</small>
                    </div>
                </button>
            </div>
        </div>
        <div className="col-span-12">
            <button 
                onClick={() => setActiveModal('parcial')} 
                className="btn btn-white border w-full p-4 rounded-2xl shadow-sm text-left flex items-center gap-3 hover-scale bg-white"
                style={{ transition: 'transform 0.2s' }}
            >
                <div className="bg-sky-500 bg-opacity-10 p-3 rounded-full text-sky-500">
                    <i className="bi bi-clock-history text-xl"></i>
                </div>
                <div>
                    <h6 className="font-bold mb-0 text-navy">Ausencia Médica Parcial</h6>
                    <small className="text-slate-400">Consulta, urgencia o acompañar familiar (horas)</small>
                </div>
            </button>
        </div>

        {/* --- LISTA HISTORIAL --- */}
        <h6 className="font-bold mb-3">Mis Solicitudes Recientes</h6>
        <div className="card border-0 shadow-sm rounded-2xl">
            <div className="list-group list-group-flush rounded-2xl">
                {myRequests.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">No has enviado ninguna solicitud aún.</div>
                ) : (
                    myRequests.map((req) => (
                        <div key={req.id} className="list-group-item p-3 flex justify-between items-center">
                            <div className="flex gap-3 items-center">
                                {req.tipo === 'vacaciones' ? 
                                    <i className="bi bi-calendar-check text-amber-500 text-lg"></i> : 
                                    <i className="bi bi-file-medical text-red-500 text-lg"></i>
                                }
                                <div>
                                    <div className="font-bold text-navy text-capitalize">
                                        {req.es_parcial ? 'Ausencia Parcial' : req.tipo === 'baja' ? 'Baja Médica' : 'Vacaciones'}
                                        {req.es_parcial && <span className="ml-1 bg-sky-500 text-white text-xs px-2 py-0.5 rounded-full font-bold bg-opacity-15 text-sky-500" style={{ fontSize: '0.65rem' }}>{req.horas_ausencia}h</span>}
                                    </div>
                                    <small className="text-slate-400">{new Date(req.created_at).toLocaleDateString()}</small>
                                </div>
                            </div>
                            <span className={`badge rounded-full ${
                                req.estado === 'pendiente' ? 'bg-amber-500 text-navy' : 
                                req.estado === 'aprobado' ? 'bg-emerald-500' : 'bg-red-500'
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
                <div className="modal fade show block" tabIndex={-1}>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-dialog-centered">
                        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto rounded-2xl border-0 shadow-md">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 border-0">
                                <h5 className="font-bold text-lg text-navy font-bold">🌴 Solicitar Vacaciones</h5>
                                <button type="button" className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none text-xl" onClick={() => setActiveModal(null)}></button>
                            </div>
                            <form onSubmit={submitVacation}>
                                <div className="p-6">
                                    <div className="mb-3">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold">Desde</label>
                                        <input type="date" className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" required onChange={e => setVacationData({...vacationData, start: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold">Hasta</label>
                                        <input type="date" className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" required onChange={e => setVacationData({...vacationData, end: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold">Motivo (Opcional)</label>
                                        <textarea className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" rows={2} onChange={e => setVacationData({...vacationData, comment: e.target.value})}></textarea>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 p-6 border-t border-gray-100 border-0">
                                    <button type="submit" className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none w-full rounded-full" disabled={loading}>
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
                <div className="modal fade show block" tabIndex={-1}>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-dialog-centered">
                        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto rounded-2xl border-0 shadow-md">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 border-0">
                                <h5 className="font-bold text-lg text-navy font-bold">🤒 Subir Baja Médica</h5>
                                <button type="button" className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none text-xl" onClick={() => setActiveModal(null)}></button>
                            </div>
                            <form onSubmit={submitBaja}>
                                <div className="p-6">
                                    <div className="mb-3">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold">Fecha de la Baja</label>
                                        <input type="date" className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" required onChange={e => setBajaData({...bajaData, date: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold">Adjuntar Parte Médico (Foto/PDF)</label>
                                        <input 
                                            type="file" 
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" 
                                            accept="image/*,.pdf" 
                                            required 
                                            onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} 
                                        />
                                        <div className="form-text text-sm">Solo visible por Administración.</div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold">Observaciones</label>
                                        <textarea className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" rows={2} onChange={e => setBajaData({...bajaData, comment: e.target.value})}></textarea>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 p-6 border-t border-gray-100 border-0">
                                    <button type="submit" className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none w-full rounded-full" disabled={loading}>
                                        {loading ? 'Subiendo Documento...' : 'Tramitar Baja'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </>
        )}

        {/* --- MODAL AUSENCIA PARCIAL --- */}
        {activeModal === 'parcial' && (
            <>
                <div className="modal-backdrop fade show"></div>
                <div className="modal fade show block" tabIndex={-1}>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-dialog-centered">
                        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto rounded-2xl border-0 shadow-md">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 border-0">
                                <h5 className="font-bold text-lg text-navy font-bold">🏥 Ausencia Médica Parcial</h5>
                                <button type="button" className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none text-xl" onClick={() => setActiveModal(null)}></button>
                            </div>
                            <form onSubmit={submitParcial}>
                                <div className="p-6">
                                    <div className="mb-3">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold">Tipo de ausencia</label>
                                        <div className="flex flex-col gap-2">
                                            {TIPOS_AUSENCIA.map(t => (
                                                <button key={t.value} type="button"
                                                    className={`text-sm py-1.5 px-3 text-left border rounded-lg ${parcialData.tipo === t.value ? 'border-primary bg-chrono-blue bg-opacity-10 font-bold' : 'border-light'}`}
                                                    onClick={() => setParcialData({...parcialData, tipo: t.value})}>
                                                    {t.icon} {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold">Fecha</label>
                                        <input type="date" className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" required
                                            onChange={e => setParcialData({...parcialData, date: e.target.value})} />
                                    </div>
                                    <div className="row g-2 mb-3">
                                        <div className="col-4">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold">Horas</label>
                                            <select className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 outline-none transition-colors text-sm"
                                                value={parcialData.horas}
                                                onChange={e => setParcialData({...parcialData, horas: e.target.value})}>
                                                {['0.5', '1', '1.5', '2', '2.5', '3', '4', '5', '6', '7', '8'].map(h => (
                                                    <option key={h} value={h}>{h}h</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-4">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold">Salida</label>
                                            <input type="time" className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm"
                                                onChange={e => setParcialData({...parcialData, horaSalida: e.target.value})} />
                                        </div>
                                        <div className="col-4">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold">Regreso</label>
                                            <input type="time" className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm"
                                                onChange={e => setParcialData({...parcialData, horaRegreso: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold">Observaciones (Opcional)</label>
                                        <textarea className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" rows={2}
                                            onChange={e => setParcialData({...parcialData, comment: e.target.value})}></textarea>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 p-6 border-t border-gray-100 border-0">
                                    <button type="submit" className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none w-full rounded-full" disabled={loading}>
                                        {loading ? 'Enviando...' : 'Registrar Ausencia Parcial'}
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