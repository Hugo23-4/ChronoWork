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
      <div className="flex justify-center items-center min-h-[50vh] py-6">
        <div className="animate-spin text-chrono-blue" role="status">
          <span className="sr-only">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up pb-6">

      {/* HEADER DESKTOP */}
      <div className="mb-4 hidden lg:block">
        <h2 className="font-bold text-navy mb-1">Tu Perfil de Empleado</h2>
      </div>

      <div className="row gap-4">

        {/* COLUMNA IZQUIERDA: TARJETA DE IDENTIFICACIÓN */}
        <div className="lg:col-span-4">
          <div className="card border-0 shadow-sm rounded-2xl overflow-hidden h-full bg-white">
            {/* Fondo Header */}
            <div className="hidden lg:block" style={{ height: '100px', backgroundColor: '#0F172A' }}></div>

            <div className="p-4 text-center pt-0 pt-lg-0 p-4">

              {/* Avatar */}
              <div className="relative d-inline-block mt-lg-n5 mb-3 mt-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Foto de perfil"
                    className="rounded-full border border-4 border-white shadow-sm object-fit-cover"
                    style={{ width: '120px', height: '120px' }}
                  />
                ) : (
                  <div
                    className="rounded-full bg-chrono-blue text-white flex items-center justify-center border border-4 border-white shadow-sm"
                    style={{ width: '120px', height: '120px', fontSize: '2.5rem', fontWeight: '700' }}
                  >
                    {getInitials(profile.nombre_completo)}
                  </div>
                )}

                {/* Botón cambiar foto */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none rounded-full shadow-sm flex items-center justify-center"
                  style={{ width: '36px', height: '36px' }}
                  title="Cambiar foto"
                >
                  {uploadingPhoto ? (
                    <span className="animate-spin animate-spin w-4 h-4"></span>
                  ) : (
                    <i className="bi bi-camera-fill"></i>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              <h3 className="font-bold text-navy mb-1">{profile.nombre_completo}</h3>
              <p className="text-slate-500 mb-3">{profile.puesto} • LOOM S.L.</p>

              {profile.departamento && (
                <span className="bg-gray-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold text-navy border px-3 py-2 rounded-full mb-3">
                  {profile.departamento}
                </span>
              )}

              {/* Badge ID (Solo Desktop) */}
              <div className="hidden d-lg-inline-block bg-gray-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold text-navy border px-3 py-2 rounded-full mb-4 font-mono">
                ID: {user?.id.substring(0, 8).toUpperCase()}
              </div>

              {/* QR Code Simulado (Solo Desktop) */}
              <div className="hidden lg:block mt-4 border rounded-lg p-4 mx-auto bg-white" style={{ maxWidth: '200px' }}>
                <div className="flex flex-wrap gap-1 justify-center opacity-75">
                  {[...Array(49)].map((_, i) => (
                    <div key={i} className="bg-navy" style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '2px',
                      opacity: Math.random() > 0.5 ? 1 : 0.1
                    }}></div>
                  ))}
                </div>
                <small className="block mt-3 text-slate-500 font-bold" style={{ fontSize: '0.75rem' }}>Escanear en Kiosco</small>
              </div>

            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: DATOS */}
        <div className="lg:col-span-8">

          {/* SECCIÓN 1: DATOS PERSONALES / CONTRATO */}
          <h6 className="hidden lg:block font-bold mb-3 text-navy">Datos del Contrato</h6>
          <h6 className="lg:hidden text-slate-500 font-bold text-sm mb-3 px-2 uppercase">Información Personal</h6>

          <div className="card border-0 shadow-sm rounded-2xl p-4 mb-4 bg-white">

            {/* Vista Desktop: Grid 2 Columnas */}
            <div className="hidden d-lg-row row gap-4">
              <div className="col-span-6">
                <small className="text-slate-500 font-bold block mb-1 uppercase" style={{ fontSize: '0.75rem' }}>NIF / DNI</small>
                <span className="font-bold text-navy text-lg">{profile.dni}</span>
              </div>
              <div className="col-span-6">
                <small className="text-slate-500 font-bold block mb-1 uppercase" style={{ fontSize: '0.75rem' }}>Núm. Seguridad Social</small>
                <span className="font-bold text-navy text-lg">{profile.seguridad_social}</span>
              </div>
              <div className="col-span-6">
                <small className="text-slate-500 font-bold block mb-1 uppercase" style={{ fontSize: '0.75rem' }}>Tipo de Contrato</small>
                <span className="font-bold text-navy">{profile.tipo_contrato}</span>
              </div>
              <div className="col-span-6">
                <small className="text-slate-500 font-bold block mb-1 uppercase" style={{ fontSize: '0.75rem' }}>Convenio Aplicado</small>
                <span className="font-bold text-navy">{profile.convenio}</span>
              </div>
            </div>

            {/* Vista Móvil */}
            <div className="lg:hidden flex flex-col gap-4">
              <div className="flex justify-between border-b pb-3">
                <span className="fw-medium text-navy">Email</span>
                <span className="text-slate-500 text-right text-break pl-3">{profile.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="fw-medium text-navy">Teléfono</span>
                {isEditing ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm form-control-sm"
                      value={editedTelefono}
                      onChange={(e) => setEditedTelefono(e.target.value)}
                      style={{ maxWidth: '150px' }}
                    />
                    <button onClick={handleSaveTelefono} className="text-sm py-1.5 px-3 btn-success">✓</button>
                    <button onClick={() => setIsEditing(false)} className="text-sm py-1.5 px-3 btn-secondary">✕</button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <span className="text-slate-500">{profile.telefono}</span>
                    <button onClick={() => setIsEditing(true)} className="text-sm py-1.5 px-3 btn-link p-0">
                      <i className="bi bi-pencil"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CONTRATO (Solo visible en Móvil separado) */}
          <div className="lg:hidden mt-4">
            <h6 className="text-slate-500 font-bold text-sm mb-3 px-2 uppercase">Contrato y Puesto</h6>
            <div className="card border-0 shadow-sm rounded-2xl p-4 mb-4 flex flex-col gap-4 bg-white">
              <div className="flex justify-between border-b pb-3">
                <span className="fw-medium text-navy">Puesto</span>
                <span className="text-slate-500">{profile.puesto}</span>
              </div>
              <div className="flex justify-between">
                <span className="fw-medium text-navy">Convenio</span>
                <span className="text-slate-500 text-right" style={{ maxWidth: '60%' }}>{profile.convenio}</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: SEGURIDAD DE LA CUENTA */}
          <h6 className="hidden lg:block font-bold mb-3 text-navy">Seguridad de la Cuenta</h6>
          <h6 className="lg:hidden text-slate-500 font-bold text-sm mb-3 px-2 uppercase">Seguridad</h6>

          <div className="card border-0 shadow-sm rounded-2xl p-4 bg-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="font-bold block text-navy">Contraseña</span>
                <small className="text-slate-400 hidden lg:block">Se enviará un correo de verificación.</small>
              </div>

              <button
                onClick={handlePasswordReset}
                disabled={resetLoading}
                className="bg-white text-navy border border-gray-200 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer btn-sm rounded-full px-4 font-bold"
              >
                {resetLoading ? (
                  <span><span className="animate-spin animate-spin w-4 h-4 mr-2"></span>Enviando...</span>
                ) : 'Cambiar por Email'}
              </button>
            </div>

            {/* PASSKEY MANAGER */}
            <div className="flex justify-between items-start">
              <PasskeyManager />
            </div>
          </div>

          {/* BOTÓN CERRAR SESIÓN (Móvil) */}
          <div className="lg:hidden mt-6 mb-3">
            <button
              onClick={handleLogout}
              className="bg-transparent text-red-500 border border-red-500 px-4 py-2.5 rounded-xl font-semibold hover:bg-red-50 transition-colors cursor-pointer w-full py-3 rounded-full font-bold bg-white border-2"
            >
              Cerrar Sesión
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}