'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
    ssr: false,
});

interface SedeListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SedeListModal({ isOpen, onClose }: SedeListModalProps) {
    const [sedes, setSedes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSede, setSelectedSede] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    useEffect(() => {
        if (isOpen) {
            fetchSedes();
            setViewMode('list');
            setSelectedSede(null);
        }
    }, [isOpen]);

    const fetchSedes = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('sedes')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setSedes(data);
        setLoading(false);
    };

    const handleSedeClick = (sede: any) => {
        setSelectedSede(sede);
        setViewMode('map');
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
                <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
                    <div className="modal-content border-0 shadow-lg rounded-4">

                        {/* Header */}
                        <div className="modal-header border-0 pb-2">
                            <div className="d-flex align-items-center gap-2">
                                {viewMode === 'map' && (
                                    <button
                                        className="btn btn-sm btn-light rounded-circle"
                                        onClick={() => setViewMode('list')}
                                    >
                                        <i className="bi bi-arrow-left"></i>
                                    </button>
                                )}
                                <h5 className="modal-title fw-bold text-dark mb-0">
                                    <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                                    {viewMode === 'map' ? selectedSede?.nombre : 'Centros de Trabajo'}
                                </h5>
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                            ></button>
                        </div>

                        {/* Body */}
                        <div className="modal-body px-4" style={{ minHeight: '400px' }}>
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary"></div>
                                    <p className="text-muted mt-2 small">Cargando sedes...</p>
                                </div>
                            ) : viewMode === 'list' ? (
                                // LIST VIEW
                                sedes.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="bi bi-geo-alt fs-1 text-muted opacity-50"></i>
                                        <h6 className="fw-bold mt-3">No hay centros creados</h6>
                                        <p className="text-secondary small">Crea el primero desde el botón "+"</p>
                                    </div>
                                ) : (
                                    <div className="d-grid gap-3">
                                        {sedes.map((sede) => (
                                            <div
                                                key={sede.id}
                                                onClick={() => handleSedeClick(sede)}
                                                className="card border-0 shadow-sm rounded-4 p-3 hover-shadow-lg transition-all"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="d-flex align-items-start gap-3">
                                                    {/* Icon */}
                                                    <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                        style={{ width: '48px', height: '48px' }}>
                                                        <i className="bi bi-building-fill text-primary fs-5"></i>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-grow-1 min-w-0">
                                                        <h6 className="fw-bold mb-1 text-dark">{sede.nombre}</h6>

                                                        {/* Dirección */}
                                                        {sede.direccion && (
                                                            <div className="d-flex align-items-center text-secondary small mb-2">
                                                                <i className="bi bi-pin-map me-1"></i>
                                                                <span className="text-truncate">{sede.direccion}</span>
                                                            </div>
                                                        )}

                                                        {/* Coordenadas */}
                                                        <div className="d-flex align-items-center text-secondary small mb-2">
                                                            <i className="bi bi-geo me-1"></i>
                                                            <span className="font-monospace" style={{ fontSize: '0.7rem' }}>
                                                                {sede.latitud?.toFixed(4)}, {sede.longitud?.toFixed(4)}
                                                            </span>
                                                        </div>

                                                        {/* Radio badge */}
                                                        <span className="badge bg-light text-dark border fw-normal rounded-pill px-3">
                                                            Radio: <strong>{sede.radio_metros}m</strong>
                                                        </span>
                                                    </div>

                                                    {/* Arrow */}
                                                    <i className="bi bi-chevron-right text-secondary"></i>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                // MAP VIEW
                                <div className="h-100">
                                    <div className="alert alert-info mb-3">
                                        <i className="bi bi-info-circle me-2"></i>
                                        <strong>{selectedSede?.nombre}</strong> - Radio: {selectedSede?.radio_metros}m
                                    </div>
                                    <div style={{ height: '400px' }}>
                                        <LocationPicker
                                            lat={selectedSede?.latitud || 40.4168}
                                            lng={selectedSede?.longitud || -3.7038}
                                            radio={selectedSede?.radio_metros || 100}
                                            onLocationSelect={() => { }} // Read-only
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {viewMode === 'list' && (
                            <div className="modal-footer border-0 pt-2">
                                <a
                                    href="/dashboard/admin/centros"
                                    className="btn btn-primary rounded-pill px-4"
                                >
                                    <i className="bi bi-pencil me-2"></i>
                                    Gestionar Centros
                                </a>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </>
    );
}
