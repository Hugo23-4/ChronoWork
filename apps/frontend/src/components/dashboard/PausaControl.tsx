'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    if (isWorking) {
      fetchPausasConfig();
      checkPausaActiva();
    }
  }, [isWorking, userId]);

  // Timer
  useEffect(() => {
    if (!pausaActiva) return;
    const start = new Date(pausaActiva.hora_inicio).getTime();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 1000);
    return () => clearInterval(interval);
  }, [pausaActiva]);

  // Notificaciones
  useEffect(() => {
    if (!pausaActiva) return;
    const elapsedMin = elapsed / 60000;
    const remaining = pausaActiva.duracion_minutos - elapsedMin;

    // Notificar X min antes de acabar
    if (pausaActiva.notificar_antes_min > 0 && remaining <= pausaActiva.notificar_antes_min && remaining > 0 && !notifiedRef.current.has('antes')) {
      notifiedRef.current.add('antes');
      sendNotification(`⏰ Quedan ${Math.ceil(remaining)} min de tu pausa de ${pausaActiva.nombre}`);
    }

    // Notificar fin
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
    if (data) setPausasConfig(data);
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
      const config = (data as any).configuracion_pausas;
      setPausaActiva({
        id: data.id,
        nombre: config?.nombre || 'Pausa',
        duracion_minutos: config?.duracion_minutos || 15,
        hora_inicio: data.hora_inicio,
        notificar_fin: config?.notificar_fin ?? true,
        notificar_antes_min: config?.notificar_antes_min ?? 3,
      });
    }
  };

  const iniciarPausa = async (config: PausaConfig) => {
    setLoading(true);
    setShowMenu(false);

    // Pedir permiso de notificaciones
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
    <div style={{ marginTop: '1rem' }}>

      {pausaActiva ? (
        /* PAUSA EN CURSO */
        <div className="anim-scale-in" style={{
          background: isOvertime ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
          border: `1.5px solid ${isOvertime ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
          borderRadius: 16, padding: '1rem 1.25rem', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: isOvertime ? '#B91C1C' : '#92400E',
            }}>
              ☕ {pausaActiva.nombre} {isOvertime ? '· EXCEDIDA' : '· en curso'}
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
              background: 'rgba(37,99,235,0.1)', color: '#1E3A8A',
            }}>
              📍 GPS pausado
            </span>
          </div>

          <div style={{
            fontSize: '2rem', fontWeight: 800, fontFamily: 'monospace',
            color: isOvertime ? '#DC2626' : '#0F172A', margin: '8px 0',
          }}>
            {formatTimer(elapsed)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: 10 }}>
            de {pausaActiva.duracion_minutos} min permitidos
          </div>

          {/* Barra progreso */}
          <div style={{ background: '#E2E8F0', borderRadius: 999, height: 6, marginBottom: 12, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999, transition: 'width 0.5s',
              width: `${progress}%`,
              background: isOvertime
                ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                : 'linear-gradient(90deg, #F59E0B, #10B981)',
            }} />
          </div>

          <button onClick={finalizarPausa} disabled={loading} style={{
            width: '100%', padding: '10px', borderRadius: 10, border: 'none',
            background: isOvertime ? '#DC2626' : '#0F172A', color: 'white',
            fontWeight: 700, fontSize: '0.875rem', cursor: loading ? 'wait' : 'pointer',
          }}>
            {loading ? 'Finalizando...' : isOvertime ? '⚠️ Finalizar pausa (excedida)' : 'Finalizar pausa'}
          </button>
        </div>
      ) : (
        /* BOTÓN INICIAR PAUSA */
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{
            width: '100%', padding: '10px 16px', borderRadius: 12,
            border: '1.5px solid #E2E8F0', background: 'white',
            color: '#475569', fontWeight: 600, fontSize: '0.875rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F59E0B'; e.currentTarget.style.background = 'rgba(245,158,11,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = 'white'; }}
          >
            <i className="bi bi-cup-hot" style={{ color: '#F59E0B' }} />
            Tomar pausa
          </button>

          {showMenu && (
            <div className="anim-scale-in" style={{
              position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6,
              background: 'white', borderRadius: 14, boxShadow: '0 8px 30px rgba(15,23,42,0.15)',
              border: '1px solid #E2E8F0', overflow: 'hidden', zIndex: 10,
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Selecciona tipo de pausa
                </span>
              </div>
              {pausasConfig.map((pc) => (
                <button key={pc.id} onClick={() => iniciarPausa(pc)} disabled={loading} style={{
                  width: '100%', padding: '10px 12px', border: 'none', background: 'transparent',
                  cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', fontSize: '0.875rem', borderBottom: '1px solid #F8FAFC',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{pc.nombre}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>{pc.duracion_minutos} min</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
