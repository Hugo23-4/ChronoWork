'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

// Importamos el mapa dinámicamente
const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-slate-400 rounded-2xl">
      <div className="animate-spin text-chrono-blue mb-2" role="status"></div>
      <small>Cargando Mapa...</small>
    </div>
  )
});

export default function CentrosTrabajoPage() {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sedes, setSedes] = useState<any[]>([]);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    id: null,
    nombre: '',
    direccion: '',
    lat: 40.4168,
    lng: -3.7038,
    radio: 100
  });

  useEffect(() => {
    fetchSedes();
  }, []);

  const fetchSedes = async () => {
    const { data } = await supabase.from('sedes').select('*').order('created_at', { ascending: false });
    if (data) setSedes(data);
    setLoading(false);
  };

  const handleNew = () => {
    setFormData({ id: null, nombre: '', direccion: '', lat: 40.4168, lng: -3.7038, radio: 100 });
    setSuccessMsg('');
    setShowMobileMap(true);
  };

  const handleEdit = (centro: any) => {
    setFormData({
      id: centro.id,
      nombre: centro.nombre,
      direccion: centro.direccion || '',
      lat: centro.latitud,
      lng: centro.longitud,
      radio: centro.radio_metros
    });
    setSuccessMsg('');
    setShowMobileMap(true);
  };

  const handleSave = async () => {
    if (!formData.nombre) return alert("Por favor, ponle un nombre al centro.");

    setSaving(true);
    const payload = {
      nombre: formData.nombre,
      direccion: formData.direccion,
      latitud: formData.lat,
      longitud: formData.lng,
      radio_metros: formData.radio
    };

    let error;
    if (formData.id) {
      const { error: updateError } = await supabase.from('sedes').update(payload).eq('id', formData.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('sedes').insert(payload);
      error = insertError;
    }

    setSaving(false);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setSuccessMsg(formData.id ? 'Cambios guardados correctamente' : 'Sede creada con éxito');
      fetchSedes();

      if (window.innerWidth < 992) {
        setTimeout(() => setShowMobileMap(false), 1500);
      } else if (!formData.id) {
        setFormData({ ...formData, nombre: '', direccion: '' });
      }
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
    <div className="pb-6" style={{ marginLeft: '-1rem', marginRight: '-1rem', marginTop: '-1rem', minHeight: 'calc(100vh - 100px)' }}>

      {/* HEADER */}
      <div className="bg-white p-3 md:p-4 border-b sticky-top" style={{ zIndex: 100 }}>
        <div className="flex justify-between items-center">
          <div>
            {showMobileMap && (
              <button
                onClick={() => setShowMobileMap(false)}
                className="bg-transparent border-none cursor-pointer text-navy p-0 no-underline lg:hidden mb-2 font-bold"
              >
                <i className="bi bi-chevron-left mr-1"></i> Volver
              </button>
            )}

            <h6 className="text-chrono-blue font-bold uppercase text-sm mb-1 tracking-wide">
              Administración
            </h6>
            <h2 className="font-bold text-navy mb-0">
              {showMobileMap ? (formData.id ? 'Editar Ubicación' : 'Nueva Ubicación') : 'Centros de Trabajo'}
            </h2>

            {!showMobileMap && (
              <p className="text-slate-500 mb-0 hidden lg:block mt-1 text-sm">
                Configura las zonas GPS permitidas para el fichaje.
              </p>
            )}
          </div>

          <button
            onClick={handleNew}
            className="hidden lg:flex bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none rounded-full px-4 font-bold shadow-sm items-center gap-2"
          >
            <i className="bi bi-plus-lg"></i> Nuevo Centro
          </button>
        </div>
      </div>

      <div className="row g-0 g-md-4 p-3 md:p-4" style={{ minHeight: '600px' }}>

        {/* LISTA CENTROS */}
        <div className={`lg:col-span-4 ${showMobileMap ? 'hidden lg:block' : 'block'}`}>

          <div className="flex justify-between items-center mb-3">
            <small className="text-slate-500 font-bold bg-white px-2 py-1 rounded border">
              {sedes.length} ACTIVOS
            </small>
          </div>

          <div className="grid gap-3 pb-6">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="card border-0 shadow-sm p-3 rounded-2xl">
                  <div className="flex gap-3">
                    <div className="bg-gray-50 rounded-full" style={{ width: 40, height: 40 }}></div>
                    <div className="flex-grow">
                      <div className="bg-gray-50 rounded w-50 mb-2" style={{ height: 10 }}></div>
                      <div className="bg-gray-50 rounded w-75" style={{ height: 10 }}></div>
                    </div>
                  </div>
                </div>
              ))
            ) : sedes.length === 0 ? (
              <div className="text-center py-6">
                <div className="mb-3 text-slate-400 opacity-50">
                  <i className="bi bi-geo-alt text-4xl"></i>
                </div>
                <h6 className="font-bold">No hay centros creados</h6>
                <p className="text-sm text-slate-500">Crea el primero para empezar.</p>
              </div>
            ) : (
              sedes.map((centro) => (
                <div
                  key={centro.id}
                  className={`
                        card p-3 border-0 shadow-sm rounded-2xl cursor-pointer relative overflow-hidden
                        ${formData.id === centro.id ? 'border border-2 border-primary bg-gray-50' : 'bg-white'}
                    `}
                  onClick={() => handleEdit(centro)}
                >
                  {formData.id === centro.id && (
                    <div className="absolute left-0 top-0 bottom-0 bg-chrono-blue" style={{ width: '4px' }}></div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className={`
                          rounded-full flex items-center justify-center shrink-0
                          ${formData.id === centro.id ? 'bg-chrono-blue text-white' : 'bg-gray-50 text-chrono-blue'}
                      `} style={{ width: '48px', height: '48px' }}>
                      <i className="bi bi-building-fill text-lg"></i>
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <h6 className="font-bold mb-1 text-navy truncate pr-2">{centro.nombre}</h6>
                        <button
                          onClick={(e) => handleDelete(centro.id, e)}
                          className="text-sm py-1.5 px-3 btn-light text-red-500 rounded-full p-0 flex items-center justify-center"
                          style={{ width: 30, height: 30 }}
                          title="Eliminar"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                      <div className="flex items-center text-slate-500 text-sm mb-2">
                        <i className="bi bi-pin-map mr-1"></i>
                        <span className="truncate">{centro.direccion || 'Ubicación GPS'}</span>
                      </div>
                      <span className="bg-gray-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold text-navy border font-normal rounded-full px-3">
                        Radio: <strong>{centro.radio_metros}m</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FAB MÓVIL */}
          <button
            onClick={handleNew}
            className="lg:hidden bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none fixed rounded-full shadow-lg flex items-center justify-center text-white"
            style={{ width: '60px', height: '60px', zIndex: 1050, bottom: '80px', right: '16px' }}
          >
            <i className="bi bi-plus-lg text-3xl"></i>
          </button>
        </div>

        {/* MAPA Y FORMULARIO */}
        <div className={`lg:col-span-8 ${!showMobileMap ? 'hidden lg:block' : 'block'}`}>
          <div className="card border-0 shadow-sm rounded-2xl overflow-hidden" style={{ height: '600px' }}>

            {/* MAPA */}
            <div style={{ height: '400px', position: 'relative' }}>
              <LocationPicker
                lat={formData.lat}
                lng={formData.lng}
                radio={formData.radio}
                onLocationSelect={(lat, lng) => setFormData({ ...formData, lat, lng })}
              />
            </div>

            {/* FORMULARIO */}
            <div className="p-4 bg-white">

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-sm border-0 bg-emerald-500 bg-opacity-10 py-2 text-sm font-bold mb-3 flex items-center">
                  <i className="bi bi-check-circle-fill mr-2"></i> {successMsg}
                </div>
              )}

              <div className="row gap-3">
                <div className="md:col-span-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold text-slate-500 mb-1">NOMBRE DEL CENTRO</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm bg-gray-50 border-0 font-bold"
                    placeholder="Ej: Oficina Central"
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold text-slate-500 mb-1">DIRECCIÓN (OPCIONAL)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm bg-gray-50 border-0"
                    placeholder="Calle, número..."
                    value={formData.direccion}
                    onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>

                <div className="col-span-12">
                  <div className="flex justify-between mb-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold text-slate-500">RADIO DE FICHAJE</label>
                    <span className="bg-chrono-blue text-white text-xs px-2 py-0.5 rounded-full font-bold rounded-full">{formData.radio}m</span>
                  </div>
                  <input
                    type="range" className="form-range"
                    min="20" max="500" step="10"
                    value={formData.radio}
                    onChange={(e) => setFormData({ ...formData, radio: Number(e.target.value) })}
                  />
                </div>

                <div className="col-span-12">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none w-full font-bold rounded-full py-2"
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin animate-spin w-4 h-4 mr-2"></span>
                        Guardando...
                      </>
                    ) : (
                      formData.id ? 'Actualizar Cambios' : 'Guardar Ubicación'
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}