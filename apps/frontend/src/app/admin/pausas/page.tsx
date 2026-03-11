'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PausaConfig {
  id: string;
  nombre: string;
  tipo_jornada: string;
  duracion_minutos: number;
  hora_inicio_sugerida: string | null;
  hora_fin_sugerida: string | null;
  es_retribuida: boolean;
  activa: boolean;
  notificar_inicio: boolean;
  notificar_fin: boolean;
  notificar_antes_min: number;
}

const TIPOS_JORNADA = [
  { value: 'mañana', label: '☀️ Mañana' },
  { value: 'tarde', label: '🌙 Tarde' },
  { value: 'completo', label: '📋ompleta' },
  { value: 'noche', label: '🌑 Noche' },
];

export default function AdminPausasPage() {
  const [pausas, setPausas] = useState<PausaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: 'Desayuno',
    tipo_jornada: 'mañana',
    duracion_minutos: 15,
    hora_inicio_sugerida: '10:30',
    hora_fin_sugerida: '10:45',
    es_retribuida: true,
    activa: true,
    notificar_inicio: true,
    notificar_fin: true,
    notificar_antes_min: 3,
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
    setForm({
      nombre: '', tipo_jornada: 'completo', duracion_minutos: 15,
      hora_inicio_sugerida: '10:30', hora_fin_sugerida: '10:45',
      es_retribuida: true, activa: true, notificar_inicio: true,
      notificar_fin: true, notificar_antes_min: 3,
    });
    setShowModal(true);
  };

  const openEdit = (p: PausaConfig) => {
    setEditId(p.id);
    setForm({
      nombre: p.nombre,
      tipo_jornada: p.tipo_jornada,
      duracion_minutos: p.duracion_minutos,
      hora_inicio_sugerida: p.hora_inicio_sugerida || '',
      hora_fin_sugerida: p.hora_fin_sugerida || '',
      es_retribuida: p.es_retribuida,
      activa: p.activa,
      notificar_inicio: p.notificar_inicio,
      notificar_fin: p.notificar_fin,
      notificar_antes_min: p.notificar_antes_min,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);

    const payload = {
      nombre: form.nombre,
      tipo_jornada: form.tipo_jornada,
      duracion_minutos: form.duracion_minutos,
      hora_inicio_sugerida: form.hora_inicio_sugerida || null,
      hora_fin_sugerida: form.hora_fin_sugerida || null,
      es_retribuida: form.es_retribuida,
      activa: form.activa,
      notificar_inicio: form.notificar_inicio,
      notificar_fin: form.notificar_fin,
      notificar_antes_min: form.notificar_antes_min,
    };

    if (editId) {
      await supabase.from('configuracion_pausas').update(payload).eq('id', editId);
    } else {
      await supabase.from('configuracion_pausas').insert(payload);
    }

    setSaving(false);
    setShowModal(false);
    setSuccess(editId ? 'Pausa actualizada' : 'Pausa creada');
    setTimeout(() => setSuccess(''), 3000);
    fetchPausas();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta pausa?')) return;
    await supabase.from('configuracion_pausas').delete().eq('id', id);
    fetchPausas();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('configuracion_pausas').update({ activa: !current }).eq('id', id);
    fetchPausas();
  };

  const presets = [
    { nombre: 'Desayuno', tipo: 'mañana', duracion: 15, inicio: '10:30', fin: '10:45' },
    { nombre: 'Comida', tipo: 'completo', duracion: 60, inicio: '14:00', fin: '15:00' },
    { nombre: 'Merienda', tipo: 'tarde', duracion: 15, inicio: '18:00', fin: '18:15' },
    { nombre: 'Cena', tipo: 'noche', duracion: 30, inicio: '21:00', fin: '21:30' },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setForm(prev => ({
      ...prev,
      nombre: p.nombre,
      tipo_jornada: p.tipo,
      duracion_minutos: p.duracion,
      hora_inicio_sugerida: p.inicio,
      hora_fin_sugerida: p.fin,
    }));
  };

  return (
    <div className="anim-fade-up pb-6">

      {/* HEADER */}
      <div className="flex flex-col flex-md-row justify-between align-items-md-center mb-4 gap-3">
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Configuración · Convenio</p>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Pausas y Descansos
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem', margin: 0 }}>
            Configura los tiempos de descanso según el convenio. Art. 34.4 ET: mínimo 15 min si jornada &gt; 6h.
          </p>
        </div>
        <button onClick={openNew} style={{
          padding: '10px 20px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #0F172A, #1E293B)',
          color: 'white', fontWeight: 700, fontSize: '0.875rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="bi bi-plus-lg" /> Nueva pausa
        </button>
      </div>

      {/* INFO */}
      <div style={{
        background: 'rgba(37,99,235,0.06)', borderRadius: 14, padding: '14px 18px', marginBottom: '1.25rem',
        border: '1px solid rgba(37,99,235,0.15)', display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <i className="bi bi-info-circle-fill" style={{ color: '#2563EB', fontSize: '1rem', marginTop: 2 }} />
        <div style={{ fontSize: '0.8125rem', color: '#1E3A8A', lineHeight: 1.6 }}>
          <strong>Normativa española (Art. 34.4 ET):</strong> Jornada continua &gt;6h → descanso mínimo 15 min.
          El convenio decide la duración exacta y si es <strong>retribuida</strong>.
          Durante la pausa, la app <strong>no registra ubicación GPS</strong>.
        </div>
      </div>

      {success && (
        <div className="anim-scale-in" style={{
          padding: '10px 16px', borderRadius: 10, marginBottom: '1rem',
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          color: '#065F46', fontSize: '0.8125rem', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="bi bi-check-circle-fill" style={{ color: '#10B981' }} /> {success}
        </div>
      )}

      {/* CARDS */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin" style={{ color: '#2563EB', width: 36, height: 36, borderWidth: 3 }} />
        </div>
      ) : pausas.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 20, padding: '3rem 2rem', textAlign: 'center',
          border: '1.5px dashed #E2E8F0',
        }}>
          <i className="bi bi-cup-hot" style={{ fontSize: 48, color: '#CBD5E1', display: 'block', marginBottom: 12 }} />
          <h5 style={{ color: '#475569', fontWeight: 700, marginBottom: 8 }}>Sin pausas configuradas</h5>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: 16 }}>
            Crea pausas según tu convenio colectivo. Ejemplos: desayuno, comida, merienda.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {presets.map((p) => (
              <button key={p.nombre} onClick={() => { openNew(); setTimeout(() => applyPreset(p), 50); }} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: '0.8125rem', fontWeight: 600,
                border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', cursor: 'pointer',
              }}>
                + {p.nombre} ({p.duracion} min)
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="row gap-3">
          {pausas.map((p) => (
            <div key={p.id} className="col-span-12 md:col-span-6 lg:col-span-4">
              <div style={{
                background: 'white', borderRadius: 16, padding: '1.25rem',
                border: `1.5px solid ${p.activa ? '#E2E8F0' : '#FEE2E2'}`,
                opacity: p.activa ? 1 : 0.6, transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h6 style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                      {p.nombre}
                    </h6>
                    <span style={{
                      padding: '2px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
                      background: 'rgba(37,99,235,0.08)', color: '#1E3A8A', border: '1px solid rgba(37,99,235,0.15)',
                    }}>
                      {TIPOS_JORNADA.find(t => t.value === p.tipo_jornada)?.label || p.tipo_jornada}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleActive(p.id, p.activa)}
                    title={p.activa ? 'Desactivar' : 'Activar'}
                    style={{
                      width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: p.activa ? '#10B981' : '#CBD5E1', transition: 'background 0.2s',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      position: 'absolute', top: 3,
                      left: p.activa ? 21 : 3, transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duración</div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>{p.duracion_minutos} min</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Horario</div>
                    <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
                      {p.hora_inicio_sugerida && p.hora_fin_sugerida
                        ? `${p.hora_inicio_sugerida.substring(0,5)}–${p.hora_fin_sugerida.substring(0,5)}`
                        : 'Flexible'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {p.es_retribuida && (
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#065F46' }}>
                      💰 Retribuida
                    </span>
                  )}
                  {p.notificar_inicio && (
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: '#92400E' }}>
                      🔔 Aviso inicio
                    </span>
                  )}
                  {p.notificar_fin && (
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#B91C1C' }}>
                      🔔 Aviso fin
                    </span>
                  )}
                  {p.notificar_antes_min > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: '#3730A3' }}>
                      ⏰ {p.notificar_antes_min}min antes
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(p)} style={{
                    flex: 1, padding: '6px', borderRadius: 8, border: '1px solid #E2E8F0',
                    background: 'transparent', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: '#475569',
                  }}>
                    <i className="bi bi-pencil mr-1" /> Editar
                  </button>
                  <button onClick={() => handleDelete(p.id)} style={{
                    padding: '6px 10px', borderRadius: 8, border: '1px solid #FEE2E2',
                    background: 'transparent', cursor: 'pointer', color: '#DC2626', fontSize: '0.8125rem',
                  }}>
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="anim-scale-in"
            style={{ background: 'white', borderRadius: 20, padding: '1.75rem', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h5 style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {editId ? 'Editar Pausa' : 'Nueva Pausa'}
                </h5>
                <p style={{ color: '#64748B', fontSize: '0.8125rem', margin: '4px 0 0' }}>
                  Configura según el convenio colectivo
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1.25rem' }}>
                <i className="bi bi-x" />
              </button>
            </div>

            {!editId && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: 6, display: 'block' }}>Plantillas rápidas</label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button key={p.nombre} onClick={() => applyPreset(p)} style={{
                      padding: '4px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                      border: form.nombre === p.nombre ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                      background: form.nombre === p.nombre ? 'rgba(37,99,235,0.08)' : 'transparent',
                      color: form.nombre === p.nombre ? '#1E3A8A' : '#64748B', cursor: 'pointer',
                    }}>
                      {p.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nombre */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nombre de la pausa</label>
              <input type="text" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" placeholder="Ej: Desayuno, Comida..." />
            </div>

            {/* Tipo jornada */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Tipo de jornada</label>
              <div className="flex flex-wrap gap-2">
                {TIPOS_JORNADA.map(t => (
                  <button key={t.value} onClick={() => setForm(f => ({...f, tipo_jornada: t.value}))}
                    style={{
                      padding: '6px 14px', borderRadius: 10, fontSize: '0.8125rem', fontWeight: 600,
                      border: form.tipo_jornada === t.value ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                      background: form.tipo_jornada === t.value ? 'rgba(37,99,235,0.08)' : 'transparent',
                      color: form.tipo_jornada === t.value ? '#1E3A8A' : '#64748B', cursor: 'pointer',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duración + Horario */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Duración (min)</label>
                <input type="number" value={form.duracion_minutos} onChange={e => setForm(f => ({...f, duracion_minutos: parseInt(e.target.value) || 15}))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" min={5} max={120} style={{ fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Hora inicio</label>
                <input type="time" value={form.hora_inicio_sugerida} onChange={e => setForm(f => ({...f, hora_inicio_sugerida: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Hora fin</label>
                <input type="time" value={form.hora_fin_sugerida} onChange={e => setForm(f => ({...f, hora_fin_sugerida: e.target.value}))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" />
              </div>
            </div>

            {/* Toggles */}
            <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'es_retribuida', label: 'Pausa retribuida', desc: 'Cuenta como jornada laboral' },
                { key: 'notificar_inicio', label: 'Notificar inicio', desc: 'Aviso cuando empiece' },
                { key: 'notificar_fin', label: 'Notificar fin', desc: 'Aviso cuando termine' },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: '#F8FAFC' }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>{label}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{desc}</div>
                  </div>
                  <button onClick={() => setForm(f => ({...f, [key]: !(f as any)[key]}))} style={{
                    width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: (form as any)[key] ? '#10B981' : '#CBD5E1', position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      position: 'absolute', top: 3,
                      left: (form as any)[key] ? 21 : 3, transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              ))}
            </div>

            {/* Minutos antes */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Avisar X minutos antes de terminar
              </label>
              <input type="number" value={form.notificar_antes_min}
                onChange={e => setForm(f => ({...f, notificar_antes_min: parseInt(e.target.value) || 0}))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" min={0} max={30} style={{ maxWidth: 100, fontWeight: 700 }} />
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #E2E8F0',
                background: 'transparent', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
              }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.nombre.trim()} style={{
                flex: 2, padding: '10px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                color: 'white', cursor: saving ? 'wait' : 'pointer', fontWeight: 700, fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: !form.nombre.trim() ? 0.5 : 1,
              }}>
                {saving ? <><span className="animate-spin animate-spin w-4 h-4" style={{ width: 14, height: 14, borderWidth: 2 }} /> Guardando...</> : editId ? 'Guardar cambios' : 'Crear pausa'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
