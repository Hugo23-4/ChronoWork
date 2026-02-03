'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// Importamos los componentes (asegúrate de que están en estas carpetas)
import AdminRequestsManager from '@/components/admin/AdminRequestsManager'; 
import EmployeeRequests from '@/components/dashboard/EmployeeRequests';

export default function SolicitudesPage() {
  const { user } = useAuth();
  
  // Estados
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'mis_solicitudes' | 'gestion_equipo'>('mis_solicitudes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) checkRole();
  }, [user]);

  const checkRole = async () => {
    try {
      console.log("🔍 Verificando rol para usuario:", user?.id);

      // SOLUCIÓN: Pedimos TANTO 'rol' (texto) COMO 'rol_id' (número)
      const { data, error } = await supabase
        .from('empleados_info')
        .select('rol, rol_id') 
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error("❌ Error leyendo base de datos:", error.message);
      } else {
        console.log("✅ Datos recibidos de Supabase:", data);
        
        // LÓGICA ROBUSTA: Eres admin si dice 'admin' O si tu ID es 2 (Jefe)
        // Esto cubre lo que vimos en tu captura de pantalla
        if (data?.rol === 'admin' || data?.rol_id === 2) {
            console.log("👑 ¡ADMIN DETECTADO!");
            setIsAdmin(true);
        } else {
            console.log("👤 Usuario normal detectado");
            setIsAdmin(false);
        }
      }
    } catch (error) {
      console.error('Error general:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center min-vh-50 py-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
            </div>
        </div>
      );
  }

  return (
    <div className="fade-in-up pb-5">
      
      {/* CABECERA */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark">Solicitudes y Ausencias</h2>
        <p className="text-secondary">Gestiona tus vacaciones o tramita las bajas médicas.</p>
      </div>

      {/* 1. PESTAÑAS (SOLO ADMIN) */}
      {isAdmin && (
        <div className="d-flex gap-2 mb-4 p-1 bg-white rounded-pill border w-auto d-inline-flex shadow-sm">
            <button 
                onClick={() => setActiveTab('mis_solicitudes')}
                className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeTab === 'mis_solicitudes' ? 'btn-dark' : 'text-secondary'}`}
            >
                Mis Solicitudes
            </button>
            <button 
                onClick={() => setActiveTab('gestion_equipo')}
                className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeTab === 'gestion_equipo' ? 'btn-dark' : 'text-secondary'}`}
            >
                Gestión de Equipo <span className="badge bg-danger ms-1 text-white rounded-circle" style={{fontSize: '0.6rem'}}>Admin</span>
            </button>
        </div>
      )}

      {/* 2. VISTA EMPLEADO (Siempre disponible o si elijo la pestaña) */}
      {(activeTab === 'mis_solicitudes' || !isAdmin) && (
          <div className="animate__animated animate__fadeIn">
              <div className="alert alert-light border shadow-sm rounded-4 mb-4">
                  <div className="d-flex gap-3">
                    <i className="bi bi-info-circle-fill text-primary fs-5"></i>
                    <div>
                        <small className="text-secondary d-block">DÍAS DISPONIBLES</small>
                        <span className="fw-bold text-dark">22 días naturales</span>
                    </div>
                  </div>
              </div>
              <EmployeeRequests />
          </div>
      )}

      {/* 3. VISTA ADMIN (Solo si es admin y elige la pestaña) */}
      {isAdmin && activeTab === 'gestion_equipo' && (
          <div className="animate__animated animate__fadeIn">
              <AdminRequestsManager />
          </div>
      )}

    </div>
  );
}