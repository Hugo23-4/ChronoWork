'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
    ssr: false,
    loading: () => <div className="flex justify-center"><div className="animate-spin text-chrono-blue"></div></div>
});

interface SedeListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SedeListModal({ isOpen, onClose }: SedeListModalProps) {
    const [sedes, setSedes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSede, setSelectedSede] = useState<any>(null);
    const [editMode, setEditMode] = useState<'list' | 'edit' | 'create'>('list');
    const [saving, setSaving] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        latitud: 40.4168,
        longitud: -3.7038,
        radio_metros: 100
    });

    useEffect(() => {
        if (isOpen) {
            fetchSedes();
            setEditMode('list');
            setSelectedSede(null);
        }
    }, [isOpen]);

    const fetchSedes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('sedes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching sedes:', error);
        }
        if (data) setSedes(data);
        setLoading(false);
    };

    const handleNew = () => {
        setFormData({
            nombre: '',
            direccion: '',
            latitud: 40.4168,
            longitud: -3.7038,
            radio_metros: 100
        });
        setSelectedSede(null);
        setEditMode('create');
    };

    const handleEdit = (sede: any) => {
        setSelectedSede(sede);
        setFormData({
            nombre: sede.nombre,
            direccion: sede.direccion || '',
            latitud: sede.latitud,
            longitud: sede.longitud,
            radio_metros: sede.radio_metros
        });
        setEditMode('edit');
    };

    const handleSave = async () => {
        if (!formData.nombre) {
            alert('El nombre es obligatorio');
            return;
        }

        setSaving(true);
        const payload = {
            nombre: formData.nombre,
            direccion: formData.direccion,
            latitud: formData.latitud,
            longitud: formData.longitud,
            radio_metros: formData.radio_metros,
            activo: true
        };

        try {
            if (editMode === 'create') {
                const { error } = await supabase.from('sedes').insert(payload);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('sedes').update(payload).eq('id', selectedSede.id);
                if (error) throw error;
            }

            await fetchSedes();
            setEditMode('list');
            setSelectedSede(null);
        } catch (error: any) {
            console.error('Error saving sede:', error);
            alert('Error: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Seguro que quieres eliminar este centro?')) return;

        try {
            const { error } = await supabase.from('sedes').delete().eq('id', id);
            if (error) throw error;

            await fetchSedes();
            if (selectedSede?.id === id) {
                setEditMode('list');
                setSelectedSede(null);
            }
        } catch (error: any) {
            console.error('Error deleting sede:', error);
            alert('Error: ' + error.message);
        }
    };

    const handleCancel = () => {
        setEditMode('list');
        setSelectedSede(null);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="modal fade show block" style={{ zIndex: 1055 }} tabIndex={-1}>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-dialog-centered modal-xl">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto border-0 shadow-lg rounded-2xl">

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 border-0 pb-2">
                            <div className="flex items-center gap-2">
                                {(editMode === 'edit' || editMode === 'create') && (
                                    <button
                                        className="text-sm py-1.5 px-3 btn-light rounded-full"
                                        onClick={handleCancel}
                                    >
                                        <i className="bi bi-arrow-left"></i>
                                    </button>
                                )}
                                <h5 className="font-bold text-lg text-navy font-bold text-navy mb-0">
                                    <i className="bi bi-geo-alt-fill text-chrono-blue mr-2"></i>
                                    {editMode === 'create' ? 'Nuevo Centro' : editMode === 'edit' ? 'Editar Centro' : 'Centros de Trabajo'}
                                </h5>
                            </div>
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none text-xl"
                                onClick={onClose}
                            ></button>
                        </div>

                        {/* Body */}
                        <div className="p-6 px-4" style={{ minHeight: '500px', maxHeight: '70vh', overflowY: 'auto' }}>

                            {/* LIST VIEW */}
                            {editMode === 'list' && (
                                <>
                                    {loading ? (
                                        <div className="text-center py-6">
                                            <div className="animate-spin text-chrono-blue"></div>
                                            <p className="text-slate-400 mt-2 text-sm">Cargando sedes...</p>
                                        </div>
                                    ) : sedes.length === 0 ? (
                                        <div className="text-center py-6">
                                            <i className="bi bi-geo-alt text-4xl text-slate-400 opacity-50"></i>
                                            <h6 className="font-bold mt-3">No hay centros creados</h6>
                                            <p className="text-slate-500 text-sm">Crea el primero con el botón "Nuevo Centro"</p>
                                        </div>
                                    ) : (
                                        <div className="row gap-3">
                                            {sedes.map((sede) => (
                                                <div key={sede.id} className="md:col-span-6">
                                                    <div className="card border-0 shadow-sm rounded-2xl p-3 h-full">
                                                        <div className="flex items-start gap-3">
                                                            {/* Icon */}
                                                            <div className="bg-chrono-blue bg-opacity-10 rounded-full flex items-center justify-center shrink-0"
                                                                style={{ width: '48px', height: '48px' }}>
                                                                <i className="bi bi-building-fill text-chrono-blue text-lg"></i>
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-grow min-w-0">
                                                                <h6 className="font-bold mb-1 text-navy">{sede.nombre}</h6>

                                                                {sede.direccion && (
                                                                    <div className="flex items-center text-slate-500 text-sm mb-2">
                                                                        <i className="bi bi-pin-map mr-1"></i>
                                                                        <span className="truncate">{sede.direccion}</span>
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center text-slate-500 text-sm mb-2">
                                                                    <i className="bi bi-geo mr-1"></i>
                                                                    <span className="font-mono" style={{ fontSize: '0.7rem' }}>
                                                                        {sede.latitud?.toFixed(4)}, {sede.longitud?.toFixed(4)}
                                                                    </span>
                                                                </div>

                                                                <span className="bg-gray-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold text-navy border font-normal rounded-full px-3">
                                                                    Radio: <strong>{sede.radio_metros}m</strong>
                                                                </span>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex flex-col gap-2">
                                                                <button
                                                                    onClick={() => handleEdit(sede)}
                                                                    className="text-sm py-1.5 px-3 btn-light rounded-full"
                                                                    title="Editar"
                                                                >
                                                                    <i className="bi bi-pencil text-chrono-blue"></i>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDelete(sede.id, e)}
                                                                    className="text-sm py-1.5 px-3 btn-light rounded-full"
                                                                    title="Eliminar"
                                                                >
                                                                    <i className="bi bi-trash text-red-500"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* EDIT/CREATE VIEW */}
                            {(editMode === 'edit' || editMode === 'create') && (
                                <div className="row gap-4">
                                    {/* Form */}
                                    <div className="lg:col-span-4">
                                        <div className="mb-3">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 font-bold">Nombre del Centro *</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm"
                                                placeholder="Ej: Oficina Central"
                                                value={formData.nombre}
                                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 font-bold">Dirección (Opcional)</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm"
                                                placeholder="Calle, número..."
                                                value={formData.direccion}
                                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <div className="flex justify-between mb-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2 font-bold">Radio de Fichaje</label>
                                                <span className="bg-chrono-blue text-white text-xs px-2 py-0.5 rounded-full font-bold">{formData.radio_metros}m</span>
                                            </div>
                                            <input
                                                type="range"
                                                className="form-range"
                                                min="20"
                                                max="500"
                                                step="10"
                                                value={formData.radio_metros}
                                                onChange={(e) => setFormData({ ...formData, radio_metros: Number(e.target.value) })}
                                            />
                                            <div className="flex justify-between text-sm text-slate-400">
                                                <span>20m</span>
                                                <span>500m</span>
                                            </div>
                                        </div>

                                        <div className="bg-sky-50 border border-sky-200 text-sky-700 rounded-xl p-3 text-sm">
                                            <small>
                                                <i className="bi bi-info-circle mr-1"></i>
                                                Haz clic en el mapa para cambiar la ubicación
                                            </small>
                                        </div>
                                    </div>

                                    {/* Map */}
                                    <div className="lg:col-span-8">
                                        <div style={{ height: '400px', borderRadius: '12px', overflow: 'hidden' }}>
                                            <LocationPicker
                                                lat={formData.latitud}
                                                lng={formData.longitud}
                                                radio={formData.radio_metros}
                                                onLocationSelect={(lat, lng) => setFormData({ ...formData, latitud: lat, longitud: lng })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 p-6 border-t border-gray-100 border-0">
                            {editMode === 'list' ? (
                                <>
                                    <button onClick={onClose} className="bg-white text-navy px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200 rounded-full px-4">
                                        Cerrar
                                    </button>
                                    <button onClick={handleNew} className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none rounded-full px-4">
                                        <i className="bi bi-plus-lg mr-2"></i>
                                        Nuevo Centro
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={handleCancel} className="bg-white text-navy px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200 rounded-full px-4">
                                        Cancelar
                                    </button>
                                    <button onClick={handleSave} disabled={saving} className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none rounded-full px-4">
                                        {saving ? (
                                            <>
                                                <span className="animate-spin animate-spin w-4 h-4 mr-2"></span>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-lg mr-2"></i>
                                                Guardar
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
