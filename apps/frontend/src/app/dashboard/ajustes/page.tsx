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
    <div className="fade-in-up pb-5">
      
      {/* HEADER (Cambia título según dispositivo para coincidir con tus capturas) */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1 d-none d-lg-block">Configuración de la Aplicación</h2>
        <h2 className="fw-bold text-dark mb-1 d-lg-none">Ajustes</h2>
        <p className="text-secondary d-none d-lg-block">Gestiona tus preferencias, alertas y privacidad.</p>
      </div>

      {/* =================================================================================
          VISTA ESCRITORIO (Grid de Tarjetas) -
         ================================================================================= */}
      <div className="d-none d-lg-flex row g-4">
        
        {/* COLUMNA 1: NOTIFICACIONES */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-bell-fill text-warning"></i> Notificaciones y Alertas
            </h5>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <span className="fw-bold d-block text-dark">Recordatorio de Entrada/Salida</span>
                <small className="text-muted">Avisar si detecta ubicación pero no fichaje.</small>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input fs-4" type="checkbox" 
                  checked={settings.recordatorio} 
                  onChange={() => toggleSetting('recordatorio')} 
                />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <span className="fw-bold d-block text-dark">Sonidos del Sistema</span>
                <small className="text-muted">Reproducir sonido al confirmar fichaje.</small>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input fs-4" type="checkbox" 
                  checked={settings.sonido} 
                  onChange={() => toggleSetting('sonido')} 
                />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold d-block text-dark">Resumen Semanal por Email</span>
                <small className="text-muted">Recibir PDF con las horas los viernes.</small>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input fs-4" type="checkbox" 
                  checked={settings.email} 
                  onChange={() => toggleSetting('email')} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: PRIVACIDAD */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-geo-alt-fill text-danger"></i> Privacidad y GPS
            </h5>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <span className="fw-bold d-block text-dark">Modo Alta Precisión</span>
                <small className="text-muted">Mejora la ubicación en obras. Consume más batería.</small>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input fs-4" type="checkbox" 
                  checked={settings.altaPrecision} 
                  onChange={() => toggleSetting('altaPrecision')} 
                />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <span className="fw-bold d-block text-dark">Política de Privacidad</span>
                <small className="text-muted">Lee cómo tratamos tus datos biométricos.</small>
              </div>
              <a href="#" className="fw-bold text-primary text-decoration-none small">Leer ›</a>
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold d-block text-dark">Datos en Caché</span>
                <small className="text-muted">Limpiar datos temporales del dispositivo.</small>
              </div>
              <button onClick={handleClearCache} className="btn btn-link text-danger fw-bold text-decoration-none p-0 small">Borrar</button>
            </div>
          </div>
        </div>

        {/* FILA INFERIOR: AYUDA */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-4 text-danger d-flex align-items-center gap-2">
              <i className="bi bi-question-circle-fill"></i> Centro de Ayuda
            </h5>
            <div className="row g-4">
              <div className="col-md-6">
                <div className="bg-light p-3 rounded-3 d-flex align-items-center gap-3 cursor-pointer hover-shadow transition-all">
                   <i className="bi bi-play-fill fs-3 text-primary"></i>
                   <div>
                      <h6 className="fw-bold mb-0 text-dark">Ver Tutorial de Uso</h6>
                      <small className="text-secondary">Aprende a fichar correctamente.</small>
                   </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="bg-light p-3 rounded-3 d-flex align-items-center gap-3 cursor-pointer hover-shadow transition-all">
                   <i className="bi bi-chat-dots-fill fs-4 text-secondary"></i>
                   <div>
                      <h6 className="fw-bold mb-0 text-dark">Contactar Soporte</h6>
                      <small className="text-secondary">Chat con RRHH o Técnico.</small>
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
      <div className="d-lg-none">
        
        {/* BLOQUE 1: NOTIFICACIONES */}
        <p className="text-secondary fw-bold small mb-2 px-2 text-uppercase">Notificaciones y Sonido</p>
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="list-group list-group-flush">
            
            <div className="list-group-item p-3 d-flex justify-content-between align-items-center border-bottom-light">
              <span className="fw-medium text-dark">Sonido al Fichar</span>
              <div className="form-check form-switch m-0">
                <input 
                  className="form-check-input fs-4 m-0" type="checkbox" 
                  checked={settings.sonido} 
                  onChange={() => toggleSetting('sonido')} 
                />
              </div>
            </div>

            <div className="list-group-item p-3 d-flex justify-content-between align-items-center border-bottom-light">
              <span className="fw-medium text-dark">Vibración Háptica</span>
              <div className="form-check form-switch m-0">
                <input 
                  className="form-check-input fs-4 m-0" type="checkbox" 
                  checked={settings.vibracion} 
                  onChange={() => toggleSetting('vibracion')} 
                />
              </div>
            </div>

            <div className="list-group-item p-3 d-flex justify-content-between align-items-center">
              <span className="fw-medium text-dark">Alerta "Olvidé Salir"</span>
              <div className="form-check form-switch m-0">
                <input 
                  className="form-check-input fs-4 m-0" type="checkbox" 
                  checked={settings.alertaOlvido} 
                  onChange={() => toggleSetting('alertaOlvido')} 
                />
              </div>
            </div>

          </div>
        </div>

        {/* BLOQUE 2: PRIVACIDAD */}
        <p className="text-secondary fw-bold small mb-2 px-2 text-uppercase">Ubicación y Privacidad</p>
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="list-group list-group-flush">
            
            <div className="list-group-item p-3 d-flex justify-content-between align-items-center list-group-item-action cursor-pointer">
              <span className="fw-medium text-dark">Permisos de Ubicación</span>
              <span className="text-secondary small d-flex align-items-center gap-1">
                 Al usar <i className="bi bi-chevron-right text-muted"></i>
              </span>
            </div>

            <div className="list-group-item p-3 d-flex justify-content-between align-items-center list-group-item-action cursor-pointer">
              <span className="fw-medium text-dark">Política de Privacidad</span>
              <i className="bi bi-chevron-right text-muted small"></i>
            </div>

          </div>
        </div>

        {/* BLOQUE 3: AYUDA */}
        <p className="text-secondary fw-bold small mb-2 px-2 text-uppercase">Ayuda</p>
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="list-group list-group-flush">
            
            <div className="list-group-item p-3 d-flex align-items-center gap-3 list-group-item-action cursor-pointer">
              <i className="bi bi-book text-secondary"></i>
              <span className="fw-medium text-dark">Cómo usar la App</span>
              <i className="bi bi-chevron-right text-muted small ms-auto"></i>
            </div>

            <div className="list-group-item p-3 d-flex align-items-center gap-3 list-group-item-action cursor-pointer">
              <i className="bi bi-chat-text text-secondary"></i>
              <span className="fw-medium text-dark">Contactar Soporte</span>
              <i className="bi bi-chevron-right text-muted small ms-auto"></i>
            </div>

             <div className="list-group-item p-3 d-flex justify-content-between align-items-center bg-light">
              <span className="fw-medium text-dark">Versión de la App</span>
              <span className="text-secondary font-monospace small">v1.0.2 (Beta)</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}