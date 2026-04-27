'use client';

import { useState, useEffect } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, AlertTriangle, Trash2, ShieldOff, Loader2, Plus, Smartphone, Laptop, Monitor, ScanFace } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBiometricStepUp } from '@/lib/useBiometricStepUp';
import BiometricStepUpDialog from '@/components/ui/BiometricStepUpDialog';

interface RegisteredDevice {
    id: string;
    device_name: string;
    created_at: string;
    last_used_at: string | null;
}

function deviceIcon(name: string) {
    if (/iPhone|iPad|Android/i.test(name)) return Smartphone;
    if (/Mac/i.test(name)) return Laptop;
    return Monitor;
}

export default function PasskeyManager() {
    const [devices, setDevices] = useState<RegisteredDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [supported, setSupported] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const stepUp = useBiometricStepUp();

    useEffect(() => {
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
        if (!user) { setLoading(false); return; }

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

            const ua = navigator.userAgent;
            let deviceName = 'Dispositivo';
            if (/iPhone/i.test(ua)) deviceName = 'iPhone';
            else if (/iPad/i.test(ua)) deviceName = 'iPad';
            else if (/Android/i.test(ua)) deviceName = 'Android';
            else if (/Mac/i.test(ua)) deviceName = 'Mac';
            else if (/Windows/i.test(ua)) deviceName = 'Windows PC';
            deviceName += ` — ${new Date().toLocaleDateString('es-ES')}`;

            const optRes = await fetch('/api/auth/passkey/register-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, userEmail: user.email, userName: user.email }),
            });

            if (!optRes.ok) {
                const errBody = await optRes.json().catch(() => ({}));
                throw new Error(errBody.error ?? `Error opciones (HTTP ${optRes.status})`);
            }
            const options = await optRes.json();

            const credential = await startRegistration({ optionsJSON: options });

            const verifyRes = await fetch('/api/auth/passkey/register-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, credential, deviceName }),
            });

            const result = await verifyRes.json();
            if (!verifyRes.ok || !result.verified) {
                throw new Error(result.error ?? `Error verificando (HTTP ${verifyRes.status})`);
            }

            setMessage({ text: 'Dispositivo registrado correctamente.', type: 'success' });
            localStorage.setItem('chrono_has_passkey', 'true');
            fetchDevices();
        } catch (err: unknown) {
            console.error('[PasskeyManager.handleRegister]', err);
            if (err instanceof Error && err.name === 'InvalidStateError') {
                setMessage({ text: 'Este dispositivo ya está registrado.', type: 'warning' });
            } else if (err instanceof Error && err.name === 'NotAllowedError') {
                setMessage({ text: 'Cancelado por el usuario o no permitido por el dispositivo.', type: 'warning' });
            } else if (err instanceof Error && err.name === 'SecurityError') {
                setMessage({ text: 'El dominio no permite passkeys. Comprueba HTTPS y rpID.', type: 'error' });
            } else {
                const msg = err instanceof Error ? err.message : 'Error desconocido';
                setMessage({ text: msg, type: 'error' });
            }
        } finally {
            setRegistering(false);
        }
    };

    const handleDelete = async (passkeyId: string, deviceName: string) => {
        // Step-up sólo si hay otra passkey además de la que se elimina
        // (si es la única, eliminarla no requiere re-auth porque pierde el flag igualmente)
        if (devices.length > 1) {
            const ok = await stepUp.request({ action: 'passkey.delete' });
            if (!ok) return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('passkeys').delete().eq('id', passkeyId).eq('user_id', user.id);
        const remaining = devices.filter(d => d.id !== passkeyId);
        setDevices(remaining);
        if (remaining.length === 0) localStorage.removeItem('chrono_has_passkey');
        setMessage({ text: `${deviceName} eliminado.`, type: 'success' });
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div>
            <BiometricStepUpDialog
                state={stepUp.state}
                onClose={stepUp.close}
                title="Confirma para eliminar"
                description="Esta acción retira un dispositivo de confianza vinculado a tu cuenta."
            />

            <div className="flex justify-between items-start mb-4 gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <ScanFace className="w-[18px] h-[18px] text-ios-blue shrink-0" />
                        <span className="font-semibold text-[15px] text-[--color-label-primary] dark:text-white">
                            Face ID / huella dactilar
                        </span>
                    </div>
                    <small className="text-[13px] text-[--color-label-secondary] dark:text-[#aeaeb2]">
                        {devices.length === 0
                            ? 'Ningún dispositivo de confianza registrado.'
                            : `${devices.length} dispositivo${devices.length > 1 ? 's' : ''} de confianza.`}
                    </small>
                </div>

                {supported && (
                    <button
                        onClick={handleRegister}
                        disabled={registering}
                        className="bg-ios-blue text-white px-3 h-9 rounded-full text-[13px] font-semibold hover:bg-[#0066D9] active:scale-[0.97] transition-all cursor-pointer border-none flex items-center gap-1.5 disabled:opacity-60 shrink-0"
                        style={{ boxShadow: '0 4px 14px rgba(0,122,255,0.25)' }}
                    >
                        {registering ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Registrando…</>
                        ) : (
                            <><Plus className="w-4 h-4" /> Añadir</>
                        )}
                    </button>
                )}

                {!supported && (
                    <span className="bg-systemGray-6 dark:bg-white/8 text-[--color-label-secondary] text-[12px] px-2.5 py-1 rounded-full font-medium shrink-0">
                        No compatible
                    </span>
                )}
            </div>

            {message && (
                <div className={cn(
                    'flex items-center gap-2 px-3.5 py-2.5 text-[13px] rounded-[14px] mb-3',
                    message.type === 'success' && 'bg-[#34C759]/12 text-[#1F8C3D] dark:text-[#34C759]',
                    message.type === 'warning' && 'bg-[#FF9500]/12 text-[#B36800] dark:text-[#FFB454]',
                    message.type === 'error' && 'bg-[#FF3B30]/12 text-[#C9251D] dark:text-[#FF6961]'
                )}>
                    {message.type === 'success'
                        ? <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        : <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="text-center py-4">
                    <Loader2 className="w-5 h-5 text-ios-blue animate-spin mx-auto" aria-hidden="true" />
                    <span className="sr-only">Cargando…</span>
                </div>
            ) : devices.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {devices.map((device) => {
                        const Icon = deviceIcon(device.device_name);
                        return (
                            <div
                                key={device.id}
                                className="flex items-center justify-between p-3 rounded-[14px] bg-systemGray-6 dark:bg-white/5 border border-[--color-separator] dark:border-white/8"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="rounded-full bg-ios-blue/12 flex items-center justify-center shrink-0 w-9 h-9">
                                        <Icon className="w-[18px] h-[18px] text-ios-blue" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-semibold text-[14px] text-[--color-label-primary] dark:text-white truncate">
                                            {device.device_name}
                                        </div>
                                        <div className="text-[12px] text-[--color-label-secondary] dark:text-[#aeaeb2] truncate">
                                            Añadido {formatDate(device.created_at)}
                                            {device.last_used_at && ` · Usado ${formatDate(device.last_used_at)}`}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(device.id, device.device_name)}
                                    className="bg-transparent border-none cursor-pointer text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors w-8 h-8 rounded-full flex items-center justify-center shrink-0 ml-2"
                                    title="Eliminar dispositivo"
                                    aria-label={`Eliminar ${device.device_name}`}
                                >
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-5 px-3 rounded-[14px] bg-systemGray-6 dark:bg-white/3 border border-[--color-separator] dark:border-white/8">
                    <ShieldOff className="w-7 h-7 text-[--color-label-tertiary] mx-auto mb-2" aria-hidden="true" />
                    <p className="text-[14px] font-medium text-[--color-label-primary] dark:text-white mb-1">
                        {supported ? 'Sin dispositivos registrados' : 'No compatible'}
                    </p>
                    <p className="text-[12px] text-[--color-label-secondary] dark:text-[#aeaeb2]">
                        {supported
                            ? 'Pulsa "Añadir" para registrar tu Face ID o huella dactilar.'
                            : 'Tu dispositivo no soporta autenticación biométrica.'}
                    </p>
                </div>
            )}
        </div>
    );
}
