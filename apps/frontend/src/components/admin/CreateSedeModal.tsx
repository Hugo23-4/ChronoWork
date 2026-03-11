'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
    ssr: false,
    loading: () => <div className="text-center py-4"><div className="animate-spin text-chrono-blue"></div></div>
});

interface CreateSedeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export default function CreateSedeModal({ isOpen, onClose, onSave }: CreateSedeModalProps) {
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        lat: 40.4168,
        lng: -3.7038,
        radio: 100
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!formData.nombre) {
            alert('Por favor, ingresa un nombre para la sede');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('sedes')
                .insert({
                    nombre: formData.nombre,
                    direccion: formData.direccion,
                    latitud: formData.lat,
                    longitud: formData.lng,
                    radio_metros: formData.radio,
                    activo: true
                });

            if (error) throw error;

            alert('✅ Sede creada exitosamente');
            onSave();
            handleClose();
        } catch (error: any) {
            console.error('Error creating sede:', error);
            alert('Error al crear sede: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({ nombre: '', direccion: '', lat: 40.4168, lng: -3.7038, radio: 100 });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={handleClose}
            ></div>

            {/* Modal */}
            <div className="modal fade show block" style={{ zIndex: 1055 }} tabIndex={-1}>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-dialog-centered modal-lg">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto border-0 shadow-lg rounded-2xl">

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 border-0 pb-0">
                            <h5 className="font-bold text-lg text-navy font-bold text-navy">
                                <i className="bi bi-geo-alt-fill text-chrono-blue mr-2"></i>
                                Nueva Sede / Centro de Trabajo
                            </h5>
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none text-xl"
                                onClick={handleClose}
                                disabled={saving}
                            ></button>
                        </div>

                        {/* Body */}
                        <div className="p-6 px-4">

                            {/* Nombre */}
                            <div className="mb-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 font-bold text-sm text-slate-500 uppercase">
                                    Nombre de la Sede *
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm rounded-full shadow-sm border-0"
                                    placeholder="Ej: Oficina Central, Obra Madrid Norte..."
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>

                            {/* Dirección */}
                            <div className="mb-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 font-bold text-sm text-slate-500 uppercase">
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm rounded-full shadow-sm border-0"
                                    placeholder="Calle, número, ciudad..."
                                    value={formData.direccion}
                                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                />
                            </div>

                            {/* Radio */}
                            <div className="mb-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 font-bold text-sm text-slate-500 uppercase flex items-center justify-between">
                                    <span>Radio de Geofencing</span>
                                    <span className="bg-chrono-blue text-white text-xs px-2 py-0.5 rounded-full font-bold">{formData.radio}m</span>
                                </label>
                                <input
                                    type="range"
                                    className="form-range"
                                    min="50"
                                    max="500"
                                    step="10"
                                    value={formData.radio}
                                    onChange={(e) => setFormData({ ...formData, radio: parseInt(e.target.value) })}
                                />
                                <div className="flex justify-between">
                                    <small className="text-slate-400">50m</small>
                                    <small className="text-slate-400">500m</small>
                                </div>
                            </div>

                            {/* Mapa */}
                            <div className="mb-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 font-bold text-sm text-slate-500 uppercase">
                                    Ubicación en el Mapa
                                </label>
                                <div style={{ height: '300px' }} className="rounded-2xl overflow-hidden shadow-sm">
                                    <LocationPicker
                                        lat={formData.lat}
                                        lng={formData.lng}
                                        radio={formData.radio}
                                        onLocationSelect={(newLat: number, newLng: number) => {
                                            setFormData({
                                                ...formData,
                                                lat: newLat,
                                                lng: newLng
                                            });
                                        }}
                                    />
                                </div>
                                <small className="text-slate-400 block mt-2">
                                    <i className="bi bi-info-circle mr-1"></i>
                                    Click en el mapa para seleccionar la ubicación exacta
                                </small>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 p-6 border-t border-gray-100 border-0 pt-0">
                            <button
                                type="button"
                                className="bg-white text-navy border border-gray-200 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer rounded-full px-4"
                                onClick={handleClose}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none rounded-full px-4 flex items-center gap-2"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="animate-spin animate-spin w-4 h-4"></span>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-lg"></i>
                                        Crear Sede
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
