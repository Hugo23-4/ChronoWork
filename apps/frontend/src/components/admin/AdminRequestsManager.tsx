'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Inbox, Check, X, Sun, Bandage, Clock, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBiometricStepUp } from '@/lib/useBiometricStepUp';
import BiometricStepUpDialog from '@/components/ui/BiometricStepUpDialog';

export default function AdminRequestsManager() {
  const { profile } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [error, setError] = useState('');
  const [isEmpty, setIsEmpty] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const stepUp = useBiometricStepUp();

  useEffect(() => { fetchRequests(); }, [filter, profile?.empresa_id]);

  const fetchRequests = async () => {
    if (!profile?.empresa_id) return;
    setLoading(true); setError(''); setIsEmpty(false);
    try {
      let query = supabase.from('solicitudes').select('*', { count: 'exact' }).eq('empresa_id', profile.empresa_id).order('created_at', { ascending: false });
      if (filter !== 'todos') query = query.eq('estado', filter);
      const { data, error: queryError, count } = await query;

      if (queryError) { setError(`Error BD: ${queryError.message}`); console.error('Error fetching solicitudes:', queryError); }
      else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const empIds = [...new Set((data || []).map((r: any) => r.empleado_id).filter(Boolean))];
        const empMap: Record<string, { nombre_completo: string; dni: string }> = {};
        if (empIds.length > 0) {
          const { data: emps } = await supabase.from('empleados_info').select('id, nombre_completo, dni').eq('empresa_id', profile.empresa_id).in('id', empIds);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (emps || []).forEach((e: any) => { empMap[e.id] = { nombre_completo: e.nombre_completo, dni: e.dni }; });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enriched = (data || []).map((r: any) => ({ ...r, empleados_info: empMap[r.empleado_id] || { nombre_completo: 'Desconocido', dni: '' } }));
        setRequests(enriched); setTotalCount(count || 0);
        if (!data || data.length === 0) setIsEmpty(true);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) { setError(`Error inesperado: ${err.message}`); }
    finally { setLoading(false); }
  };

  const handleViewFile = (path: string) => {
    if (!path) return;
    const { data } = supabase.storage.from('justificantes').getPublicUrl(path);
    window.open(data.publicUrl, '_blank');
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const ok = await stepUp.request({ action: `solicitud.${newStatus}` });
    if (!ok) return;
    const { error } = await supabase.from('solicitudes').update({ estado: newStatus }).eq('id', id);
    if (error) alert('Error actualizando estado: ' + error.message);
    else fetchRequests();
  };

  const statusBadge = (estado: string) => {
    if (estado === 'pendiente') return <span className="bg-amber-100 text-amber-700 text-[0.65rem] px-2.5 py-0.5 rounded-full font-bold border border-amber-200">Pendiente</span>;
    if (estado === 'aprobado') return <span className="bg-emerald-100 text-emerald-700 text-[0.65rem] px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">Aprobado</span>;
    if (estado === 'rechazado') return <span className="bg-red-100 text-red-700 text-[0.65rem] px-2.5 py-0.5 rounded-full font-bold border border-red-200">Rechazado</span>;
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeBadge = (req: any) => {
    if (req.es_parcial) return <span className="bg-sky-100 text-sky-700 text-[0.65rem] px-2.5 py-0.5 rounded-full font-bold border border-sky-200 inline-flex items-center gap-1"><Clock className="w-3 h-3" />Parcial ({req.horas_ausencia}h)</span>;
    if (req.tipo === 'vacaciones') return <span className="bg-amber-100 text-amber-700 text-[0.65rem] px-2.5 py-0.5 rounded-full font-bold border border-amber-200 inline-flex items-center gap-1"><Sun className="w-3 h-3" />Vacaciones</span>;
    return <span className="bg-red-100 text-red-700 text-[0.65rem] px-2.5 py-0.5 rounded-full font-bold border border-red-200 inline-flex items-center gap-1"><Bandage className="w-3 h-3" />Baja Médica</span>;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-zinc-800">
      <BiometricStepUpDialog
        state={stepUp.state}
        onClose={stepUp.close}
        title="Confirma para autorizar"
        description="Esta acción afecta a una solicitud del personal y queda registrada en la auditoría."
      />
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
          <div>
            <h5 className="font-bold text-navy dark:text-zinc-100 mb-1">Solicitudes del Personal</h5>
            <small className="text-slate-400 dark:text-zinc-500">
              {loading ? 'Cargando...' : error ? `⚠️ ${error}` : isEmpty ? `Sin solicitudes${filter !== 'todos' ? ` en estado "${filter}"` : ''}` : `${totalCount} solicitud${totalCount === 1 ? '' : 'es'}`}
            </small>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { value: 'todos', label: 'Todas' },
              { value: 'pendiente', label: 'Pendientes' },
              { value: 'aprobado', label: 'Aprobadas' },
              { value: 'rechazado', label: 'Rechazadas' },
            ].map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-bold border-[1.5px] cursor-pointer transition-all',
                  filter === f.value ? 'bg-navy text-white border-navy' : 'bg-transparent text-slate-500 dark:text-zinc-400 border-gray-200 hover:border-gray-300')}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/80 dark:bg-zinc-800">
            <tr>
              <th className="pl-5 py-3 text-slate-400 dark:text-zinc-500 text-xs uppercase font-bold text-left">Empleado</th>
              <th className="py-3 text-slate-400 dark:text-zinc-500 text-xs uppercase font-bold text-left">Tipo</th>
              <th className="py-3 text-slate-400 dark:text-zinc-500 text-xs uppercase font-bold text-left">Fechas</th>
              <th className="py-3 text-slate-400 dark:text-zinc-500 text-xs uppercase font-bold text-left">Archivo</th>
              <th className="py-3 text-slate-400 dark:text-zinc-500 text-xs uppercase font-bold text-left">Estado</th>
              <th className="pr-5 py-3 text-slate-400 dark:text-zinc-500 text-xs uppercase font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10"><Loader2 className="w-7 h-7 text-chrono-blue animate-spin mx-auto" /></td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                {error
                  ? <p className="text-red-500 mb-1 font-medium">{error}</p>
                  : <><p className="text-slate-400 dark:text-zinc-500 mb-1">No hay solicitudes{filter !== 'todos' ? ` en estado "${filter}"` : ''}</p><small className="text-slate-400 dark:text-zinc-500">Las solicitudes aparecerán aquí cuando los empleados las creen</small></>
                }
              </td></tr>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              requests.map((req: any) => (
                <tr key={req.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800 transition-colors">
                  <td className="pl-5 py-3">
                    <div className="font-bold text-navy dark:text-zinc-100 text-sm">{req.empleados_info?.nombre_completo || 'Desconocido'}</div>
                    <small className="text-slate-400 dark:text-zinc-500 text-xs">{req.empleados_info?.dni}</small>
                  </td>
                  <td className="py-3">{typeBadge(req)}</td>
                  <td className="py-3">
                    <small className="text-navy dark:text-zinc-100 text-sm">
                      {req.fecha_inicio && new Date(req.fecha_inicio).toLocaleDateString('es-ES')}
                      {req.fecha_fin && ` - ${new Date(req.fecha_fin).toLocaleDateString('es-ES')}`}
                    </small>
                  </td>
                  <td className="py-3">
                    {req.archivo_path ? (
                      <button onClick={() => handleViewFile(req.archivo_path)}
                        className="bg-gray-100 hover:bg-gray-200 border-none rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 cursor-pointer transition-colors inline-flex items-center gap-1">
                        <FileText className="w-3 h-3 text-red-500" /> Ver
                      </button>
                    ) : <span className="text-slate-300 text-sm">-</span>}
                  </td>
                  <td className="py-3">{statusBadge(req.estado)}</td>
                  <td className="pr-5 py-3 text-right">
                    {req.estado === 'pendiente' && (
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => updateStatus(req.id, 'aprobado')} title="Aprobar"
                          className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 border-none cursor-pointer hover:bg-emerald-200 transition-colors flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateStatus(req.id, 'rechazado')} title="Rechazar"
                          className="w-8 h-8 rounded-full bg-red-100 text-red-600 border-none cursor-pointer hover:bg-red-200 transition-colors flex items-center justify-center">
                          <X className="w-4 h-4" />
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

      {/* Mobile Cards */}
      <div className="md:hidden p-3">
        {loading ? (
          <div className="text-center py-10"><Loader2 className="w-7 h-7 text-chrono-blue animate-spin mx-auto" /></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-10">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            {error
              ? <p className="text-red-500 mb-1 font-medium">{error}</p>
              : <><p className="text-slate-400 dark:text-zinc-500 mb-1">No hay solicitudes{filter !== 'todos' ? ` en estado "${filter}"` : ''}</p><small className="text-slate-400 dark:text-zinc-500">Las solicitudes aparecerán aquí cuando los empleados las creen</small></>
            }
          </div>
        ) : (
          <div className="grid gap-3 pb-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {requests.map((req: any) => (
              <div key={req.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h6 className="font-bold text-navy dark:text-zinc-100 text-sm mb-0">{req.empleados_info?.nombre_completo || 'Desconocido'}</h6>
                    <small className="text-slate-400 dark:text-zinc-500 text-xs">{req.empleados_info?.dni}</small>
                  </div>
                  {statusBadge(req.estado)}
                </div>
                <div className="mb-2">{typeBadge(req)}</div>
                <div className="text-sm text-slate-500 dark:text-zinc-400 mb-2">
                  {req.fecha_inicio && new Date(req.fecha_inicio).toLocaleDateString('es-ES')}
                  {req.fecha_fin && ` - ${new Date(req.fecha_fin).toLocaleDateString('es-ES')}`}
                </div>
                {req.estado === 'pendiente' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => updateStatus(req.id, 'aprobado')}
                      className="flex-1 py-2 rounded-full bg-emerald-500 text-white border-none font-bold text-sm cursor-pointer hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" /> Aprobar
                    </button>
                    <button onClick={() => updateStatus(req.id, 'rechazado')}
                      className="flex-1 py-2 rounded-full bg-red-500 text-white border-none font-bold text-sm cursor-pointer hover:bg-red-600 transition-colors flex items-center justify-center gap-1">
                      <X className="w-4 h-4" /> Rechazar
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