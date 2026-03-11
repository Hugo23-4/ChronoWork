'use client';

import { useState, useEffect } from 'react';

export default function AjustesPage() {
  // Estado para guardar las preferencias
  // En una app real, esto podría venir de Supabase, pero localStorage es estándar para ajustes de UI
  const [settings, setSettings] = useState({
    recordatorio: true,
    sonido: true,
    email: false,
    altaPrecision: true,
    vibracion: true,
    alertaOlvido: true
  });

  // Efecto para cargar preferencias guardadas al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('chrono_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // Función para cambiar un ajuste y guardar
  const toggleSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem('chrono_settings', JSON.stringify(newSettings));
  };

  // Función simulada para limpiar caché
  const handleClearCache = () => {
    if (confirm('¿Seguro que quieres borrar los datos temporales?')) {
      alert('Caché limpiada correctamente.');
    }
  };

  return (
    <div className="fade-in-up pb-6">
      
      {/* HEADER (Cambia título según dispositivo para coincidir con tus capturas) */}
      <div className="mb-4">
        <h2 className="font-bold text-navy mb-1 hidden lg:block">Configuración de la Aplicación</h2>
        <h2 className="font-bold text-navy mb-1 lg:hidden">Ajustes</h2>
        <p className="text-slate-500 hidden lg:block">Gestiona tus preferencias, alertas y privacidad.</p>
      </div>

      {/* =================================================================================
          VISTA ESCRITORIO (Grid de Tarjetas) -
         ================================================================================= */}
      <div className="hidden lg:flex row gap-4">
        
        {/* COLUMNA 1: NOTIFICACIONES */}
        <div className="lg:col-span-6">
          <div className="card border-0 shadow-sm rounded-2xl p-4 h-full">
            <h5 className="font-bold mb-4 flex items-center gap-2">
              <i className="bi bi-bell-fill text-amber-500"></i> Notificaciones y Alertas
            </h5>

            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="font-bold block text-navy">Recordatorio de Entrada/Salida</span>
                <small className="text-slate-400">Avisar si detecta ubicación pero no fichaje.</small>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="accent-chrono-blue text-xl" type="checkbox" 
                  checked={settings.recordatorio} 
                  onChange={() => toggleSetting('recordatorio')} 
                />
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="font-bold block text-navy">Sonidos del Sistema</span>
                <small className="text-slate-400">Reproducir sonido al confirmar fichaje.</small>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="accent-chrono-blue text-xl" type="checkbox" 
                  checked={settings.sonido} 
                  onChange={() => toggleSetting('sonido')} 
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold block text-navy">Resumen Semanal por Email</span>
                <small className="text-slate-400">Recibir PDF con las horas los viernes.</small>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="accent-chrono-blue text-xl" type="checkbox" 
                  checked={settings.email} 
                  onChange={() => toggleSetting('email')} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: PRIVACIDAD */}
        <div className="lg:col-span-6">
          <div className="card border-0 shadow-sm rounded-2xl p-4 h-full">
            <h5 className="font-bold mb-4 flex items-center gap-2">
              <i className="bi bi-geo-alt-fill text-red-500"></i> Privacidad y GPS
            </h5>

            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="font-bold block text-navy">Modo Alta Precisión</span>
                <small className="text-slate-400">Mejora la ubicación en obras. Consume más batería.</small>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="accent-chrono-blue text-xl" type="checkbox" 
                  checked={settings.altaPrecision} 
                  onChange={() => toggleSetting('altaPrecision')} 
                />
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="font-bold block text-navy">Política de Privacidad</span>
                <small className="text-slate-400">Lee cómo tratamos tus datos biométricos.</small>
              </div>
              <a href="#" className="font-bold text-chrono-blue no-underline text-sm">Leer ›</a>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold block text-navy">Datos en Caché</span>
                <small className="text-slate-400">Limpiar datos temporales del dispositivo.</small>
              </div>
              <button onClick={handleClearCache} className="bg-transparent border-none cursor-pointer text-red-500 font-bold no-underline p-0 text-sm">Borrar</button>
            </div>
          </div>
        </div>

        {/* FILA INFERIOR: AYUDA */}
        <div className="col-span-12">
          <div className="card border-0 shadow-sm rounded-2xl p-4">
            <h5 className="font-bold mb-4 text-red-500 flex items-center gap-2">
              <i className="bi bi-question-circle-fill"></i> Centro de Ayuda
            </h5>
            <div className="row gap-4">
              <div className="md:col-span-6">
                <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3 cursor-pointer hover-shadow transition-all">
                   <i className="bi bi-play-fill text-2xl text-chrono-blue"></i>
                   <div>
                      <h6 className="font-bold mb-0 text-navy">Ver Tutorial de Uso</h6>
                      <small className="text-slate-500">Aprende a fichar correctamente.</small>
                   </div>
                </div>
              </div>
              <div className="md:col-span-6">
                <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3 cursor-pointer hover-shadow transition-all">
                   <i className="bi bi-chat-dots-fill text-xl text-slate-500"></i>
                   <div>
                      <h6 className="font-bold mb-0 text-navy">Contactar Soporte</h6>
                      <small className="text-slate-500">Chat con RRHH o Técnico.</small>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================================
          VISTA MÓVIL (Lista Apilada) -
         ================================================================================= */}
      <div className="lg:hidden">
        
        {/* BLOQUE 1: NOTIFICACIONES */}
        <p className="text-slate-500 font-bold text-sm mb-2 px-2 uppercase">Notificaciones y Sonido</p>
        <div className="card border-0 shadow-sm rounded-2xl overflow-hidden mb-4">
          <div className="list-group list-group-flush">
            
            <div className="list-group-item p-3 flex justify-between items-center border-bottom-light">
              <span className="fw-medium text-navy">Sonido al Fichar</span>
              <div className="form-check form-switch m-0">
                <input 
                  className="accent-chrono-blue text-xl m-0" type="checkbox" 
                  checked={settings.sonido} 
                  onChange={() => toggleSetting('sonido')} 
                />
              </div>
            </div>

            <div className="list-group-item p-3 flex justify-between items-center border-bottom-light">
              <span className="fw-medium text-navy">Vibración Háptica</span>
              <div className="form-check form-switch m-0">
                <input 
                  className="accent-chrono-blue text-xl m-0" type="checkbox" 
                  checked={settings.vibracion} 
                  onChange={() => toggleSetting('vibracion')} 
                />
              </div>
            </div>

            <div className="list-group-item p-3 flex justify-between items-center">
              <span className="fw-medium text-navy">Alerta "Olvidé Salir"</span>
              <div className="form-check form-switch m-0">
                <input 
                  className="accent-chrono-blue text-xl m-0" type="checkbox" 
                  checked={settings.alertaOlvido} 
                  onChange={() => toggleSetting('alertaOlvido')} 
                />
              </div>
            </div>

          </div>
        </div>

        {/* BLOQUE 2: PRIVACIDAD */}
        <p className="text-slate-500 font-bold text-sm mb-2 px-2 uppercase">Ubicación y Privacidad</p>
        <div className="card border-0 shadow-sm rounded-2xl overflow-hidden mb-4">
          <div className="list-group list-group-flush">
            
            <div className="list-group-item p-3 flex justify-between items-center list-group-item-action cursor-pointer">
              <span className="fw-medium text-navy">Permisos de Ubicación</span>
              <span className="text-slate-500 text-sm flex items-center gap-1">
                 Al usar <i className="bi bi-chevron-right text-slate-400"></i>
              </span>
            </div>

            <div className="list-group-item p-3 flex justify-between items-center list-group-item-action cursor-pointer">
              <span className="fw-medium text-navy">Política de Privacidad</span>
              <i className="bi bi-chevron-right text-slate-400 text-sm"></i>
            </div>

          </div>
        </div>

        {/* BLOQUE 3: AYUDA */}
        <p className="text-slate-500 font-bold text-sm mb-2 px-2 uppercase">Ayuda</p>
        <div className="card border-0 shadow-sm rounded-2xl overflow-hidden mb-4">
          <div className="list-group list-group-flush">
            
            <div className="list-group-item p-3 flex items-center gap-3 list-group-item-action cursor-pointer">
              <i className="bi bi-book text-slate-500"></i>
              <span className="fw-medium text-navy">Cómo usar la App</span>
              <i className="bi bi-chevron-right text-slate-400 text-sm ml-auto"></i>
            </div>

            <div className="list-group-item p-3 flex items-center gap-3 list-group-item-action cursor-pointer">
              <i className="bi bi-chat-text text-slate-500"></i>
              <span className="fw-medium text-navy">Contactar Soporte</span>
              <i className="bi bi-chevron-right text-slate-400 text-sm ml-auto"></i>
            </div>

             <div className="list-group-item p-3 flex justify-between items-center bg-gray-50">
              <span className="fw-medium text-navy">Versión de la App</span>
              <span className="text-slate-500 font-mono text-sm">v1.0.2 (Beta)</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}