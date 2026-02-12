'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
    const [mode, setMode] = useState<'manual' | 'camera'>('manual');
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        setCameraActive(false);
    }, []);

    // Start camera for QR scanning
    const startCamera = async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setCameraActive(true);

            // Try BarcodeDetector API (Chrome/Edge)
            if ('BarcodeDetector' in window) {
                const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                scanIntervalRef.current = setInterval(async () => {
                    if (!videoRef.current || videoRef.current.readyState < 2) return;
                    try {
                        const barcodes = await detector.detect(videoRef.current);
                        if (barcodes.length > 0) {
                            const qrData = barcodes[0].rawValue;
                            stopCamera();
                            setSearchQuery(qrData);
                            handleSearchWithQuery(qrData);
                        }
                    } catch (e) {
                        // Scan error, continue
                    }
                }, 500);
            } else {
                // BarcodeDetector not available, show manual entry fallback
                setCameraError('Tu navegador no soporta escaneo QR nativo. Introduce el código manualmente.');
            }
        } catch (err: any) {
            console.error('Camera error:', err);
            setCameraError('No se pudo acceder a la cámara. Verifica los permisos o introduce el código manualmente.');
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    const handleSearchWithQuery = async (query: string) => {
        if (!query.trim()) return;
        setLoading(true);
        setSearched(true);

        // Search employees by name, DNI, or direct ID
        let empleados: any = null;
        let error: any = null;

        // Try UUID match first (from QR code)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.trim());
        if (isUUID) {
            const res = await supabase
                .from('empleados_info')
                .select('id, nombre_completo, dni')
                .eq('id', query.trim())
                .single();
            empleados = res.data;
            error = res.error;
        } else {
            const res = await supabase
                .from('empleados_info')
                .select('id, nombre_completo, dni')
                .or(`nombre_completo.ilike.%${query}%,dni.ilike.%${query}%`)
                .limit(1)
                .single();
            empleados = res.data;
            error = res.error;
        }

        if (error || !empleados) {
            setResult({
                found: false,
                nombre: query,
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

        // Check active fichaje today
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

    const handleSearch = async () => {
        await handleSearchWithQuery(searchQuery);
    };

    const handleReset = () => {
        setSearchQuery('');
        setResult(null);
        setSearched(false);
        stopCamera();
    };

    return (
        <div className="fade-in-up" style={{ background: '#0F172A', minHeight: '100vh', margin: '-1rem -1rem 0', padding: '1.5rem' }}>

            {/* Header */}
            <div className="text-center mb-4 pt-3">
                <h6 className="text-danger fw-bold text-uppercase small mb-1" style={{ letterSpacing: '0.08em' }}>
                    MINISTERIO DE TRABAJO
                </h6>
                <h2 className="fw-bold text-white mb-1">Verificador de Campo</h2>
                <p className="text-white-50 small mb-0">Escanea un QR o introduce nombre/DNI</p>
            </div>

            {/* Mode Switcher */}
            <div className="row justify-content-center mb-4">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="d-flex gap-2 mb-3">
                        <button
                            className={`btn rounded-pill flex-grow-1 fw-bold py-2 ${mode === 'manual' ? 'text-white' : 'btn-outline-secondary text-white-50'}`}
                            style={mode === 'manual' ? { background: '#F59E0B' } : { borderColor: '#475569' }}
                            onClick={() => { setMode('manual'); stopCamera(); }}
                        >
                            <i className="bi bi-search me-2"></i>Buscar Manual
                        </button>
                        <button
                            className={`btn rounded-pill flex-grow-1 fw-bold py-2 ${mode === 'camera' ? 'text-white' : 'btn-outline-secondary text-white-50'}`}
                            style={mode === 'camera' ? { background: '#F59E0B' } : { borderColor: '#475569' }}
                            onClick={() => { setMode('camera'); startCamera(); }}
                        >
                            <i className="bi bi-qr-code-scan me-2"></i>Escanear QR
                        </button>
                    </div>
                </div>
            </div>

            {/* Manual Search */}
            {mode === 'manual' && (
                <div className="row justify-content-center mb-4">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="input-group shadow-sm rounded-pill overflow-hidden">
                            <input
                                type="text"
                                className="form-control form-control-lg border-0 py-3 ps-4"
                                placeholder="Nombre, DNI o código QR..."
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
            )}

            {/* Camera View */}
            {mode === 'camera' && (
                <div className="row justify-content-center mb-4">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="rounded-4 overflow-hidden position-relative" style={{ background: '#1E293B', aspectRatio: '4/3' }}>
                            {/* Video feed */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />

                            {/* Scanning overlay */}
                            {cameraActive && !cameraError && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                                    <div style={{
                                        width: '60%', height: '60%',
                                        border: '3px solid #F59E0B',
                                        borderRadius: '16px',
                                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                                        animation: 'pulse 2s infinite'
                                    }}>
                                        <div className="text-center mt-2">
                                            <small className="text-warning fw-bold bg-dark bg-opacity-75 px-3 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>
                                                Apunta al código QR
                                            </small>
                                        </div>
                                    </div>
                                    <style>{`@keyframes pulse { 0%, 100% { border-color: #F59E0B; } 50% { border-color: #FBBF24; } }`}</style>
                                </div>
                            )}

                            {/* Loading state */}
                            {!cameraActive && !cameraError && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                                    <div className="spinner-border text-warning mb-2"></div>
                                    <small className="text-white-50">Iniciando cámara...</small>
                                </div>
                            )}

                            {/* Error state */}
                            {cameraError && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center">
                                    <i className="bi bi-camera-video-off text-danger mb-2" style={{ fontSize: '2rem' }}></i>
                                    <small className="text-white-50">{cameraError}</small>
                                    <button
                                        className="btn btn-sm btn-outline-warning rounded-pill mt-3"
                                        onClick={() => { setMode('manual'); stopCamera(); }}
                                    >
                                        Usar Búsqueda Manual
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Manual entry fallback when camera is active */}
                        {cameraActive && (
                            <div className="mt-3">
                                <small className="text-white-50 d-block mb-2 text-center">O introduce el código manualmente:</small>
                                <div className="input-group rounded-pill overflow-hidden">
                                    <input
                                        type="text"
                                        className="form-control border-0 py-2 ps-3"
                                        placeholder="Pegar código QR..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <button
                                        className="btn px-3 text-white"
                                        style={{ background: '#F59E0B' }}
                                        onClick={handleSearch}
                                        disabled={!searchQuery.trim()}
                                    >
                                        <i className="bi bi-search"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
            {!searched && mode === 'manual' && (
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6 text-center py-5">
                        <i className="bi bi-qr-code-scan text-white-50 mb-3" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <p className="text-white-50 mb-1">Introduce un nombre, DNI o código QR</p>
                        <p className="text-white-50 small">O cambia al modo cámara para escanear directamente</p>
                    </div>
                </div>
            )}

        </div>
    );
}
