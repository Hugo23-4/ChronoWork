'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// Interfaz para tipar los datos y evitar errores
interface ProfileData {
  nombre: string;
  apellido: string;
  puesto: string;
  email?: string;
  telefono: string;
  dni: string;
  seguridad_social: string;
  tipo_contrato: string;
  convenio: string;
}

export default function PerfilPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Estado para los datos del perfil
  const [profile, setProfile] = useState<ProfileData>({
    nombre: 'Cargando...',
    apellido: '',
    puesto: '...',
    telefono: '...',
    dni: '...',
    seguridad_social: '...',
    tipo_contrato: '...',
    convenio: '...'
  });

  // Estados de carga y UI
  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false); // Estado para el botón de email
  
  // Estados para los toggles (Visuales)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  // 1. OBTENER DATOS DE SUPABASE
  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('empleados_info')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // Ignoramos error si no existe fila aun
      
      if (data) {
        setProfile({
            nombre: data.nombre || 'Usuario',
            apellido: data.apellido || '',
            puesto: data.puesto || 'Puesto no definido',
            email: user?.email, 
            telefono: data.telefono || '+34 000 000 000',
            dni: data.dni || 'No registrado',
            seguridad_social: data.seguridad_social || 'Pendiente',
            tipo_contrato: data.tipo_contrato || 'Indefinido',
            convenio: data.convenio || 'General'
        });
      }
    } catch (err) {
      console.error('Error cargando perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. FUNCIÓN CERRAR SESIÓN
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // 3. FUNCIÓN RECUPERAR CONTRASEÑA POR EMAIL
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetLoading(true);

    try {
      // Redirige a la página de actualización que creamos antes
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      alert(`✅ Correo enviado a ${user.email}. Revisa tu bandeja de entrada para cambiar la contraseña.`);
    } catch (error: any) {
      alert('Error al enviar correo: ' + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center min-vh-50 py-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
            </div>
        </div>
      );
  }

  return (
    <div className="fade-in-up pb-5">
      
      {/* HEADER DESKTOP */}
      <div className="mb-4 d-none d-lg-block">
        <h2 className="fw-bold text-dark mb-1">Tu Perfil de Empleado</h2>
      </div>

      <div className="row g-4">
        
        {/* =======================================================
            COLUMNA IZQUIERDA: TARJETA DE IDENTIFICACIÓN
           ======================================================= */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 bg-white">
            {/* Fondo Azul Header */}
            <div className="d-none d-lg-block" style={{ height: '100px', backgroundColor: '#0F172A' }}></div>
            
            <div className="card-body text-center pt-0 pt-lg-0 p-4">
              
              {/* Avatar con Iniciales */}
              <div className="position-relative d-inline-block mt-lg-n5 mb-3 mt-4">
                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center border border-4 border-white shadow-sm" 
                     style={{ width: '120px', height: '120px', fontSize: '2.5rem', fontWeight: '700' }}>
                  {profile.nombre.charAt(0)}{profile.apellido.charAt(0)}
                </div>
              </div>

              <h3 className="fw-bold text-dark mb-1">{profile.nombre} {profile.apellido}</h3>
              <p className="text-secondary mb-3">{profile.puesto} • LOOM S.L.</p>
              
              {/* Badge ID (Solo Desktop) */}
              <div className="d-none d-lg-inline-block badge bg-light text-dark border px-3 py-2 rounded-pill mb-4 font-monospace">
                ID: {user?.id.substring(0, 8).toUpperCase()}
              </div>

              {/* QR Code Simulado (Solo Desktop) */}
              <div className="d-none d-lg-block mt-4 border rounded-3 p-4 mx-auto bg-white" style={{ maxWidth: '200px' }}>
                 <div className="d-flex flex-wrap gap-1 justify-content-center opacity-75">
                    {/* Generamos cuadraditos para simular el QR visualmente */}
                    {[...Array(49)].map((_, i) => (
                        <div key={i} className="bg-dark" style={{ 
                            width: '18px', 
                            height: '18px', 
                            borderRadius: '2px',
                            opacity: Math.random() > 0.5 ? 1 : 0.1 
                        }}></div>
                    ))}
                 </div>
                 <small className="d-block mt-3 text-secondary fw-bold" style={{ fontSize: '0.75rem' }}>Escanear en Kiosco</small>
              </div>

            </div>
          </div>
        </div>

        {/* =======================================================
            COLUMNA DERECHA: DATOS
           ======================================================= */}
        <div className="col-lg-8">
            
            {/* SECCIÓN 1: DATOS PERSONALES / CONTRATO */}
            <h6 className="d-none d-lg-block fw-bold mb-3 text-dark">Datos del Contrato</h6>
            <h6 className="d-lg-none text-secondary fw-bold small mb-3 px-2 text-uppercase">Información Personal</h6>
            
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                
                {/* Vista Desktop: Grid 2 Columnas */}
                <div className="d-none d-lg-row row g-4">
                    <div className="col-6">
                        <small className="text-secondary fw-bold d-block mb-1 text-uppercase" style={{fontSize: '0.75rem'}}>NIF / DNI</small>
                        <span className="fw-bold text-dark fs-5">{profile.dni}</span>
                    </div>
                    <div className="col-6">
                        <small className="text-secondary fw-bold d-block mb-1 text-uppercase" style={{fontSize: '0.75rem'}}>Núm. Seguridad Social</small>
                        <span className="fw-bold text-dark fs-5">{profile.seguridad_social}</span>
                    </div>
                    <div className="col-6">
                        <small className="text-secondary fw-bold d-block mb-1 text-uppercase" style={{fontSize: '0.75rem'}}>Tipo de Contrato</small>
                        <span className="fw-bold text-dark">{profile.tipo_contrato}</span>
                    </div>
                    <div className="col-6">
                        <small className="text-secondary fw-bold d-block mb-1 text-uppercase" style={{fontSize: '0.75rem'}}>Convenio Aplicado</small>
                        <span className="fw-bold text-dark">{profile.convenio}</span>
                    </div>
                </div>

                {/* Vista Móvil: Lista vertical limpia */}
                <div className="d-lg-none d-flex flex-column gap-4">
                    <div className="d-flex justify-content-between border-bottom pb-3">
                        <span className="fw-medium text-dark">Email</span>
                        <span className="text-secondary text-end text-break ps-3">{profile.email}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span className="fw-medium text-dark">Teléfono</span>
                        <span className="text-secondary">{profile.telefono}</span>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: CONTRATO (Solo visible en Móvil separado) */}
            <div className="d-lg-none mt-4">
                 <h6 className="text-secondary fw-bold small mb-3 px-2 text-uppercase">Contrato y Puesto</h6>
                 <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 d-flex flex-column gap-4 bg-white">
                    <div className="d-flex justify-content-between border-bottom pb-3">
                        <span className="fw-medium text-dark">Puesto</span>
                        <span className="text-secondary">{profile.puesto}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span className="fw-medium text-dark">Convenio</span>
                        <span className="text-secondary text-end" style={{maxWidth: '60%'}}>{profile.convenio}</span>
                    </div>
                 </div>
            </div>

            {/* SECCIÓN 3: SEGURIDAD DE LA CUENTA */}
            <h6 className="d-none d-lg-block fw-bold mb-3 text-dark">Seguridad de la Cuenta</h6>
            <h6 className="d-lg-none text-secondary fw-bold small mb-3 px-2 text-uppercase">Seguridad</h6>
            
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                 <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <span className="fw-bold d-block text-dark">Contraseña</span>
                        <small className="text-muted d-none d-lg-block">Se enviará un correo de verificación.</small>
                    </div>
                    
                    {/* BOTÓN "CAMBIAR POR EMAIL" CONECTADO */}
                    <button 
                        onClick={handlePasswordReset} 
                        disabled={resetLoading}
                        className="btn btn-outline-secondary btn-sm rounded-pill px-4 fw-bold"
                    >
                        {resetLoading ? (
                            <span><span className="spinner-border spinner-border-sm me-2"></span>Enviando...</span>
                        ) : 'Cambiar por Email'}
                    </button>
                 </div>

                 <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <span className="fw-bold d-block text-dark d-none d-lg-block">Autenticación en dos pasos (2FA)</span>
                        <small className="text-muted d-none d-lg-block">Añade una capa extra de seguridad.</small>
                        
                        {/* Texto específico para móvil */}
                        <span className="d-lg-none fw-medium text-dark">Face ID / Biometría</span>
                    </div>
                    
                    {/* Toggle Switch Interactivo */}
                    <div className="form-check form-switch">
                        <input 
                            className="form-check-input fs-4 cursor-pointer" 
                            type="checkbox" 
                            checked={is2FAEnabled}
                            onChange={() => setIs2FAEnabled(!is2FAEnabled)} 
                        />
                    </div>
                 </div>
            </div>

            {/* BOTÓN CERRAR SESIÓN (Móvil - Rojo y Grande) */}
            <div className="d-lg-none mt-5 mb-3">
                <button 
                    onClick={handleLogout}
                    className="btn btn-outline-danger w-100 py-3 rounded-pill fw-bold bg-white border-2 hover-shadow transition-all"
                >
                    Cerrar Sesión
                </button>
            </div>

        </div>
      </div>
    </div>
  );
}