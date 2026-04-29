'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Segmented control iOS-style para alternar tema light / dark / system.
 * Apto para sidebar desktop. En mobile se usa ProfileDrawer.
 */
export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const options = [
        { id: 'light', Icon: Sun, label: 'Claro' },
        { id: 'dark', Icon: Moon, label: 'Oscuro' },
        { id: 'system', Icon: Monitor, label: 'Auto' },
    ] as const;

    return (
        <div className="cw-segmented w-full" role="group" aria-label="Tema">
            {options.map(({ id, Icon, label }) => {
                const active = mounted ? theme === id : id === 'system';
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTheme(id)}
                        data-active={active}
                        aria-pressed={active}
                        className={cn('cw-segmented-item flex-1 flex items-center justify-center gap-1', compact && 'py-1.5 px-2')}
                        title={label}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {!compact && <span>{label}</span>}
                    </button>
                );
            })}
        </div>
    );
}
