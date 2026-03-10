'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type ProcessedFichaje = {
  id: string;
  empleado_nombre: string;
  date: string;
  entry: string;
  exit: string;
  total: string;
  status: 'valid' | 'progress' | 'incident';
};

function formatDateRange(): { start: string; end: string } {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 30);
  return {
    start: start.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  };
}

export default function AdminFichajesPage() {
  const [fichajes, setFichajes]         = useState<ProcessedFichaje[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'incident' | 'progress'>('all');
  const [dateFrom, setDateFrom]         = useState(formatDateRange().start);
  const [dateTo, setDateTo]             = useState(formatDateRange().end);

  const fetchFichajes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fichajes')
        .select('*, empleados_info(nombre_completo)')
        .gte('fecha', dateFrom)
        .lte('fecha', dateTo)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      if (data) setFichajes(processFichajes(data));
    } catch (err) {
      console.error('Error cargando fichajes:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchFichajes();
  }, [fetchFichajes]);

  const processFichajes = (data: any[]): ProcessedFichaje[] => {
    return data.map((f) => {
      try {
        let start: Date;
        if (f.hora_entrada?.includes('T') || f.hora_entrada?.includes('Z')) {
          start = new Date(f.hora_entrada);
        } else {
          const [h, m, s] = (f.hora_entrada || '00:00:00').split(':').map(Number);
          start = new Date(f.fecha);
          start.setHours(h, m, s || 0);
        }

        let end: Date | null = null;
        if (f.hora_salida) {
          if (f.hora_salida.includes('T') || f.hora_salida.includes('Z')) {
            end = new Date(f.hora_salida);
          } else {
            const [h, m, s] = f.hora_salida.split(':').map(Number);
            end = new Date(f.fecha);
            end.setHours(h, m, s || 0);
          }
        }

        const now = new Date();
        const isValidDate = !isNaN(start.getTime());

        const dateStr = isValidDate
          ? start.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
          : f.fecha;

        const entryTime = isValidDate
          ? start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : f.hora_entrada;

        const exitTime = end && !isNaN(end.getTime())
          ? end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : f.hora_salida || '--:--';

        let duration = '--h --m';
        if (end && !isNaN(end.getTime()) && isValidDate) {
          const diff = end.getTime() - start.getTime();
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          duration = `${h}h ${m.toString().padStart(2, '0')}m`;
        } else if (!f.hora_salida && isValidDate && start.toDateString() === now.toDateString()) {
          const diff = now.getTime() - start.getTime();
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          duration = `↑ ${h}h ${m}m`;
        }

        let status: ProcessedFichaje['status'] = 'valid';
        if (!f.hora_salida && isValidDate) {
          status = start.toDateString() === now.toDateString() ? 'progress' : 'incident';
        }

        return {
          id: f.id,
          empleado_nombre: f.empleados_info?.nombre_completo || 'Sin nombre',
          date: dateStr.charAt(0).toUpperCase() + dateStr.slice(1),
          entry: entryTime,
          exit: exitTime,
          total: duration,
          status,
        };
      } catch {
        return {
          id: f.id,
          empleado_nombre: f.empleados_info?.nombre_completo || 'Sin nombre',
          date: f.fecha || '-', entry: f.hora_entrada || '-',
          exit: f.hora_salida || '--:--', total: '--h --m', status: 'incident',
        };
      }
    });
  };

  const filtered = fichajes.filter((f) => {
    const matchSearch = !search || f.empleado_nombre.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusConfig = {
    valid:    { label: 'Válido',    bg: 'rgba(16,185,129,0.1)',  text: '#065F46', border: 'rgba(16,185,129,0.25)', dot: '#10B981' },
    incident: { label: 'Incidencia', bg: 'rgba(239,68,68,0.1)', text: '#B91C1C', border: 'rgba(239,68,68,0.25)',  dot: '#EF4444' },
    progress: { label: 'En curso',   bg: 'rgba(37,99,235,0.1)', text: '#1E3A8A', border: 'rgba(37,99,235,0.25)', dot: '#2563EB' },
  };

  const stats = {
    total: fichajes.length,
    valid: fichajes.filter(f => f.status === 'valid').length,
    incident: fichajes.filter(f => f.status === 'incident').length,
    progress: fichajes.filter(f => f.status === 'progress').length,
  };

  return (
    <div className="anim-fade-up pb-5">

      {/* HEADER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Admin</p>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 0 }}>
            Fichajes del Personal
          </h2>
        </div>
        {/* Filtro de fechas */}
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="form-control form-control-sm" style={{ maxWidth: 140, fontSize: '0.85rem' }} />
          <span style={{ color: '#94A3B8', fontSize: '0.875rem' }}>–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="form-control form-control-sm" style={{ maxWidth: 140, fontSize: '0.85rem' }} />
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total fichajes', value: stats.total, icon: 'bi-clock-history', color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
          { label: 'Válidos', value: stats.valid, icon: 'bi-check-circle-fill', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'En curso', value: stats.progress, icon: 'bi-play-circle-fill', color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
          { label: 'Incidencias', value: stats.incident, icon: 'bi-exclamation-circle-fill', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
        ].map((s, i) => (
          <div key={i} className="col-6 col-lg-3">
            <div style={{
              background: 'white', borderRadius: 16, padding: '16px 20px',
              border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: '0.9rem' }} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '16px 20px', marginBottom: 16,
        border: '1px solid #E2E8F0', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text" placeholder="Buscar empleado..." value={search}
            onChange={e => setSearch(e.target.value)} className="form-control"
            style={{ paddingLeft: 36, background: '#F8FAFC' }}
          />
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {(['all', 'valid', 'progress', 'incident'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 14px', borderRadius: 999, fontSize: '0.8125rem', fontWeight: 600,
                border: filterStatus === s ? '1.5px solid #0F172A' : '1.5px solid #E2E8F0',
                background: filterStatus === s ? '#0F172A' : 'transparent',
                color: filterStatus === s ? 'white' : '#64748B',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {s === 'all' ? 'Todos' : statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA */}
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border" style={{ color: '#2563EB', width: 36, height: 36, borderWidth: 3 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 20, padding: '4rem 2rem', textAlign: 'center', border: '1.5px dashed #E2E8F0' }}>
          <i className="bi bi-clock-history" style={{ fontSize: 48, color: '#CBD5E1', display: 'block', marginBottom: 12 }} />
          <h5 style={{ color: '#475569', fontWeight: 700 }}>No hay fichajes</h5>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Ajusta el rango de fechas o los filtros.</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="d-none d-md-block" style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(15,23,42,0.08)', border: '1px solid #E2E8F0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Empleado', 'Fecha', 'Entrada', 'Salida', 'Total', 'Estado'].map((h) => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, idx) => {
                  const sc = statusConfig[f.status];
                  return (
                    <tr key={f.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #F1F5F9' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: `hsl(${f.empleado_nombre.charCodeAt(0) * 7 % 360}, 55%, 45%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                          }}>
                            {f.empleado_nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>{f.empleado_nombre}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#475569', fontSize: '0.875rem' }}>{f.date}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>{f.entry}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>{f.exit}</td>
                      <td style={{ padding: '14px 20px', color: '#475569', fontSize: '0.875rem', fontWeight: 500 }}>{f.total}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '4px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700,
                          background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                          {sc.label.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '12px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                Mostrando {filtered.length} de {fichajes.length} registros
              </span>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="d-md-none d-grid gap-3">
            {filtered.map((f) => {
              const sc = statusConfig[f.status];
              return (
                <div key={f.id} style={{ background: 'white', borderRadius: 16, padding: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: `hsl(${f.empleado_nombre.charCodeAt(0) * 7 % 360}, 55%, 45%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                      }}>
                        {f.empleado_nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>{f.empleado_nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{f.date}</div>
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700,
                      background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                    }}>
                      {sc.label.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[['Entrada', f.entry], ['Salida', f.exit], ['Total', f.total]].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
