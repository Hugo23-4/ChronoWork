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
        success: { bg: 'bg-success', icon: 'bi-check-circle-fill' },
        error: { bg: 'bg-danger', icon: 'bi-x-circle-fill' },
        warning: { bg: 'bg-warning text-dark', icon: 'bi-exclamation-triangle-fill' },
        info: { bg: 'bg-dark', icon: 'bi-info-circle-fill' },
    };

    const { bg, icon } = config[type];

    return (
        <div
            className="position-fixed bottom-0 end-0 p-3"
            style={{ zIndex: 9999 }}
            role="alert"
            aria-live="polite"
        >
            <div
                className={`toast show d-flex align-items-center text-white border-0 rounded-4 shadow-lg ${bg}`}
                style={{ minWidth: '280px' }}
            >
                <div className="toast-body d-flex align-items-center gap-2 fw-bold">
                    <i className={`bi ${icon} flex-shrink-0`} aria-hidden="true"></i>
                    <span>{message}</span>
                </div>
                <button
                    type="button"
                    className="btn-close btn-close-white me-2 ms-auto flex-shrink-0"
                    onClick={onClose}
                    aria-label="Cerrar notificación"
                ></button>
            </div>
        </div>
    );
}
