'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, History, X, Loader2 } from 'lucide-react';

interface EmployeeModalProps {
  employeeId: string;
  onClose: () => void;
}

export default function EmployeeModal({ employeeId, onClose }: EmployeeModalProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [employee, setEmployee] = useState<any>(null);
  const [stats, setStats] = useState({ asistencias: 0, faltas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEmployeeDetails(); }, [employeeId]);

  const fetchEmployeeDetails = async () => {
    try {
      const { data: info } = await supabase.from('empleados_info').select('*').eq('id', employeeId).single();
      const { count: fichajesCount } = await supabase.from('fichajes').select('*', { count: 'exact', head: true }).eq('empleado_id', employeeId);
      setEmployee(info);
      setStats({ asistencias: fichajesCount || 0, faltas: 0 });
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (!employee && !loading) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="relative h-[100px] bg-navy rounded-t-2xl">
            <button type="button" onClick={onClose}
              className="text-white/60 hover:text-white cursor-pointer bg-transparent border-none absolute top-3 right-3 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 pt-0 text-center">
            {loading ? (
              <div className="py-10"><Loader2 className="w-7 h-7 text-chrono-blue animate-spin mx-auto" /></div>
            ) : (
              <>
                {/* Avatar */}
                <div className="inline-block -mt-12 mb-3">
                  <div className="rounded-full bg-white p-1 shadow-sm">
                    <div className="rounded-full bg-chrono-blue text-white flex items-center justify-center font-bold text-4xl w-[100px] h-[100px]">
                      {employee?.nombre_completo?.charAt(0) || 'U'}
                    </div>
                  </div>
                </div>

                <h4 className="font-bold mb-1">{employee?.nombre_completo}</h4>
                <p className="text-slate-500 text-sm mb-3">{employee?.puesto || 'Puesto no definido'}</p>

                <div className="flex justify-center gap-2 mb-4">
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold border ${employee?.rol === 'admin' ? 'bg-red-50 text-red-500 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                    {employee?.rol?.toUpperCase()}
                  </span>
                  <span className="rounded-full bg-gray-50 text-navy border border-gray-200 px-3 py-1.5 text-xs font-bold">ACTIVO</span>
                </div>

                {/* Contact info */}
                <div className="bg-gray-50 rounded-lg p-3 text-left mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><small className="text-slate-400 block text-[0.7rem]">DNI / NIE</small><span className="font-bold text-navy text-sm">{employee?.dni || '-'}</span></div>
                    <div><small className="text-slate-400 block text-[0.7rem]">TELÉFONO</small><span className="font-bold text-navy text-sm">{employee?.telefono || '-'}</span></div>
                    <div className="col-span-2"><small className="text-slate-400 block text-[0.7rem]">EMAIL (Corporativo)</small><span className="font-bold text-navy text-sm">{employee?.email || 'No registrado'}</span></div>
                    <div className="col-span-2"><small className="text-slate-400 block text-[0.7rem]">DIRECCIÓN</small><span className="font-bold text-navy text-sm truncate block">{employee?.direccion || 'Calle Sin Nombre, 123'}</span></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-emerald-50 rounded-xl p-3"><div className="font-bold text-2xl text-emerald-600">{stats.asistencias}</div><small className="text-slate-400">Fichajes</small></div>
                  <div className="bg-red-50 rounded-xl p-3"><div className="font-bold text-2xl text-red-500">{stats.faltas}</div><small className="text-slate-400">Faltas</small></div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 rounded-full border-2 border-navy text-navy font-bold text-sm cursor-pointer bg-transparent hover:bg-navy hover:text-white transition-colors flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Mensaje
                  </button>
                  <button className="flex-1 py-2.5 rounded-full bg-navy text-white font-bold text-sm cursor-pointer border-none hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <History className="w-4 h-4" /> Ver Historial
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}