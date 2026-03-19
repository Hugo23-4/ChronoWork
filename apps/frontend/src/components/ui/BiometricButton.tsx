'use client';

import { useState, useEffect } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface BiometricButtonProps {
    onSuccess?: () => void;
    userId?: string;
    className?: string;
}

export default function BiometricButton({ onSuccess, userId, className }: BiometricButtonProps) {
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
            const result = await verifyRes.json();
            if (!verifyRes.ok || !result.verified) throw new Error(result.error ?? 'Verificación biométrica fallida');
            if (result.email) {
                await supabase.auth.signInWithOtp({ email: result.email, options: { shouldCreateUser: false } });
            }
            onSuccess?.();
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
                className="w-full flex items-center justify-center gap-2 font-bold py-3 rounded-lg bg-gradient-to-br from-navy to-slate-700 text-white border-none cursor-pointer transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60">
                {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
                ) : (
                    <>
                        {/* Face ID SVG */}
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M9 9H9.01M15 9H15.01M9 15C9.83 15.67 10.83 16 12 16C13.17 16 14.17 15.67 15 15" />
                            <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
                            <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                        </svg>
                        Entrar con Face ID / Huella
                    </>
                )}
            </button>
            {error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 text-sm flex items-center gap-2 mt-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {error}
                </div>
            )}
        </div>
    );
}
