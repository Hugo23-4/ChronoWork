'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { ArrowLeft, MapPin, MapPinOff, Building2, Navigation, Globe, Pencil, Trash2, Info, Plus, Check, Loader2 } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { cn } from '@/lib/utils';

const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center items-center h-48 bg-slate-50 rounded-xl">
            <Loader2 className="w-5 h-5 text-chrono-blue animate-spin" />
        </div>
    ),
});

interface SedeListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Sede {
    id: string;
    nombre: string;
    direccion?: string;
    latitud: number;
    longitud: number;
    radio_metros: number;
    activo?: boolean;
}

type EditMode = 'list' | 'edit' | 'create';

const FIELD_CLASS = 'w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm';
const LABEL_CLASS = 'block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5';

export default function SedeListModal({ isOpen, onClose }: SedeListModalProps) {
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSede, setSelectedSede] = useState<Sede | null>(null);
    const [editMode, setEditMode] = useState<EditMode>('list');
    const [saving, setSaving] = useState(false);
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
        if (error) console.error('Error fetching sedes:', error);
        if (data) setSedes(data as Sede[]);
        setLoading(false);
    };

    const handleNew = () => {
        setFormData({ nombre: '', direccion: '', latitud: 40.4168, longitud: -3.7038, radio_metros: 100 });
        setSelectedSede(null);
        setEditMode('create');
    };

    const handleEdit = (sede: Sede) => {
        setSelectedSede(sede);
        setFormData({ nombre: sede.nombre, direccion: sede.direccion || '', latitud: sede.latitud, longitud: sede.longitud, radio_metros: sede.radio_metros });
        setEditMode('edit');
    };

    const handleSave = async () => {
        if (!formData.nombre) { alert('El nombre es obligatorio'); return; }
        setSaving(true);
        const payload = { ...formData, activo: true };
        try {
            if (editMode === 'create') {
                const { error } = await supabase.from('sedes').insert(payload);
                if (error) throw error;
            } else if (selectedSede) {
                const { error } = await supabase.from('sedes').update(payload).eq('id', selectedSede.id);
                if (error) throw error;
            }
            await fetchSedes();
            setEditMode('list');
            setSelectedSede(null);
        } catch (error: unknown) {
            alert('Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
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
            if (selectedSede?.id === id) { setEditMode('list'); setSelectedSede(null); }
        } catch (error: unknown) {
            alert('Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
        }
    };

    const handleCancel = () => { setEditMode('list'); setSelectedSede(null); };

    const titleLabel = editMode === 'create' ? 'Nuevo Centro' : editMode === 'edit' ? 'Editar Centro' : 'Centros de Trabajo';

    const titleNode = (
        <span className="flex items-center gap-2">
            {(editMode === 'edit' || editMode === 'create') && (
                <button
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors border-none cursor-pointer shrink-0"
                    onClick={handleCancel}
                    aria-label="Volver"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
            )}
            <MapPin className="w-4 h-4 text-chrono-blue shrink-0" />
            {titleLabel}
        </span>
    );

    const footerNode = editMode === 'list' ? (
        <>
            <button onClick={onClose} className="bg-white text-navy border border-gray-200 px-4 py-2.5 rounded-full font-semibold hover:bg-gray-50 transition-colors cursor-pointer text-sm">
                Cerrar
            </button>
            <button onClick={handleNew} className="bg-navy text-white px-4 py-2.5 rounded-full font-semibold hover:bg-slate-800 transition-colors cursor-pointer border-none flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Nuevo Centro
            </button>
        </>
    ) : (
        <>
            <button onClick={handleCancel} className="bg-white text-navy border border-gray-200 px-4 py-2.5 rounded-full font-semibold hover:bg-gray-50 transition-colors cursor-pointer text-sm">
                Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="bg-navy text-white px-4 py-2.5 rounded-full font-semibold hover:bg-slate-800 transition-colors cursor-pointer border-none flex items-center gap-2 disabled:opacity-60 text-sm">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Check className="w-4 h-4" /> Guardar</>}
            </button>
        </>
    );

    return (
        <ResponsiveModal
            open={isOpen}
            onOpenChange={(open) => { if (!open) onClose(); }}
            title={titleNode}
            footer={footerNode}
            contentClassName="max-w-2xl"
        >
            {/* ── LIST VIEW ─── */}
            {editMode === 'list' && (
                <>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-6 h-6 text-chrono-blue animate-spin" />
                            <p className="text-slate-400 text-sm">Cargando centros...</p>
                        </div>
                    ) : sedes.length === 0 ? (
                        <div className="text-center py-12">
                            <MapPinOff className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <h6 className="font-bold text-navy mb-1">Sin centros de trabajo</h6>
                            <p className="text-slate-400 text-sm">Crea el primero usando el botón &quot;Nuevo Centro&quot;</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sedes.map((sede) => (
                                <div key={sede.id}
                                    className="bg-gray-50 border border-gray-100 hover:border-chrono-blue/20 hover:bg-blue-50/30 rounded-2xl p-4 transition-all duration-200 group">
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className="bg-chrono-blue/10 rounded-full flex items-center justify-center shrink-0 w-11 h-11">
                                            <Building2 className="w-5 h-5 text-chrono-blue" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h6 className="font-bold text-navy text-sm truncate">{sede.nombre}</h6>
                                                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0', sede.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500')}>
                                                    {sede.activo ? 'ACTIVO' : 'INACTIVO'}
                                                </span>
                                            </div>
                                            {sede.direccion && (
                                                <div className="flex items-center text-slate-500 text-xs mb-1.5">
                                                    <Navigation className="w-3 h-3 mr-1 shrink-0" />
                                                    <span className="truncate">{sede.direccion}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center text-slate-400 text-[11px]">
                                                    <Globe className="w-3 h-3 mr-1" />
                                                    {sede.latitud?.toFixed(4)}, {sede.longitud?.toFixed(4)}
                                                </span>
                                                <span className="bg-navy/10 text-navy text-[11px] px-2 py-0.5 rounded-full font-bold">
                                                    R: {sede.radio_metros}m
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(sede)} className="p-2 rounded-full bg-white hover:bg-chrono-blue/10 transition-colors border border-gray-200 cursor-pointer" title="Editar">
                                                <Pencil className="w-3.5 h-3.5 text-chrono-blue" />
                                            </button>
                                            <button onClick={(e) => handleDelete(sede.id, e)} className="p-2 rounded-full bg-white hover:bg-red-50 transition-colors border border-gray-200 cursor-pointer" title="Eliminar">
                                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── EDIT / CREATE VIEW ─── */}
            {(editMode === 'edit' || editMode === 'create') && (
                <div className="space-y-4">
                    {/* Nombre */}
                    <div>
                        <label className={LABEL_CLASS}>Nombre del Centro *</label>
                        <input type="text" className={FIELD_CLASS} placeholder="Ej: Oficina Central"
                            value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className={LABEL_CLASS}>Dirección <span className="font-normal normal-case">(opcional)</span></label>
                        <input type="text" className={FIELD_CLASS} placeholder="Calle, número..."
                            value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} />
                    </div>

                    {/* Radio */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className={LABEL_CLASS + ' mb-0'}>Radio de Geofencing</label>
                            <span className="bg-chrono-blue text-white text-xs px-2.5 py-0.5 rounded-full font-bold">{formData.radio_metros}m</span>
                        </div>
                        <input type="range" className="w-full accent-chrono-blue" min="20" max="500" step="10"
                            value={formData.radio_metros} onChange={(e) => setFormData({ ...formData, radio_metros: Number(e.target.value) })} />
                        <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>20m</span><span>500m</span></div>
                    </div>

                    {/* Info hint */}
                    <div className="bg-sky-50 border border-sky-200 text-sky-700 rounded-xl p-3 text-xs flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        Haz clic en el mapa para cambiar la ubicación exacta
                    </div>

                    {/* Map */}
                    <div style={{ height: '300px' }} className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        <LocationPicker
                            lat={formData.latitud}
                            lng={formData.longitud}
                            radio={formData.radio_metros}
                            onLocationSelect={(lat, lng) => setFormData({ ...formData, latitud: lat, longitud: lng })}
                        />
                    </div>
                </div>
            )}
        </ResponsiveModal>
    );
}
