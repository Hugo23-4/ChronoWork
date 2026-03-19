'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/ui/Toast';
import { PencilLine, UserPlus, Check, Loader2, X } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';

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

const FIELD_CLASS = 'w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm';
const LABEL_CLASS = 'block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5';

export default function EmployeeFormModal({ employeeId, isOpen, onClose, onSave }: EmployeeFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sedes, setSedes] = useState<SedeOption[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const defaultForm: FormData = {
        nombre_completo: '', email: '', dni: '', telefono: '',
        puesto: '', departamento: '', rol: 'empleado', rol_id: 1,
        sede_id: undefined, activo: true
    };
    const [formData, setFormData] = useState<FormData>(defaultForm);

    useEffect(() => {
        if (isOpen) {
            fetchSedes();
            if (employeeId) fetchEmployeeData();
            else setFormData(defaultForm);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, employeeId]);

    const fetchSedes = async () => {
        const { data } = await supabase.from('sedes').select('id, nombre').eq('activo', true).order('nombre');
        if (data) setSedes(data);
    };

    const fetchEmployeeData = async () => {
        if (!employeeId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('empleados_info').select('*').eq('id', employeeId).single();
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

    const handleChange = (field: keyof FormData, value: string | number | boolean | undefined) => {
        if (field === 'rol') {
            setFormData(prev => ({ ...prev, rol: value as string, rol_id: value === 'admin' ? 2 : 1 }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async () => {
        if (!formData.nombre_completo || !formData.email) {
            setToast({ message: 'Nombre y email son obligatorios.', type: 'warning' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData, sede_id: formData.sede_id || null };
            if (employeeId) {
                const { error } = await supabase.from('empleados_info').update(payload).eq('id', employeeId);
                if (error) throw error;
                setToast({ message: 'Empleado actualizado correctamente.', type: 'success' });
            } else {
                const { error } = await supabase.from('empleados_info').insert(payload);
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

    const footer = (
        <>
            <button type="button" onClick={onClose} disabled={saving}
                className="bg-white text-navy border border-gray-200 px-4 py-2.5 rounded-full font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 text-sm">
                Cancelar
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving || loading}
                className="bg-navy text-white px-4 py-2.5 rounded-full font-semibold hover:bg-slate-800 transition-colors cursor-pointer border-none flex items-center gap-2 disabled:opacity-50 text-sm">
                {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                    : <><Check className="w-4 h-4" /> {employeeId ? 'Actualizar' : 'Crear Empleado'}</>
                }
            </button>
        </>
    );

    const titleIcon = employeeId ? <PencilLine className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />;
    const titleText = employeeId ? 'Editar Empleado' : 'Nuevo Empleado';

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ResponsiveModal
                open={isOpen}
                onOpenChange={(open) => { if (!open) onClose(); }}
                title={<span className="flex items-center gap-2">{titleIcon} {titleText}</span>}
                footer={footer}
            >
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-chrono-blue animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div className="sm:col-span-2">
                            <label className={LABEL_CLASS}>Nombre Completo *</label>
                            <input type="text" className={FIELD_CLASS} placeholder="Ej: Juan Pérez García"
                                value={formData.nombre_completo} onChange={(e) => handleChange('nombre_completo', e.target.value)} required />
                        </div>

                        {/* DNI */}
                        <div>
                            <label className={LABEL_CLASS}>DNI / NIE</label>
                            <input type="text" className={FIELD_CLASS} placeholder="12345678X"
                                value={formData.dni} onChange={(e) => handleChange('dni', e.target.value)} />
                        </div>

                        {/* Email */}
                        <div>
                            <label className={LABEL_CLASS}>Email Corporativo *</label>
                            <input type="email" className={FIELD_CLASS} placeholder="empleado@empresa.es"
                                value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label className={LABEL_CLASS}>Teléfono</label>
                            <input type="tel" className={FIELD_CLASS} placeholder="+34 600 000 000"
                                value={formData.telefono} onChange={(e) => handleChange('telefono', e.target.value)} />
                        </div>

                        {/* Puesto */}
                        <div>
                            <label className={LABEL_CLASS}>Puesto</label>
                            <input type="text" className={FIELD_CLASS} placeholder="Ej: Desarrollador"
                                value={formData.puesto} onChange={(e) => handleChange('puesto', e.target.value)} />
                        </div>

                        {/* Departamento */}
                        <div>
                            <label className={LABEL_CLASS}>Departamento</label>
                            <select className={FIELD_CLASS} value={formData.departamento} onChange={(e) => handleChange('departamento', e.target.value)}>
                                <option value="">Sin asignar</option>
                                <option>Tecnología</option>
                                <option>Operaciones</option>
                                <option>Obra Civil</option>
                                <option>Administración</option>
                                <option>Recursos Humanos</option>
                            </select>
                        </div>

                        {/* Sede */}
                        <div>
                            <label className={LABEL_CLASS}>Sede Asignada</label>
                            <select className={FIELD_CLASS} value={formData.sede_id || ''} onChange={(e) => handleChange('sede_id', e.target.value || undefined)}>
                                <option value="">Sin asignar</option>
                                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>

                        {/* Rol */}
                        <div className="sm:col-span-2">
                            <label className={LABEL_CLASS}>Rol de Usuario</label>
                            <select className={FIELD_CLASS} value={formData.rol} onChange={(e) => handleChange('rol', e.target.value)}>
                                <option value="empleado">Empleado</option>
                                <option value="admin">Administrador</option>
                            </select>
                            {formData.rol === 'admin' && (
                                <p className="text-xs text-red-500 mt-1 font-medium">⚠️ Tendrá acceso total al panel admin</p>
                            )}
                        </div>

                        {/* Estado */}
                        <div className="sm:col-span-2">
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only peer" checked={formData.activo}
                                        onChange={(e) => handleChange('activo', e.target.checked)} />
                                    <div className="w-10 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-chrono-blue/30 rounded-full peer peer-checked:bg-chrono-blue transition-colors" />
                                    <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform peer-checked:translate-x-4" />
                                </div>
                                <span className="text-sm font-semibold text-navy">
                                    Empleado {formData.activo ? <span className="text-emerald-600">ACTIVO</span> : <span className="text-red-500">DE BAJA</span>}
                                </span>
                            </label>
                            {!formData.activo && <p className="text-xs text-slate-400 mt-1 ml-13">No aparecerá en listados activos</p>}
                        </div>

                        {/* Close hint */}
                        <button type="button" onClick={onClose} className="sr-only"><X /></button>
                    </div>
                )}
            </ResponsiveModal>
        </>
    );
}
