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
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filter !== 'todos') {
        query = query.eq('estado', filter);
      }

      const { data, error: queryError, count } = await query;



      if (queryError) {
        setError(`Error BD: ${queryError.message}`);
        console.error('Error fetching solicitudes:', queryError);
      } else {
        // Batch fetch employee names (empleados_info is a view, can't FK embed)
        const empIds = [...new Set((data || []).map((r: any) => r.empleado_id).filter(Boolean))];
        const empMap: Record<string, { nombre_completo: string; dni: string }> = {};

        if (empIds.length > 0) {
          const { data: emps } = await supabase
            .from('empleados_info')
            .select('id, nombre_completo, dni')
            .in('id', empIds);
          (emps || []).forEach((e: any) => {
            empMap[e.id] = { nombre_completo: e.nombre_completo, dni: e.dni };
          });
        }

        const enriched = (data || []).map((r: any) => ({
          ...r,
          empleados_info: empMap[r.empleado_id] || { nombre_completo: 'Desconocido', dni: '' },
        }));

        setRequests(enriched);
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
    <div className="card border-0 shadow-sm rounded-2xl overflow-hidden">

      {/* HEADER */}
      <div className="p-4 border-b border-gray-100 bg-white p-4 border-b border-light">
        <div className="flex flex-col flex-md-row justify-between align-items-md-center gap-3">
          <div>
            <h5 className="font-bold mb-1">Solicitudes del Personal</h5>
            <small className="text-slate-400">
              {loading ? 'Cargando...' : error ? `⚠️ ${error}` : `✅ ${totalCount} solicitu${totalCount === 1 ? 'd' : 'des'} encontrada${totalCount === 1 ? '' : 's'}`}
            </small>
          </div>
          <div className="btn-group">
            <button className={`text-sm py-1.5 px-3 ${filter === 'todos' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setFilter('todos')}>Todas</button>
            <button className={`text-sm py-1.5 px-3 ${filter === 'pendiente' ? 'btn-warning text-navy' : 'btn-outline-secondary'}`} onClick={() => setFilter('pendiente')}>Pendientes</button>
            <button className={`text-sm py-1.5 px-3 ${filter === 'aprobado' ? 'btn-success text-white' : 'btn-outline-secondary'}`} onClick={() => setFilter('aprobado')}>Aprobadas</button>
            <button className={`text-sm py-1.5 px-3 ${filter === 'rechazado' ? 'btn-danger text-white' : 'btn-outline-secondary'}`} onClick={() => setFilter('rechazado')}>Rechazadas</button>
          </div>
        </div>
      </div>

      {/* TABLE DESKTOP */}
      <div className="table-responsive hidden md:block">
        <table className="w-full table-hover align-middle mb-0">
          <thead className="bg-gray-50">
            <tr>
              <th className="ps-4 py-3 text-slate-500 text-sm uppercase">Empleado</th>
              <th className="py-3 text-slate-500 text-sm uppercase">Tipo</th>
              <th className="py-3 text-slate-500 text-sm uppercase">Fechas</th>
              <th className="py-3 text-slate-500 text-sm uppercase">Archivo</th>
              <th className="py-3 text-slate-500 text-sm uppercase">Estado</th>
              <th className="pe-4 py-3 text-right text-slate-500 text-sm uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-6">
                <div className="animate-spin text-chrono-blue"></div>
              </td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6">
                <i className="bi bi-inbox text-4xl block mb-3 text-slate-400 opacity-25"></i>
                <p className="text-slate-400 mb-2">{error || 'No hay solicitudes'}</p>
                {!error && <small className="text-slate-500">Las solicitudes aparecerán aquí cuando los empleados las creen</small>}
              </td></tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id}>
                  <td className="ps-4">
                    <div className="font-bold text-navy">{req.empleados_info?.nombre_completo || 'Desconocido'}</div>
                    <small className="text-slate-400">{req.empleados_info?.dni}</small>
                  </td>

                  <td>
                    {req.es_parcial ? (
                      <span className="bg-sky-500 text-white text-xs px-2 py-0.5 rounded-full font-bold text-white bg-opacity-75 border border-info"><i className="bi bi-clock mr-1"></i>Parcial ({req.horas_ausencia}h)</span>
                    ) : req.tipo === 'vacaciones' ? (
                      <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold text-navy bg-opacity-25 border border-warning"><i className="bi bi-sun mr-1"></i>Vacaciones</span>
                    ) : (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold text-red-500 bg-opacity-10 border border-danger"><i className="bi bi-bandaid mr-1"></i>Baja Médica</span>
                    )}
                  </td>

                  <td>
                    <small className="text-navy">
                      {req.fecha_inicio && new Date(req.fecha_inicio).toLocaleDateString('es-ES')}
                      {req.fecha_fin && ` - ${new Date(req.fecha_fin).toLocaleDateString('es-ES')}`}
                    </small>
                  </td>

                  <td>
                    {req.archivo_path ? (
                      <button
                        onClick={() => handleViewFile(req.archivo_path)}
                        className="text-sm py-1.5 px-3 btn-light rounded-full"
                      >
                        <i className="bi bi-file-earmark-pdf text-red-500 mr-1"></i> Ver
                      </button>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </td>

                  <td>
                    {req.estado === 'pendiente' && <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold text-navy">Pendiente</span>}
                    {req.estado === 'aprobado' && <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">Aprobado</span>}
                    {req.estado === 'rechazado' && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">Rechazado</span>}
                  </td>

                  <td className="pe-4 text-right">
                    {req.estado === 'pendiente' && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => updateStatus(req.id, 'aprobado')}
                          className="text-sm py-1.5 px-3 btn-success rounded-full px-3"
                          title="Aprobar"
                        >
                          <i className="bi bi-check-lg"></i>
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, 'rechazado')}
                          className="text-sm py-1.5 px-3 btn-danger rounded-full px-3"
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
          <div className="text-center py-6">
            <div className="animate-spin text-chrono-blue"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-6">
            <i className="bi bi-inbox text-4xl block mb-3 text-slate-400 opacity-25"></i>
            <p className="text-slate-400 mb-2">{error || 'No hay solicitudes'}</p>
            {!error && <small className="text-slate-500">Las solicitudes aparecerán aquí cuando los empleados las creen</small>}
          </div>
        ) : (
          <div className="grid gap-3 pb-6">
            {requests.map((req) => (
              <div key={req.id} className="card border-0 shadow-sm rounded-2xl p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h6 className="font-bold mb-0">{req.empleados_info?.nombre_completo || 'Desconocido'}</h6>
                    <small className="text-slate-400">{req.empleados_info?.dni}</small>
                  </div>
                  {req.estado === 'pendiente' && <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold text-navy">Pendiente</span>}
                  {req.estado === 'aprobado' && <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">Aprobado</span>}
                  {req.estado === 'rechazado' && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">Rechazado</span>}
                </div>

                <div className="mb-2">
                  {req.tipo === 'vacaciones' ?
                    <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold text-navy"><i className="bi bi-sun mr-1"></i>Vacaciones</span> :
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold"><i className="bi bi-bandaid mr-1"></i>Baja</span>
                  }
                </div>

                <div className="text-sm text-slate-500 mb-2">
                  {req.fecha_inicio && new Date(req.fecha_inicio).toLocaleDateString('es-ES')}
                  {req.fecha_fin && ` - ${new Date(req.fecha_fin).toLocaleDateString('es-ES')}`}
                </div>

                {req.estado === 'pendiente' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => updateStatus(req.id, 'aprobado')}
                      className="text-sm py-1.5 px-3 btn-success rounded-full flex-grow"
                    >
                      <i className="bi bi-check-lg mr-1"></i> Aprobar
                    </button>
                    <button
                      onClick={() => updateStatus(req.id, 'rechazado')}
                      className="text-sm py-1.5 px-3 btn-danger rounded-full flex-grow"
                    >
                      <i className="bi bi-x-lg mr-1"></i> Rechazar
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