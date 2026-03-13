'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import PasskeyManager from '@/components/ui/PasskeyManager';
import { Camera, Loader2, Pencil, Check, X as XIcon, LogOut, KeyRound } from 'lucide-react';

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
    nombre_completo: 'Cargando...', puesto: '...', telefono: '...', dni: '...',
    seguridad_social: '...', tipo_contrato: '...', convenio: '...', avatar_url: undefined
  });

  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTelefono, setEditedTelefono] = useState('');

  useEffect(() => { if (user) fetchProfile(); }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from('empleados_info').select('*').eq('id', user?.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setProfile({
          nombre_completo: data.nombre_completo || 'Usuario', puesto: data.puesto || 'Puesto no definido',
          email: user?.email, telefono: data.telefono || '+34 000 000 000', dni: data.dni || 'No registrado',
          seguridad_social: data.seguridad_social || 'Pendiente', tipo_contrato: data.tipo_contrato || 'Indefinido',
          convenio: data.convenio || 'General', avatar_url: data.avatar_url, departamento: data.departamento
        });
        setEditedTelefono(data.telefono || '');
      }
    } catch (err) { console.error('Error cargando perfil:', err); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      alert(`✅ Correo enviado a ${user.email}. Revisa tu bandeja de entrada.`);
    } catch (error: unknown) {
      alert('Error al enviar correo: ' + (error instanceof Error ? error.message : String(error)));
    } finally { setResetLoading(false); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) { alert('Por favor, selecciona una imagen válida'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('La imagen debe ser menor a 2MB'); return; }
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('empleados_info').update({ avatar_url: urlData.publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      setProfile(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
      alert('✅ Foto de perfil actualizada');
    } catch (error: unknown) {
      alert('Error al subir foto: ' + (error instanceof Error ? error.message : String(error)));
    } finally { setUploadingPhoto(false); }
  };

  const handleSaveTelefono = async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase.from('empleados_info').update({ telefono: editedTelefono }).eq('id', user.id);
      if (error) throw error;
      setProfile(prev => ({ ...prev, telefono: editedTelefono }));
      setIsEditing(false);
      alert('✅ Teléfono actualizado');
    } catch (error: unknown) {
      alert('Error al actualizar: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const getInitials = (nombre: string) => nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-chrono-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up pb-20 lg:pb-6">
      <div className="mb-5 hidden lg:block">
        <h2 className="font-bold text-navy text-2xl font-[family-name:var(--font-jakarta)] mb-1">Tu Perfil de Empleado</h2>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        {/* LEFT: ID CARD */}
        <div className="lg:col-span-4">
          <div className="bg-white shadow-sm rounded-2xl overflow-hidden h-full">
            <div className="hidden lg:block h-24 bg-gradient-to-br from-navy to-slate-dark" />
            <div className="p-5 text-center lg:-mt-12">
              {/* Avatar */}
              <div className="relative inline-block mb-3">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Foto de perfil"
                    className="w-28 h-28 rounded-full border-4 border-white shadow-md object-cover" />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-chrono-blue text-white flex items-center justify-center border-4 border-white shadow-md text-4xl font-bold">
                    {getInitials(profile.nombre_completo)}
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                  className="absolute bottom-1 right-1 w-9 h-9 bg-navy text-white rounded-full shadow-md flex items-center justify-center border-2 border-white cursor-pointer hover:bg-slate-dark transition-colors disabled:opacity-50">
                  {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>

              <h3 className="font-bold text-navy text-lg mb-0.5">{profile.nombre_completo}</h3>
              <p className="text-slate-500 text-sm mb-3">{profile.puesto} • LOOM S.L.</p>

              {profile.departamento && (
                <span className="inline-block bg-gray-100 text-navy text-xs font-bold px-3 py-1.5 rounded-full border border-gray-200 mb-3">
                  {profile.departamento}
                </span>
              )}

              <div className="hidden lg:inline-block bg-gray-100 text-navy text-xs font-bold px-3 py-1.5 rounded-full border border-gray-200 font-mono mb-4">
                ID: {user?.id.substring(0, 8).toUpperCase()}
              </div>

              {/* QR Simulated */}
              <div className="hidden lg:block mt-3 border border-gray-200 rounded-xl p-4 mx-auto bg-white max-w-[200px]">
                <div className="flex flex-wrap gap-1 justify-center opacity-75">
                  {[...Array(49)].map((_, i) => (
                    <div key={i} className="bg-navy" style={{ width: 16, height: 16, borderRadius: 2, opacity: Math.random() > 0.5 ? 1 : 0.1 }} />
                  ))}
                </div>
                <small className="block mt-3 text-slate-500 font-bold text-xs">Escanear en Kiosco</small>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: DATA */}
        <div className="lg:col-span-8 space-y-5">
          {/* Contract Data (Desktop) */}
          <div className="hidden lg:block">
            <h6 className="font-bold text-navy mb-3">Datos del Contrato</h6>
            <div className="bg-white shadow-sm rounded-2xl p-5">
              <div className="grid grid-cols-2 gap-5">
                {[
                  { label: 'NIF / DNI', value: profile.dni },
                  { label: 'Núm. Seguridad Social', value: profile.seguridad_social },
                  { label: 'Tipo de Contrato', value: profile.tipo_contrato },
                  { label: 'Convenio Aplicado', value: profile.convenio },
                ].map(item => (
                  <div key={item.label}>
                    <small className="text-slate-400 font-bold block mb-1 uppercase text-[0.7rem] tracking-wider">{item.label}</small>
                    <span className="font-bold text-navy">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Personal Info (Mobile) */}
          <div className="lg:hidden">
            <h6 className="text-slate-400 font-bold text-xs mb-3 px-1 uppercase tracking-wider">Información Personal</h6>
            <div className="bg-white shadow-sm rounded-2xl p-4 space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <span className="font-medium text-navy text-sm">Email</span>
                <span className="text-slate-500 text-sm text-right break-all pl-3">{profile.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-navy text-sm">Teléfono</span>
                {isEditing ? (
                  <div className="flex gap-2 items-center">
                    <input type="tel" className="w-36 px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-sm outline-none focus:border-chrono-blue"
                      value={editedTelefono} onChange={(e) => setEditedTelefono(e.target.value)} />
                    <button onClick={handleSaveTelefono} className="w-7 h-7 bg-emerald-500 text-white rounded-lg flex items-center justify-center border-none cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIsEditing(false)} className="w-7 h-7 bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center border-none cursor-pointer">
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <span className="text-slate-500 text-sm">{profile.telefono}</span>
                    <button onClick={() => setIsEditing(true)} className="bg-transparent border-none p-0 cursor-pointer text-slate-400 hover:text-chrono-blue transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contract (Mobile) */}
          <div className="lg:hidden">
            <h6 className="text-slate-400 font-bold text-xs mb-3 px-1 uppercase tracking-wider">Contrato y Puesto</h6>
            <div className="bg-white shadow-sm rounded-2xl p-4 space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <span className="font-medium text-navy text-sm">Puesto</span>
                <span className="text-slate-500 text-sm">{profile.puesto}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-navy text-sm">Convenio</span>
                <span className="text-slate-500 text-sm text-right max-w-[60%]">{profile.convenio}</span>
              </div>
            </div>
          </div>

          {/* Security */}
          <div>
            <h6 className="font-bold text-navy mb-3 hidden lg:block">Seguridad de la Cuenta</h6>
            <h6 className="text-slate-400 font-bold text-xs mb-3 px-1 uppercase tracking-wider lg:hidden">Seguridad</h6>
            <div className="bg-white shadow-sm rounded-2xl p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-navy text-sm flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    Contraseña
                  </span>
                  <small className="text-slate-400 hidden lg:block text-xs">Se enviará un correo de verificación.</small>
                </div>
                <button onClick={handlePasswordReset} disabled={resetLoading}
                  className="bg-white text-navy border border-gray-200 px-4 py-2 rounded-full text-xs font-bold cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {resetLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  {resetLoading ? 'Enviando...' : 'Cambiar por Email'}
                </button>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <PasskeyManager />
              </div>
            </div>
          </div>

          {/* Logout (Mobile) */}
          <div className="lg:hidden">
            <button onClick={handleLogout}
              className="w-full bg-white text-red-500 border-2 border-red-200 py-3 rounded-full font-bold cursor-pointer hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}