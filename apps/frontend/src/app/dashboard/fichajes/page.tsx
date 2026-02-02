'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import HistoryCard from '@/components/HistoryCard';

// Definimos el tipo de dato procesado para usar en la vista
type ProcessedFichaje = {
  id: string;
  date: string;      // "Lun, 26 Oct"
  fullDate: string;  // Para lógica
  entry: string;     // "08:00"
  exit: string;      // "16:00"
  location: string;
  total: string;     // "8h 00m"
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
        .order('timestamp_entrada', { ascending: false }); // Los más recientes primero

      if (error) throw error;

      if (data) {
        // PROCESAMIENTO DE DATOS (Transformar SQL a Vista)
        const processed = data.map((f) => {
          const start = new Date(f.timestamp_entrada);
          const end = f.timestamp_salida ? new Date(f.timestamp_salida) : null;
          const now = new Date();

          // 1. Formatear Fechas y Horas
          const dateStr = start.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
          const entryTime = start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          const exitTime = end ? end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--';
          
          // 2. Calcular Duración
          let duration = '--h --m';
          if (end) {
            const diff = end.getTime() - start.getTime();
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            duration = `${h}h ${m.toString().padStart(2, '0')}m`;
          } else if (start.getDate() === now.getDate()) {
             // Si es hoy y no ha acabado, calculamos "tiempo hasta ahora"
             const diff = now.getTime() - start.getTime();
             const h = Math.floor(diff / (1000 * 60 * 60));
             const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
             duration = `${h}h ${m}m`;
          }

          // 3. Determinar Estado Lógico
          let status: 'valid' | 'progress' | 'incident' = 'valid';
          
          if (!end) {
            // Si no tiene salida...
            const isToday = start.toDateString() === now.toDateString();
            status = isToday ? 'progress' : 'incident'; // Si es hoy -> En curso. Si es viejo -> Olvido.
          }

          return {
            id: f.id,
            date: dateStr.charAt(0).toUpperCase() + dateStr.slice(1), // Capitalizar "lun" -> "Lun"
            fullDate: f.timestamp_entrada,
            entry: entryTime,
            exit: exitTime,
            location: f.geo_entrada ? f.geo_entrada.split('(')[0].trim() : 'Ubicación Web', // Limpiar texto
            total: duration,
            status: status
          };
        });

        setFichajes(processed);
      }
    } catch (err) {
      console.error('Error cargando historial:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper para badges de la tabla (Desktop)
  const getBadgeClassTable = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-success bg-opacity-10 text-success';
      case 'incident': return 'bg-danger bg-opacity-10 text-danger';
      case 'progress': return 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25';
      default: return 'bg-secondary';
    }
  };

  const getStatusLabelTable = (status: string) => {
    switch (status) {
      case 'valid': return 'VÁLIDO';
      case 'incident': return 'INCIDENCIA'; //
      case 'progress': return 'EN CURSO';   //
      default: return '-';
    }
  };

  return (
    <div className="fade-in-up pb-5">
      
      {/* HEADER COMPARTIDO */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <h2 className="fw-bold mb-0 text-dark">
          <span className="d-none d-md-inline">Historial de Jornada</span>
          <span className="d-md-none">Mis Fichajes</span> {/* */}
        </h2>
        
        <div className="d-flex gap-2 w-100 w-md-auto">
            {/* Select de Mes (Visual por ahora) */}
            <select className="form-select fw-bold border-0 shadow-sm rounded-pill px-4" style={{ width: 'auto', minWidth: '160px' }}>
                <option>📅 Octubre 2026</option>
                <option>Septiembre 2026</option>
            </select>
            
            {/* Botón Descargar (Solo Desktop) */}
            <button className="btn btn-outline-primary fw-bold rounded-pill px-4 d-none d-md-block">
                <i className="bi bi-download me-2"></i> Descargar PDF
            </button>
        </div>
      </div>

      {/* =======================================================
          VISTA ESCRITORIO: TABLA (Visible md+) 
         
         ======================================================= */}
      <div className="d-none d-md-block card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light border-bottom">
              <tr className="text-secondary small text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                <th className="py-4 ps-4 border-0">Fecha</th>
                <th className="py-4 border-0">Entrada</th>
                <th className="py-4 border-0">Salida</th>
                <th className="py-4 border-0">Ubicación</th>
                <th className="py-4 border-0">Total</th>
                <th className="py-4 border-0">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={6} className="text-center py-5">Cargando datos...</td></tr>
              ) : fichajes.length === 0 ? (
                 <tr><td colSpan={6} className="text-center py-5">No hay fichajes registrados este mes.</td></tr>
              ) : (
                fichajes.map((f) => (
                  <tr key={f.id} style={{ height: '70px' }}>
                    <td className="ps-4 fw-bold text-dark">{f.date}</td>
                    <td className="text-secondary">{f.entry}</td>
                    {/* Si es incidencia (falta salida), lo ponemos en rojo */}
                    <td className={f.status === 'incident' ? 'text-danger fw-bold' : 'text-secondary'}>
                        {f.exit}
                    </td>
                    <td className="text-secondary">{f.location}</td>
                    <td className={`fw-bold ${f.status === 'incident' ? 'text-danger' : 'text-dark'}`}>
                        {f.total}
                    </td>
                    <td>
                      <span className={`badge rounded-pill px-3 py-2 ${getBadgeClassTable(f.status)}`}>
                        {getStatusLabelTable(f.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =======================================================
          VISTA MÓVIL: TARJETAS (Visible <md)
         
         ======================================================= */}
      <div className="d-md-none">
        <div className="d-flex justify-content-end mb-3 px-1">
             <small className="text-secondary fw-bold">Total: {fichajes.length > 0 ? 'Calculando...' : '0h'}</small>
        </div>

        {loading ? (
             <div className="text-center py-5"><span className="spinner-border text-primary"></span></div>
        ) : fichajes.length === 0 ? (
             <p className="text-center text-muted">No tienes fichajes.</p>
        ) : (
             fichajes.map((f) => (
               <HistoryCard 
                 key={f.id} 
                 data={{
                   date: f.date,
                   fullDate: f.fullDate,
                   entryTime: f.entry,
                   exitTime: f.exit,
                   location: f.location.split('-')[0], // En móvil acortamos la ubicación
                   duration: f.total,
                   status: f.status
                 }} 
               />
             ))
        )}
      </div>
      
    </div>
  );
}