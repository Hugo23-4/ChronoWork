'use client';

import { useState, useEffect } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { supabase } from '@/lib/supabase';

interface BiometricButtonProps {
    onSuccess?: () => void;
    userId?: string; // Si se conoce el user_id, acelera el proceso
    className?: string;
}

/**
 * Botón de autenticación biométrica (Face ID / Huella).
 * Usa WebAuthn API nativa — solo se muestra si el navegador lo soporta.
 */
export default function BiometricButton({ onSuccess, userId, className }: BiometricButtonProps) {
    const [supported, setSupported] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Verificar soporte de WebAuthn en el dispositivo
        const checkSupport = async () => {
            if (
                typeof window !== 'undefined' &&
                window.PublicKeyCredential &&
                typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
            ) {
                const available = await window.PublicKeyCredential
                    .isUserVerifyingPlatformAuthenticatorAvailable()
                    .catch(() => false);
                setSupported(available);
            }
        };
        checkSupport();
    }, []);

    if (!supported) return null; // No mostrar en navegadores/dispositivos sin soporte

    const handleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Pedir opciones de autenticación al servidor
            const optRes = await fetch('/api/auth/passkey/login-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId ?? null }),
            });

            if (!optRes.ok) throw new Error('No se pudieron obtener las opciones de autenticación');
            const options = await optRes.json();

            // 2. Lanzar el diálogo nativo de Face ID / Huella
            const assertion = await startAuthentication({ optionsJSON: options });

            // 3. Verificar en el servidor
            const verifyRes = await fetch('/api/auth/passkey/login-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: assertion }),
            });

            const result = await verifyRes.json();

            if (!verifyRes.ok || !result.verified) {
                throw new Error(result.error ?? 'Verificación biométrica fallida');
            }

            // 4. El servidor confirmó la biometría — iniciar sesión OTP sin contraseña
            if (result.email) {
                await supabase.auth.signInWithOtp({
                    email: result.email,
                    options: { shouldCreateUser: false },
                });
            }

            onSuccess?.();
        } catch (err: unknown) {
            // El usuario canceló el diálogo — no mostramos error
            if (err instanceof Error && err.name === 'NotAllowedError') {
                setError(null);
            } else {
                const message = err instanceof Error ? err.message : 'Error desconocido';
                // Si no hay passkey registrada en este dispositivo, mensaje claro
                if (message.includes('no credentials') || message.includes('not registered') || message.includes('404')) {
                    setError('No hay passkey registrada. Regístrala en tu perfil primero.');
                } else {
                    setError('No se pudo autenticar. Inténtalo de nuevo.');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={className}>
            <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="btn w-full flex items-center justify-center gap-2 font-bold py-3 rounded-lg"
                style={{
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    color: 'white',
                    border: 'none',
                    transition: 'opacity 0.2s ease, transform 0.1s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
                {loading ? (
                    <>
                        <span className="animate-spin animate-spin w-4 h-4" role="status" aria-hidden="true" />
                        Verificando...
                    </>
                ) : (
                    <>
                        {/* Icono Face ID animado */}
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M9 9H9.01M15 9H15.01M9 15C9.83 15.67 10.83 16 12 16C13.17 16 14.17 15.67 15 15" />
                            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                        </svg>
                        Entrar con Face ID / Huella
                    </>
                )}
            </button>

            {error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 text-sm flex items-center gap-2 text-sm py-2 mt-2 rounded-lg mb-0">
                    <i className="bi bi-exclamation-triangle-fill shrink-0" aria-hidden="true"></i>
                    {error}
                </div>
            )}
        </div>
    );
}
