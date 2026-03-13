'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { ChevronLeft, Plus, MapPin, Building2, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-slate-400 rounded-2xl">
      <Loader2 className="w-6 h-6 text-chrono-blue animate-spin mb-2" />
      <small>Cargando Mapa...</small>
    </div>
  )
});

export default function CentrosTrabajoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sedes, setSedes] = useState<any[]>([]);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    id: null as string | null, nombre: '', direccion: '', lat: 40.4168, lng: -3.7038, radio: 100
  });

  useEffect(() => { fetchSedes(); }, []);

  const fetchSedes = async () => {
    const { data } = await supabase.from('sedes').select('*').order('created_at', { ascending: false });
    if (data) setSedes(data);
    setLoading(false);
  };

  const handleNew = () => { setFormData({ id: null, nombre: '', direccion: '', lat: 40.4168, lng: -3.7038, radio: 100 }); setSuccessMsg(''); setShowMobileMap(true); };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = (centro: any) => {
    setFormData({ id: centro.id, nombre: centro.nombre, direccion: centro.direccion || '', lat: centro.latitud, lng: centro.longitud, radio: centro.radio_metros });
    setSuccessMsg(''); setShowMobileMap(true);
  };

  const handleSave = async () => {
    if (!formData.nombre) return alert("Por favor, ponle un nombre al centro.");
    setSaving(true);
    const payload = { nombre: formData.nombre, direccion: formData.direccion, latitud: formData.lat, longitud: formData.lng, radio_metros: formData.radio };
    const error = formData.id
      ? (await supabase.from('sedes').update(payload).eq('id', formData.id)).error
      : (await supabase.from('sedes').insert(payload)).error;
    setSaving(false);
    if (error) { alert('Error: ' + error.message); }
    else {
      setSuccessMsg(formData.id ? 'Cambios guardados correctamente' : 'Sede creada con éxito');
      fetchSedes();
      if (window.innerWidth < 992) setTimeout(() => setShowMobileMap(false), 1500);
      else if (!formData.id) setFormData({ ...formData, nombre: '', direccion: '' });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Seguro que quieres eliminar este centro?')) return;
    await supabase.from('sedes').delete().eq('id', id);
    fetchSedes();
    if (formData.id === id) handleNew();
  };

  return (
    <div className="animate-fade-up pb-20 lg:pb-6 -mx-4 -mt-4 min-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="bg-white px-4 md:px-5 py-4 border-b border-gray-100 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <div>
            {showMobileMap && (
              <button onClick={() => setShowMobileMap(false)} className="bg-transparent border-none cursor-pointer text-navy p-0 font-bold lg:hidden mb-2 flex items-center gap-1 text-sm">
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>
            )}
            <p className="text-chrono-blue font-bold uppercase text-xs mb-1 tracking-widest">Administración</p>
            <h2 className="font-bold text-navy text-xl md:text-2xl font-[family-name:var(--font-jakarta)]">
              {showMobileMap ? (formData.id ? 'Editar Ubicación' : 'Nueva Ubicación') : 'Centros de Trabajo'}
            </h2>
            {!showMobileMap && <p className="text-slate-400 text-sm mt-1 hidden lg:block">Configura las zonas GPS permitidas para el fichaje.</p>}
          </div>
          <button onClick={handleNew}
            className="hidden lg:flex bg-navy text-white px-5 py-2.5 rounded-full font-bold text-sm border-none cursor-pointer hover:bg-slate-dark transition-colors items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Nuevo Centro
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-0 lg:gap-5 p-4 md:p-5 min-h-[600px]">
        {/* List */}
        <div className={cn('lg:col-span-4', showMobileMap ? 'hidden lg:block' : 'block')}>
          <div className="flex justify-between items-center mb-3">
            <small className="text-slate-500 font-bold bg-gray-100 px-2.5 py-1 rounded-full text-xs border border-gray-200">{sedes.length} ACTIVOS</small>
          </div>
          <div className="grid gap-3 pb-6">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white shadow-sm p-4 rounded-2xl">
                  <div className="flex gap-3"><div className="bg-gray-100 rounded-full w-10 h-10 animate-pulse" /><div className="flex-1"><div className="bg-gray-100 rounded w-1/2 h-2.5 mb-2 animate-pulse" /><div className="bg-gray-100 rounded w-3/4 h-2.5 animate-pulse" /></div></div>
                </div>
              ))
            ) : sedes.length === 0 ? (
              <div className="text-center py-10">
                <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h6 className="font-bold text-slate-500 mb-1">No hay centros creados</h6>
                <p className="text-sm text-slate-400">Crea el primero para empezar.</p>
              </div>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              sedes.map((centro: any) => (
                <div key={centro.id} onClick={() => handleEdit(centro)}
                  className={cn('bg-white p-4 rounded-2xl cursor-pointer relative overflow-hidden shadow-sm transition-all hover:shadow-md',
                    formData.id === centro.id && 'ring-2 ring-chrono-blue bg-blue-50/30')}>
                  {formData.id === centro.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-chrono-blue" />}
                  <div className="flex items-start gap-3">
                    <div className={cn('w-11 h-11 rounded-full flex items-center justify-center shrink-0',
                      formData.id === centro.id ? 'bg-chrono-blue text-white' : 'bg-gray-100 text-chrono-blue')}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h6 className="font-bold text-navy text-sm truncate pr-2">{centro.nombre}</h6>
                        <button onClick={(e) => handleDelete(centro.id, e)} title="Eliminar"
                          className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center border-none cursor-pointer text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center text-slate-400 text-xs mt-0.5 mb-2">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate">{centro.direccion || 'Ubicación GPS'}</span>
                      </div>
                      <span className="bg-gray-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-medium border border-gray-200">
                        Radio: <strong>{centro.radio_metros}m</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* FAB Mobile */}
          <button onClick={handleNew}
            className="lg:hidden fixed bottom-[88px] right-4 w-14 h-14 bg-navy text-white rounded-full shadow-lg flex items-center justify-center border-none cursor-pointer z-40">
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Map + Form */}
        <div className={cn('lg:col-span-8', !showMobileMap ? 'hidden lg:block' : 'block')}>
          <div className="bg-white shadow-sm rounded-2xl overflow-hidden h-[600px] flex flex-col">
            <div className="h-[400px] relative">
              <LocationPicker lat={formData.lat} lng={formData.lng} radio={formData.radio}
                onLocationSelect={(lat: number, lng: number) => setFormData({ ...formData, lat, lng })} />
            </div>
            <div className="p-5 bg-white flex-1">
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-2.5 text-sm font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {successMsg}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[0.7rem] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Nombre del Centro</label>
                  <input type="text" className="w-full px-3 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-chrono-blue/20"
                    placeholder="Ej: Oficina Central" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                </div>
                <div>
                  <label className="text-[0.7rem] font-bold text-slate-400 mb-1 block uppercase tracking-wider">Dirección (Opcional)</label>
                  <input type="text" className="w-full px-3 py-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-chrono-blue/20"
                    placeholder="Calle, número..." value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} />
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Radio de Fichaje</label>
                  <span className="bg-chrono-blue text-white text-xs px-2.5 py-0.5 rounded-full font-bold">{formData.radio}m</span>
                </div>
                <input type="range" min="20" max="500" step="10" value={formData.radio}
                  onChange={e => setFormData({ ...formData, radio: Number(e.target.value) })}
                  className="w-full accent-chrono-blue" />
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full bg-navy text-white py-2.5 rounded-full font-bold text-sm border-none cursor-pointer hover:bg-slate-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : formData.id ? 'Actualizar Cambios' : 'Guardar Ubicación'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}