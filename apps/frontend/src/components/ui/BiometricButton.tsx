'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { startAuthentication } from '@simplewebauthn/browser';
import { supabase } from '@/lib/supabase';
import type { PasskeyLoginResponse } from '@/lib/passkey-types';
import { AlertTriangle, Loader2, ScanFace } from 'lucide-react';

interface BiometricButtonProps {
    onSuccess?: () => void;
    userId?: string;
    className?: string;
    redirectTo?: string;
}

export default function BiometricButton({ onSuccess, userId, className, redirectTo = '/dashboard' }: BiometricButtonProps) {
    const router = useRouter();
    const [supported, setSupported] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkSupport = async () => {
            if (typeof window !== 'undefined' && window.PublicKeyCredential &&
                typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
                const available = await window.PublicKeyCredential
                    .isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);
                setSupported(available);
            }
        };
        checkSupport();
    }, []);

    if (!supported) return null;

    const handleLogin = async () => {
        setLoading(true); setError(null);
        try {
            const optRes = await fetch('/api/auth/passkey/login-options', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId ?? null }),
            });
            if (!optRes.ok) throw new Error('No se pudieron obtener las opciones de autenticación');
            const options = await optRes.json();
            const assertion = await startAuthentication({ optionsJSON: options });
            const verifyRes = await fetch('/api/auth/passkey/login-verify', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: assertion }),
            });
            const result: PasskeyLoginResponse = await verifyRes.json();
            if (!verifyRes.ok || !result.verified) throw new Error(result.error ?? 'Verificación biométrica fallida');

            if (result.access_token && result.refresh_token) {
                const { error: setErr } = await supabase.auth.setSession({
                    access_token: result.access_token,
                    refresh_token: result.refresh_token,
                });
                if (setErr) throw setErr;
                onSuccess?.();
                router.push(redirectTo);
                return;
            }

            if (result.action_link) {
                window.location.href = result.action_link;
                return;
            }

            throw new Error('Respuesta de sesión inválida');
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'NotAllowedError') {
                setError(null);
            } else {
                const message = err instanceof Error ? err.message : 'Error desconocido';
                setError(message.includes('no credentials') || message.includes('not registered') || message.includes('404')
                    ? 'No hay passkey registrada. Regístrala en tu perfil primero.'
                    : 'No se pudo autenticar. Inténtalo de nuevo.');
            }
        } finally { setLoading(false); }
    };

    return (
        <div className={className}>
            <button type="button" onClick={handleLogin} disabled={loading}
                className="w-full flex items-center justify-center gap-2 font-semibold h-14 px-6 rounded-[20px] bg-ios-blue text-white border-none cursor-pointer transition-transform duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#0066D9] active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
                style={{ boxShadow: '0 4px 14px rgba(0, 122, 255, 0.25)' }}>
                {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Verificando…</>
                ) : (
                    <>
                        <ScanFace className="w-5 h-5" />
                        Entrar con Face ID / Huella
                    </>
                )}
            </button>
            {error && (
                <div className="bg-[#FFF7ED] border border-[#FED7AA] text-[#9A3412] dark:bg-[#3A2A1F] dark:border-[#5C4030] dark:text-[#FBA570] rounded-[14px] px-3 py-2.5 text-sm flex items-center gap-2 mt-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {error}
                </div>
            )}
        </div>
    );
}
