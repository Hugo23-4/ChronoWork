'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type ViewMode = 'admin' | 'personal';

interface ViewModeContextType {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    isAdminMode: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
    const [viewMode, setViewModeState] = useState<ViewMode>('admin');
    const [isInitialized, setIsInitialized] = useState(false);

    // Cargar desde localStorage solo en cliente
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('chronowork_view_mode');
            if (stored === 'admin' || stored === 'personal') {
                setViewModeState(stored);
            }
            setIsInitialized(true);
        }
    }, []);

    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('chronowork_view_mode', mode);
        }
    };

    // No renderizar hasta que esté inicializado para evitar flash
    if (!isInitialized) {
        return null;
    }

    return (
        <ViewModeContext.Provider value={{
            viewMode,
            setViewMode,
            isAdminMode: viewMode === 'admin'
        }}>
            {children}
        </ViewModeContext.Provider>
    );
}

export function useViewMode() {
    const context = useContext(ViewModeContext);
    if (!context) {
        throw new Error('useViewMode must be used within ViewModeProvider');
    }
    return context;
}
