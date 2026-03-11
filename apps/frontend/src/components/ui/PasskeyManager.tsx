'use client';

import { useState, useEffect } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { supabase } from '@/lib/supabase';

interface RegisteredDevice {
    id: string;
    device_name: string;
    created_at: string;
    last_used_at: string | null;
}

/**
 * Sección de gestión de Passkeys / Dispositivos de confianza.
 * Se integra en la página de perfil del empleado.
 */
export default function PasskeyManager() {
    const [devices, setDevices] = useState<RegisteredDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [supported, setSupported] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

    useEffect(() => {
        // Comprobar soporte biométrico
        if (
            typeof window !== 'undefined' &&
            window.PublicKeyCredential &&
            typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
        ) {
            window.PublicKeyCredential
                .isUserVerifyingPlatformAuthenticatorAvailable()
                .then(setSupported)
                .catch(() => setSupported(false));
        }
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('passkeys')
            .select('id, device_name, created_at, last_used_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        setDevices(data ?? []);
        setLoading(false);
    };

    const handleRegister = async () => {
        setRegistering(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No hay sesión activa');

            // Detectar nombre del dispositivo automáticamente
            const ua = navigator.userAgent;
            let deviceName = 'Dispositivo';
            if (/iPhone/i.test(ua)) deviceName = 'iPhone';
            else if (/iPad/i.test(ua)) deviceName = 'iPad';
            else if (/Android/i.test(ua)) deviceName = 'Android';
            else if (/Mac/i.test(ua)) deviceName = 'Mac';
            else if (/Windows/i.test(ua)) deviceName = 'Windows PC';
            deviceName += ` — ${new Date().toLocaleDateString('es-ES')}`;

            // 1. Obtener opciones de registro
            const optRes = await fetch('/api/auth/passkey/register-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.email,
                }),
            });

            if (!optRes.ok) throw new Error('Error obteniendo opciones de registro');
            const options = await optRes.json();

            // 2. Lanzar diálogo de Face ID / Huella
            const credential = await startRegistration({ optionsJSON: options });

            // 3. Verificar y guardar
            const verifyRes = await fetch('/api/auth/passkey/register-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, credential, deviceName }),
            });

            const result = await verifyRes.json();
            if (!verifyRes.ok || !result.verified) throw new Error(result.error ?? 'Error verificando');

            setMessage({ text: '✓ Dispositivo registrado correctamente', type: 'success' });
            localStorage.setItem('chrono_has_passkey', 'true'); // Flag para auto-trigger en login
            fetchDevices();
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'InvalidStateError') {
                setMessage({ text: 'Este dispositivo ya está registrado', type: 'warning' });
            } else if (err instanceof Error && err.name === 'NotAllowedError') {
                // Usuario canceló
            } else {
                setMessage({ text: 'No se pudo registrar el dispositivo. Inténtalo de nuevo.', type: 'error' });
            }
        } finally {
            setRegistering(false);
        }
    };

    const handleDelete = async (passkeyId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('passkeys').delete().eq('id', passkeyId).eq('user_id', user.id);
        setDevices(prev => prev.filter(d => d.id !== passkeyId));
        setMessage({ text: 'Dispositivo eliminado', type: 'success' });
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div>
            <div className="flex justify-between items-center mb-3">
                <div>
                    <span className="font-bold block text-navy">Face ID / Huella dactilar</span>
                    <small className="text-slate-400">
                        {devices.length === 0
                            ? 'Ningún dispositivo registrado'
                            : `${devices.length} dispositivo${devices.length > 1 ? 's' : ''} de confianza`}
                    </small>
                </div>

                {supported && (
                    <button
                        onClick={handleRegister}
                        disabled={registering}
                        className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none btn-sm rounded-full px-3 flex items-center gap-2"
                    >
                        {registering ? (
                            <><span className="animate-spin animate-spin w-4 h-4" /> Registrando...</>
                        ) : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M9 9H9.01M15 9H15.01M9 15C9.83 15.67 10.83 16 12 16C13.17 16 14.17 15.67 15 15" />
                                    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                                </svg>
                                Añadir dispositivo
                            </>
                        )}
                    </button>
                )}

                {!supported && (
                    <span className="bg-gray-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold text-slate-500 border text-sm">No compatible</span>
                )}
            </div>

            {message && (
                <div className={`alert py-2 text-sm flex items-center gap-2 rounded-lg mb-3 alert-${message.type === 'success' ? 'success' : message.type === 'warning' ? 'warning' : 'danger'}`}>
                    <i className={`bi bi-${message.type === 'success' ? 'check-circle' : 'exclamation-triangle'}-fill`} aria-hidden="true"></i>
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="text-center py-3">
                    <div className="animate-spin animate-spin w-4 h-4 text-slate-500" role="status">
                        <span className="sr-only">Cargando...</span>
                    </div>
                </div>
            ) : devices.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {devices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-navy flex items-center justify-center shrink-0" style={{ width: 32, height: 32 }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M9 9H9.01M15 9H15.01M9 15C9.83 15.67 10.83 16 12 16C13.17 16 14.17 15.67 15 15" />
                                        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-navy">{device.device_name}</div>
                                    <div className="text-slate-400" style={{ fontSize: '0.72rem' }}>
                                        Añadido {formatDate(device.created_at)}
                                        {device.last_used_at && ` · Usado ${formatDate(device.last_used_at)}`}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(device.id)}
                                className="bg-transparent border-none cursor-pointer text-red-500 p-0"
                                title="Eliminar dispositivo"
                                aria-label={`Eliminar ${device.device_name}`}
                            >
                                <i className="bi bi-trash3" aria-hidden="true"></i>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-3 text-slate-400 text-sm">
                    <i className="bi bi-shield-lock block mb-1 text-xl opacity-25" aria-hidden="true"></i>
                    {supported
                        ? 'Pulsa "Añadir dispositivo" para registrar tu Face ID o huella'
                        : 'Tu dispositivo no soporta autenticación biométrica'}
                </div>
            )}
        </div>
    );
}
