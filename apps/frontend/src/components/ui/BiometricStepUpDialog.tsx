'use client';

import { m, AnimatePresence } from 'framer-motion';
import { ScanFace, Loader2, AlertCircle, X } from 'lucide-react';
import { springSoft } from '@/lib/motion';
import type { StepUpState } from '@/lib/useBiometricStepUp';

interface BiometricStepUpDialogProps {
    state: StepUpState;
    onClose: () => void;
    title?: string;
    description?: string;
}

export default function BiometricStepUpDialog({
    state,
    onClose,
    title = 'Confirma tu identidad',
    description = 'Esta acción requiere verificación biométrica. Sigue las instrucciones de tu dispositivo.',
}: BiometricStepUpDialogProps) {
    return (
        <AnimatePresence>
            {state.open && (
                <m.div
                    className="fixed inset-0 z-[80] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <m.div
                        className="absolute inset-0 bg-black/30 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={state.loading ? undefined : onClose}
                    />
                    <m.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="biometric-step-up-title"
                        className="relative w-full max-w-sm cw-sheet-panel p-6 text-center"
                        initial={{ opacity: 0, scale: 0.94, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 4 }}
                        transition={springSoft}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={state.loading}
                            aria-label="Cerrar"
                            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-systemGray-6 dark:bg-white/8 text-[--color-label-secondary] hover:bg-systemGray-5 dark:hover:bg-white/12 cursor-pointer border-none disabled:opacity-50"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div
                            className={
                                'mx-auto mt-2 mb-5 w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ' +
                                (state.error
                                    ? 'bg-[#FF3B30]/12'
                                    : state.loading
                                        ? 'bg-ios-blue/12'
                                        : 'bg-ios-blue/12')
                            }
                            style={
                                !state.error && state.loading
                                    ? { boxShadow: '0 0 0 8px rgba(0,122,255,0.06), 0 0 0 16px rgba(0,122,255,0.03)' }
                                    : undefined
                            }
                        >
                            {state.loading ? (
                                <Loader2 className="w-9 h-9 text-ios-blue animate-spin" />
                            ) : state.error ? (
                                <AlertCircle className="w-9 h-9 text-[#FF3B30]" />
                            ) : (
                                <ScanFace className="w-9 h-9 text-ios-blue" />
                            )}
                        </div>

                        <h3
                            id="biometric-step-up-title"
                            className="cw-title-2 text-[--color-label-primary] dark:text-white mb-1.5"
                        >
                            {state.error ? 'No se pudo verificar' : title}
                        </h3>
                        <p className="text-[14px] text-[--color-label-secondary] dark:text-[#aeaeb2] leading-relaxed mb-5">
                            {state.error ?? description}
                        </p>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={state.loading}
                            className="w-full h-11 rounded-[14px] bg-systemGray-6 dark:bg-white/8 hover:bg-systemGray-5 dark:hover:bg-white/12 text-[--color-label-primary] dark:text-white font-medium text-[15px] border-none cursor-pointer transition-colors disabled:opacity-50"
                        >
                            {state.error ? 'Cerrar' : 'Cancelar'}
                        </button>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
