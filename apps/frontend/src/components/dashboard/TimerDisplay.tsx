'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface TimerDisplayProps {
  userId: string;
  onStatusChange?: () => void;
}

// --- UTILIDAD: Calcular distancia (Haversine) ---
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export default function TimerDisplay({ userId, onStatusChange }: TimerDisplayProps) {
  const [status, setStatus] = useState<'fuera' | 'trabajando' | 'pausa'>('fuera');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [locationError, setLocationError] = useState<string | null>(null);
  const [blockingError, setBlockingError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) checkCurrentStatus();
  }, [userId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'trabajando' && startTime) {
      interval = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, startTime]);

  const checkCurrentStatus = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('fichajes')
          .select('*')
          .eq('empleado_id', userId)
          .eq('fecha', today)
          .is('hora_salida', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); 

        if (data) {
          setStatus(data.tipo === 'pausa' ? 'pausa' : 'trabajando');
          const horaParts = data.hora_entrada.split(':');
          const start = new Date();
          start.setHours(parseInt(horaParts[0]), parseInt(horaParts[1]), parseInt(horaParts[2] || '0'));
          setStartTime(start.getTime());
          setElapsed(Date.now() - start.getTime());
        } else {
          setStatus('fuera');
          setElapsed(0);
        }
    } catch (e) {
        console.error("Excepción verificando estado:", e);
    }
  };

  const getPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('El navegador no soporta geolocalización'));
      } else {
        // CORRECCIÓN AQUÍ: Quitamos 'enableHighAccuracy' para que funcione en PC/Interiores
        // y aumentamos el tiempo de espera a 20 segundos.
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false, // False = Usa Wi-Fi (Más rápido y compatible)
            timeout: 20000,            // 20 segundos de paciencia
            maximumAge: 0
        });
      }
    });
  };

  const handleFichaje = async (nuevoEstado: 'trabajando' | 'pausa' | 'fuera') => {
    setLoading(true);
    setLocationError(null);
    setBlockingError(null);
    
    try {
        if (nuevoEstado === 'fuera') {
            await registrarSalida();
            setLoading(false);
            return;
        }

        // --- INTENTO DE OBTENER GPS ---
        let lat = 0;
        let lng = 0;

        try {
            const pos = await getPosition();
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
        } catch (geoError: any) {
            console.error("Error GPS detallado:", geoError);
            
            let mensaje = "❌ Error desconocido de ubicación.";
            if (geoError.code === 1) mensaje = "🔒 Permiso denegado. Permite la ubicación en el navegador.";
            else if (geoError.code === 2) mensaje = "📡 Ubicación no disponible. No hay señal.";
            else if (geoError.code === 3) mensaje = "⏱️ Tiempo agotado. Inténtalo de nuevo.";
            
            setBlockingError(mensaje);
            setLoading(false);
            return;
        }

        // --- GEOVALLA ---
        const { data: sedes } = await supabase.from('sedes').select('*').eq('activo', true);

        if (sedes && sedes.length > 0) {
            let dentroDeZona = false;
            let sedeMasCercana = '';
            let distanciaMinima = 9999999;

            for (const sede of sedes) {
                const distancia = getDistanceFromLatLonInMeters(lat, lng, sede.latitud, sede.longitud);
                if (distancia < distanciaMinima) {
                    distanciaMinima = distancia;
                    sedeMasCercana = sede.nombre;
                }
                if (distancia <= sede.radio_metros) {
                    dentroDeZona = true;
                    break; 
                }
            }

            if (!dentroDeZona) {
                setBlockingError(`⛔ Fuera de zona. Estás a ${Math.round(distanciaMinima)}m de "${sedeMasCercana}".`);
                setLoading(false);
                return;
            }
        } else {
             setLocationError("⚠️ Fichaje permitido (Sin sedes activas)");
        }

        // --- GUARDAR ---
        const now = new Date();
        const horaActual = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const fechaActual = now.toISOString().split('T')[0];

        const { error } = await supabase.from('fichajes').insert({
            empleado_id: userId,
            fecha: fechaActual,
            hora_entrada: horaActual,
            tipo: 'trabajo',
            latitud: lat,
            longitud: lng,
            ubicacion_error: null
        });

        if (error) throw error;

        setStartTime(Date.now());
        setStatus(nuevoEstado);
        if (onStatusChange) onStatusChange();

    } catch (error: any) {
        alert('Error: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  const registrarSalida = async () => {
    const now = new Date();
    const horaActual = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const { error } = await supabase
        .from('fichajes')
        .update({ hora_salida: horaActual })
        .eq('empleado_id', userId)
        .is('hora_salida', null)
        .select();
    
    if (error) throw error;
    
    setStartTime(null);
    setElapsed(0);
    setStatus('fuera');
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden text-center position-relative bg-white">
      <div className="card-body p-4 p-lg-5">
        
        <h2 className="fw-bold mb-1 text-dark">
            {status === 'fuera' ? 'Hola, Compañero 👋' : 
             status === 'trabajando' ? '¡A por todas! 🚀' : 'Descanso merecido ☕'}
        </h2>
        <p className="text-secondary mb-4">
            {status === 'fuera' ? 'Registra tu entrada para comenzar.' : 
             status === 'trabajando' ? 'Tu jornada está en curso.' : 'Recarga pilas.'}
        </p>

        <div className="display-1 fw-bold font-monospace my-4 text-dark tracking-tight">
            {formatTime(elapsed)}
        </div>

        {blockingError && (
            <div className="alert alert-danger border-0 bg-danger bg-opacity-10 py-3 small mb-4 fw-bold animate__animated animate__shakeX">
                {blockingError}
            </div>
        )}
        
        {locationError && (
            <div className="alert alert-warning border-0 bg-warning bg-opacity-10 py-2 small mb-3">
                {locationError}
            </div>
        )}

        <div className="d-grid gap-2 col-md-8 mx-auto">
            {status === 'fuera' ? (
                <button 
                    onClick={() => handleFichaje('trabajando')} 
                    disabled={loading}
                    className="btn btn-dark btn-lg rounded-pill py-3 fw-bold shadow-lg hover-scale transition-all"
                >
                    {loading ? 'Ubicando...' : 'REGISTRAR ENTRADA'}
                </button>
            ) : (
                <button 
                    onClick={() => handleFichaje('fuera')} 
                    disabled={loading}
                    className="btn btn-outline-danger btn-lg rounded-pill py-3 fw-bold"
                >
                    {loading ? 'Procesando...' : 'REGISTRAR SALIDA'}
                </button>
            )}
        </div>

      </div>
      <div className={`progress mt-4 rounded-0`} style={{height: '6px'}}>
          <div className={`progress-bar ${status === 'trabajando' ? 'bg-success progress-bar-striped progress-bar-animated' : 'bg-secondary'}`} style={{width: '100%'}}></div>
      </div>
    </div>
  );
}