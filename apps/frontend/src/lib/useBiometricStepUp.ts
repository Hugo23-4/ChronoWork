'use client';

import { useCallback, useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import type { PasskeyStepUpResponse } from '@/lib/passkey-types';

export interface StepUpOptions {
    /** Etiqueta corta de la acción a auditar (e.g. 'employee.delete') */
    action?: string;
}

export interface StepUpState {
    open: boolean;
    loading: boolean;
    error: string | null;
}

/**
 * Hook que dispara una verificación biométrica de step-up sobre el
 * usuario actualmente autenticado. Devuelve true si la verificación
 * pasó, false si el usuario canceló o falló.
 *
 * Uso típico:
 *
 *   const { request, state, close } = useBiometricStepUp();
 *   ...
 *   const ok = await request({ action: 'employee.delete' });
 *   if (ok) {
 *     await deleteEmployee();
 *   }
 */
export function useBiometricStepUp() {
    const [state, setState] = useState<StepUpState>({ open: false, loading: false, error: null });

    const request = useCallback(async (opts: StepUpOptions = {}): Promise<boolean> => {
        setState({ open: true, loading: true, error: null });

        try {
            // Comprobación de soporte
            if (typeof window === 'undefined' || !window.PublicKeyCredential) {
                setState({ open: true, loading: false, error: 'Tu navegador no soporta verificación biométrica.' });
                return false;
            }

            const optRes = await fetch('/api/auth/passkey/step-up-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (!optRes.ok) {
                const err = await optRes.json().catch(() => ({}));
                setState({ open: true, loading: false, error: err.error ?? 'No se pudo iniciar la verificación.' });
                return false;
            }

            const options = await optRes.json();
            const assertion = await startAuthentication({ optionsJSON: options });

            const verifyRes = await fetch('/api/auth/passkey/step-up-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: assertion, action: opts.action }),
            });

            const result: PasskeyStepUpResponse = await verifyRes.json();

            if (!verifyRes.ok || !result.verified) {
                setState({ open: true, loading: false, error: result.error ?? 'Verificación rechazada.' });
                return false;
            }

            setState({ open: false, loading: false, error: null });
            return true;
        } catch (err: unknown) {
            const name = err instanceof Error ? err.name : '';
            if (name === 'NotAllowedError' || name === 'AbortError') {
                setState({ open: false, loading: false, error: null });
                return false;
            }
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setState({ open: true, loading: false, error: message });
            return false;
        }
    }, []);

    const close = useCallback(() => {
        setState({ open: false, loading: false, error: null });
    }, []);

    return { request, close, state };
}
