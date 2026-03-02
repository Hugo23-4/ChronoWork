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
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <span className="fw-bold d-block text-dark">Face ID / Huella dactilar</span>
                    <small className="text-muted">
                        {devices.length === 0
                            ? 'Ningún dispositivo registrado'
                            : `${devices.length} dispositivo${devices.length > 1 ? 's' : ''} de confianza`}
                    </small>
                </div>

                {supported && (
                    <button
                        onClick={handleRegister}
                        disabled={registering}
                        className="btn btn-dark btn-sm rounded-pill px-3 d-flex align-items-center gap-2"
                    >
                        {registering ? (
                            <><span className="spinner-border spinner-border-sm" /> Registrando...</>
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
                    <span className="badge bg-light text-secondary border small">No compatible</span>
                )}
            </div>

            {message && (
                <div className={`alert py-2 small d-flex align-items-center gap-2 rounded-3 mb-3 alert-${message.type === 'success' ? 'success' : message.type === 'warning' ? 'warning' : 'danger'}`}>
                    <i className={`bi bi-${message.type === 'success' ? 'check-circle' : 'exclamation-triangle'}-fill`} aria-hidden="true"></i>
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-secondary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            ) : devices.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                    {devices.map((device) => (
                        <div key={device.id} className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light">
                            <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle bg-dark d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 32, height: 32 }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M9 9H9.01M15 9H15.01M9 15C9.83 15.67 10.83 16 12 16C13.17 16 14.17 15.67 15 15" />
                                        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="fw-bold small text-dark">{device.device_name}</div>
                                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                        Añadido {formatDate(device.created_at)}
                                        {device.last_used_at && ` · Usado ${formatDate(device.last_used_at)}`}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(device.id)}
                                className="btn btn-link text-danger p-0"
                                title="Eliminar dispositivo"
                                aria-label={`Eliminar ${device.device_name}`}
                            >
                                <i className="bi bi-trash3" aria-hidden="true"></i>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-3 text-muted small">
                    <i className="bi bi-shield-lock d-block mb-1 fs-4 opacity-25" aria-hidden="true"></i>
                    {supported
                        ? 'Pulsa "Añadir dispositivo" para registrar tu Face ID o huella'
                        : 'Tu dispositivo no soporta autenticación biométrica'}
                </div>
            )}
        </div>
    );
}
