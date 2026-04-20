'use client';

import { useState, useEffect } from 'react';
import { Bell, MapPin, HelpCircle, Play, MessageSquare, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AjustesPage() {
  const [settings, setSettings] = useState({
    recordatorio: true, sonido: true, email: false,
    altaPrecision: true, vibracion: true, alertaOlvido: true
  });

  useEffect(() => {
    const saved = localStorage.getItem('chrono_settings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const toggleSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem('chrono_settings', JSON.stringify(newSettings));
  };

  const handleClearCache = () => {
    if (confirm('¿Seguro que quieres borrar los datos temporales?')) {
      alert('Caché limpiada correctamente.');
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={cn(
      'relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none shrink-0',
      checked ? 'bg-chrono-blue' : 'bg-gray-300'
    )}>
      <div className={cn(
        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
        checked ? 'translate-x-[22px]' : 'translate-x-0.5'
      )} />
    </button>
  );

  return (
    <div className="animate-fade-up pb-20 lg:pb-6">
      <div className="mb-5">
        <h2 className="font-bold text-navy dark:text-zinc-100 text-2xl font-[family-name:var(--font-jakarta)] mb-1 hidden lg:block">
          Configuración de la Aplicación
        </h2>
        <h2 className="font-bold text-navy dark:text-zinc-100 text-xl font-[family-name:var(--font-jakarta)] mb-1 lg:hidden">Ajustes</h2>
        <p className="text-slate-400 dark:text-zinc-400 text-sm hidden lg:block">Gestiona tus preferencias, alertas y privacidad.</p>
      </div>

      {/* ═══ DESKTOP ═══ */}
      <div className="hidden lg:grid grid-cols-2 gap-5">
        {/* Notifications */}
        <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-2xl p-5">
          <h5 className="font-bold text-navy dark:text-zinc-100 mb-5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-500" />
            </div>
            Notificaciones y Alertas
          </h5>
          <div className="space-y-5">
            {[
              { key: 'recordatorio' as const, label: 'Recordatorio de Entrada/Salida', desc: 'Avisar si detecta ubicación pero no fichaje.' },
              { key: 'sonido' as const, label: 'Sonidos del Sistema', desc: 'Reproducir sonido al confirmar fichaje.' },
              { key: 'email' as const, label: 'Resumen Semanal por Email', desc: 'Recibir PDF con las horas los viernes.' },
            ].map(s => (
              <div key={s.key} className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-navy dark:text-zinc-100 text-sm block">{s.label}</span>
                  <small className="text-slate-400 dark:text-zinc-400 text-xs">{s.desc}</small>
                </div>
                <Toggle checked={settings[s.key]} onChange={() => toggleSetting(s.key)} />
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-2xl p-5">
          <h5 className="font-bold text-navy dark:text-zinc-100 mb-5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-red-500" />
            </div>
            Privacidad y GPS
          </h5>
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-navy text-sm block">Modo Alta Precisión</span>
                <small className="text-slate-400 text-xs">Mejora la ubicación en obras. Consume más batería.</small>
              </div>
              <Toggle checked={settings.altaPrecision} onChange={() => toggleSetting('altaPrecision')} />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-navy text-sm block">Política de Privacidad</span>
                <small className="text-slate-400 text-xs">Lee cómo tratamos tus datos biométricos.</small>
              </div>
              <a href="#" className="text-chrono-blue font-bold text-xs no-underline hover:underline">Leer ›</a>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-navy text-sm block">Datos en Caché</span>
                <small className="text-slate-400 text-xs">Limpiar datos temporales del dispositivo.</small>
              </div>
              <button onClick={handleClearCache} className="text-red-500 font-bold text-xs bg-transparent border-none cursor-pointer hover:text-red-700 transition-colors flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" />
                Borrar
              </button>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="col-span-2 bg-white dark:bg-zinc-800 shadow-sm rounded-2xl p-5">
          <h5 className="font-bold text-navy dark:text-zinc-100 mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-sky-500" />
            </div>
            Centro de Ayuda
          </h5>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-zinc-700/50 p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
              <div className="w-10 h-10 bg-chrono-blue/10 rounded-xl flex items-center justify-center">
                <Play className="w-4 h-4 text-chrono-blue" />
              </div>
              <div>
                <h6 className="font-bold text-navy dark:text-zinc-100 text-sm mb-0.5">Ver Tutorial de Uso</h6>
                <small className="text-slate-400 text-xs">Aprende a fichar correctamente.</small>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-700/50 p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
              <div className="w-10 h-10 bg-slate-500/10 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <h6 className="font-bold text-navy dark:text-zinc-100 text-sm mb-0.5">Contactar Soporte</h6>
                <small className="text-slate-400 text-xs">Chat con RRHH o Técnico.</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MOBILE ═══ */}
      <div className="lg:hidden space-y-5">
        {/* Notifications */}
        <div>
          <p className="text-slate-400 dark:text-zinc-400 font-bold text-xs mb-2 px-1 uppercase tracking-wider">Notificaciones y Sonido</p>
          <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-zinc-700">
            {[
              { key: 'sonido' as const, label: 'Sonido al Fichar' },
              { key: 'vibracion' as const, label: 'Vibración Háptica' },
              { key: 'alertaOlvido' as const, label: 'Alerta "Olvidé Salir"' },
            ].map(s => (
              <div key={s.key} className="p-3.5 flex justify-between items-center">
                <span className="font-medium text-navy dark:text-zinc-100 text-sm">{s.label}</span>
                <Toggle checked={settings[s.key]} onChange={() => toggleSetting(s.key)} />
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div>
          <p className="text-slate-400 dark:text-zinc-400 font-bold text-xs mb-2 px-1 uppercase tracking-wider">Ubicación y Privacidad</p>
          <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-zinc-700">
            <div className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
              <span className="font-medium text-navy dark:text-zinc-100 text-sm">Permisos de Ubicación</span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                Al usar <ChevronRight className="w-4 h-4" />
              </span>
            </div>
            <div className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
              <span className="font-medium text-navy dark:text-zinc-100 text-sm">Política de Privacidad</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Help */}
        <div>
          <p className="text-slate-400 dark:text-zinc-400 font-bold text-xs mb-2 px-1 uppercase tracking-wider">Ayuda</p>
          <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-zinc-700">
            <div className="p-3.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-navy dark:text-zinc-100 text-sm flex-1">Cómo usar la App</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="p-3.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-navy dark:text-zinc-100 text-sm flex-1">Contactar Soporte</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="p-3.5 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-700/50">
              <span className="font-medium text-navy dark:text-zinc-100 text-sm">Versión de la App</span>
              <span className="text-slate-500 dark:text-zinc-400 font-mono text-xs">v1.0.2 (Beta)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}