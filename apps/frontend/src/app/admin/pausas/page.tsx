'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, X, Pencil, Trash2, Coffee, Info, CheckCircle, Loader2, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PausaConfig {
  id: string; nombre: string; tipo_jornada: string; duracion_minutos: number;
  hora_inicio_sugerida: string | null; hora_fin_sugerida: string | null;
  es_retribuida: boolean; activa: boolean; notificar_inicio: boolean;
  notificar_fin: boolean; notificar_antes_min: number;
}

const TIPOS_JORNADA = [
  { value: 'mañana', label: '☀️ Mañana' }, { value: 'tarde', label: '🌙 Tarde' },
  { value: 'completo', label: '📋 Completa' }, { value: 'noche', label: '🌑 Noche' },
];

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button onClick={onChange} className={cn('relative w-[42px] h-6 rounded-full transition-colors cursor-pointer border-none shrink-0', checked ? 'bg-emerald-500' : 'bg-gray-300')}>
    <div className={cn('absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[21px]' : 'translate-x-[3px]')} />
  </button>
);

export default function AdminPausasPage() {
  const [pausas, setPausas] = useState<PausaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: 'Desayuno', tipo_jornada: 'mañana', duracion_minutos: 15,
    hora_inicio_sugerida: '10:30', hora_fin_sugerida: '10:45',
    es_retribuida: true, activa: true, notificar_inicio: true, notificar_fin: true, notificar_antes_min: 3,
  });

  useEffect(() => { fetchPausas(); }, []);

  const fetchPausas = async () => {
    setLoading(true);
    const { data } = await supabase.from('configuracion_pausas').select('*').order('tipo_jornada');
    if (data) setPausas(data);
    setLoading(false);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ nombre: '', tipo_jornada: 'completo', duracion_minutos: 15, hora_inicio_sugerida: '10:30', hora_fin_sugerida: '10:45', es_retribuida: true, activa: true, notificar_inicio: true, notificar_fin: true, notificar_antes_min: 3 });
    setShowModal(true);
  };

  const openEdit = (p: PausaConfig) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre, tipo_jornada: p.tipo_jornada, duracion_minutos: p.duracion_minutos, hora_inicio_sugerida: p.hora_inicio_sugerida || '', hora_fin_sugerida: p.hora_fin_sugerida || '', es_retribuida: p.es_retribuida, activa: p.activa, notificar_inicio: p.notificar_inicio, notificar_fin: p.notificar_fin, notificar_antes_min: p.notificar_antes_min });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    const payload = { nombre: form.nombre, tipo_jornada: form.tipo_jornada, duracion_minutos: form.duracion_minutos, hora_inicio_sugerida: form.hora_inicio_sugerida || null, hora_fin_sugerida: form.hora_fin_sugerida || null, es_retribuida: form.es_retribuida, activa: form.activa, notificar_inicio: form.notificar_inicio, notificar_fin: form.notificar_fin, notificar_antes_min: form.notificar_antes_min };
    if (editId) await supabase.from('configuracion_pausas').update(payload).eq('id', editId);
    else await supabase.from('configuracion_pausas').insert(payload);
    setSaving(false); setShowModal(false); setSuccess(editId ? 'Pausa actualizada' : 'Pausa creada'); setTimeout(() => setSuccess(''), 3000); fetchPausas();
  };

  const handleDelete = async (id: string) => { if (!confirm('¿Eliminar esta pausa?')) return; await supabase.from('configuracion_pausas').delete().eq('id', id); fetchPausas(); };
  const toggleActive = async (id: string, current: boolean) => { await supabase.from('configuracion_pausas').update({ activa: !current }).eq('id', id); fetchPausas(); };

  const presets = [
    { nombre: 'Desayuno', tipo: 'mañana', duracion: 15, inicio: '10:30', fin: '10:45' },
    { nombre: 'Comida', tipo: 'completo', duracion: 60, inicio: '14:00', fin: '15:00' },
    { nombre: 'Merienda', tipo: 'tarde', duracion: 15, inicio: '18:00', fin: '18:15' },
    { nombre: 'Cena', tipo: 'noche', duracion: 30, inicio: '21:00', fin: '21:30' },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setForm(f => ({ ...f, nombre: p.nombre, tipo_jornada: p.tipo, duracion_minutos: p.duracion, hora_inicio_sugerida: p.inicio, hora_fin_sugerida: p.fin }));
  };

  return (
    <div className="animate-fade-up pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-5 gap-3">
        <div>
          <p className="text-chrono-blue font-bold uppercase text-xs mb-1 tracking-widest">Configuración · Convenio</p>
          <h2 className="font-bold text-navy text-2xl font-[family-name:var(--font-jakarta)]">Pausas y Descansos</h2>
          <p className="text-slate-400 text-sm mt-1 hidden md:block">Art. 34.4 ET: mínimo 15 min si jornada &gt; 6h.</p>
        </div>
        <button onClick={openNew}
          className="bg-gradient-to-br from-navy to-slate-dark text-white px-5 py-2.5 rounded-xl font-bold text-sm border-none cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
          <Plus className="w-4 h-4" /> Nueva pausa
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200/50 rounded-2xl p-4 mb-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-chrono-blue mt-0.5 shrink-0" />
        <div className="text-sm text-blue-900 leading-relaxed">
          <strong>Normativa española (Art. 34.4 ET):</strong> Jornada continua &gt;6h → descanso mínimo 15 min.
          El convenio decide la duración exacta y si es <strong>retribuida</strong>. Durante la pausa, la app <strong>no registra ubicación GPS</strong>.
        </div>
      </div>

      {success && (
        <div className="animate-scale-in bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-sm font-medium flex items-center gap-2 mb-4">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-chrono-blue animate-spin" /></div>
      ) : pausas.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border-[1.5px] border-dashed border-gray-200">
          <Coffee className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h5 className="font-bold text-slate-500 mb-2">Sin pausas configuradas</h5>
          <p className="text-slate-400 text-sm mb-4">Crea pausas según tu convenio colectivo.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {presets.map(p => (
              <button key={p.nombre} onClick={() => { openNew(); setTimeout(() => applyPreset(p), 50); }}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold border-[1.5px] border-gray-200 bg-white text-slate-500 cursor-pointer hover:border-gray-300 transition-colors">
                + {p.nombre} ({p.duracion} min)
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pausas.map(p => (
            <div key={p.id} className={cn('bg-white rounded-2xl p-5 border-[1.5px] shadow-sm transition-all',
              p.activa ? 'border-gray-100' : 'border-red-200 opacity-60')}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h6 className="font-bold text-navy text-base mb-1">{p.nombre}</h6>
                  <span className="bg-blue-50 text-blue-800 text-[0.65rem] px-2.5 py-0.5 rounded-full font-semibold border border-blue-200/50">
                    {TIPOS_JORNADA.find(t => t.value === p.tipo_jornada)?.label || p.tipo_jornada}
                  </span>
                </div>
                <Toggle checked={p.activa} onChange={() => toggleActive(p.id, p.activa)} />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <div className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider">Duración</div>
                  <div className="font-bold text-navy text-lg">{p.duracion_minutos} min</div>
                </div>
                <div>
                  <div className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider">Horario</div>
                  <div className="font-semibold text-slate-500 text-sm">
                    {p.hora_inicio_sugerida && p.hora_fin_sugerida ? `${p.hora_inicio_sugerida.substring(0, 5)}–${p.hora_fin_sugerida.substring(0, 5)}` : 'Flexible'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.es_retribuida && <span className="bg-emerald-50 text-emerald-700 text-[0.65rem] px-2 py-0.5 rounded-md font-semibold">💰 Retribuida</span>}
                {p.notificar_inicio && <span className="bg-amber-50 text-amber-700 text-[0.65rem] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1"><Bell className="w-2.5 h-2.5" /> Inicio</span>}
                {p.notificar_fin && <span className="bg-red-50 text-red-700 text-[0.65rem] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1"><BellOff className="w-2.5 h-2.5" /> Fin</span>}
                {p.notificar_antes_min > 0 && <span className="bg-indigo-50 text-indigo-700 text-[0.65rem] px-2 py-0.5 rounded-md font-semibold">⏰ {p.notificar_antes_min}min antes</span>}
              </div>

              <div className="flex gap-2">
                <button onClick={() => openEdit(p)}
                  className="flex-1 py-1.5 rounded-lg border border-gray-200 bg-transparent text-slate-500 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                <button onClick={() => handleDelete(p.id)}
                  className="py-1.5 px-3 rounded-lg border border-red-200 bg-transparent text-red-500 cursor-pointer hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-in bg-white rounded-2xl p-7 w-full max-w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h5 className="font-bold text-navy text-lg">{editId ? 'Editar Pausa' : 'Nueva Pausa'}</h5>
                <p className="text-slate-400 text-sm mt-1">Configura según el convenio colectivo</p>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editId && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Plantillas rápidas</label>
                <div className="flex flex-wrap gap-2">
                  {presets.map(p => (
                    <button key={p.nombre} onClick={() => applyPreset(p)}
                      className={cn('px-3 py-1 rounded-full text-xs font-semibold border-[1.5px] cursor-pointer transition-all',
                        form.nombre === p.nombre ? 'border-chrono-blue bg-blue-50 text-blue-800' : 'border-gray-200 text-slate-500 bg-transparent')}>
                      {p.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm font-semibold text-slate-600 block mb-1.5">Nombre de la pausa</label>
              <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:border-chrono-blue" placeholder="Ej: Desayuno, Comida..." />
            </div>

            <div className="mb-4">
              <label className="text-sm font-semibold text-slate-600 block mb-1.5">Tipo de jornada</label>
              <div className="flex flex-wrap gap-2">
                {TIPOS_JORNADA.map(t => (
                  <button key={t.value} onClick={() => setForm(f => ({ ...f, tipo_jornada: t.value }))}
                    className={cn('px-3.5 py-1.5 rounded-xl text-sm font-semibold border-[1.5px] cursor-pointer transition-all',
                      form.tipo_jornada === t.value ? 'border-chrono-blue bg-blue-50 text-blue-800' : 'border-gray-200 text-slate-500 bg-transparent')}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-1.5">Duración (min)</label>
                <input type="number" value={form.duracion_minutos} onChange={e => setForm(f => ({ ...f, duracion_minutos: parseInt(e.target.value) || 15 }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:border-chrono-blue" min={5} max={120} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-1.5">Hora inicio</label>
                <input type="time" value={form.hora_inicio_sugerida} onChange={e => setForm(f => ({ ...f, hora_inicio_sugerida: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:border-chrono-blue" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-1.5">Hora fin</label>
                <input type="time" value={form.hora_fin_sugerida} onChange={e => setForm(f => ({ ...f, hora_fin_sugerida: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:border-chrono-blue" />
              </div>
            </div>

            <div className="mb-4 space-y-2">
              {[
                { key: 'es_retribuida' as const, label: 'Pausa retribuida', desc: 'Cuenta como jornada laboral' },
                { key: 'notificar_inicio' as const, label: 'Notificar inicio', desc: 'Aviso cuando empiece' },
                { key: 'notificar_fin' as const, label: 'Notificar fin', desc: 'Aviso cuando termine' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex justify-between items-center px-3 py-2.5 rounded-xl bg-gray-50">
                  <div>
                    <div className="text-sm font-semibold text-navy">{label}</div>
                    <div className="text-[0.7rem] text-slate-400">{desc}</div>
                  </div>
                  <Toggle checked={form[key]} onChange={() => setForm(f => ({ ...f, [key]: !f[key] }))} />
                </div>
              ))}
            </div>

            <div className="mb-5">
              <label className="text-sm font-semibold text-slate-600 block mb-1.5">Avisar X minutos antes de terminar</label>
              <input type="number" value={form.notificar_antes_min} onChange={e => setForm(f => ({ ...f, notificar_antes_min: parseInt(e.target.value) || 0 }))}
                className="w-24 px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:border-chrono-blue" min={0} max={30} />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border-[1.5px] border-gray-200 bg-transparent text-slate-500 cursor-pointer font-semibold text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.nombre.trim()}
                className={cn('flex-[2] py-2.5 rounded-xl border-none bg-gradient-to-br from-navy to-slate-dark text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 transition-opacity',
                  (saving || !form.nombre.trim()) && 'opacity-50 cursor-not-allowed')}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : editId ? 'Guardar cambios' : 'Crear pausa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
