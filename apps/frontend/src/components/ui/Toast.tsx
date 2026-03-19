'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
    duration?: number;
}

const config = {
    success: { bg: 'bg-emerald-500', Icon: CheckCircle2 },
    error: { bg: 'bg-red-500', Icon: XCircle },
    warning: { bg: 'bg-amber-500', Icon: AlertTriangle },
    info: { bg: 'bg-navy', Icon: Info },
};

export default function Toast({ message, type = 'info', onClose, duration = 3500 }: ToastProps) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        timerRef.current = setTimeout(onClose, duration);
        return () => clearTimeout(timerRef.current);
    }, [onClose, duration]);

    const { bg, Icon } = config[type];

    return (
        <div className="fixed bottom-4 right-4 z-[9999]" role="alert" aria-live="polite">
            <div className={`flex items-center gap-3 text-white rounded-2xl shadow-xl px-4 py-3 ${bg}`}
                style={{ minWidth: '280px' }}>
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="font-bold flex-grow text-sm">{message}</span>
                <button type="button" onClick={onClose} aria-label="Cerrar notificación"
                    className="text-white/70 hover:text-white cursor-pointer bg-transparent border-none p-0 flex items-center">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
