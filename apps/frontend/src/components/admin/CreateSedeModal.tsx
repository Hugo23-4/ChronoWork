'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
    ssr: false,
    loading: () => <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
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
            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content border-0 shadow-lg rounded-4">

                        {/* Header */}
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold text-dark">
                                <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                                Nueva Sede / Centro de Trabajo
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={handleClose}
                                disabled={saving}
                            ></button>
                        </div>

                        {/* Body */}
                        <div className="modal-body px-4">

                            {/* Nombre */}
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-secondary text-uppercase">
                                    Nombre de la Sede *
                                </label>
                                <input
                                    type="text"
                                    className="form-control rounded-pill shadow-sm border-0"
                                    placeholder="Ej: Oficina Central, Obra Madrid Norte..."
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>

                            {/* Dirección */}
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-secondary text-uppercase">
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    className="form-control rounded-pill shadow-sm border-0"
                                    placeholder="Calle, número, ciudad..."
                                    value={formData.direccion}
                                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                />
                            </div>

                            {/* Radio */}
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-secondary text-uppercase d-flex align-items-center justify-content-between">
                                    <span>Radio de Geofencing</span>
                                    <span className="badge bg-primary">{formData.radio}m</span>
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
                                <div className="d-flex justify-content-between">
                                    <small className="text-muted">50m</small>
                                    <small className="text-muted">500m</small>
                                </div>
                            </div>

                            {/* Mapa */}
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-secondary text-uppercase">
                                    Ubicación en el Mapa
                                </label>
                                <div style={{ height: '300px' }} className="rounded-4 overflow-hidden shadow-sm">
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
                                <small className="text-muted d-block mt-2">
                                    <i className="bi bi-info-circle me-1"></i>
                                    Click en el mapa para seleccionar la ubicación exacta
                                </small>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="modal-footer border-0 pt-0">
                            <button
                                type="button"
                                className="btn btn-outline-secondary rounded-pill px-4"
                                onClick={handleClose}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm"></span>
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
