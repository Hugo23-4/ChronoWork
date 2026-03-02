'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import PasskeyManager from '@/components/ui/PasskeyManager';

interface ProfileData {
  nombre_completo: string;
  puesto: string;
  email?: string;
  telefono: string;
  dni: string;
  seguridad_social: string;
  tipo_contrato: string;
  convenio: string;
  avatar_url?: string;
  departamento?: string;
}

export default function PerfilPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>({
    nombre_completo: 'Cargando...',
    puesto: '...',
    telefono: '...',
    dni: '...',
    seguridad_social: '...',
    tipo_contrato: '...',
    convenio: '...',
    avatar_url: undefined
  });

  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTelefono, setEditedTelefono] = useState('');

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('empleados_info')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          nombre_completo: data.nombre_completo || 'Usuario',
          puesto: data.puesto || 'Puesto no definido',
          email: user?.email,
          telefono: data.telefono || '+34 000 000 000',
          dni: data.dni || 'No registrado',
          seguridad_social: data.seguridad_social || 'Pendiente',
          tipo_contrato: data.tipo_contrato || 'Indefinido',
          convenio: data.convenio || 'General',
          avatar_url: data.avatar_url,
          departamento: data.departamento
        });
        setEditedTelefono(data.telefono || '');
      }
    } catch (err) {
      console.error('Error cargando perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;
      alert(`✅ Correo enviado a ${user.email}. Revisa tu bandeja de entrada.`);
    } catch (error: any) {
      alert('Error al enviar correo: ' + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen debe ser menor a 2MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      // 1. Subir imagen a Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Actualizar en base de datos
      const { error: updateError } = await supabase
        .from('empleados_info')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 4. Actualizar estado local
      setProfile(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
      alert('✅ Foto de perfil actualizada');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert('Error al subir foto: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveTelefono = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('empleados_info')
        .update({ telefono: editedTelefono })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, telefono: editedTelefono }));
      setIsEditing(false);
      alert('✅ Teléfono actualizado');
    } catch (error: any) {
      console.error('Error updating phone:', error);
      alert('Error al actualizar: ' + error.message);
    }
  };

  const getInitials = (nombre: string) => {
    return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
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

        {/* COLUMNA IZQUIERDA: TARJETA DE IDENTIFICACIÓN */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 bg-white">
            {/* Fondo Header */}
            <div className="d-none d-lg-block" style={{ height: '100px', backgroundColor: '#0F172A' }}></div>

            <div className="card-body text-center pt-0 pt-lg-0 p-4">

              {/* Avatar */}
              <div className="position-relative d-inline-block mt-lg-n5 mb-3 mt-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Foto de perfil"
                    className="rounded-circle border border-4 border-white shadow-sm object-fit-cover"
                    style={{ width: '120px', height: '120px' }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center border border-4 border-white shadow-sm"
                    style={{ width: '120px', height: '120px', fontSize: '2.5rem', fontWeight: '700' }}
                  >
                    {getInitials(profile.nombre_completo)}
                  </div>
                )}

                {/* Botón cambiar foto */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="position-absolute bottom-0 end-0 btn btn-primary rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                  style={{ width: '36px', height: '36px' }}
                  title="Cambiar foto"
                >
                  {uploadingPhoto ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <i className="bi bi-camera-fill"></i>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="d-none"
                />
              </div>

              <h3 className="fw-bold text-dark mb-1">{profile.nombre_completo}</h3>
              <p className="text-secondary mb-3">{profile.puesto} • LOOM S.L.</p>

              {profile.departamento && (
                <span className="badge bg-light text-dark border px-3 py-2 rounded-pill mb-3">
                  {profile.departamento}
                </span>
              )}

              {/* Badge ID (Solo Desktop) */}
              <div className="d-none d-lg-inline-block badge bg-light text-dark border px-3 py-2 rounded-pill mb-4 font-monospace">
                ID: {user?.id.substring(0, 8).toUpperCase()}
              </div>

              {/* QR Code Simulado (Solo Desktop) */}
              <div className="d-none d-lg-block mt-4 border rounded-3 p-4 mx-auto bg-white" style={{ maxWidth: '200px' }}>
                <div className="d-flex flex-wrap gap-1 justify-content-center opacity-75">
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

        {/* COLUMNA DERECHA: DATOS */}
        <div className="col-lg-8">

          {/* SECCIÓN 1: DATOS PERSONALES / CONTRATO */}
          <h6 className="d-none d-lg-block fw-bold mb-3 text-dark">Datos del Contrato</h6>
          <h6 className="d-lg-none text-secondary fw-bold small mb-3 px-2 text-uppercase">Información Personal</h6>

          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">

            {/* Vista Desktop: Grid 2 Columnas */}
            <div className="d-none d-lg-row row g-4">
              <div className="col-6">
                <small className="text-secondary fw-bold d-block mb-1 text-uppercase" style={{ fontSize: '0.75rem' }}>NIF / DNI</small>
                <span className="fw-bold text-dark fs-5">{profile.dni}</span>
              </div>
              <div className="col-6">
                <small className="text-secondary fw-bold d-block mb-1 text-uppercase" style={{ fontSize: '0.75rem' }}>Núm. Seguridad Social</small>
                <span className="fw-bold text-dark fs-5">{profile.seguridad_social}</span>
              </div>
              <div className="col-6">
                <small className="text-secondary fw-bold d-block mb-1 text-uppercase" style={{ fontSize: '0.75rem' }}>Tipo de Contrato</small>
                <span className="fw-bold text-dark">{profile.tipo_contrato}</span>
              </div>
              <div className="col-6">
                <small className="text-secondary fw-bold d-block mb-1 text-uppercase" style={{ fontSize: '0.75rem' }}>Convenio Aplicado</small>
                <span className="fw-bold text-dark">{profile.convenio}</span>
              </div>
            </div>

            {/* Vista Móvil */}
            <div className="d-lg-none d-flex flex-column gap-4">
              <div className="d-flex justify-content-between border-bottom pb-3">
                <span className="fw-medium text-dark">Email</span>
                <span className="text-secondary text-end text-break ps-3">{profile.email}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-medium text-dark">Teléfono</span>
                {isEditing ? (
                  <div className="d-flex gap-2 align-items-center">
                    <input
                      type="tel"
                      className="form-control form-control-sm"
                      value={editedTelefono}
                      onChange={(e) => setEditedTelefono(e.target.value)}
                      style={{ maxWidth: '150px' }}
                    />
                    <button onClick={handleSaveTelefono} className="btn btn-sm btn-success">✓</button>
                    <button onClick={() => setIsEditing(false)} className="btn btn-sm btn-secondary">✕</button>
                  </div>
                ) : (
                  <div className="d-flex gap-2 align-items-center">
                    <span className="text-secondary">{profile.telefono}</span>
                    <button onClick={() => setIsEditing(true)} className="btn btn-sm btn-link p-0">
                      <i className="bi bi-pencil"></i>
                    </button>
                  </div>
                )}
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
                <span className="text-secondary text-end" style={{ maxWidth: '60%' }}>{profile.convenio}</span>
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

            {/* PASSKEY MANAGER */}
            <div className="d-flex justify-content-between align-items-start">
              <PasskeyManager />
            </div>
          </div>

          {/* BOTÓN CERRAR SESIÓN (Móvil) */}
          <div className="d-lg-none mt-5 mb-3">
            <button
              onClick={handleLogout}
              className="btn btn-outline-danger w-100 py-3 rounded-pill fw-bold bg-white border-2"
            >
              Cerrar Sesión
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}