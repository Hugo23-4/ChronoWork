'use client';

import { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { springSoft } from '@/lib/motion';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
    duration?: number;
}

const config = {
    success: { iconColor: 'text-[#34C759]', iconBg: 'bg-[#34C759]/12', Icon: CheckCircle2, progress: 'bg-[#34C759]' },
    error: { iconColor: 'text-[#FF3B30]', iconBg: 'bg-[#FF3B30]/12', Icon: XCircle, progress: 'bg-[#FF3B30]' },
    warning: { iconColor: 'text-[#FF9500]', iconBg: 'bg-[#FF9500]/12', Icon: AlertTriangle, progress: 'bg-[#FF9500]' },
    info: { iconColor: 'text-ios-blue', iconBg: 'bg-ios-blue/12', Icon: Info, progress: 'bg-ios-blue' },
};

export default function Toast({ message, type = 'info', onClose, duration = 3500 }: ToastProps) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        timerRef.current = setTimeout(() => setVisible(false), duration);
        return () => clearTimeout(timerRef.current);
    }, [duration]);

    const { iconColor, iconBg, Icon, progress } = config[type];

    return (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-none" role="alert" aria-live="polite">
            <AnimatePresence onExitComplete={onClose}>
                {visible && (
                    <m.div
                        initial={{ opacity: 0, y: -16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={springSoft}
                        className="pointer-events-auto cw-sheet-panel relative flex items-center gap-3 px-4 py-3 pr-3 overflow-hidden"
                        style={{ minWidth: '300px', maxWidth: '380px' }}
                    >
                        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${iconBg}`}>
                            <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
                        </div>
                        <span className="text-[15px] font-medium text-[--color-label-primary] dark:text-white flex-grow leading-snug">
                            {message}
                        </span>
                        <button
                            type="button"
                            onClick={() => setVisible(false)}
                            aria-label="Cerrar notificación"
                            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[--color-label-secondary] hover:bg-systemGray-6 dark:hover:bg-white/5 transition-colors cursor-pointer bg-transparent border-none"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <m.div
                            className={`absolute bottom-0 left-0 h-[2px] ${progress}`}
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: duration / 1000, ease: 'linear' }}
                        />
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
