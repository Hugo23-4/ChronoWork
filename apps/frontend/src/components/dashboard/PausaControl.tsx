'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Coffee, MapPinOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PausaControlProps {
  userId: string;
  isWorking: boolean;
  fichajeId?: string;
}

interface PausaConfig {
  id: string;
  nombre: string;
  duracion_minutos: number;
  hora_inicio_sugerida: string | null;
  notificar_inicio: boolean;
  notificar_fin: boolean;
  notificar_antes_min: number;
}

interface PausaActiva {
  id: string;
  nombre: string;
  duracion_minutos: number;
  hora_inicio: string;
  notificar_fin: boolean;
  notificar_antes_min: number;
}

export default function PausaControl({ userId, isWorking, fichajeId }: PausaControlProps) {
  const [pausasConfig, setPausasConfig] = useState<PausaConfig[]>([]);
  const [pausaActiva, setPausaActiva] = useState<PausaActiva | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const notifiedRef = useRef<Set<string>>(new Set());
  // Config rarely changes — fetch once per component lifetime, not on every clock-in
  const configFetchedRef = useRef(false);

  useEffect(() => {
    if (isWorking) {
      if (!configFetchedRef.current) {
        fetchPausasConfig();
      }
      checkPausaActiva();
    }
  }, [isWorking, userId]);

  useEffect(() => {
    if (!pausaActiva) return;
    const start = new Date(pausaActiva.hora_inicio).getTime();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 1000);
    return () => clearInterval(interval);
  }, [pausaActiva]);

  useEffect(() => {
    if (!pausaActiva) return;
    const elapsedMin = elapsed / 60000;
    const remaining = pausaActiva.duracion_minutos - elapsedMin;

    if (pausaActiva.notificar_antes_min > 0 && remaining <= pausaActiva.notificar_antes_min && remaining > 0 && !notifiedRef.current.has('antes')) {
      notifiedRef.current.add('antes');
      sendNotification(`⏰ Quedan ${Math.ceil(remaining)} min de tu pausa de ${pausaActiva.nombre}`);
    }

    if (pausaActiva.notificar_fin && remaining <= 0 && !notifiedRef.current.has('fin')) {
      notifiedRef.current.add('fin');
      sendNotification(`✅ Tu pausa de ${pausaActiva.nombre} ha terminado. ¡Vuelve al puesto!`);
    }
  }, [elapsed, pausaActiva]);

  const sendNotification = useCallback((message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ChronoWork', { body: message, icon: '/favicon.ico' });
    }
  }, []);

  const fetchPausasConfig = async () => {
    const { data } = await supabase.from('configuracion_pausas').select('*').eq('activa', true);
    if (data) {
      setPausasConfig(data);
      configFetchedRef.current = true;
    }
  };

  const checkPausaActiva = async () => {
    const { data } = await supabase
      .from('pausas_registro')
      .select('*, configuracion_pausas(nombre, duracion_minutos, notificar_fin, notificar_antes_min)')
      .eq('empleado_id', userId)
      .is('hora_fin', null)
      .order('hora_inicio', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const config = (data as Record<string, unknown>).configuracion_pausas as Record<string, unknown> | null;
      setPausaActiva({
        id: data.id,
        nombre: (config?.nombre as string) || 'Pausa',
        duracion_minutos: (config?.duracion_minutos as number) || 15,
        hora_inicio: data.hora_inicio,
        notificar_fin: (config?.notificar_fin as boolean) ?? true,
        notificar_antes_min: (config?.notificar_antes_min as number) ?? 3,
      });
    }
  };

  const iniciarPausa = async (config: PausaConfig) => {
    setLoading(true);
    setShowMenu(false);

    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    const { data, error } = await supabase.from('pausas_registro').insert({
      empleado_id: userId,
      fichaje_id: fichajeId || null,
      pausa_config_id: config.id,
      hora_inicio: new Date().toISOString(),
    }).select().single();

    if (!error && data) {
      notifiedRef.current = new Set();
      setPausaActiva({
        id: data.id,
        nombre: config.nombre,
        duracion_minutos: config.duracion_minutos,
        hora_inicio: data.hora_inicio,
        notificar_fin: config.notificar_fin,
        notificar_antes_min: config.notificar_antes_min,
      });
      setElapsed(0);
      if (config.notificar_inicio) {
        sendNotification(`☕ Tu pausa de ${config.nombre} ha comenzado — ${config.duracion_minutos} min`);
      }
    }
    setLoading(false);
  };

  const finalizarPausa = async () => {
    if (!pausaActiva) return;
    setLoading(true);

    const ahora = new Date();
    const inicio = new Date(pausaActiva.hora_inicio);
    const duracionReal = Math.round((ahora.getTime() - inicio.getTime()) / 60000);

    await supabase.from('pausas_registro').update({
      hora_fin: ahora.toISOString(),
      duracion_real_min: duracionReal,
    }).eq('id', pausaActiva.id);

    setPausaActiva(null);
    setElapsed(0);
    setLoading(false);
  };

  const formatTimer = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isWorking || pausasConfig.length === 0) return null;

  const elapsedMin = elapsed / 60000;
  const progress = pausaActiva ? Math.min((elapsedMin / pausaActiva.duracion_minutos) * 100, 100) : 0;
  const isOvertime = pausaActiva && elapsedMin > pausaActiva.duracion_minutos;

  return (
    <div className="mt-4">

      {pausaActiva ? (
        <div className={cn(
          'rounded-2xl p-4 text-center animate-scale-in border-[1.5px]',
          isOvertime ? 'bg-red-500/[0.05] border-red-500/20' : 'bg-amber-500/[0.05] border-amber-500/20'
        )}>
          <div className="flex justify-between items-center mb-2">
            <span className={cn(
              'text-[0.75rem] font-bold uppercase tracking-widest',
              isOvertime ? 'text-red-700' : 'text-amber-800'
            )}>
              ☕ {pausaActiva.nombre} {isOvertime ? '· EXCEDIDA' : '· en curso'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-semibold bg-chrono-blue/10 text-blue-800 flex items-center gap-1">
              <MapPinOff className="w-3 h-3" />
              GPS pausado
            </span>
          </div>

          <div className={cn(
            'text-3xl font-extrabold font-mono my-2',
            isOvertime ? 'text-red-600' : 'text-navy'
          )}>
            {formatTimer(elapsed)}
          </div>
          <div className="text-xs text-slate-500 mb-3">
            de {pausaActiva.duracion_minutos} min permitidos
          </div>

          {/* Progress bar */}
          <div className="bg-gray-200 rounded-full h-1.5 mb-3 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isOvertime
                  ? 'bg-gradient-to-r from-amber-500 to-red-500'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            onClick={finalizarPausa}
            disabled={loading}
            className={cn(
              'w-full py-2.5 rounded-xl font-bold text-sm border-none cursor-pointer transition-colors text-white',
              isOvertime ? 'bg-red-600 hover:bg-red-700' : 'bg-navy hover:bg-slate-dark',
              loading && 'opacity-60 cursor-wait'
            )}
          >
            {loading ? 'Finalizando...' : isOvertime ? '⚠️ Finalizar pausa (excedida)' : 'Finalizar pausa'}
          </button>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-full py-2.5 px-4 rounded-xl border-[1.5px] border-gray-200 bg-white text-slate-600 font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 transition-all hover:border-amber-500 hover:bg-amber-500/[0.03]"
          >
            <Coffee className="w-4 h-4 text-amber-500" />
            Tomar pausa
          </button>

          {showMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-10 animate-scale-in">
              <div className="px-3 py-2 border-b border-gray-100">
                <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">
                  Selecciona tipo de pausa
                </span>
              </div>
              {pausasConfig.map((pc) => (
                <button
                  key={pc.id}
                  onClick={() => iniciarPausa(pc)}
                  disabled={loading}
                  className="w-full px-3 py-2.5 border-none bg-transparent cursor-pointer text-left flex justify-between items-center text-sm hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-navy">{pc.nombre}</span>
                  <span className="text-xs text-slate-400 font-medium">{pc.duracion_minutos} min</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
