'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface EmployeeModalProps {
  employeeId: string;
  onClose: () => void;
}

export default function EmployeeModal({ employeeId, onClose }: EmployeeModalProps) {
  const [employee, setEmployee] = useState<any>(null);
  const [stats, setStats] = useState({ asistencias: 0, faltas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [employeeId]);

  const fetchEmployeeDetails = async () => {
    try {
      // 1. Datos Personales
      const { data: info } = await supabase
        .from('empleados_info')
        .select('*')
        .eq('id', employeeId)
        .single();

      // 2. Estadísticas Rápidas (Fichajes del mes)
      const { count: fichajesCount } = await supabase
        .from('fichajes')
        .select('*', { count: 'exact', head: true })
        .eq('empleado_id', employeeId);

      setEmployee(info);
      setStats({ asistencias: fichajesCount || 0, faltas: 0 }); // Simplificado por ahora
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!employee && !loading) return null;

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose}></div>
      <div className="modal fade show block" tabIndex={-1}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-dialog-centered">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto rounded-2xl border-0 shadow-lg overflow-hidden">
            
            {/* CABECERA CON FONDO Y AVATAR */}
            <div className="relative" style={{ height: '100px', backgroundColor: '#0F172A' }}>
                <button 
                    type="button" 
                    className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none text-xl btn-close-white absolute top-0 right-0 m-3" 
                    onClick={onClose}
                ></button>
            </div>
            
            <div className="p-6 text-center pt-0 px-4 pb-4">
                {/* Avatar Flotante */}
                <div className="relative d-inline-block mt-n5 mb-3">
                    <div className="rounded-full bg-white p-1 shadow-sm">
                        <div className="rounded-full bg-chrono-blue text-white flex items-center justify-center font-bold text-4xl" 
                             style={{ width: '100px', height: '100px' }}>
                            {employee?.nombre_completo?.charAt(0) || 'U'}
                        </div>
                    </div>
                </div>

                <h4 className="font-bold mb-1">{employee?.nombre_completo}</h4>
                <p className="text-slate-500 text-sm mb-3">{employee?.puesto || 'Puesto no definido'}</p>

                <div className="flex justify-center gap-2 mb-4">
                    <span className={`badge rounded-full px-3 py-2 ${employee?.rol === 'admin' ? 'bg-red-500' : 'bg-emerald-500'} bg-opacity-10 text-${employee?.rol === 'admin' ? 'danger' : 'success'} border border-${employee?.rol === 'admin' ? 'danger' : 'success'}`}>
                        {employee?.rol?.toUpperCase()}
                    </span>
                    <span className="badge rounded-full bg-gray-50 text-navy border px-3 py-2">
                        ACTIVO
                    </span>
                </div>

                {/* DATOS DE CONTACTO (GRID) */}
                <div className="bg-gray-50 rounded-lg p-3 text-left mb-4">
                    <div className="row gap-3">
                        <div className="col-span-6">
                            <small className="text-slate-400 block" style={{fontSize: '0.7rem'}}>DNI / NIE</small>
                            <span className="font-bold text-navy">{employee?.dni || '-'}</span>
                        </div>
                        <div className="col-span-6">
                            <small className="text-slate-400 block" style={{fontSize: '0.7rem'}}>TELÉFONO</small>
                            <span className="font-bold text-navy">{employee?.telefono || '-'}</span>
                        </div>
                        <div className="col-span-12">
                            <small className="text-slate-400 block" style={{fontSize: '0.7rem'}}>EMAIL (Corporativo)</small>
                            <span className="font-bold text-navy">{employee?.email || 'No registrado'}</span>
                        </div>
                        <div className="col-span-12">
                            <small className="text-slate-400 block" style={{fontSize: '0.7rem'}}>DIRECCIÓN</small>
                            <span className="font-bold text-navy truncate block">{employee?.direccion || 'Calle Sin Nombre, 123'}</span>
                        </div>
                    </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="grid gap-2 flex justify-center">
                    <button className="btn btn-outline-dark flex-grow rounded-full font-bold">
                        <i className="bi bi-chat-dots mr-2"></i>Mensaje
                    </button>
                    <button className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none flex-grow rounded-full font-bold" style={{backgroundColor: '#0F172A'}}>
                        <i className="bi bi-file-person mr-2"></i>Ver Historial
                    </button>
                </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}