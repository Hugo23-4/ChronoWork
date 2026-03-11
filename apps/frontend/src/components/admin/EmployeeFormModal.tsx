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
            <div className="modal fade show block" tabIndex={-1} style={{ zIndex: 1055 }}>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-dialog-centered modal-lg modal-dialog-scrollable">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto rounded-2xl border-0 shadow-lg">

                        {/* HEADER */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-navy text-white border-0 rounded-top-4">
                            <h5 className="font-bold text-lg text-navy font-bold flex items-center gap-2">
                                <i className={`bi ${employeeId ? 'bi-pencil-square' : 'bi-person-plus-fill'}`}></i>
                                {employeeId ? 'Editar Empleado' : 'Nuevo Empleado'}
                            </h5>
                            <button type="button" className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none text-xl btn-close-white" onClick={onClose} aria-label="Cerrar modal"></button>
                        </div>

                        {/* BODY */}
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 p-4">
                                {loading ? (
                                    <div className="text-center py-6">
                                        <div className="animate-spin text-chrono-blue" role="status">
                                            <span className="sr-only">Cargando...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="row gap-3">

                                        {/* Nombre Completo */}
                                        <div className="md:col-span-6">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold text-slate-500">NOMBRE COMPLETO *</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm bg-gray-50 border-0"
                                                placeholder="Ej: Juan Pérez García"
                                                value={formData.nombre_completo}
                                                onChange={(e) => handleChange('nombre_completo', e.target.value)}
                                                required
                                            />
                                        </div>

                                        {/* DNI */}
                                        <div className="md:col-span-6">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold text-slate-500">DNI / NIE</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm bg-gray-50 border-0"
                                                placeholder="12345678X"
                                                value={formData.dni}
                                                onChange={(e) => handleChange('dni', e.target.value)}
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="md:col-span-6">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold text-slate-500">EMAIL CORPORATIVO *</label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm bg-gray-50 border-0"
                                                placeholder="empleado@loom.es"
                                                value={formData.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                required
                                            />
                                        </div>

                                        {/* Teléfono */}
                                        <div className="md:col-span-6">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold text-slate-500">TELÉFONO</label>
                                            <input
                                                type="tel"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm bg-gray-50 border-0"
                                                placeholder="+34 600 000 000"
                                                value={formData.telefono}
                                                onChange={(e) => handleChange('telefono', e.target.value)}
                                            />
                                        </div>

                                        {/* Puesto */}
                                        <div className="md:col-span-6">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold text-slate-500">PUESTO</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm bg-gray-50 border-0"
                                                placeholder="Ej: Desarrollador"
                                                value={formData.puesto}
                                                onChange={(e) => handleChange('puesto', e.target.value)}
                                            />
                                        </div>

                                        {/* Departamento */}
                                        <div className="md:col-span-6">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold text-slate-500">DEPARTAMENTO</label>
                                            <select
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 outline-none transition-colors text-sm bg-gray-50 border-0"
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
                                        <div className="md:col-span-6">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold text-slate-500">SEDE / OBRA ASIGNADA</label>
                                            <select
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 outline-none transition-colors text-sm bg-gray-50 border-0"
                                                value={formData.sede_id || ''}
                                                onChange={(e) => handleChange('sede_id', e.target.value || undefined)}
                                            >
                                                <option value="">Sin asignar</option>
                                                {sedes.map(sede => (
                                                    <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                                                ))}
                                            </select>
                                            <small className="form-text text-slate-400">Aparecerá en el mapa de esa sede</small>
                                        </div>

                                        {/* Rol */}
                                        <div className="md:col-span-6">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold text-slate-500">ROL DE USUARIO</label>
                                            <select
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 outline-none transition-colors text-sm bg-gray-50 border-0"
                                                value={formData.rol}
                                                onChange={(e) => handleChange('rol', e.target.value)}
                                            >
                                                <option value="empleado">Empleado</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                            {formData.rol === 'admin' && (
                                                <small className="form-text text-red-500">⚠️ Tendrá acceso total al panel admin</small>
                                            )}
                                        </div>

                                        {/* Estado */}
                                        <div className="col-span-12">
                                            <div className="form-check form-switch">
                                                <input
                                                    className="accent-chrono-blue"
                                                    type="checkbox"
                                                    checked={formData.activo}
                                                    onChange={(e) => handleChange('activo', e.target.checked)}
                                                />
                                                <label className="form-check-label font-bold">
                                                    Empleado {formData.activo ? 'ACTIVO' : 'DE BAJA'}
                                                </label>
                                            </div>
                                            {!formData.activo && (
                                                <small className="text-slate-400">Este empleado no aparecerá en listados activos</small>
                                            )}
                                        </div>

                                    </div>
                                )}
                            </div>

                            {/* FOOTER */}
                            <div className="flex justify-end gap-2 p-6 border-t border-gray-100 border-0 bg-gray-50 rounded-b-2xl p-3">
                                <button
                                    type="button"
                                    className="bg-white text-navy px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200 rounded-full px-4"
                                    onClick={onClose}
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none rounded-full px-4 flex items-center gap-2"
                                    disabled={saving || loading}
                                >
                                    {saving ? (
                                        <>
                                            <span className="animate-spin animate-spin w-4 h-4"></span>
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
