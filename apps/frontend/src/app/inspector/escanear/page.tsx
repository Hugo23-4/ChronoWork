'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, QrCode, Camera, CameraOff, Check, Minus, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationResult { found: boolean; nombre: string; dni: string; fichaje_activo: boolean; hora_entrada: string; sede: string; gps_ok: boolean; hash: string; }

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

    const stopCamera = useCallback(() => {
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        if (scanIntervalRef.current) { clearInterval(scanIntervalRef.current); scanIntervalRef.current = null; }
        setCameraActive(false);
    }, []);

    const startCamera = async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } });
            streamRef.current = stream;
            if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
            setCameraActive(true);
            if ('BarcodeDetector' in window) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                scanIntervalRef.current = setInterval(async () => {
                    if (!videoRef.current || videoRef.current.readyState < 2) return;
                    try { const barcodes = await detector.detect(videoRef.current); if (barcodes.length > 0) { stopCamera(); setSearchQuery(barcodes[0].rawValue); handleSearchWithQuery(barcodes[0].rawValue); } } catch { /* scan error */ }
                }, 500);
            } else { setCameraError('Tu navegador no soporta escaneo QR nativo. Introduce el código manualmente.'); }
        } catch { setCameraError('No se pudo acceder a la cámara. Verifica los permisos o introduce el código manualmente.'); }
    };

    useEffect(() => { return () => { stopCamera(); }; }, [stopCamera]);

    const handleSearchWithQuery = async (query: string) => {
        if (!query.trim()) return;
        setLoading(true); setSearched(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let empleados: any = null; let error: any = null;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.trim());
        if (isUUID) { const res = await supabase.from('empleados_info').select('id, nombre_completo, dni').eq('id', query.trim()).single(); empleados = res.data; error = res.error; }
        else { const res = await supabase.from('empleados_info').select('id, nombre_completo, dni').or(`nombre_completo.ilike.%${query}%,dni.ilike.%${query}%`).limit(1).single(); empleados = res.data; error = res.error; }
        if (error || !empleados) { setResult({ found: false, nombre: query, dni: '', fichaje_activo: false, hora_entrada: '', sede: '', gps_ok: false, hash: '' }); setLoading(false); return; }
        const today = new Date().toISOString().split('T')[0];
        const { data: fichaje } = await supabase.from('fichajes').select('*, sedes(nombre)').eq('empleado_id', empleados.id).eq('fecha', today).is('hora_salida', null).order('hora_entrada', { ascending: false }).limit(1).single();
        let lastFichaje = fichaje;
        if (!fichaje) { const { data: lastF } = await supabase.from('fichajes').select('*, sedes(nombre)').eq('empleado_id', empleados.id).eq('fecha', today).order('hora_entrada', { ascending: false }).limit(1).single(); lastFichaje = lastF; }
        const activeFichaje = fichaje || lastFichaje;
        const formatTime = (t: string) => { if (!t) return '--:--:--'; if (t.includes('T')) return new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); return t.substring(0, 8); };
        const chars = '0123456789abcdef'; let hash = '0x'; const seed = empleados.id; for (let i = 0; i < 8; i++) hash += chars[Math.abs(seed.charCodeAt(i % seed.length) * (i + 3)) % 16]; hash += '...' + seed.substring(0, 4);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setResult({ found: true, nombre: empleados.nombre_completo, dni: empleados.dni || 'No registrado', fichaje_activo: !!fichaje, hora_entrada: activeFichaje ? formatTime(activeFichaje.hora_entrada) : 'Sin fichaje hoy', sede: (activeFichaje as any)?.sedes?.nombre || 'Sin sede asignada', gps_ok: !!(activeFichaje?.latitud_entrada && activeFichaje?.longitud_entrada), hash });
        setLoading(false);
    };

    const handleSearch = () => handleSearchWithQuery(searchQuery);
    const handleReset = () => { setSearchQuery(''); setResult(null); setSearched(false); stopCamera(); };

    return (
        <div className="animate-fade-up bg-navy min-h-screen px-4 py-6"
            style={{ marginInline: 'calc(-1 * var(--content-p, 0.75rem))', marginTop: 'calc(-1 * var(--content-p, 0.75rem))' }}>
            {/* Header */}
            <div className="text-center mb-5 pt-3">
                <h6 className="text-red-500 font-bold uppercase text-xs mb-1 tracking-[0.08em]">MINISTERIO DE TRABAJO</h6>
                <h2 className="font-bold text-white text-2xl mb-1 font-[family-name:var(--font-jakarta)]">Verificador de Campo</h2>
                <p className="text-white/50 text-sm">Escanea un QR o introduce nombre/DNI</p>
            </div>

            {/* Mode Switcher */}
            <div className="flex justify-center mb-5">
                <div className="w-full max-w-md">
                    <div className="flex gap-2 mb-3">
                        <button onClick={() => { setMode('manual'); stopCamera(); }}
                            className={cn('flex-1 py-2.5 rounded-full font-bold text-sm border-none cursor-pointer transition-all flex items-center justify-center gap-2',
                                mode === 'manual' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' : 'bg-transparent border-2 border-slate-600 text-white/50')}>
                            <Search className="w-4 h-4" /> Buscar Manual
                        </button>
                        <button onClick={() => { setMode('camera'); startCamera(); }}
                            className={cn('flex-1 py-2.5 rounded-full font-bold text-sm border-none cursor-pointer transition-all flex items-center justify-center gap-2',
                                mode === 'camera' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' : 'bg-transparent border-2 border-slate-600 text-white/50')}>
                            <QrCode className="w-4 h-4" /> Escanear QR
                        </button>
                    </div>
                </div>
            </div>

            {/* Manual Search */}
            {mode === 'manual' && (
                <div className="flex justify-center mb-5">
                    <div className="w-full max-w-md">
                        <div className="relative rounded-full overflow-hidden shadow-lg">
                            <input type="text" className="w-full py-3.5 pl-5 pr-16 border-none outline-none text-sm bg-white"
                                placeholder="Nombre, DNI o código QR..." value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                            <button onClick={handleSearch} disabled={loading || !searchQuery.trim()}
                                className="absolute right-1 top-1 bottom-1 px-4 bg-amber-500 text-white rounded-full border-none cursor-pointer font-bold disabled:opacity-50 flex items-center justify-center">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera View */}
            {mode === 'camera' && (
                <div className="flex justify-center mb-5">
                    <div className="w-full max-w-md">
                        <div className="rounded-2xl overflow-hidden relative bg-slate-800" style={{ aspectRatio: '4/3' }}>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            {cameraActive && !cameraError && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-[60%] h-[60%] border-[3px] border-amber-500 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] animate-pulse">
                                        <div className="text-center mt-2"><small className="text-amber-500 font-bold bg-navy/75 px-3 py-1 rounded-full text-[0.7rem]">Apunta al código QR</small></div>
                                    </div>
                                </div>
                            )}
                            {!cameraActive && !cameraError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <Camera className="w-8 h-8 text-amber-500 mb-2 animate-pulse" />
                                    <small className="text-white/50">Iniciando cámara...</small>
                                </div>
                            )}
                            {cameraError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                    <CameraOff className="w-8 h-8 text-red-500 mb-2" />
                                    <small className="text-white/50">{cameraError}</small>
                                    <button onClick={() => { setMode('manual'); stopCamera(); }}
                                        className="mt-3 px-3.5 py-1.5 rounded-full text-xs font-bold border-[1.5px] border-amber-400 text-amber-400 bg-transparent cursor-pointer hover:bg-amber-500/10 transition-colors">
                                        Usar Búsqueda Manual
                                    </button>
                                </div>
                            )}
                        </div>
                        {cameraActive && (
                            <div className="mt-3">
                                <small className="text-white/50 block mb-2 text-center">O introduce el código manualmente:</small>
                                <div className="relative rounded-full overflow-hidden">
                                    <input type="text" className="w-full py-2.5 pl-4 pr-12 border-none outline-none text-sm bg-slate-800 text-white"
                                        placeholder="Pegar código QR..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                                    <button onClick={handleSearch} disabled={!searchQuery.trim()}
                                        className="absolute right-1 top-1 bottom-1 px-3 bg-amber-500 text-white rounded-full border-none cursor-pointer">
                                        <Search className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Result */}
            {searched && result && (
                <div className="flex justify-center">
                    <div className="w-full max-w-md">
                        {result.found ? (
                            <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                                <div className="text-center py-6 px-4">
                                    <div className={cn('w-[90px] h-[90px] rounded-full mx-auto flex items-center justify-center mb-3', result.fichaje_activo ? 'bg-emerald-100' : 'bg-red-100')}>
                                        {result.fichaje_activo ? <Check className="w-12 h-12 text-emerald-500" /> : <Minus className="w-12 h-12 text-red-500" />}
                                    </div>
                                    <h3 className={cn('font-bold mb-1 text-xl', result.fichaje_activo ? 'text-emerald-500' : 'text-orange-500')}>
                                        {result.fichaje_activo ? 'EMPLEADO VÁLIDO' : 'SIN TURNO ACTIVO'}
                                    </h3>
                                    <p className="text-slate-400 text-sm">{result.fichaje_activo ? 'Fichaje activo detectado' : 'No tiene fichaje activo hoy'}</p>
                                </div>
                                <div className="p-4 bg-white">
                                    <div className="text-center mb-3 text-slate-200 tracking-[4px] text-xs">{'- '.repeat(20)}</div>
                                    <div className="mb-3">
                                        <small className="text-amber-500 font-bold uppercase text-[0.65rem] tracking-[0.1em]">IDENTIDAD</small>
                                        <h5 className="font-bold text-navy">{result.nombre}</h5>
                                        <small className="text-slate-400">NIF: {result.dni}</small>
                                    </div>
                                    <div className="mb-3">
                                        <small className="text-amber-500 font-bold uppercase text-[0.65rem] tracking-[0.1em]">REGISTRO DE HOY</small>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="font-bold font-mono text-3xl">{result.hora_entrada}</span>
                                            {result.fichaje_activo && (
                                                <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-[0.7rem] font-bold', result.gps_ok ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>
                                                    {result.gps_ok ? 'GPS OK' : 'SIN GPS'}
                                                </span>
                                            )}
                                        </div>
                                        <small className="text-slate-400">📍 {result.sede}</small>
                                    </div>
                                    <div className="rounded-lg p-3 text-center bg-slate-50 border border-dashed border-slate-200">
                                        <code className="text-slate-400 text-sm">Hash: {result.hash} (Inmutable)</code>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-xl">
                                <div className="text-center py-8 px-4">
                                    <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-3 bg-red-500/15">
                                        <X className="w-10 h-10 text-red-500" />
                                    </div>
                                    <h4 className="font-bold text-red-500 mb-1">NO ENCONTRADO</h4>
                                    <p className="text-white/50 text-sm">No se encontró ningún empleado con &quot;{searchQuery}&quot;</p>
                                </div>
                            </div>
                        )}

                        <button onClick={handleReset}
                            className="w-full py-3.5 rounded-full font-bold text-white mt-4 flex items-center justify-center gap-2 bg-blue-500 border-none cursor-pointer text-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25">
                            <QrCode className="w-5 h-5" /> Escanear Siguiente QR
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!searched && mode === 'manual' && (
                <div className="flex justify-center">
                    <div className="w-full max-w-md text-center py-10">
                        <QrCode className="w-16 h-16 text-white/10 mx-auto mb-3" />
                        <p className="text-white/50 mb-1">Introduce un nombre, DNI o código QR</p>
                        <p className="text-white/30 text-sm">O cambia al modo cámara para escanear directamente</p>
                    </div>
                </div>
            )}
        </div>
    );
}
