'use client';

import { useEffect, useRef } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
    duration?: number;
}

/**
 * Componente Toast reutilizable.
 * Reemplaza los alert() nativos con notificaciones no bloqueantes.
 * 
 * Uso:
 *   const [toast, setToast] = useState<{ message: string; type?: ToastType } | null>(null);
 *   {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
 */
export default function Toast({ message, type = 'info', onClose, duration = 3500 }: ToastProps) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        timerRef.current = setTimeout(onClose, duration);
        return () => clearTimeout(timerRef.current);
    }, [onClose, duration]);

    const config = {
        success: { bg: 'bg-emerald-500', icon: 'bi-check-circle-fill' },
        error: { bg: 'bg-red-500', icon: 'bi-x-circle-fill' },
        warning: { bg: 'bg-amber-500 text-navy', icon: 'bi-exclamation-triangle-fill' },
        info: { bg: 'bg-navy', icon: 'bi-info-circle-fill' },
    };

    const { bg, icon } = config[type];

    return (
        <div
            className="fixed bottom-0 right-0 p-3"
            style={{ zIndex: 9999 }}
            role="alert"
            aria-live="polite"
        >
            <div
                className={`toast show flex items-center text-white border-0 rounded-2xl shadow-lg ${bg}`}
                style={{ minWidth: '280px' }}
            >
                <div className="toast-body flex items-center gap-2 font-bold">
                    <i className={`bi ${icon} shrink-0`} aria-hidden="true"></i>
                    <span>{message}</span>
                </div>
                <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none text-xl btn-close-white mr-2 ml-auto shrink-0"
                    onClick={onClose}
                    aria-label="Cerrar notificación"
                ></button>
            </div>
        </div>
    );
}
