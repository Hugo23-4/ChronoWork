'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
    ssr: false,
    loading: () => <div className="d-flex justify-content-center"><div className="spinner-border text-primary"></div></div>
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
            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <div className="modal-content border-0 shadow-lg rounded-4">

                        {/* Header */}
                        <div className="modal-header border-0 pb-2">
                            <div className="d-flex align-items-center gap-2">
                                {(editMode === 'edit' || editMode === 'create') && (
                                    <button
                                        className="btn btn-sm btn-light rounded-circle"
                                        onClick={handleCancel}
                                    >
                                        <i className="bi bi-arrow-left"></i>
                                    </button>
                                )}
                                <h5 className="modal-title fw-bold text-dark mb-0">
                                    <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                                    {editMode === 'create' ? 'Nuevo Centro' : editMode === 'edit' ? 'Editar Centro' : 'Centros de Trabajo'}
                                </h5>
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                            ></button>
                        </div>

                        {/* Body */}
                        <div className="modal-body px-4" style={{ minHeight: '500px', maxHeight: '70vh', overflowY: 'auto' }}>

                            {/* LIST VIEW */}
                            {editMode === 'list' && (
                                <>
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <div className="spinner-border text-primary"></div>
                                            <p className="text-muted mt-2 small">Cargando sedes...</p>
                                        </div>
                                    ) : sedes.length === 0 ? (
                                        <div className="text-center py-5">
                                            <i className="bi bi-geo-alt fs-1 text-muted opacity-50"></i>
                                            <h6 className="fw-bold mt-3">No hay centros creados</h6>
                                            <p className="text-secondary small">Crea el primero con el botón "Nuevo Centro"</p>
                                        </div>
                                    ) : (
                                        <div className="row g-3">
                                            {sedes.map((sede) => (
                                                <div key={sede.id} className="col-md-6">
                                                    <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
                                                        <div className="d-flex align-items-start gap-3">
                                                            {/* Icon */}
                                                            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                                style={{ width: '48px', height: '48px' }}>
                                                                <i className="bi bi-building-fill text-primary fs-5"></i>
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-grow-1 min-w-0">
                                                                <h6 className="fw-bold mb-1 text-dark">{sede.nombre}</h6>

                                                                {sede.direccion && (
                                                                    <div className="d-flex align-items-center text-secondary small mb-2">
                                                                        <i className="bi bi-pin-map me-1"></i>
                                                                        <span className="text-truncate">{sede.direccion}</span>
                                                                    </div>
                                                                )}

                                                                <div className="d-flex align-items-center text-secondary small mb-2">
                                                                    <i className="bi bi-geo me-1"></i>
                                                                    <span className="font-monospace" style={{ fontSize: '0.7rem' }}>
                                                                        {sede.latitud?.toFixed(4)}, {sede.longitud?.toFixed(4)}
                                                                    </span>
                                                                </div>

                                                                <span className="badge bg-light text-dark border fw-normal rounded-pill px-3">
                                                                    Radio: <strong>{sede.radio_metros}m</strong>
                                                                </span>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="d-flex flex-column gap-2">
                                                                <button
                                                                    onClick={() => handleEdit(sede)}
                                                                    className="btn btn-sm btn-light rounded-circle"
                                                                    title="Editar"
                                                                >
                                                                    <i className="bi bi-pencil text-primary"></i>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDelete(sede.id, e)}
                                                                    className="btn btn-sm btn-light rounded-circle"
                                                                    title="Eliminar"
                                                                >
                                                                    <i className="bi bi-trash text-danger"></i>
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
                                <div className="row g-4">
                                    {/* Form */}
                                    <div className="col-lg-4">
                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Nombre del Centro *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Ej: Oficina Central"
                                                value={formData.nombre}
                                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Dirección (Opcional)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Calle, número..."
                                                value={formData.direccion}
                                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-2">
                                                <label className="form-label fw-bold">Radio de Fichaje</label>
                                                <span className="badge bg-primary">{formData.radio_metros}m</span>
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
                                            <div className="d-flex justify-content-between small text-muted">
                                                <span>20m</span>
                                                <span>500m</span>
                                            </div>
                                        </div>

                                        <div className="alert alert-info">
                                            <small>
                                                <i className="bi bi-info-circle me-1"></i>
                                                Haz clic en el mapa para cambiar la ubicación
                                            </small>
                                        </div>
                                    </div>

                                    {/* Map */}
                                    <div className="col-lg-8">
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
                        <div className="modal-footer border-0">
                            {editMode === 'list' ? (
                                <>
                                    <button onClick={onClose} className="btn btn-light rounded-pill px-4">
                                        Cerrar
                                    </button>
                                    <button onClick={handleNew} className="btn btn-primary rounded-pill px-4">
                                        <i className="bi bi-plus-lg me-2"></i>
                                        Nuevo Centro
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={handleCancel} className="btn btn-light rounded-pill px-4">
                                        Cancelar
                                    </button>
                                    <button onClick={handleSave} disabled={saving} className="btn btn-primary rounded-pill px-4">
                                        {saving ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-lg me-2"></i>
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
