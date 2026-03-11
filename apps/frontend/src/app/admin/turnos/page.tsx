'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Empleado {
  id: string;
  nombre_completo: string;
  puesto: string;
}

interface Turno {
  id: string;
  empleado_id: string;
  dia_semana: number; // 0=Lun, 1=Mar, ... 4=Vie
  hora_inicio: string;
  hora_fin: string;
  tipo: 'mañana' | 'tarde' | 'completo' | 'libre';
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const DIAS_COMPLETOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const TURNO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  mañana:  { bg: 'rgba(245,158,11,0.12)',  text: '#92400E', border: 'rgba(245,158,11,0.3)' },
  tarde:   { bg: 'rgba(99,102,241,0.12)',  text: '#3730A3', border: 'rgba(99,102,241,0.3)' },
  completo:{ bg: 'rgba(16,185,129,0.12)',  text: '#065F46', border: 'rgba(16,185,129,0.3)' },
  libre:   { bg: 'rgba(148,163,184,0.1)',  text: '#64748B', border: 'rgba(148,163,184,0.2)' },
};

export default function TurnosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [turnos, setTurnos]       = useState<Turno[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [success, setSuccess]     = useState('');

  // Modal
  const [showModal, setShowModal]             = useState(false);
  const [modalEmpleado, setModalEmpleado]     = useState<string>('');
  const [modalDia, setModalDia]               = useState<number>(0);
  const [modalTipo, setModalTipo]             = useState<Turno['tipo']>('mañana');
  const [modalInicio, setModalInicio]         = useState('09:00');
  const [modalFin, setModalFin]               = useState('14:00');
  const [editingTurnoId, setEditingTurnoId]   = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: emps }, { data: tur }] = await Promise.all([
      supabase.from('empleados_info').select('id, nombre_completo, puesto').order('nombre_completo'),
      supabase.from('turnos').select('*'),
    ]);
    if (emps) setEmpleados(emps);
    if (tur)  setTurnos(tur);
    setLoading(false);
  };

  const getTurno = (empleadoId: string, dia: number): Turno | undefined =>
    turnos.find(t => t.empleado_id === empleadoId && t.dia_semana === dia);

  const openModal = (empleadoId: string, dia: number) => {
    const existing = getTurno(empleadoId, dia);
    setModalEmpleado(empleadoId);
    setModalDia(dia);
    if (existing) {
      setEditingTurnoId(existing.id);
      setModalTipo(existing.tipo);
      setModalInicio(existing.hora_inicio);
      setModalFin(existing.hora_fin);
    } else {
      setEditingTurnoId(null);
      setModalTipo('mañana');
      setModalInicio('09:00');
      setModalFin('14:00');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      empleado_id: modalEmpleado,
      dia_semana: modalDia,
      tipo: modalTipo,
      hora_inicio: modalInicio,
      hora_fin: modalFin,
    };

    let error;
    if (editingTurnoId) {
      const { error: e } = await supabase.from('turnos').update(payload).eq('id', editingTurnoId);
      error = e;
    } else {
      const { error: e } = await supabase.from('turnos').insert(payload);
      error = e;
    }

    setSaving(false);
    if (!error) {
      setSuccess('Turno guardado correctamente');
      setTimeout(() => setSuccess(''), 3000);
      setShowModal(false);
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!editingTurnoId) return;
    setSaving(true);
    await supabase.from('turnos').delete().eq('id', editingTurnoId);
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      mañana: '☀️ Mañana', tarde: '🌙 Tarde', completo: '📋 Completo', libre: '✈️ Libre',
    };
    return labels[tipo] || tipo;
  };

  // Horas según tipo
  const handleTipoChange = (tipo: Turno['tipo']) => {
    setModalTipo(tipo);
    if (tipo === 'mañana')   { setModalInicio('09:00'); setModalFin('14:00'); }
    if (tipo === 'tarde')    { setModalInicio('15:00'); setModalFin('20:00'); }
    if (tipo === 'completo') { setModalInicio('09:00'); setModalFin('18:00'); }
    if (tipo === 'libre')    { setModalInicio('00:00'); setModalFin('00:00'); }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="anim-fade-up pb-6">

      {/* HEADER */}
      <div className="flex justify-between items-start align-items-md-center mb-4 flex-col flex-md-row gap-3">
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Gestión</p>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Turnos y Horarios
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
            Configura los horarios semanales de tu equipo. Haz clic en cualquier celda para asignar o editar un turno.
          </p>
        </div>
        <div className="flex gap-2">
          {['mañana', 'tarde', 'completo', 'libre'].map((tipo) => {
            const c = TURNO_COLORS[tipo];
            return (
              <span key={tipo} style={{
                padding: '4px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                background: c.bg, color: c.text, border: `1px solid ${c.border}`,
              }}>
                {getTipoLabel(tipo)}
              </span>
            );
          })}
        </div>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="anim-scale-in" style={{
          padding: '12px 16px', borderRadius: 12, marginBottom: '1rem',
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          color: '#065F46', fontSize: '0.875rem', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="bi bi-check-circle-fill" style={{ color: '#10B981' }} /> {success}
        </div>
      )}

      {/* TABLA */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin" style={{ color: '#2563EB', width: 36, height: 36, borderWidth: 3 }} />
        </div>
      ) : empleados.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 20, padding: '4rem 2rem', textAlign: 'center',
          border: '1.5px dashed #E2E8F0',
        }}>
          <i className="bi bi-calendar3" style={{ fontSize: 48, color: '#CBD5E1', display: 'block', marginBottom: 12 }} />
          <h5 style={{ color: '#475569', fontWeight: 700 }}>No hay empleados</h5>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Añade empleados primero desde la sección Usuarios.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(15,23,42,0.08)', border: '1px solid #E2E8F0' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', width: 200 }}>
                    Empleado
                  </th>
                  {DIAS.map((dia, i) => (
                    <th key={dia} style={{ padding: '14px 12px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <div>{dia}</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 400, color: '#94A3B8', textTransform: 'none', letterSpacing: 0 }}>
                        {DIAS_COMPLETOS[i]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empleados.map((emp, idx) => (
                  <tr key={emp.id} style={{ borderBottom: idx < empleados.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: `hsl(${emp.nombre_completo.charCodeAt(0) * 7 % 360}, 60%, 45%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '0.75rem', fontWeight: 700,
                        }}>
                          {getInitials(emp.nombre_completo)}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{emp.nombre_completo}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{emp.puesto || 'Sin puesto'}</div>
                        </div>
                      </div>
                    </td>
                    {[0, 1, 2, 3, 4].map((dia) => {
                      const turno = getTurno(emp.id, dia);
                      const c = turno ? TURNO_COLORS[turno.tipo] : null;
                      return (
                        <td key={dia} style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <button
                            onClick={() => openModal(emp.id, dia)}
                            title={turno ? `${getTipoLabel(turno.tipo)} · ${turno.hora_inicio}-${turno.hora_fin}` : 'Asignar turno'}
                            style={{
                              width: '100%', minWidth: 90, padding: '8px 6px', borderRadius: 10,
                              border: turno ? `1px solid ${c!.border}` : '1.5px dashed #E2E8F0',
                              background: turno ? c!.bg : 'transparent',
                              cursor: 'pointer', transition: 'all 0.15s',
                              fontSize: '0.7rem', fontWeight: 600, color: turno ? c!.text : '#CBD5E1',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = turno ? c!.border : '#94A3B8'; e.currentTarget.style.opacity = '0.85'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                          >
                            {turno ? (
                              <>
                                <div style={{ marginBottom: 2 }}>{turno.tipo.charAt(0).toUpperCase() + turno.tipo.slice(1)}</div>
                                <div style={{ fontWeight: 400, opacity: 0.8 }}>{turno.hora_inicio}–{turno.hora_fin}</div>
                              </>
                            ) : (
                              <span style={{ fontSize: '1rem' }}>+</span>
                            )}
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

      {/* MODAL */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="anim-scale-in"
            style={{ background: 'white', borderRadius: 20, padding: '1.75rem', width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(15,23,42,0.25)' }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h5 style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {editingTurnoId ? 'Editar Turno' : 'Asignar Turno'}
                </h5>
                <p style={{ color: '#64748B', fontSize: '0.8125rem', margin: '4px 0 0' }}>
                  {DIAS_COMPLETOS[modalDia]} — {empleados.find(e => e.id === modalEmpleado)?.nombre_completo}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1.25rem', padding: 4 }}>
                <i className="bi bi-x" />
              </button>
            </div>

            {/* Tipo */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Tipo de turno</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['mañana', 'tarde', 'completo', 'libre'] as Turno['tipo'][]).map((tipo) => {
                  const c = TURNO_COLORS[tipo];
                  const selected = modalTipo === tipo;
                  return (
                    <button key={tipo} onClick={() => handleTipoChange(tipo)} style={{
                      padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${selected ? c.border : '#E2E8F0'}`,
                      background: selected ? c.bg : 'transparent', color: selected ? c.text : '#64748B',
                      cursor: 'pointer', fontSize: '0.875rem', fontWeight: selected ? 700 : 500, textAlign: 'left',
                      transition: 'all 0.15s',
                    }}>
                      {getTipoLabel(tipo)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horas */}
            {modalTipo !== 'libre' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Hora entrada</label>
                  <input type="time" value={modalInicio} onChange={e => setModalInicio(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" style={{ fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Hora salida</label>
                  <input type="time" value={modalFin} onChange={e => setModalFin(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm" style={{ fontWeight: 600 }} />
                </div>
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 8 }}>
              {editingTurnoId && (
                <button onClick={handleDelete} disabled={saving} style={{
                  padding: '10px 16px', borderRadius: 10, border: '1.5px solid #FEE2E2',
                  background: 'rgba(239,68,68,0.06)', color: '#B91C1C',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                }}>
                  <i className="bi bi-trash" />
                </button>
              )}
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0',
                background: 'transparent', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
              }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 2, padding: '10px 16px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                color: 'white', cursor: saving ? 'wait' : 'pointer', fontWeight: 700, fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {saving ? <><span className="animate-spin animate-spin w-4 h-4" style={{ width: 14, height: 14, borderWidth: 2 }} /> Guardando...</> : 'Guardar turno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
