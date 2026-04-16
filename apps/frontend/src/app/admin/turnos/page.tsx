'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Plus, X, Trash2, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Empleado { id: string; nombre_completo: string; puesto: string; }
interface Turno { id: string; empleado_id: string; dia_semana: number; hora_inicio: string; hora_fin: string; tipo: 'mañana' | 'tarde' | 'completo' | 'libre'; }

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const DIAS_COMPLETOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const TURNO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  mañana:   { bg: 'bg-amber-500/10', text: 'text-amber-800', border: 'border-amber-300/40' },
  tarde:    { bg: 'bg-indigo-500/10', text: 'text-indigo-800', border: 'border-indigo-300/40' },
  completo: { bg: 'bg-emerald-500/10', text: 'text-emerald-800', border: 'border-emerald-300/40' },
  libre:    { bg: 'bg-slate-100', text: 'text-slate-500 dark:text-zinc-400', border: 'border-slate-200' },
};

export default function TurnosPage() {
  const { profile } = useAuth();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalEmpleado, setModalEmpleado] = useState('');
  const [modalDia, setModalDia] = useState(0);
  const [modalTipo, setModalTipo] = useState<Turno['tipo']>('mañana');
  const [modalInicio, setModalInicio] = useState('09:00');
  const [modalFin, setModalFin] = useState('14:00');
  const [editingTurnoId, setEditingTurnoId] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, [profile?.empresa_id]);

  const fetchData = async () => {
    if (!profile?.empresa_id) return;
    setLoading(true);
    const [{ data: emps }, { data: tur }] = await Promise.all([
      supabase.from('empleados_info').select('id, nombre_completo, puesto').eq('empresa_id', profile.empresa_id).order('nombre_completo'),
      supabase.from('turnos').select('*').eq('empresa_id', profile.empresa_id),
    ]);
    if (emps) setEmpleados(emps);
    if (tur) setTurnos(tur);
    setLoading(false);
  };

  const getTurno = (empleadoId: string, dia: number) => turnos.find(t => t.empleado_id === empleadoId && t.dia_semana === dia);

  const openModal = (empleadoId: string, dia: number) => {
    const existing = getTurno(empleadoId, dia);
    setModalEmpleado(empleadoId);
    setModalDia(dia);
    if (existing) {
      setEditingTurnoId(existing.id); setModalTipo(existing.tipo); setModalInicio(existing.hora_inicio); setModalFin(existing.hora_fin);
    } else {
      setEditingTurnoId(null); setModalTipo('mañana'); setModalInicio('09:00'); setModalFin('14:00');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { empleado_id: modalEmpleado, dia_semana: modalDia, tipo: modalTipo, hora_inicio: modalInicio, hora_fin: modalFin, empresa_id: profile?.empresa_id };
    const { error } = editingTurnoId
      ? await supabase.from('turnos').update(payload).eq('id', editingTurnoId)
      : await supabase.from('turnos').insert(payload);
    setSaving(false);
    if (error) { setSuccess(''); alert('Error guardando turno: ' + error.message); return; }
    setSuccess('Turno guardado correctamente'); setTimeout(() => setSuccess(''), 3000); setShowModal(false); fetchData();
  };

  const handleDelete = async () => {
    if (!editingTurnoId) return;
    setSaving(true);
    const { error } = await supabase.from('turnos').delete().eq('id', editingTurnoId);
    setSaving(false);
    if (error) { alert('Error eliminando turno: ' + error.message); return; }
    setShowModal(false); fetchData();
  };

  const getTipoLabel = (tipo: string) => ({ mañana: '☀️ Mañana', tarde: '🌙 Tarde', completo: '📋 Completo', libre: '✈️ Libre' }[tipo] || tipo);

  const handleTipoChange = (tipo: Turno['tipo']) => {
    setModalTipo(tipo);
    if (tipo === 'mañana') { setModalInicio('09:00'); setModalFin('14:00'); }
    if (tipo === 'tarde') { setModalInicio('15:00'); setModalFin('20:00'); }
    if (tipo === 'completo') { setModalInicio('09:00'); setModalFin('18:00'); }
    if (tipo === 'libre') { setModalInicio('00:00'); setModalFin('00:00'); }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-5 gap-3">
        <div>
          <p className="text-chrono-blue font-bold uppercase text-xs mb-1 tracking-widest">Gestión</p>
          <h2 className="font-bold text-navy dark:text-zinc-100 text-2xl font-[family-name:var(--font-jakarta)]">Turnos y Horarios</h2>
          <p className="text-slate-400 dark:text-zinc-500 text-sm mt-1 hidden md:block">Configura los horarios semanales de tu equipo.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['mañana', 'tarde', 'completo', 'libre'] as const).map(tipo => {
            const c = TURNO_COLORS[tipo];
            return (
              <span key={tipo} className={cn('px-3 py-1 rounded-full text-xs font-semibold border', c.bg, c.text, c.border)}>
                {getTipoLabel(tipo)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Success */}
      {success && (
        <div className="animate-scale-in bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-sm font-medium flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {success}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-chrono-blue animate-spin" /></div>
      ) : empleados.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border-[1.5px] border-dashed border-gray-200">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h5 className="font-bold text-slate-500 dark:text-zinc-400 mb-1">No hay empleados</h5>
          <p className="text-slate-400 dark:text-zinc-500 text-sm">Añade empleados primero desde la sección Usuarios.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800">
                  <th className="py-3.5 px-5 text-left text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider w-[200px]">Empleado</th>
                  {DIAS.map((dia, i) => (
                    <th key={dia} className="py-3.5 px-3 text-center text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      <div>{dia}</div>
                      <div className="text-[0.65rem] font-normal text-slate-300 normal-case tracking-normal">{DIAS_COMPLETOS[i]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                {empleados.map(emp => (
                  <tr key={emp.id}>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: `hsl(${emp.nombre_completo.charCodeAt(0) * 7 % 360}, 60%, 45%)` }}>
                          {getInitials(emp.nombre_completo)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-navy">{emp.nombre_completo}</div>
                          <div className="text-xs text-slate-400 dark:text-zinc-500">{emp.puesto || 'Sin puesto'}</div>
                        </div>
                      </div>
                    </td>
                    {[0, 1, 2, 3, 4].map(dia => {
                      const turno = getTurno(emp.id, dia);
                      const c = turno ? TURNO_COLORS[turno.tipo] : null;
                      return (
                        <td key={dia} className="py-1.5 px-2 text-center">
                          <button onClick={() => openModal(emp.id, dia)}
                            title={turno ? `${getTipoLabel(turno.tipo)} · ${turno.hora_inicio}-${turno.hora_fin}` : 'Asignar turno'}
                            className={cn(
                              'w-full min-w-[90px] py-2 px-1.5 rounded-xl border-[1.5px] cursor-pointer transition-all text-[0.7rem] font-semibold',
                              turno ? cn(c!.bg, c!.text, c!.border, 'hover:opacity-80') : 'border-dashed border-gray-200 text-gray-300 bg-transparent hover:border-gray-400'
                            )}>
                            {turno ? (
                              <>
                                <div className="mb-0.5">{turno.tipo.charAt(0).toUpperCase() + turno.tipo.slice(1)}</div>
                                <div className="font-normal opacity-70">{turno.hora_inicio}–{turno.hora_fin}</div>
                              </>
                            ) : <Plus className="w-4 h-4 mx-auto" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-navy/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-in bg-white dark:bg-zinc-900 rounded-2xl p-7 w-full max-w-[420px] shadow-2xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h5 className="font-bold text-navy dark:text-zinc-100 text-lg">{editingTurnoId ? 'Editar Turno' : 'Asignar Turno'}</h5>
                <p className="text-slate-400 dark:text-zinc-500 text-sm mt-1">{DIAS_COMPLETOS[modalDia]} — {empleados.find(e => e.id === modalEmpleado)?.nombre_completo}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-transparent border-none cursor-pointer text-slate-400 dark:text-zinc-500 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tipo */}
            <div className="mb-5">
              <label className="text-sm font-semibold text-slate-600 block mb-2">Tipo de turno</label>
              <div className="grid grid-cols-2 gap-2">
                {(['mañana', 'tarde', 'completo', 'libre'] as Turno['tipo'][]).map(tipo => {
                  const c = TURNO_COLORS[tipo];
                  const selected = modalTipo === tipo;
                  return (
                    <button key={tipo} onClick={() => handleTipoChange(tipo)}
                      className={cn('py-2.5 px-3.5 rounded-xl border-[1.5px] cursor-pointer text-sm font-semibold text-left transition-all',
                        selected ? cn(c.bg, c.text, c.border) : 'border-gray-200 text-slate-500 dark:text-zinc-400 bg-transparent hover:border-gray-300')}>
                      {getTipoLabel(tipo)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horas */}
            {modalTipo !== 'libre' && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1.5">Hora entrada</label>
                  <input type="time" value={modalInicio} onChange={e => setModalInicio(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 dark:text-zinc-100 text-sm font-semibold outline-none focus:border-chrono-blue" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1.5">Hora salida</label>
                  <input type="time" value={modalFin} onChange={e => setModalFin(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 dark:text-zinc-100 text-sm font-semibold outline-none focus:border-chrono-blue" />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {editingTurnoId && (
                <button onClick={handleDelete} disabled={saving}
                  className="py-2.5 px-4 rounded-xl border-[1.5px] border-red-200 bg-red-50/50 text-red-600 cursor-pointer font-semibold text-sm hover:bg-red-100/50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border-[1.5px] border-gray-200 bg-transparent text-slate-500 dark:text-zinc-400 cursor-pointer font-semibold text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className={cn('flex-[2] py-2.5 rounded-xl border-none bg-gradient-to-br from-navy to-slate-dark text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 transition-opacity',
                  saving && 'opacity-60 cursor-wait')}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar turno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
