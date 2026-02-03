'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminRequestsManager() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pendiente'); // 'pendiente', 'aprobado', 'todos'

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase
      .from('solicitudes')
      .select(`
        *,
        empleados_info ( nombre_completo, dni )
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'todos') {
      query = query.eq('estado', filter);
    }

    const { data, error } = await query;
    if (data) setRequests(data);
    setLoading(false);
  };

  // FUNCIÓN PARA VER ARCHIVO
  const handleViewFile = (path: string) => {
    if (!path) return;
    
    // Obtenemos la URL pública del archivo
    const { data } = supabase.storage
        .from('justificantes')
        .getPublicUrl(path);
    
    // Lo abrimos en otra pestaña
    window.open(data.publicUrl, '_blank');
  };

  // FUNCIÓN APROBAR/RECHAZAR
  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from('solicitudes').update({ estado: newStatus }).eq('id', id);
    fetchRequests(); // Recargar lista
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
      
      {/* FILTROS SUPERIORES */}
      <div className="card-header bg-white p-4 border-bottom border-light">
        <div className="d-flex justify-content-between align-items-center">
            <h5 className="fw-bold mb-0">Gestión de Solicitudes</h5>
            <div className="btn-group">
                <button className={`btn btn-sm ${filter === 'pendiente' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setFilter('pendiente')}>Pendientes</button>
                <button className={`btn btn-sm ${filter === 'aprobado' ? 'btn-success text-white' : 'btn-outline-secondary'}`} onClick={() => setFilter('aprobado')}>Aprobadas</button>
                <button className={`btn btn-sm ${filter === 'todos' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter('todos')}>Todas</button>
            </div>
        </div>
      </div>

      <div className="table-responsive">
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
                <tr><td colSpan={6} className="text-center py-5">Cargando solicitudes...</td></tr>
            ) : requests.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-5 text-muted">No hay solicitudes en este estado.</td></tr>
            ) : (
                requests.map((req) => (
                    <tr key={req.id}>
                        {/* EMPLEADO */}
                        <td className="ps-4">
                            <div className="fw-bold text-dark">{req.empleados_info?.nombre_completo || 'Desconocido'}</div>
                            <small className="text-muted">{req.empleados_info?.dni}</small>
                        </td>

                        {/* TIPO */}
                        <td>
                            {req.tipo === 'vacaciones' ? 
                                <span className="badge bg-warning text-dark bg-opacity-25 border border-warning"><i className="bi bi-sun me-1"></i>Vacaciones</span> : 
                                <span className="badge bg-danger text-danger bg-opacity-10 border border-danger"><i className="bi bi-bandaid me-1"></i>Baja Médica</span>
                            }
                        </td>

                        {/* FECHAS */}
                        <td>
                            <div className="small">
                                <strong>Inicio:</strong> {new Date(req.fecha_inicio).toLocaleDateString()}<br/>
                                {req.fecha_fin && <span className="text-muted">Fin: {new Date(req.fecha_fin).toLocaleDateString()}</span>}
                            </div>
                        </td>

                        {/* ARCHIVO (Botón Ver) */}
                        <td>
                            {req.archivo_path ? (
                                <button 
                                    onClick={() => handleViewFile(req.archivo_path)}
                                    className="btn btn-sm btn-outline-primary rounded-pill"
                                >
                                    <i className="bi bi-paperclip me-1"></i>Ver Doc
                                </button>
                            ) : (
                                <span className="text-muted small">-</span>
                            )}
                        </td>

                        {/* ESTADO */}
                        <td>
                             <span className={`badge rounded-pill ${
                                req.estado === 'pendiente' ? 'bg-warning text-dark' : 
                                req.estado === 'aprobado' ? 'bg-success' : 'bg-secondary'
                             }`}>
                                {req.estado.toUpperCase()}
                             </span>
                        </td>

                        {/* ACCIONES */}
                        <td className="pe-4 text-end">
                            {req.estado === 'pendiente' && (
                                <div className="btn-group">
                                    <button onClick={() => updateStatus(req.id, 'aprobado')} className="btn btn-sm btn-success" title="Aprobar"><i className="bi bi-check-lg"></i></button>
                                    <button onClick={() => updateStatus(req.id, 'rechazado')} className="btn btn-sm btn-outline-danger" title="Rechazar"><i className="bi bi-x-lg"></i></button>
                                </div>
                            )}
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}