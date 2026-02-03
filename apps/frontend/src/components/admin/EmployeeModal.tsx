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
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
            
            {/* CABECERA CON FONDO Y AVATAR */}
            <div className="position-relative" style={{ height: '100px', backgroundColor: '#0F172A' }}>
                <button 
                    type="button" 
                    className="btn-close btn-close-white position-absolute top-0 end-0 m-3" 
                    onClick={onClose}
                ></button>
            </div>
            
            <div className="modal-body text-center pt-0 px-4 pb-4">
                {/* Avatar Flotante */}
                <div className="position-relative d-inline-block mt-n5 mb-3">
                    <div className="rounded-circle bg-white p-1 shadow-sm">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-1" 
                             style={{ width: '100px', height: '100px' }}>
                            {employee?.nombre_completo?.charAt(0) || 'U'}
                        </div>
                    </div>
                </div>

                <h4 className="fw-bold mb-1">{employee?.nombre_completo}</h4>
                <p className="text-secondary small mb-3">{employee?.puesto || 'Puesto no definido'}</p>

                <div className="d-flex justify-content-center gap-2 mb-4">
                    <span className={`badge rounded-pill px-3 py-2 ${employee?.rol === 'admin' ? 'bg-danger' : 'bg-success'} bg-opacity-10 text-${employee?.rol === 'admin' ? 'danger' : 'success'} border border-${employee?.rol === 'admin' ? 'danger' : 'success'}`}>
                        {employee?.rol?.toUpperCase()}
                    </span>
                    <span className="badge rounded-pill bg-light text-dark border px-3 py-2">
                        ACTIVO
                    </span>
                </div>

                {/* DATOS DE CONTACTO (GRID) */}
                <div className="bg-light rounded-3 p-3 text-start mb-4">
                    <div className="row g-3">
                        <div className="col-6">
                            <small className="text-muted d-block" style={{fontSize: '0.7rem'}}>DNI / NIE</small>
                            <span className="fw-bold text-dark">{employee?.dni || '-'}</span>
                        </div>
                        <div className="col-6">
                            <small className="text-muted d-block" style={{fontSize: '0.7rem'}}>TELÉFONO</small>
                            <span className="fw-bold text-dark">{employee?.telefono || '-'}</span>
                        </div>
                        <div className="col-12">
                            <small className="text-muted d-block" style={{fontSize: '0.7rem'}}>EMAIL (Corporativo)</small>
                            <span className="fw-bold text-dark">{employee?.email || 'No registrado'}</span>
                        </div>
                        <div className="col-12">
                            <small className="text-muted d-block" style={{fontSize: '0.7rem'}}>DIRECCIÓN</small>
                            <span className="fw-bold text-dark text-truncate d-block">{employee?.direccion || 'Calle Sin Nombre, 123'}</span>
                        </div>
                    </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="d-grid gap-2 d-flex justify-content-center">
                    <button className="btn btn-outline-dark flex-grow-1 rounded-pill fw-bold">
                        <i className="bi bi-chat-dots me-2"></i>Mensaje
                    </button>
                    <button className="btn btn-primary flex-grow-1 rounded-pill fw-bold" style={{backgroundColor: '#0F172A'}}>
                        <i className="bi bi-file-person me-2"></i>Ver Historial
                    </button>
                </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}