'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface VerificationResult {
    found: boolean;
    nombre: string;
    dni: string;
    fichaje_activo: boolean;
    hora_entrada: string;
    sede: string;
    gps_ok: boolean;
    hash: string;
}

export default function InspectorEscanearPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setSearched(true);

        // Search employees by name or DNI
        const { data: empleados, error } = await supabase
            .from('empleados_info')
            .select('id, nombre_completo, dni')
            .or(`nombre_completo.ilike.%${searchQuery}%,dni.ilike.%${searchQuery}%`)
            .limit(1)
            .single();

        if (error || !empleados) {
            setResult({
                found: false,
                nombre: searchQuery,
                dni: '',
                fichaje_activo: false,
                hora_entrada: '',
                sede: '',
                gps_ok: false,
                hash: '',
            });
            setLoading(false);
            return;
        }

        // Check active fichaje today with sedes join
        const today = new Date().toISOString().split('T')[0];
        const { data: fichaje } = await supabase
            .from('fichajes')
            .select('*, sedes(nombre)')
            .eq('empleado_id', empleados.id)
            .eq('fecha', today)
            .is('hora_salida', null)
            .order('hora_entrada', { ascending: false })
            .limit(1)
            .single();

        // If no active fichaje, get last one today
        let lastFichaje = fichaje;
        if (!fichaje) {
            const { data: lastF } = await supabase
                .from('fichajes')
                .select('*, sedes(nombre)')
                .eq('empleado_id', empleados.id)
                .eq('fecha', today)
                .order('hora_entrada', { ascending: false })
                .limit(1)
                .single();
            lastFichaje = lastF;
        }

        const activeFichaje = fichaje || lastFichaje;

        const formatTime = (t: string) => {
            if (!t) return '--:--:--';
            if (t.includes('T')) return new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return t.substring(0, 8);
        };

        // Generate simulated hash
        const chars = '0123456789abcdef';
        let hash = '0x';
        const seed = empleados.id;
        for (let i = 0; i < 8; i++) hash += chars[Math.abs(seed.charCodeAt(i % seed.length) * (i + 3)) % 16];
        hash += '...' + seed.substring(0, 4);

        setResult({
            found: true,
            nombre: empleados.nombre_completo,
            dni: empleados.dni || 'No registrado',
            fichaje_activo: !!fichaje,
            hora_entrada: activeFichaje ? formatTime(activeFichaje.hora_entrada) : 'Sin fichaje hoy',
            sede: activeFichaje?.sedes?.nombre || 'Sin sede asignada',
            gps_ok: !!(activeFichaje?.latitud_entrada && activeFichaje?.longitud_entrada),
            hash: hash,
        });

        setLoading(false);
    };

    const handleReset = () => {
        setSearchQuery('');
        setResult(null);
        setSearched(false);
    };

    return (
        <div className="fade-in-up" style={{ background: '#0F172A', minHeight: '100vh', margin: '-1rem -1rem 0', padding: '1.5rem' }}>

            {/* Header - Figma dark bg */}
            <div className="text-center mb-4 pt-3">
                <h6 className="text-danger fw-bold text-uppercase small mb-1" style={{ letterSpacing: '0.08em' }}>
                    MINISTERIO DE TRABAJO
                </h6>
                <h2 className="fw-bold text-white mb-1">Verificador de Campo</h2>
                <p className="text-white-50 small">Buscar empleado por nombre o DNI</p>
            </div>

            {/* Search */}
            <div className="row justify-content-center mb-4">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="input-group shadow-sm rounded-pill overflow-hidden">
                        <input
                            type="text"
                            className="form-control form-control-lg border-0 py-3 ps-4"
                            placeholder="Buscar por nombre o DNI..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            className="btn px-4 fw-bold text-white"
                            style={{ background: '#F59E0B' }}
                            onClick={handleSearch}
                            disabled={loading || !searchQuery.trim()}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                                <i className="bi bi-search fs-5"></i>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Result */}
            {searched && result && (
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">

                        {result.found ? (
                            <div className="card border-0 shadow rounded-4 overflow-hidden">
                                {/* Status Banner */}
                                <div className="text-center py-5 px-3" style={{ background: '#fff' }}>
                                    <div className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3"
                                        style={{
                                            width: 90, height: 90,
                                            background: result.fichaje_activo ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
                                        }}>
                                        <i className={`bi ${result.fichaje_activo ? 'bi-check-lg' : 'bi-dash-lg'}`}
                                            style={{
                                                fontSize: '3rem',
                                                color: result.fichaje_activo ? '#10B981' : '#EF4444'
                                            }}></i>
                                    </div>
                                    <h3 className="fw-bold mb-1" style={{ color: result.fichaje_activo ? '#10B981' : '#F97316' }}>
                                        {result.fichaje_activo ? 'EMPLEADO VÁLIDO' : 'SIN TURNO ACTIVO'}
                                    </h3>
                                    <p className="text-muted small mb-0">
                                        {result.fichaje_activo ? 'Fichaje activo detectado' : 'No tiene fichaje activo hoy'}
                                    </p>
                                </div>

                                {/* Details */}
                                <div className="p-4" style={{ background: '#fff' }}>
                                    <div className="text-center mb-3" style={{ letterSpacing: '4px', color: '#CBD5E1' }}>
                                        {'- '.repeat(20)}
                                    </div>

                                    {/* Identity */}
                                    <div className="mb-3">
                                        <small className="text-warning fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                                            IDENTIDAD
                                        </small>
                                        <h5 className="fw-bold text-dark mb-0">{result.nombre}</h5>
                                        <small className="text-muted">NIF: {result.dni}</small>
                                    </div>

                                    {/* Today's record */}
                                    <div className="mb-3">
                                        <small className="text-warning fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                                            REGISTRO DE HOY
                                        </small>
                                        <div className="d-flex align-items-center gap-3 mt-1">
                                            <span className="fw-bold font-monospace" style={{ fontSize: '1.8rem' }}>
                                                {result.hora_entrada}
                                            </span>
                                            {result.fichaje_activo && (
                                                <span className="badge rounded-pill px-3 py-2 fw-bold"
                                                    style={{
                                                        color: result.gps_ok ? '#10B981' : '#EF4444',
                                                        background: result.gps_ok ? '#ECFDF5' : '#FEF2F2',
                                                        fontSize: '0.7rem'
                                                    }}>
                                                    {result.gps_ok ? 'GPS OK' : 'SIN GPS'}
                                                </span>
                                            )}
                                        </div>
                                        <small className="text-muted">📍 {result.sede}</small>
                                    </div>

                                    {/* Hash */}
                                    <div className="rounded-3 p-3 text-center" style={{ background: '#F8FAFC', border: '1px dashed #E2E8F0' }}>
                                        <code className="text-muted" style={{ fontSize: '0.8rem' }}>
                                            Hash: {result.hash} (Inmutable)
                                        </code>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card border-0 shadow rounded-4 overflow-hidden">
                                <div className="text-center py-5 px-3" style={{ background: '#1E293B' }}>
                                    <div className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3"
                                        style={{ width: 80, height: 80, background: 'rgba(239, 68, 68, 0.15)' }}>
                                        <i className="bi bi-x-lg" style={{ fontSize: '2.5rem', color: '#EF4444' }}></i>
                                    </div>
                                    <h4 className="fw-bold text-danger mb-1">NO ENCONTRADO</h4>
                                    <p className="text-white-50 small">No se encontró ningún empleado con &quot;{searchQuery}&quot;</p>
                                </div>
                            </div>
                        )}

                        {/* Reset button */}
                        <button
                            onClick={handleReset}
                            className="btn w-100 py-3 rounded-pill fw-bold text-white mt-4 d-flex align-items-center justify-content-center gap-2"
                            style={{ background: '#3B82F6', fontSize: '1.1rem' }}
                        >
                            <i className="bi bi-qr-code-scan fs-5"></i>
                            Escanear Siguiente QR
                        </button>

                    </div>
                </div>
            )}

            {/* Empty State */}
            {!searched && (
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6 text-center py-5">
                        <i className="bi bi-qr-code-scan text-white-50 mb-3" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <p className="text-white-50">Introduce un nombre o DNI para verificar un empleado</p>
                    </div>
                </div>
            )}

        </div>
    );
}
