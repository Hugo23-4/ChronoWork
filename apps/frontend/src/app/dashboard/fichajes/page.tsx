'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type ProcessedFichaje = {
  id: string;
  date: string;
  entry: string;
  exit: string;
  total: string;
  status: 'valid' | 'progress' | 'incident';
};

export default function FichajesPage() {
  const { user } = useAuth();
  const [fichajes, setFichajes] = useState<ProcessedFichaje[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchFichajes();
  }, [user]);

  const fetchFichajes = async () => {
    try {
      const { data, error } = await supabase
        .from('fichajes')
        .select('*')
        .eq('empleado_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) setFichajes(processFichajes(data));
    } catch (err) {
      console.error('Error cargando fichajes:', err);
    } finally {
      setLoading(false);
    }
  };

  const processFichajes = (data: any[]) => {
    return data.map((f) => {
      try {
        // Parsear hora_entrada
        let start: Date;
        if (f.hora_entrada.includes('T') || f.hora_entrada.includes('Z')) {
          start = new Date(f.hora_entrada);
        } else {
          const [hours, minutes, seconds] = f.hora_entrada.split(':').map(Number);
          start = new Date(f.fecha);
          start.setHours(hours, minutes, seconds || 0);
        }

        // Parsear hora_salida
        let end: Date | null = null;
        if (f.hora_salida) {
          if (f.hora_salida.includes('T') || f.hora_salida.includes('Z')) {
            end = new Date(f.hora_salida);
          } else {
            const [hours, minutes, seconds] = f.hora_salida.split(':').map(Number);
            end = new Date(f.fecha);
            end.setHours(hours, minutes, seconds || 0);
          }
        }

        const now = new Date();

        const dateStr = isNaN(start.getTime())
          ? f.fecha
          : start.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

        const entryTime = isNaN(start.getTime())
          ? f.hora_entrada
          : start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        const exitTime = !end || isNaN(end.getTime())
          ? (f.hora_salida || '--:--')
          : end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        let duration = '--h --m';
        if (end && !isNaN(end.getTime()) && !isNaN(start.getTime())) {
          const diff = end.getTime() - start.getTime();
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          duration = `${h}h ${m.toString().padStart(2, '0')}m`;
        } else if (!f.hora_salida && !isNaN(start.getTime())) {
          const isToday = start.toDateString() === now.toDateString();
          if (isToday) {
            const diff = now.getTime() - start.getTime();
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            duration = `${h}h ${m}m`;
          }
        }

        let status: 'valid' | 'progress' | 'incident' = 'valid';
        if (!f.hora_salida && !isNaN(start.getTime())) {
          const isToday = start.toDateString() === now.toDateString();
          status = isToday ? 'progress' : 'incident';
        }

        return {
          id: f.id,
          date: dateStr.charAt(0).toUpperCase() + dateStr.slice(1),
          entry: entryTime,
          exit: exitTime,
          total: duration,
          status: status
        };
      } catch (parseError) {
        console.error('Error parsing fichaje:', parseError, f);
        return {
          id: f.id,
          date: f.fecha || '-',
          entry: f.hora_entrada || '-',
          exit: f.hora_salida || '--:--',
          total: '--h --m',
          status: 'incident' as const
        };
      }
    });
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-success bg-opacity-10 text-success border border-success';
      case 'incident': return 'bg-danger bg-opacity-10 text-danger border border-danger';
      case 'progress': return 'bg-primary bg-opacity-10 text-primary border border-primary';
      default: return 'bg-secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'valid': return 'COMPLETO';
      case 'incident': return 'INCIDENCIA';
      case 'progress': return 'EN CURSO';
      default: return '-';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return 'bi-check-circle-fill';
      case 'incident': return 'bi-exclamation-triangle-fill';
      case 'progress': return 'bi-arrow-clockwise';
      default: return 'bi-dash-circle';
    }
  };

  return (
    <div className="fade-in-up pb-5">

      {/* HEADER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <h2 className="fw-bold mb-0 text-dark">Mis Fichajes</h2>

        <div className="d-flex gap-2 w-100 w-md-auto">
          <select className="form-select fw-bold border-0 shadow-sm rounded-pill px-4" style={{ width: 'auto', minWidth: '160px' }}>
            <option>📅 Febrero 2026</option>
            <option>Enero 2026</option>
            <option>Diciembre 2025</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : fichajes.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
          <i className="bi bi-clock-history display-1 text-muted opacity-25"></i>
          <h5 className="mt-3 text-muted">Sin fichajes todavía</h5>
          <p className="text-muted small">Tus fichajes aparecerán aquí cuando registres entradas</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden d-none d-md-block">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="py-3 text-secondary small text-uppercase fw-bold">Fecha</th>
                    <th className="py-3 text-secondary small text-uppercase fw-bold">Entrada</th>
                    <th className="py-3 text-secondary small text-uppercase fw-bold">Salida</th>
                    <th className="py-3 text-secondary small text-uppercase fw-bold">Total</th>
                    <th className="py-3 text-secondary small text-uppercase fw-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {fichajes.map((f) => (
                    <tr key={f.id}>
                      <td className="py-3 fw-semibold">{f.date}</td>
                      <td className="py-3 font-monospace fw-bold text-success">{f.entry}</td>
                      <td className="py-3 font-monospace fw-bold text-danger">{f.exit}</td>
                      <td className="py-3 fw-semibold">{f.total}</td>
                      <td className="py-3">
                        <span className={`badge rounded-pill px-3 py-1 ${getBadgeClass(f.status)}`}>
                          <i className={`bi ${getStatusIcon(f.status)} me-1`}></i>
                          {getStatusLabel(f.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="d-md-none">
            <div className="d-grid gap-3">
              {fichajes.map((f) => (
                <div key={f.id} className="card border-0 shadow-sm rounded-4 p-3">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="fw-bold text-dark">{f.date}</div>
                    <span className={`badge rounded-pill px-2 py-1 small ${getBadgeClass(f.status)}`}>
                      <i className={`bi ${getStatusIcon(f.status)} me-1`}></i>
                      {getStatusLabel(f.status)}
                    </span>
                  </div>

                  <div className="row g-2 small">
                    <div className="col-4">
                      <div className="text-muted mb-1">Entrada</div>
                      <div className="fw-bold text-success font-monospace">{f.entry}</div>
                    </div>
                    <div className="col-4">
                      <div className="text-muted mb-1">Salida</div>
                      <div className="fw-bold text-danger font-monospace">{f.exit}</div>
                    </div>
                    <div className="col-4">
                      <div className="text-muted mb-1">Total</div>
                      <div className="fw-bold">{f.total}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}