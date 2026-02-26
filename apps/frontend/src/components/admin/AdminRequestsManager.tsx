'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminRequestsManager() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');

    try {
      let query = supabase
        .from('solicitudes')
        .select(`
          *,
          empleados_info ( nombre_completo, dni )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filter !== 'todos') {
        query = query.eq('estado', filter);
      }

      const { data, error: queryError, count } = await query;



      if (queryError) {
        setError(`Error BD: ${queryError.message}`);
        console.error('Error fetching solicitudes:', queryError);
      } else {
        setRequests(data || []);
        setTotalCount(count || 0);
        if (!data || data.length === 0) {
          setError(`No hay solicitudes${filter !== 'todos' ? ` en estado "${filter}"` : ''}. Es posible que no haya datos en la tabla.`);
        }
      }
    } catch (err: any) {
      setError(`Error inesperado: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (path: string) => {
    if (!path) return;
    const { data } = supabase.storage.from('justificantes').getPublicUrl(path);
    window.open(data.publicUrl, '_blank');
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('solicitudes').update({ estado: newStatus }).eq('id', id);
    if (error) {
      alert('Error actualizando estado: ' + error.message);
    } else {
      fetchRequests();
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

      {/* HEADER */}
      <div className="card-header bg-white p-4 border-bottom border-light">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h5 className="fw-bold mb-1">Solicitudes del Personal</h5>
            <small className="text-muted">
              {loading ? 'Cargando...' : error ? `⚠️ ${error}` : `✅ ${totalCount} solicitu${totalCount === 1 ? 'd' : 'des'} encontrada${totalCount === 1 ? '' : 's'}`}
            </small>
          </div>
          <div className="btn-group">
            <button className={`btn btn-sm ${filter === 'todos' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setFilter('todos')}>Todas</button>
            <button className={`btn btn-sm ${filter === 'pendiente' ? 'btn-warning text-dark' : 'btn-outline-secondary'}`} onClick={() => setFilter('pendiente')}>Pendientes</button>
            <button className={`btn btn-sm ${filter === 'aprobado' ? 'btn-success text-white' : 'btn-outline-secondary'}`} onClick={() => setFilter('aprobado')}>Aprobadas</button>
            <button className={`btn btn-sm ${filter === 'rechazado' ? 'btn-danger text-white' : 'btn-outline-secondary'}`} onClick={() => setFilter('rechazado')}>Rechazadas</button>
          </div>
        </div>
      </div>

      {/* TABLE DESKTOP */}
      <div className="table-responsive d-none d-md-block">
        <table className="table table-hover align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th className="ps-4 py-3 text-secondary small text-uppercase">Empleado</th>
              <th className="py-3 text-secondary small text-uppercase">Tipo</th>
              <th className="py-3 text-secondary small text-uppercase">Fechas</th>
              <th className="py-3 text-secondary small text-uppercase">Archivo</th>
              <th className="py-3 text-secondary small text-uppercase">Estado</th>
              <th className="pe-4 py-3 text-end text-secondary small text-uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-5">
                <div className="spinner-border text-primary"></div>
              </td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-5">
                <i className="bi bi-inbox fs-1 d-block mb-3 text-muted opacity-25"></i>
                <p className="text-muted mb-2">{error || 'No hay solicitudes'}</p>
                {!error && <small className="text-secondary">Las solicitudes aparecerán aquí cuando los empleados las creen</small>}
              </td></tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id}>
                  <td className="ps-4">
                    <div className="fw-bold text-dark">{req.empleados_info?.nombre_completo || 'Desconocido'}</div>
                    <small className="text-muted">{req.empleados_info?.dni}</small>
                  </td>

                  <td>
                    {req.tipo === 'vacaciones' ?
                      <span className="badge bg-warning text-dark bg-opacity-25 border border-warning"><i className="bi bi-sun me-1"></i>Vacaciones</span> :
                      <span className="badge bg-danger text-danger bg-opacity-10 border border-danger"><i className="bi bi-bandaid me-1"></i>Baja Médica</span>
                    }
                  </td>

                  <td>
                    <small className="text-dark">
                      {req.fecha_inicio && new Date(req.fecha_inicio).toLocaleDateString('es-ES')}
                      {req.fecha_fin && ` - ${new Date(req.fecha_fin).toLocaleDateString('es-ES')}`}
                    </small>
                  </td>

                  <td>
                    {req.archivo_path ? (
                      <button
                        onClick={() => handleViewFile(req.archivo_path)}
                        className="btn btn-sm btn-light rounded-pill"
                      >
                        <i className="bi bi-file-earmark-pdf text-danger me-1"></i> Ver
                      </button>
                    ) : (
                      <span className="text-muted small">-</span>
                    )}
                  </td>

                  <td>
                    {req.estado === 'pendiente' && <span className="badge bg-warning text-dark">Pendiente</span>}
                    {req.estado === 'aprobado' && <span className="badge bg-success">Aprobado</span>}
                    {req.estado === 'rechazado' && <span className="badge bg-danger">Rechazado</span>}
                  </td>

                  <td className="pe-4 text-end">
                    {req.estado === 'pendiente' && (
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          onClick={() => updateStatus(req.id, 'aprobado')}
                          className="btn btn-sm btn-success rounded-pill px-3"
                          title="Aprobar"
                        >
                          <i className="bi bi-check-lg"></i>
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, 'rechazado')}
                          className="btn btn-sm btn-danger rounded-pill px-3"
                          title="Rechazar"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CARDS MOBILE */}
      <div className="d-md-none p-3">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox fs-1 d-block mb-3 text-muted opacity-25"></i>
            <p className="text-muted mb-2">{error || 'No hay solicitudes'}</p>
            {!error && <small className="text-secondary">Las solicitudes aparecerán aquí cuando los empleados las creen</small>}
          </div>
        ) : (
          <div className="d-grid gap-3 pb-5">
            {requests.map((req) => (
              <div key={req.id} className="card border-0 shadow-sm rounded-4 p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="fw-bold mb-0">{req.empleados_info?.nombre_completo || 'Desconocido'}</h6>
                    <small className="text-muted">{req.empleados_info?.dni}</small>
                  </div>
                  {req.estado === 'pendiente' && <span className="badge bg-warning text-dark">Pendiente</span>}
                  {req.estado === 'aprobado' && <span className="badge bg-success">Aprobado</span>}
                  {req.estado === 'rechazado' && <span className="badge bg-danger">Rechazado</span>}
                </div>

                <div className="mb-2">
                  {req.tipo === 'vacaciones' ?
                    <span className="badge bg-warning text-dark"><i className="bi bi-sun me-1"></i>Vacaciones</span> :
                    <span className="badge bg-danger"><i className="bi bi-bandaid me-1"></i>Baja</span>
                  }
                </div>

                <div className="small text-secondary mb-2">
                  {req.fecha_inicio && new Date(req.fecha_inicio).toLocaleDateString('es-ES')}
                  {req.fecha_fin && ` - ${new Date(req.fecha_fin).toLocaleDateString('es-ES')}`}
                </div>

                {req.estado === 'pendiente' && (
                  <div className="d-flex gap-2 mt-2">
                    <button
                      onClick={() => updateStatus(req.id, 'aprobado')}
                      className="btn btn-sm btn-success rounded-pill flex-grow-1"
                    >
                      <i className="bi bi-check-lg me-1"></i> Aprobar
                    </button>
                    <button
                      onClick={() => updateStatus(req.id, 'rechazado')}
                      className="btn btn-sm btn-danger rounded-pill flex-grow-1"
                    >
                      <i className="bi bi-x-lg me-1"></i> Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}