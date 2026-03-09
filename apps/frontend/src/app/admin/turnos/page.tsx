'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Empleado = { id: string; nombre_completo: string; };
type Turno = {
    id: string;
    empleado_id: string;
    dia_semana: number; // 0=Lun, 1=Mar, ... 4=Vie
    hora_inicio: string;
    hora_fin: string;
    empleados_info?: { nombre_completo: string };
};

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const TURNOS_PREDEFINIDOS = [
    { label: 'Mañana (08:00 – 16:00)', inicio: '08:00', fin: '16:00' },
    { label: 'Tarde (16:00 – 00:00)', inicio: '16:00', fin: '00:00' },
    { label: 'Noche (00:00 – 08:00)', inicio: '00:00', fin: '08:00' },
    { label: 'Partido (09:00 – 14:00 / 16:00 – 19:00)', inicio: '09:00', fin: '19:00' },
    { label: 'Jornada Completa (09:00 – 18:00)', inicio: '09:00', fin: '18:00' },
    { label: 'Media Jornada (09:00 – 13:00)', inicio: '09:00', fin: '13:00' },
];

export default function TurnosPage() {
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hasTurnosTable, setHasTurnosTable] = useState(true);

    // Form state
    const [form, setForm] = useState({
        empleado_id: '',
        dia_semana: 0,
        hora_inicio: '09:00',
        hora_fin: '18:00',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar empleados
            const { data: emps } = await supabase
                .from('empleados_info')
                .select('id, nombre_completo')
                .order('nombre_completo');
            setEmpleados(emps || []);

            // Intentar cargar turnos (la tabla puede no existir)
            const { data: turnosData, error: turnosErr } = await supabase
                .from('turnos')
                .select('*, empleados_info(nombre_completo)')
                .order('dia_semana');

            if (turnosErr) {
                // La tabla aún no existe — mostrar UI de creación
                setHasTurnosTable(false);
            } else {
                setTurnos(turnosData || []);
                setHasTurnosTable(true);
            }
        } catch {
            setHasTurnosTable(false);
        } finally {
            setLoading(false);
        }
    };

    const applyPreset = (preset: typeof TURNOS_PREDEFINIDOS[0]) => {
        setForm(f => ({ ...f, hora_inicio: preset.inicio, hora_fin: preset.fin }));
    };

    const handleSave = async () => {
        if (!form.empleado_id) { setError('Selecciona un empleado.'); return; }
        setSaving(true);
        setError('');
        try {
            const { error: insertErr } = await supabase.from('turnos').insert({
                empleado_id: form.empleado_id,
                dia_semana: form.dia_semana,
                hora_inicio: form.hora_inicio,
                hora_fin: form.hora_fin,
            });
            if (insertErr) throw insertErr;
            setSuccess('Turno asignado correctamente.');
            setShowForm(false);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Error al guardar.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este turno?')) return;
        await supabase.from('turnos').delete().eq('id', id);
        loadData();
    };

    // Agrupar turnos por empleado
    const turnosPorEmpleado = turnos.reduce((acc: Record<string, Turno[]>, t) => {
        const nombre = t.empleados_info?.nombre_completo || t.empleado_id;
        if (!acc[nombre]) acc[nombre] = [];
        acc[nombre].push(t);
        return acc;
    }, {});

    return (
        <div className="pb-5 anim-fade-up">

            {/* HEADER */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div>
                    <h2 className="fw-bold text-dark mb-1" style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', letterSpacing: '-0.02em' }}>
                        Turnos y Horarios
                    </h2>
                    <p className="text-secondary mb-0">Asigna y gestiona los horarios semanales del equipo.</p>
                </div>
                {hasTurnosTable && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn fw-bold px-4 py-2 d-flex align-items-center gap-2"
                        style={{
                            background: showForm ? '#F1F5F9' : '#0F172A',
                            color: showForm ? '#475569' : 'white',
                            border: 'none', borderRadius: 12,
                            boxShadow: showForm ? 'none' : '0 4px 12px rgba(15,23,42,0.2)',
                        }}
                    >
                        <i className={`bi bi-${showForm ? 'x-lg' : 'plus-lg'}`} />
                        {showForm ? 'Cancelar' : 'Asignar Turno'}
                    </button>
                )}
            </div>

            {/* ALERTS */}
            {success && (
                <div className="alert border-0 mb-4 anim-scale-in d-flex align-items-center gap-2"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#065F46', borderRadius: 12 }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#10B981' }} /> {success}
                </div>
            )}
            {error && (
                <div className="alert border-0 mb-4 anim-scale-in d-flex align-items-center gap-2"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#B91C1C', borderRadius: 12 }}>
                    <i className="bi bi-exclamation-circle-fill" style={{ color: '#EF4444' }} /> {error}
                </div>
            )}

            {/* TABLA NO EXISTE */}
            {!hasTurnosTable && !loading && (
                <div className="card border-0 p-5 text-center" style={{
                    background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)',
                    borderRadius: 20, border: '1px solid rgba(226,232,240,0.6)',
                    boxShadow: '0 16px 40px rgba(15,23,42,0.08)',
                }}>
                    <i className="bi bi-calendar3 display-2 mb-3" style={{ color: '#CBD5E1' }} />
                    <h4 className="fw-bold mb-2" style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
                        Módulo de Turnos
                    </h4>
                    <p className="text-secondary mb-4" style={{ maxWidth: 380, margin: '0 auto 1.5rem' }}>
                        Para activar este módulo, ejecuta el siguiente SQL en tu base de datos Supabase:
                    </p>
                    <div style={{
                        background: '#0F172A', borderRadius: 12, padding: '1.25rem 1.5rem',
                        textAlign: 'left', maxWidth: 560, margin: '0 auto',
                    }}>
                        <pre className="mb-0" style={{ color: '#7DD3FC', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                            {`CREATE TABLE IF NOT EXISTS turnos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id uuid REFERENCES empleados_info(id) ON DELETE CASCADE,
  dia_semana int2 NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage turnos" ON turnos
  USING (true) WITH CHECK (true);`}
                        </pre>
                    </div>
                </div>
            )}

            {/* FORMULARIO */}
            {showForm && hasTurnosTable && (
                <div className="card border-0 mb-4 p-4 anim-scale-in" style={{
                    background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)',
                    borderRadius: 20, border: '1px solid rgba(226,232,240,0.6)',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                }}>
                    <h6 className="fw-bold mb-4" style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
                        Nuevo Turno
                    </h6>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-secondary">Empleado</label>
                            <select className="form-select" value={form.empleado_id}
                                onChange={e => setForm(f => ({ ...f, empleado_id: e.target.value }))}>
                                <option value="">Seleccionar empleado...</option>
                                {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre_completo}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-secondary">Día de la semana</label>
                            <select className="form-select" value={form.dia_semana}
                                onChange={e => setForm(f => ({ ...f, dia_semana: Number(e.target.value) }))}>
                                {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                            </select>
                        </div>
                        <div className="col-12">
                            <label className="form-label fw-semibold small text-secondary">Turno predefinido</label>
                            <div className="d-flex flex-wrap gap-2">
                                {TURNOS_PREDEFINIDOS.map((p, i) => (
                                    <button key={i} type="button" onClick={() => applyPreset(p)}
                                        className="btn btn-sm"
                                        style={{
                                            borderRadius: 8, fontSize: '0.78rem',
                                            background: form.hora_inicio === p.inicio && form.hora_fin === p.fin
                                                ? '#0F172A' : '#F1F5F9',
                                            color: form.hora_inicio === p.inicio && form.hora_fin === p.fin
                                                ? 'white' : '#475569',
                                            border: 'none', fontWeight: 500,
                                        }}>
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="col-6">
                            <label className="form-label fw-semibold small text-secondary">Hora inicio</label>
                            <input type="time" className="form-control" value={form.hora_inicio}
                                onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
                        </div>
                        <div className="col-6">
                            <label className="form-label fw-semibold small text-secondary">Hora fin</label>
                            <input type="time" className="form-control" value={form.hora_fin}
                                onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} />
                        </div>
                        <div className="col-12 d-flex justify-content-end gap-2 pt-2">
                            <button onClick={() => setShowForm(false)} className="btn btn-light px-4" style={{ borderRadius: 10 }}>
                                Cancelar
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="btn px-4 fw-bold"
                                style={{ background: '#0F172A', color: 'white', borderRadius: 10, border: 'none' }}>
                                {saving ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</> : 'Guardar Turno'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CARGANDO */}
            {loading && (
                <div className="text-center py-5">
                    <div className="spinner-border" style={{ color: '#0F172A' }} />
                </div>
            )}

            {/* TURNOS POR EMPLEADO */}
            {!loading && hasTurnosTable && Object.keys(turnosPorEmpleado).length === 0 && (
                <div className="text-center py-5" style={{
                    background: 'white', borderRadius: 20,
                    border: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(15,23,42,0.04)',
                }}>
                    <i className="bi bi-calendar-x display-2 mb-3 d-block" style={{ color: '#CBD5E1' }} />
                    <h5 className="fw-bold mb-2">No hay turnos asignados</h5>
                    <p className="text-secondary small">Pulsa &ldquo;Asignar Turno&rdquo; para comenzar a configurar los horarios del equipo.</p>
                </div>
            )}

            {!loading && hasTurnosTable && Object.keys(turnosPorEmpleado).length > 0 && (
                <div className="d-grid gap-4">
                    {Object.entries(turnosPorEmpleado).map(([nombre, tList]) => (
                        <div key={nombre} className="card border-0 overflow-hidden" style={{
                            borderRadius: 18, border: '1px solid rgba(226,232,240,0.5)',
                            boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
                        }}>
                            {/* Cabecera empleado */}
                            <div className="d-flex align-items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <i className="bi bi-person-fill" style={{ color: 'white', fontSize: '1rem' }} />
                                </div>
                                <div>
                                    <div className="fw-bold" style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', fontSize: '0.9375rem' }}>
                                        {nombre}
                                    </div>
                                    <small className="text-secondary">{tList.length} turno{tList.length !== 1 ? 's' : ''} asignado{tList.length !== 1 ? 's' : ''}</small>
                                </div>
                            </div>

                            {/* Cuadrícula semanal */}
                            <div className="p-4">
                                <div className="d-flex flex-wrap gap-2">
                                    {DIAS.map((dia, idx) => {
                                        const t = tList.find(t => t.dia_semana === idx);
                                        return (
                                            <div key={idx} style={{
                                                flex: '1 1 calc(14.28% - 8px)', minWidth: 90,
                                                padding: '10px 12px', borderRadius: 12,
                                                background: t ? 'rgba(37,99,235,0.06)' : '#F8FAFC',
                                                border: `1.5px solid ${t ? 'rgba(37,99,235,0.15)' : '#E2E8F0'}`,
                                            }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                                                    {dia.slice(0, 3)}
                                                </div>
                                                {t ? (
                                                    <>
                                                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                                                            {t.hora_inicio.slice(0, 5)}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                                            → {t.hora_fin.slice(0, 5)}
                                                        </div>
                                                        <button
                                                            onClick={() => handleDelete(t.id)}
                                                            className="btn p-0 mt-2"
                                                            style={{ fontSize: '0.7rem', color: '#EF4444', border: 'none', background: 'none' }}
                                                            title="Eliminar turno"
                                                        >
                                                            <i className="bi bi-trash3" /> Quitar
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>Libre</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
