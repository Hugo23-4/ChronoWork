'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/ui/Toast';

interface EmployeeFormModalProps {
    employeeId?: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

interface FormData {
    nombre_completo: string;
    email: string;
    dni: string;
    telefono: string;
    puesto: string;
    departamento: string;
    rol: string;
    rol_id: number;
    sede_id?: string;
    activo: boolean;
}

interface SedeOption {
    id: string;
    nombre: string;
}

export default function EmployeeFormModal({ employeeId, isOpen, onClose, onSave }: EmployeeFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sedes, setSedes] = useState<SedeOption[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const [formData, setFormData] = useState<FormData>({
        nombre_completo: '',
        email: '',
        dni: '',
        telefono: '',
        puesto: '',
        departamento: '',
        rol: 'empleado',
        rol_id: 1,
        sede_id: undefined,
        activo: true
    });

    useEffect(() => {
        if (isOpen) {
            fetchSedes();
            if (employeeId) {
                fetchEmployeeData();
            } else {
                resetForm();
            }
        }
    }, [isOpen, employeeId]);

    const fetchSedes = async () => {
        const { data } = await supabase
            .from('sedes')
            .select('id, nombre')
            .eq('activo', true)
            .order('nombre');
        if (data) setSedes(data);
    };

    const fetchEmployeeData = async () => {
        if (!employeeId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('empleados_info')
                .select('*')
                .eq('id', employeeId)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    nombre_completo: data.nombre_completo || '',
                    email: data.email || '',
                    dni: data.dni || '',
                    telefono: data.telefono || '',
                    puesto: data.puesto || '',
                    departamento: data.departamento || '',
                    rol: data.rol || 'empleado',
                    rol_id: data.rol_id || 1,
                    sede_id: data.sede_id || undefined,
                    activo: data.activo !== false
                });
            }
        } catch {
            setToast({ message: 'No se pudo cargar el empleado. Inténtalo de nuevo.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nombre_completo: '',
            email: '',
            dni: '',
            telefono: '',
            puesto: '',
            departamento: '',
            rol: 'empleado',
            rol_id: 1,
            sede_id: undefined,
            activo: true
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre_completo || !formData.email) {
            setToast({ message: 'Nombre y email son obligatorios.', type: 'warning' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                sede_id: formData.sede_id || null
            };

            if (employeeId) {
                const { error } = await supabase
                    .from('empleados_info')
                    .update(payload)
                    .eq('id', employeeId);

                if (error) throw error;
                setToast({ message: 'Empleado actualizado correctamente.', type: 'success' });
            } else {
                const { error } = await supabase
                    .from('empleados_info')
                    .insert(payload);

                if (error) throw error;
                setToast({ message: 'Empleado creado correctamente.', type: 'success' });
            }

            onSave();
            onClose();
        } catch {
            setToast({ message: 'No se pudo guardar el empleado. Inténtalo de nuevo.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof FormData, value: string | number | boolean | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Sincronizar rol y rol_id
        if (field === 'rol') {
            setFormData(prev => ({
                ...prev,
                rol: value as string,
                rol_id: value === 'admin' ? 2 : 1
            }));
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <div className="modal-backdrop fade show" onClick={onClose}></div>
            <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1055 }}>
                <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                    <div className="modal-content rounded-4 border-0 shadow-lg">

                        {/* HEADER */}
                        <div className="modal-header bg-dark text-white border-0 rounded-top-4">
                            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                <i className={`bi ${employeeId ? 'bi-pencil-square' : 'bi-person-plus-fill'}`}></i>
                                {employeeId ? 'Editar Empleado' : 'Nuevo Empleado'}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Cerrar modal"></button>
                        </div>

                        {/* BODY */}
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body p-4">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Cargando...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="row g-3">

                                        {/* Nombre Completo */}
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">NOMBRE COMPLETO *</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                placeholder="Ej: Juan Pérez García"
                                                value={formData.nombre_completo}
                                                onChange={(e) => handleChange('nombre_completo', e.target.value)}
                                                required
                                            />
                                        </div>

                                        {/* DNI */}
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">DNI / NIE</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                placeholder="12345678X"
                                                value={formData.dni}
                                                onChange={(e) => handleChange('dni', e.target.value)}
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">EMAIL CORPORATIVO *</label>
                                            <input
                                                type="email"
                                                className="form-control bg-light border-0"
                                                placeholder="empleado@loom.es"
                                                value={formData.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                required
                                            />
                                        </div>

                                        {/* Teléfono */}
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">TELÉFONO</label>
                                            <input
                                                type="tel"
                                                className="form-control bg-light border-0"
                                                placeholder="+34 600 000 000"
                                                value={formData.telefono}
                                                onChange={(e) => handleChange('telefono', e.target.value)}
                                            />
                                        </div>

                                        {/* Puesto */}
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">PUESTO</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                placeholder="Ej: Desarrollador"
                                                value={formData.puesto}
                                                onChange={(e) => handleChange('puesto', e.target.value)}
                                            />
                                        </div>

                                        {/* Departamento */}
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">DEPARTAMENTO</label>
                                            <select
                                                className="form-select bg-light border-0"
                                                value={formData.departamento}
                                                onChange={(e) => handleChange('departamento', e.target.value)}
                                            >
                                                <option value="">Sin asignar</option>
                                                <option value="Tecnología">Tecnología</option>
                                                <option value="Operaciones">Operaciones</option>
                                                <option value="Obra Civil">Obra Civil</option>
                                                <option value="Administración">Administración</option>
                                                <option value="Recursos Humanos">Recursos Humanos</option>
                                            </select>
                                        </div>

                                        {/* Sede Asignada */}
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">SEDE / OBRA ASIGNADA</label>
                                            <select
                                                className="form-select bg-light border-0"
                                                value={formData.sede_id || ''}
                                                onChange={(e) => handleChange('sede_id', e.target.value || undefined)}
                                            >
                                                <option value="">Sin asignar</option>
                                                {sedes.map(sede => (
                                                    <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                                                ))}
                                            </select>
                                            <small className="form-text text-muted">Aparecerá en el mapa de esa sede</small>
                                        </div>

                                        {/* Rol */}
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">ROL DE USUARIO</label>
                                            <select
                                                className="form-select bg-light border-0"
                                                value={formData.rol}
                                                onChange={(e) => handleChange('rol', e.target.value)}
                                            >
                                                <option value="empleado">Empleado</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                            {formData.rol === 'admin' && (
                                                <small className="form-text text-danger">⚠️ Tendrá acceso total al panel admin</small>
                                            )}
                                        </div>

                                        {/* Estado */}
                                        <div className="col-12">
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={formData.activo}
                                                    onChange={(e) => handleChange('activo', e.target.checked)}
                                                />
                                                <label className="form-check-label fw-bold">
                                                    Empleado {formData.activo ? 'ACTIVO' : 'DE BAJA'}
                                                </label>
                                            </div>
                                            {!formData.activo && (
                                                <small className="text-muted">Este empleado no aparecerá en listados activos</small>
                                            )}
                                        </div>

                                    </div>
                                )}
                            </div>

                            {/* FOOTER */}
                            <div className="modal-footer border-0 bg-light rounded-bottom-4 p-3">
                                <button
                                    type="button"
                                    className="btn btn-light rounded-pill px-4"
                                    onClick={onClose}
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-dark rounded-pill px-4 d-flex align-items-center gap-2"
                                    disabled={saving || loading}
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm"></span>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg"></i>
                                            {employeeId ? 'Actualizar' : 'Crear Empleado'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            </div>
        </>
    );
}
