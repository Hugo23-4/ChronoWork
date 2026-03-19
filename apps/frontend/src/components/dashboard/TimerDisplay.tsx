'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ReflectiveCard from '@/components/ui/ReflectiveCard';
import PausaControl from '@/components/dashboard/PausaControl';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  userId: string;
  onStatusChange?: () => void;
}

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
  const [status, setStatus] = useState<'fuera' | 'trabajando'>('fuera');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentFichajeId, setCurrentFichajeId] = useState<string | undefined>();

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
      const { data } = await supabase
        .from('fichajes')
        .select('*')
        .eq('empleado_id', userId)
        .eq('fecha', today)
        .is('hora_salida', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.hora_entrada) {
        setCurrentFichajeId(data.id);
        let start: Date;

        if (data.hora_entrada.includes('T') || data.hora_entrada.includes('Z')) {
          start = new Date(data.hora_entrada);
        } else {
          const [hours, minutes, seconds] = data.hora_entrada.split(':').map(Number);
          start = new Date();
          start.setHours(hours, minutes, seconds || 0, 0);
        }

        if (!isNaN(start.getTime())) {
          setStatus('trabajando');
          setStartTime(start.getTime());
          setElapsed(Date.now() - start.getTime());
        } else {
          setStatus('fuera');
        }
      } else {
        setStatus('fuera');
        setElapsed(0);
      }
    } catch {
      setStatus('fuera');
    }
  };

  const getPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('El navegador no soporta geolocalización'));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 0
        });
      }
    });
  };

  const handleFichaje = async (nuevoEstado: 'trabajando' | 'fuera') => {
    setLoading(true);
    setLocationError(null);
    setBlockingError(null);

    try {
      if (nuevoEstado === 'fuera') {
        await registrarSalida();
        setLoading(false);
        return;
      }

      let lat = 0;
      let lng = 0;

      try {
        const pos = await getPosition();
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (geoError: unknown) {
        const code = (geoError as GeolocationPositionError)?.code;
        let mensaje = "❌ Error desconocido de ubicación.";
        if (code === 1) mensaje = "🔒 Permiso denegado. Permite la ubicación en el navegador.";
        else if (code === 2) mensaje = "📡 Ubicación no disponible. No hay señal.";
        else if (code === 3) mensaje = "⏱️ Tiempo agotado. Inténtalo de nuevo.";

        setBlockingError(mensaje);
        setLoading(false);
        return;
      }

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

      const now = new Date();
      const fechaActual = now.toISOString().split('T')[0];
      const horaActual = now.toISOString();

      const { error } = await supabase.from('fichajes').insert({
        empleado_id: userId,
        fecha: fechaActual,
        hora_entrada: horaActual,
        tipo: 'trabajo',
        latitud_entrada: lat,
        longitud_entrada: lng,
        ubicacion_error: null
      });

      if (error) throw error;

      setStartTime(Date.now());
      setStatus(nuevoEstado);
      if (onStatusChange) onStatusChange();

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      setBlockingError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const registrarSalida = async () => {
    try {
      const horaActual = new Date().toISOString();

      let lat = null;
      let lng = null;
      try {
        const pos = await getPosition();
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // No se pudo obtener ubicación de salida
      }

      const updateData: Record<string, unknown> = { hora_salida: horaActual };
      if (lat && lng) {
        updateData.latitud_salida = lat;
        updateData.longitud_salida = lng;
      }

      const { error } = await supabase
        .from('fichajes')
        .update(updateData)
        .eq('empleado_id', userId)
        .is('hora_salida', null)
        .select();

      if (error) throw error;

      setStartTime(null);
      setElapsed(0);
      setStatus('fuera');
      if (onStatusChange) onStatusChange();
    } catch (error: unknown) {
      throw error;
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <ReflectiveCard className="w-full h-full">
      <div className="rounded-2xl overflow-hidden text-center relative bg-transparent">
        <div className="p-4 lg:p-8">

          <h2 className="font-bold mb-1 text-navy text-xl font-[family-name:var(--font-jakarta)]">
            {status === 'fuera' ? 'Hola, Compañero 👋' : '¡A por todas! 🚀'}
          </h2>
          <p className="text-slate-400 mb-4">
            {status === 'fuera' ? 'Registra tu entrada para comenzar.' : 'Tu jornada está en curso.'}
          </p>

          <div className="text-6xl font-bold font-mono my-4 text-navy tracking-tight">
            {formatTime(elapsed)}
          </div>

          {blockingError && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 rounded-xl py-3 px-4 text-sm mb-4 font-bold">
              {blockingError}
            </div>
          )}

          {locationError && (
            <div className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800/60 text-yellow-700 dark:text-yellow-400 rounded-xl py-2 px-4 text-sm mb-3">
              {locationError}
            </div>
          )}

          <div className="max-w-md mx-auto">
            {status === 'fuera' ? (
              <button
                onClick={() => handleFichaje('trabajando')}
                disabled={loading}
                className={cn(
                  'w-full py-3.5 rounded-full font-bold text-base shadow-lg transition-all cursor-pointer border-none',
                  loading
                    ? 'bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 cursor-not-allowed shadow-none'
                    : 'bg-[#0F172A] dark:bg-blue-600 dark:hover:bg-blue-500 text-white hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0'
                )}
              >
                {loading ? 'Ubicando...' : 'REGISTRAR ENTRADA'}
              </button>
            ) : (
              <button
                onClick={() => handleFichaje('fuera')}
                disabled={loading}
                className={cn(
                  'w-full py-3.5 rounded-full font-bold text-base transition-all cursor-pointer',
                  loading
                    ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 border-gray-200 dark:border-zinc-700 cursor-not-allowed'
                    : 'bg-transparent text-red-500 border-2 border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                )}
              >
                {loading ? 'Procesando...' : 'REGISTRAR SALIDA'}
              </button>
            )}
          </div>

          {/* Pausas */}
          <div className="max-w-md mx-auto">
            <PausaControl userId={userId} isWorking={status === 'trabajando'} fichajeId={currentFichajeId} />
          </div>

        </div>
        {/* Progress bar */}
        <div className="h-1.5">
          <div
            className={cn(
              'h-full w-full transition-colors',
              status === 'trabajando' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-200 dark:bg-zinc-700'
            )}
          />
        </div>
      </div>
    </ReflectiveCard>
  );
}