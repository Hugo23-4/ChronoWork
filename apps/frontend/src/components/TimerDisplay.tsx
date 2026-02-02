'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function TimerDisplay() {
  const { user } = useAuth();
  
  const [isWorking, setIsWorking] = useState(false); 
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [loading, setLoading] = useState(true);
  const [currentFichajeId, setCurrentFichajeId] = useState<string | null>(null);

  // 1. CARGA INICIAL: ¿Estoy trabajando?
  useEffect(() => {
    if (user) checkEstadoActual();
  }, [user]);

  // 2. CRONÓMETRO: Se actualiza cada segundo calculando la diferencia
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isWorking && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        
        // Formatear a HH:MM:SS
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setElapsed(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else {
      setElapsed('00:00:00'); // Si no trabaja, reseteamos o mostramos 00:00:00
    }

    return () => clearInterval(interval);
  }, [isWorking, startTime]);

  const checkEstadoActual = async () => {
    try {
      // Buscamos turno abierto (entrada sin salida)
      const { data } = await supabase
        .from('fichajes')
        .select('*')
        .eq('empleado_id', user?.id)
        .is('timestamp_salida', null)
        .order('timestamp_entrada', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setIsWorking(true);
        setStartTime(new Date(data.timestamp_entrada)); // ¡Clave! Recuperamos la hora real de inicio
        setCurrentFichajeId(data.id);
      } else {
        setIsWorking(false);
        setStartTime(null);
      }
    } catch (err) {
      console.log('Sin turno activo');
    } finally {
      setLoading(false);
    }
  };

  const handleFichaje = async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (!isWorking) {
        // ENTRADA
        const now = new Date();
        const { data, error } = await supabase
          .from('fichajes')
          .insert([{ 
              empleado_id: user.id, 
              timestamp_entrada: now.toISOString(),
              geo_entrada: 'Sede Central (Web)' 
            }])
          .select()
          .single();

        if (error) throw error;
        setIsWorking(true);
        setStartTime(now);
        setCurrentFichajeId(data.id);

      } else {
        // SALIDA
        if (!currentFichajeId) return;
        
        const { error } = await supabase
          .from('fichajes')
          .update({ 
            timestamp_salida: new Date().toISOString(),
            geo_salida: 'Sede Central (Web)'
          })
          .eq('id', currentFichajeId);

        if (error) throw error;
        setIsWorking(false);
        setStartTime(null);
        setCurrentFichajeId(null);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white">
      <div className="card-body d-flex flex-column justify-content-center align-items-center text-center p-4">
        
        {/* Badge Estado */}
        <span className={`badge rounded-pill px-3 py-2 mb-3 d-flex align-items-center gap-2
          ${isWorking ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
          <i className={`bi bi-circle-fill small ${isWorking ? 'blink-animation' : ''}`}></i>
          {isWorking ? 'JORNADA ACTIVA' : 'JORNADA PAUSADA'}
        </span>

        {/* CONTADOR GIGANTE (Duración) */}
        <h2 className="display-1 fw-bold mb-1 text-dark" style={{ letterSpacing: '-2px', fontVariantNumeric: 'tabular-nums' }}>
          {elapsed}
        </h2>
        
        {/* Hora de Inicio (Solo si está trabajando) */}
        <p className="text-secondary mb-4 fw-medium small">
          {isWorking && startTime 
            ? `Inicio registrado: ${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • Sede Central` 
            : 'Listo para comenzar tu jornada'}
        </p>

        {/* Botón Acción */}
        <button 
          className={`btn btn-lg w-100 py-3 fw-bold rounded-3 shadow-sm transition-all text-uppercase
            ${isWorking ? 'btn-danger' : 'btn-primary'}`} // btn-primary usará tu azul Loom
          onClick={handleFichaje}
          disabled={loading}
          style={{ letterSpacing: '1px' }}
        >
          {loading ? 'Procesando...' : (isWorking ? 'Finalizar Turno' : 'Registrar Entrada')}
        </button>
      </div>
    </div>
  );
}