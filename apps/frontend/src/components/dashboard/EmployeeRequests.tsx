'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Sun, Bandage, Clock, CalendarCheck, FileText, X, Loader2, Briefcase, Scale, Vote, Building2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import Toast from '@/components/ui/Toast';

interface Solicitud {
  id: string;
  empleado_id: string;
  tipo: 'vacaciones' | 'baja' | 'otra_ausencia';
  subtipo?: string | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fecha_inicio: string;
  fecha_fin?: string | null;
  comentario?: string | null;
  archivo_path?: string | null;
  es_parcial?: boolean | null;
  horas_ausencia?: number | null;
  familiar_relacion?: string | null;
  hora_salida_prevista?: string | null;
  hora_regreso_prevista?: string | null;
  created_at: string;
}

const SUBTIPOS_OTRA = [
  { value: 'juicio', label: 'Juicio / Citación judicial', Icon: Scale },
  { value: 'mesa_electoral', label: 'Mesa electoral', Icon: Vote },
  { value: 'ayuntamiento', label: 'Trámite ayuntamiento / administración', Icon: Building2 },
  { value: 'deber_publico', label: 'Deber inexcusable público', Icon: Briefcase },
  { value: 'otro', label: 'Otro motivo', Icon: MoreHorizontal },
];

export default function EmployeeRequests() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<'vacaciones' | 'baja' | 'parcial' | 'otra' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [myRequests, setMyRequests] = useState<Solicitud[]>([]);

  const [vacationData, setVacationData] = useState({ start: '', end: '', comment: '' });
  const [bajaData, setBajaData] = useState({ date: '', comment: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [otraData, setOtraData] = useState({
    subtipo: 'juicio', start: '', end: '', horaSalida: '', horaRegreso: '', comment: ''
  });
  const [otraFile, setOtraFile] = useState<File | null>(null);

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

  const fetchMyHistory = async () => {
    try {
      const { data } = await supabase
        .from('solicitudes')
        .select('*')
        .eq('empleado_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setMyRequests(data);
    } catch (error) {
      console.error("Error cargando historial", error);
    }
  };

  const submitVacation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (vacationData.start && vacationData.end && vacationData.end <= vacationData.start) {
      setToast({ message: 'La fecha de fin debe ser posterior a la de inicio.', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('solicitudes').insert({
        empleado_id: user?.id, tipo: 'vacaciones',
        fecha_inicio: vacationData.start, fecha_fin: vacationData.end,
        comentario: vacationData.comment, estado: 'pendiente'
      });
      if (error) throw error;
      setActiveModal(null);
      fetchMyHistory();
      setToast({ message: 'Solicitud enviada correctamente', type: 'success' });
    } catch (err: unknown) {
      setToast({ message: 'Error: ' + (err instanceof Error ? err.message : String(err)), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const submitBaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setToast({ message: 'Por favor, adjunta el parte médico.', type: 'warning' });
      return;
    }
    setLoading(true);
    let uploadedFileName: string | null = null;
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('justificantes').upload(fileName, selectedFile);
      if (uploadError) throw uploadError;
      uploadedFileName = fileName;

      const { error: dbError } = await supabase.from('solicitudes').insert({
        empleado_id: user?.id, tipo: 'baja', fecha_inicio: bajaData.date,
        comentario: bajaData.comment, archivo_path: fileName, estado: 'pendiente'
      });
      if (dbError) {
        // Rollback: remove the orphaned file from Storage before surfacing the error.
        // Use a dedicated try/catch so a Storage failure doesn't swallow the DB error.
        try {
          await supabase.storage.from('justificantes').remove([uploadedFileName]);
        } catch (rollbackError: unknown) {
          console.error('Storage rollback failed — orphaned file:', uploadedFileName, rollbackError);
        }
        throw dbError;
      }

      setActiveModal(null);
      fetchMyHistory();
      setToast({ message: 'Baja tramitada correctamente', type: 'success' });
    } catch (err: unknown) {
      setToast({ message: 'Error al tramitar la baja: ' + (err instanceof Error ? err.message : String(err)), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const submitOtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otraData.start) {
      setToast({ message: 'Indica la fecha de la ausencia.', type: 'warning' });
      return;
    }
    setLoading(true);
    let uploadedFileName: string | null = null;
    try {
      if (otraFile) {
        const ext = otraFile.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('justificantes').upload(fileName, otraFile);
        if (upErr) throw upErr;
        uploadedFileName = fileName;
      }
      const { error } = await supabase.from('solicitudes').insert({
        empleado_id: user?.id,
        tipo: 'otra_ausencia',
        subtipo: otraData.subtipo,
        fecha_inicio: otraData.start,
        fecha_fin: otraData.end || null,
        comentario: otraData.comment,
        archivo_path: uploadedFileName,
        hora_salida_prevista: otraData.horaSalida || null,
        hora_regreso_prevista: otraData.horaRegreso || null,
        estado: 'pendiente',
      });
      if (error) {
        if (uploadedFileName) {
          try { await supabase.storage.from('justificantes').remove([uploadedFileName]); } catch {}
        }
        throw error;
      }
      setActiveModal(null);
      setOtraData({ subtipo: 'juicio', start: '', end: '', horaSalida: '', horaRegreso: '', comment: '' });
      setOtraFile(null);
      fetchMyHistory();
      setToast({ message: 'Solicitud enviada correctamente.', type: 'success' });
    } catch (err: unknown) {
      setToast({ message: 'Error: ' + (err instanceof Error ? err.message : String(err)), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const submitParcial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const relacion = parcialData.tipo.startsWith('acompanar_') ? parcialData.tipo.replace('acompanar_', '') : null;
      const { error } = await supabase.from('solicitudes').insert({
        empleado_id: user?.id, tipo: 'baja', fecha_inicio: parcialData.date,
        comentario: `${TIPOS_AUSENCIA.find(t => t.value === parcialData.tipo)?.label || parcialData.tipo}${parcialData.comment ? ' - ' + parcialData.comment : ''}`,
        estado: 'pendiente', es_parcial: true, horas_ausencia: parseFloat(parcialData.horas),
        familiar_relacion: relacion,
        hora_salida_prevista: parcialData.horaSalida || null,
        hora_regreso_prevista: parcialData.horaRegreso || null,
      });
      if (error) throw error;
      setActiveModal(null);
      fetchMyHistory();
      setToast({ message: 'Ausencia parcial registrada correctamente', type: 'success' });
    } catch (err: unknown) {
      setToast({ message: 'Error: ' + (err instanceof Error ? err.message : String(err)), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/60 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-all text-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";

  return (
    <div>
      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button onClick={() => setActiveModal('vacaciones')}
          className="bg-white border border-gray-100 w-full p-4 rounded-2xl shadow-sm text-left flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-px transition-all">
          <div className="bg-amber-500/10 p-3 rounded-xl text-amber-500">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h6 className="font-bold text-navy text-sm">Solicitar Vacaciones</h6>
            <small className="text-slate-400 text-xs">Pide días libres</small>
          </div>
        </button>
        <button onClick={() => setActiveModal('baja')}
          className="bg-white border border-gray-100 w-full p-4 rounded-2xl shadow-sm text-left flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-px transition-all">
          <div className="bg-red-500/10 p-3 rounded-xl text-red-500">
            <Bandage className="w-5 h-5" />
          </div>
          <div>
            <h6 className="font-bold text-navy text-sm">Subir Baja Médica</h6>
            <small className="text-slate-400 text-xs">Adjunta el parte médico</small>
          </div>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button onClick={() => setActiveModal('parcial')}
          className="bg-white border border-gray-100 w-full p-4 rounded-2xl shadow-sm text-left flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-px transition-all">
          <div className="bg-sky-500/10 p-3 rounded-xl text-sky-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h6 className="font-bold text-navy text-sm">Ausencia Médica Parcial</h6>
            <small className="text-slate-400 text-xs">Consulta, urgencia o familiar (horas)</small>
          </div>
        </button>
        <button onClick={() => setActiveModal('otra')}
          className="bg-white border border-gray-100 w-full p-4 rounded-2xl shadow-sm text-left flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-px transition-all">
          <div className="bg-violet-500/10 p-3 rounded-xl text-violet-500">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h6 className="font-bold text-navy text-sm">Otra Ausencia</h6>
            <small className="text-slate-400 text-xs">Juicio, mesa electoral, ayuntamiento…</small>
          </div>
        </button>
      </div>

      {/* Historial */}
      <h6 className="font-bold text-navy mb-3">Mis Solicitudes Recientes</h6>
      <div className="bg-white shadow-sm rounded-2xl overflow-hidden">
        {myRequests.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">No has enviado ninguna solicitud aún.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {myRequests.map((req) => (
              <div key={req.id} className="p-3.5 flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  {req.tipo === 'vacaciones'
                    ? <CalendarCheck className="w-5 h-5 text-amber-500" />
                    : req.tipo === 'otra_ausencia'
                      ? <Briefcase className="w-5 h-5 text-violet-500" />
                      : <FileText className="w-5 h-5 text-red-500" />
                  }
                  <div>
                    <div className="font-bold text-navy text-sm capitalize">
                      {req.tipo === 'otra_ausencia'
                        ? `Otra ausencia${req.subtipo ? ` · ${SUBTIPOS_OTRA.find(s => s.value === req.subtipo)?.label ?? req.subtipo}` : ''}`
                        : req.es_parcial ? 'Ausencia Parcial'
                        : req.tipo === 'baja' ? 'Baja Médica'
                        : 'Vacaciones'}
                      {req.es_parcial && (
                        <span className="ml-1.5 bg-sky-500/10 text-sky-600 text-[0.65rem] px-1.5 py-0.5 rounded-full font-bold">
                          {req.horas_ausencia}h
                        </span>
                      )}
                    </div>
                    <small className="text-slate-400 text-xs">{new Date(req.created_at).toLocaleDateString()}</small>
                  </div>
                </div>
                <span className={cn(
                  'text-[0.65rem] font-bold px-2.5 py-1 rounded-full uppercase',
                  req.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                    req.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                )}>
                  {req.estado.toUpperCase()}
                </span>
              </div>
            ))}
            {myRequests.length === 50 && (
              <div className="px-4 py-3 text-center text-xs text-slate-400 border-t border-gray-50">
                Mostrando las 50 solicitudes más recientes
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setActiveModal(null)}>
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto animate-scale-in" onClick={e => e.stopPropagation()}>

            {/* Vacaciones */}
            {activeModal === 'vacaciones' && (
              <form onSubmit={submitVacation}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h5 className="font-bold text-navy text-lg">🌴 Solicitar Vacaciones</h5>
                  <button type="button" className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer" onClick={() => setActiveModal(null)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className={labelClass}>Desde</label>
                    <input type="date" className={inputClass} required onChange={e => setVacationData({ ...vacationData, start: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Hasta</label>
                    <input type="date" className={inputClass} required onChange={e => setVacationData({ ...vacationData, end: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Motivo (Opcional)</label>
                    <textarea className={inputClass} rows={2} onChange={e => setVacationData({ ...vacationData, comment: e.target.value })} />
                  </div>
                </div>
                <div className="p-5 border-t border-gray-100">
                  <button type="submit" disabled={loading}
                    className="w-full bg-navy text-white py-3 rounded-xl font-bold border-none cursor-pointer hover:bg-slate-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                </div>
              </form>
            )}

            {/* Baja */}
            {activeModal === 'baja' && (
              <form onSubmit={submitBaja}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h5 className="font-bold text-navy text-lg">🤒 Subir Baja Médica</h5>
                  <button type="button" className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer" onClick={() => setActiveModal(null)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className={labelClass}>Fecha de la Baja</label>
                    <input type="date" className={inputClass} required onChange={e => setBajaData({ ...bajaData, date: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Adjuntar Parte Médico (Foto/PDF)</label>
                    <input type="file" className={inputClass} accept="image/*,.pdf" required onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                    <p className="text-xs text-slate-400 mt-1">Solo visible por Administración.</p>
                  </div>
                  <div>
                    <label className={labelClass}>Observaciones</label>
                    <textarea className={inputClass} rows={2} onChange={e => setBajaData({ ...bajaData, comment: e.target.value })} />
                  </div>
                </div>
                <div className="p-5 border-t border-gray-100">
                  <button type="submit" disabled={loading}
                    className="w-full bg-navy text-white py-3 rounded-xl font-bold border-none cursor-pointer hover:bg-slate-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Subiendo Documento...' : 'Tramitar Baja'}
                  </button>
                </div>
              </form>
            )}

            {/* Otra ausencia */}
            {activeModal === 'otra' && (
              <form onSubmit={submitOtra}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h5 className="font-bold text-navy text-lg">Otra Ausencia</h5>
                  <button type="button" className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer" onClick={() => setActiveModal(null)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className={labelClass}>Motivo</label>
                    <div className="flex flex-col gap-2">
                      {SUBTIPOS_OTRA.map(s => {
                        const Icon = s.Icon;
                        return (
                          <button key={s.value} type="button"
                            className={cn(
                              'text-left border rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all bg-transparent flex items-center gap-2',
                              otraData.subtipo === s.value
                                ? 'border-chrono-blue bg-chrono-blue/5 font-bold text-navy'
                                : 'border-gray-200 text-slate-600 hover:border-gray-300'
                            )}
                            onClick={() => setOtraData({ ...otraData, subtipo: s.value })}>
                            <Icon className="w-4 h-4 shrink-0" />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Desde</label>
                      <input type="date" className={inputClass} required
                        value={otraData.start}
                        onChange={e => setOtraData({ ...otraData, start: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Hasta (opcional)</label>
                      <input type="date" className={inputClass}
                        value={otraData.end}
                        onChange={e => setOtraData({ ...otraData, end: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Hora salida (opcional)</label>
                      <input type="time" className={inputClass}
                        value={otraData.horaSalida}
                        onChange={e => setOtraData({ ...otraData, horaSalida: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Hora regreso (opcional)</label>
                      <input type="time" className={inputClass}
                        value={otraData.horaRegreso}
                        onChange={e => setOtraData({ ...otraData, horaRegreso: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Justificante (opcional, foto/PDF)</label>
                    <input type="file" className={inputClass} accept="image/*,.pdf"
                      onChange={e => setOtraFile(e.target.files ? e.target.files[0] : null)} />
                    <p className="text-xs text-slate-400 mt-1">Citación judicial, convocatoria mesa electoral, etc.</p>
                  </div>
                  <div>
                    <label className={labelClass}>Observaciones</label>
                    <textarea className={inputClass} rows={2}
                      value={otraData.comment}
                      onChange={e => setOtraData({ ...otraData, comment: e.target.value })} />
                  </div>
                </div>
                <div className="p-5 border-t border-gray-100">
                  <button type="submit" disabled={loading}
                    className="w-full bg-navy text-white py-3 rounded-xl font-bold border-none cursor-pointer hover:bg-slate-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Enviando…' : 'Enviar solicitud'}
                  </button>
                </div>
              </form>
            )}

            {/* Parcial */}
            {activeModal === 'parcial' && (
              <form onSubmit={submitParcial}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h5 className="font-bold text-navy text-lg">🏥 Ausencia Médica Parcial</h5>
                  <button type="button" className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer" onClick={() => setActiveModal(null)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className={labelClass}>Tipo de ausencia</label>
                    <div className="flex flex-col gap-2">
                      {TIPOS_AUSENCIA.map(t => (
                        <button key={t.value} type="button"
                          className={cn(
                            'text-left border rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all bg-transparent',
                            parcialData.tipo === t.value
                              ? 'border-chrono-blue bg-chrono-blue/5 font-bold text-navy'
                              : 'border-gray-200 text-slate-600 hover:border-gray-300'
                          )}
                          onClick={() => setParcialData({ ...parcialData, tipo: t.value })}>
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Fecha</label>
                    <input type="date" className={inputClass} required
                      onChange={e => setParcialData({ ...parcialData, date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={labelClass}>Horas</label>
                      <select className={inputClass} value={parcialData.horas}
                        onChange={e => setParcialData({ ...parcialData, horas: e.target.value })}>
                        {['0.5', '1', '1.5', '2', '2.5', '3', '4', '5', '6', '7', '8'].map(h => (
                          <option key={h} value={h}>{h}h</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Salida</label>
                      <input type="time" className={inputClass}
                        onChange={e => setParcialData({ ...parcialData, horaSalida: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Regreso</label>
                      <input type="time" className={inputClass}
                        onChange={e => setParcialData({ ...parcialData, horaRegreso: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Observaciones (Opcional)</label>
                    <textarea className={inputClass} rows={2}
                      onChange={e => setParcialData({ ...parcialData, comment: e.target.value })} />
                  </div>
                </div>
                <div className="p-5 border-t border-gray-100">
                  <button type="submit" disabled={loading}
                    className="w-full bg-navy text-white py-3 rounded-xl font-bold border-none cursor-pointer hover:bg-slate-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Enviando...' : 'Registrar Ausencia Parcial'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}