'use client';

import { useState, useEffect } from 'react';
import { m, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Play, Square, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReflectiveCard from '@/components/ui/ReflectiveCard';
import PausaControl from '@/components/dashboard/PausaControl';
import { cn } from '@/lib/utils';
import { springSoft, springSnappy } from '@/lib/motion';

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
        let mensaje = 'Error desconocido de ubicación.';
        if (code === 1) mensaje = 'Permiso denegado. Permite la ubicación en el navegador.';
        else if (code === 2) mensaje = 'Ubicación no disponible. No hay señal.';
        else if (code === 3) mensaje = 'Tiempo agotado. Inténtalo de nuevo.';

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
          setBlockingError(`Fuera de zona. Estás a ${Math.round(distanciaMinima)}m de "${sedeMasCercana}".`);
          setLoading(false);
          return;
        }
      } else {
        setLocationError('Fichaje permitido (sin sedes activas).');
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
    if (!currentFichajeId) throw new Error('No hay fichaje activo para cerrar');

    const horaActual = new Date().toISOString();

    let lat = null;
    let lng = null;
    try {
      const pos = await getPosition();
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // Ubicación de salida opcional — no bloquea el fichaje
    }

    const updateData: Record<string, unknown> = { hora_salida: horaActual };
    if (lat && lng) {
      updateData.latitud_salida = lat;
      updateData.longitud_salida = lng;
    }

    const { error } = await supabase
      .from('fichajes')
      .update(updateData)
      .eq('id', currentFichajeId);

    if (error) throw error;

    setCurrentFichajeId(undefined);
    setStartTime(null);
    setElapsed(0);
    setStatus('fuera');
    if (onStatusChange) onStatusChange();
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const isWorking = status === 'trabajando';

  return (
    <ReflectiveCard className="w-full h-full">
      <LayoutGroup>
        <div className="overflow-hidden text-center relative bg-transparent rounded-[24px]">
          <div className="px-5 py-7 sm:px-8 sm:py-10">

            {/* Status pill */}
            <div className="flex justify-center mb-5">
              <m.div
                layout
                transition={springSoft}
                className={cn(
                  'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-medium',
                  isWorking
                    ? 'bg-[#34C759]/12 text-[#1F8C3D] dark:text-[#34C759]'
                    : 'bg-systemGray-6 dark:bg-white/8 text-[--color-label-secondary] dark:text-[#aeaeb2]'
                )}
              >
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isWorking ? 'bg-[#34C759] animate-pulse' : 'bg-systemGray-2 dark:bg-systemGray-1'
                )} />
                {isWorking ? 'Jornada en curso' : 'Sin actividad'}
              </m.div>
            </div>

            <h2 className="cw-title-2 text-[--color-label-primary] dark:text-white mb-1.5">
              {isWorking ? '¡A por todas!' : 'Hola, compañero'}
            </h2>
            <p className="text-[15px] text-[--color-label-secondary] dark:text-[#aeaeb2] mb-7">
              {isWorking ? 'Tu jornada está en curso.' : 'Registra tu entrada para comenzar.'}
            </p>

            {/* Time display */}
            <div className="cw-display cw-numeric text-[--color-label-primary] dark:text-white my-6 select-none">
              {formatTime(elapsed)}
            </div>

            {/* Errors */}
            <AnimatePresence>
              {blockingError && (
                <m.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={springSoft}
                  className="flex items-center gap-2 mx-auto max-w-md bg-[#FF3B30]/10 dark:bg-[#FF453A]/15 text-[#C9251D] dark:text-[#FF6961] rounded-[14px] px-4 py-3 text-sm mb-4"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-left">{blockingError}</span>
                </m.div>
              )}
              {locationError && !blockingError && (
                <m.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={springSoft}
                  className="flex items-center gap-2 mx-auto max-w-md bg-[#FF9500]/10 text-[#B36800] dark:text-[#FFB454] rounded-[14px] px-4 py-2.5 text-sm mb-3"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-left">{locationError}</span>
                </m.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <div className="max-w-md mx-auto mt-2">
              <AnimatePresence mode="wait" initial={false}>
                {!isWorking ? (
                  <m.button
                    key="start"
                    onClick={() => handleFichaje('trabajando')}
                    disabled={loading}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    whileTap={{ scale: 0.97 }}
                    transition={springSnappy}
                    className={cn(
                      'w-full h-14 rounded-[20px] font-semibold text-[17px] flex items-center justify-center gap-2 cursor-pointer border-none transition-colors',
                      loading
                        ? 'bg-systemGray-5 dark:bg-white/10 text-[--color-label-tertiary] cursor-not-allowed'
                        : 'bg-ios-blue text-white hover:bg-[#0066D9]'
                    )}
                    style={!loading ? { boxShadow: '0 8px 24px rgba(0, 122, 255, 0.28)' } : undefined}
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Ubicando…</>
                    ) : (
                      <><Play className="w-5 h-5 fill-current" /> Registrar entrada</>
                    )}
                  </m.button>
                ) : (
                  <m.button
                    key="stop"
                    onClick={() => handleFichaje('fuera')}
                    disabled={loading}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    whileTap={{ scale: 0.97 }}
                    transition={springSnappy}
                    className={cn(
                      'w-full h-14 rounded-[20px] font-semibold text-[17px] flex items-center justify-center gap-2 cursor-pointer transition-colors',
                      loading
                        ? 'bg-systemGray-5 dark:bg-white/10 text-[--color-label-tertiary] border-0 cursor-not-allowed'
                        : 'bg-[#FF3B30]/10 text-[#FF3B30] border-0 hover:bg-[#FF3B30]/15'
                    )}
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Procesando…</>
                    ) : (
                      <><Square className="w-5 h-5 fill-current" /> Registrar salida</>
                    )}
                  </m.button>
                )}
              </AnimatePresence>
            </div>

            {/* Pausas */}
            <div className="max-w-md mx-auto mt-3">
              <PausaControl userId={userId} isWorking={isWorking} fichajeId={currentFichajeId} />
            </div>

          </div>

          {/* Subtle bottom indicator */}
          <m.div
            className={cn(
              'h-[3px] w-full origin-left',
              isWorking ? 'bg-gradient-to-r from-[#34C759] via-[#34C759] to-[#34C759]/40' : 'bg-systemGray-5 dark:bg-white/6'
            )}
            animate={{ scaleX: isWorking ? [0.4, 1, 0.4] : 1 }}
            transition={isWorking ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />
        </div>
      </LayoutGroup>
    </ReflectiveCard>
  );
}
