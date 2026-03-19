'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { MapPin, Info, Check, Loader2 } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';

const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center items-center h-48 bg-slate-50 rounded-xl">
            <Loader2 className="w-5 h-5 text-chrono-blue animate-spin" />
        </div>
    ),
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
            onSave();
            handleClose();
        } catch (error: unknown) {
            console.error('Error creating sede:', error);
            alert('Error al crear sede: ' + (error instanceof Error ? error.message : 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({ nombre: '', direccion: '', lat: 40.4168, lng: -3.7038, radio: 100 });
        onClose();
    };

    const footer = (
        <>
            <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="bg-white text-navy border border-gray-200 px-4 py-2.5 rounded-full font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 text-sm"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-navy text-white px-4 py-2.5 rounded-full font-semibold hover:bg-slate-800 transition-colors cursor-pointer border-none flex items-center gap-2 disabled:opacity-50 text-sm"
            >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Check className="w-4 h-4" /> Crear Sede</>}
            </button>
        </>
    );

    return (
        <ResponsiveModal
            open={isOpen}
            onOpenChange={(open) => { if (!open) handleClose(); }}
            title={<span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-chrono-blue" /> Nueva Sede / Centro de Trabajo</span>}
            footer={footer}
        >
            <div className="space-y-4">
                {/* Nombre */}
                <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        Nombre de la Sede *
                    </label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm"
                        placeholder="Ej: Oficina Central, Obra Madrid Norte..."
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                </div>

                {/* Dirección */}
                <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        Dirección
                    </label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm"
                        placeholder="Calle, número, ciudad..."
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    />
                </div>

                {/* Radio */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Radio de Geofencing</label>
                        <span className="bg-chrono-blue text-white text-xs px-2.5 py-0.5 rounded-full font-bold">{formData.radio}m</span>
                    </div>
                    <input
                        type="range"
                        className="w-full accent-chrono-blue"
                        min="50" max="500" step="10"
                        value={formData.radio}
                        onChange={(e) => setFormData({ ...formData, radio: parseInt(e.target.value) })}
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>50m</span><span>500m</span>
                    </div>
                </div>

                {/* Mapa */}
                <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        Ubicación en el Mapa
                    </label>
                    <div style={{ height: '280px' }} className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <LocationPicker
                            lat={formData.lat}
                            lng={formData.lng}
                            radio={formData.radio}
                            onLocationSelect={(lat, lng) => setFormData({ ...formData, lat, lng })}
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        Click en el mapa para seleccionar la ubicación exacta
                    </p>
                </div>
            </div>
        </ResponsiveModal>
    );
}
