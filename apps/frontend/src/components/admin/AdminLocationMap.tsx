'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';
import { Building2, MapPin } from 'lucide-react';

// Iconos personalizados
const greenIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const blueIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

interface Sede {
    id: string;
    nombre: string;
    latitud: number;
    longitud: number;
    radio_metros: number;
    direccion?: string;
}

interface EmpleadoEnSede {
    id: string;
    nombre: string;
    puesto: string;
    hora_fichaje?: string;
    lat?: number;
    lng?: number;
    enZona?: boolean;
}

interface SedeConEmpleados extends Sede {
    empleados: EmpleadoEnSede[];
    empleados_activos: number;
}

export default function AdminLocationMap() {
    const [sedes, setSedes] = useState<SedeConEmpleados[]>([]);
    const [empleadosSueltos, setEmpleadosSueltos] = useState<EmpleadoEnSede[]>([]);
    const [loading, setLoading] = useState(true);
    const [center, setCenter] = useState<[number, number]>([40.4168, -3.7038]); // Madrid por defecto

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // 1. Obtener sedes
            const { data: sedesData } = await supabase
                .from('sedes')
                .select('*')
                .eq('activo', true);

            if (sedesData && sedesData.length > 0) {
                // Centrar en la primera sede
                setCenter([sedesData[0].latitud, sedesData[0].longitud]);

                // 2. Para cada sede, obtener empleados asignados
                const sedesConEmpleados: SedeConEmpleados[] = await Promise.all(
                    sedesData.map(async (sede) => {
                        // 2a. Empleados asignados a esta sede
                        const { data: empleadosAsignados } = await supabase
                            .from('empleados_info')
                            .select('id, nombre_completo, puesto')
                            .eq('sede_id', sede.id)
                            .eq('activo', true);

                        // 2b. Fichajes activos de empleados en esta sede
                        const { data: fichajesActivos } = await supabase
                            .from('fichajes')
                            .select('*, empleados_info(nombre_completo, puesto)')
                            .eq('sede_id', sede.id)
                            .is('hora_salida', null)
                            .not('latitud_entrada', 'is', null);

                        const empleados: EmpleadoEnSede[] = [];

                        // Agregar empleados con fichaje activo
                        if (fichajesActivos) {
                            fichajesActivos.forEach((f: any) => {
                                const enZona = calcularDistancia(
                                    f.latitud_entrada,
                                    f.longitud_entrada,
                                    sede.latitud,
                                    sede.longitud
                                ) <= sede.radio_metros;

                                empleados.push({
                                    id: f.empleado_id,
                                    nombre: f.empleados_info?.nombre_completo || 'Empleado',
                                    puesto: f.empleados_info?.puesto || '',
                                    hora_fichaje: new Date(f.hora_entrada).toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }),
                                    lat: f.latitud_entrada,
                                    lng: f.longitud_entrada,
                                    enZona
                                });
                            });
                        }

                        // Agregar empleados asignados que no están fichados (solo para conteo)
                        if (empleadosAsignados) {
                            empleadosAsignados.forEach((emp: any) => {
                                if (!empleados.find(e => e.id === emp.id)) {
                                    empleados.push({
                                        id: emp.id,
                                        nombre: emp.nombre_completo,
                                        puesto: emp.puesto || 'Sin puesto'
                                    });
                                }
                            });
                        }

                        return {
                            ...sede,
                            empleados,
                            empleados_activos: fichajesActivos?.length || 0
                        };
                    })
                );

                setSedes(sedesConEmpleados);

                // 3. Empleados sin sede asignada pero con fichaje activo
                const { data: fichajesSinSede } = await supabase
                    .from('fichajes')
                    .select('*, empleados_info(nombre_completo, puesto, sede_id)')
                    .is('hora_salida', null)
                    .not('latitud_entrada', 'is', null);

                if (fichajesSinSede) {
                    const sueltos = fichajesSinSede
                        .filter((f: any) => !f.empleados_info?.sede_id)
                        .map((f: any) => ({
                            id: f.empleado_id,
                            nombre: f.empleados_info?.nombre_completo || 'Empleado',
                            puesto: f.empleados_info?.puesto || '',
                            hora_fichaje: new Date(f.hora_entrada).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            lat: f.latitud_entrada,
                            lng: f.longitud_entrada,
                            enZona: false
                        }));
                    setEmpleadosSueltos(sueltos);
                }
            }
        } catch (error) {
            console.error('Error loading map data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calcular distancia entre dos puntos en metros
    const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Obtener iniciales para avatares
    const getInitials = (nombre: string) => {
        return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    // Color de avatar según nombre
    const getAvatarColor = (nombre: string) => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        const index = nombre.charCodeAt(0) % colors.length;
        return colors[index];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-2xl">
                <div className="animate-spin text-chrono-blue" role="status">
                    <span className="sr-only">Cargando mapa...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden">
            <MapContainer
                center={center}
                zoom={14}
                style={{ height: '100%', width: '100%', minHeight: '280px' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                />

                {/* Sedes (círculos azules con empleados) */}
                {sedes.map(sede => (
                    <Circle
                        key={sede.id}
                        center={[sede.latitud, sede.longitud]}
                        radius={sede.radio_metros}
                        pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.15 }}
                    >
                        <Popup maxWidth={300}>
                            <div className="p-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Building2 className="w-5 h-5 text-chrono-blue inline" />
                                    <strong className="text-base">{sede.nombre}</strong>
                                </div>

                                {sede.direccion && (
                                    <div className="text-slate-400 text-sm mb-2 flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                        {sede.direccion}
                                    </div>
                                )}

                                <div className="text-sm text-slate-500 mb-3">
                                    Radio: {sede.radio_metros}m
                                </div>

                                {/* Lista de empleados en esta sede */}
                                <div className="border-t pt-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <strong className="text-sm">Empleados en esta sede</strong>
                                        <span className="bg-chrono-blue text-white text-xs px-2 py-0.5 rounded-full font-bold rounded-full">{sede.empleados.length}</span>
                                    </div>

                                    {sede.empleados.length === 0 ? (
                                        <div className="text-slate-400 text-sm">No hay empleados asignados</div>
                                    ) : (
                                        <div className="flex flex-col gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {sede.empleados.map(emp => (
                                                <div key={emp.id} className="flex items-center gap-2 text-sm">
                                                    <div
                                                        className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            fontSize: '0.65rem',
                                                            backgroundColor: getAvatarColor(emp.nombre)
                                                        }}
                                                    >
                                                        {getInitials(emp.nombre)}
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <div className="font-bold truncate" style={{ fontSize: '0.8rem' }}>
                                                            {emp.nombre}
                                                        </div>
                                                        <div className="text-slate-400 truncate" style={{ fontSize: '0.7rem' }}>
                                                            {emp.puesto}
                                                            {emp.hora_fichaje && (
                                                                <span className="ml-1">• Fichó {emp.hora_fichaje}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {emp.enZona !== undefined && (
                                                        <div className={`badge ${emp.enZona ? 'bg-emerald-500' : 'bg-red-500'} rounded-full`}
                                                            style={{ fontSize: '0.6rem' }}>
                                                            {emp.enZona ? '✓' : '⚠'}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Circle>
                ))}

                {/* Marcadores de sedes con badge de empleados activos */}
                {sedes.map(sede => (
                    <Marker key={`sede-${sede.id}`} position={[sede.latitud, sede.longitud]} icon={blueIcon}>
                        <Popup>
                            <div className="text-center">
                                <strong>📍 {sede.nombre}</strong>
                                <div className="mt-1">
                                    <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{sede.empleados_activos} activos</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Empleados con ubicación GPS (desde fichajes) */}
                {sedes.flatMap(sede =>
                    sede.empleados
                        .filter(emp => emp.lat && emp.lng)
                        .map(emp => (
                            <Marker
                                key={`emp-${emp.id}`}
                                position={[emp.lat!, emp.lng!]}
                                icon={emp.enZona ? greenIcon : redIcon}
                            >
                                <Popup>
                                    <div>
                                        <strong>{emp.nombre}</strong><br />
                                        <small>{emp.puesto}</small><br />
                                        <small>Fichó a las {emp.hora_fichaje}</small><br />
                                        <span className={emp.enZona ? 'text-emerald-500' : 'text-red-500'}>
                                            {emp.enZona ? '✓ En zona permitida' : '⚠ Fuera de zona'}
                                        </span>
                                    </div>
                                </Popup>
                            </Marker>
                        ))
                )}

                {/* Empleados sin sede asignada */}
                {empleadosSueltos.map(emp => (
                    <Marker
                        key={`suelto-${emp.id}`}
                        position={[emp.lat!, emp.lng!]}
                        icon={redIcon}
                    >
                        <Popup>
                            <div>
                                <strong>{emp.nombre}</strong><br />
                                <small>{emp.puesto}</small><br />
                                <small>Fichó a las {emp.hora_fichaje}</small><br />
                                <span className="text-amber-500">⚠ Sin sede asignada</span>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
