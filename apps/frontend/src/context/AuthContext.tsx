'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Interfaz tipada con los campos reales de la tabla empleados_info
interface EmpleadoProfile {
  id: string;
  nombre_completo: string;
  email: string;
  rol: 'admin' | 'empleado' | 'inspector';
  rol_id: number;
  empresa_id?: string;
  dni?: string;
  telefono?: string;
  puesto?: string;
  departamento?: string;
  sede_id?: string;
  activo?: boolean;
  roles?: { nombre: string };
  empresas?: { nombre: string };
}

// Definimos la forma de nuestro estado global
interface AuthContextType {
  user: User | null;
  profile: EmpleadoProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<EmpleadoProfile | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on mount with the current session (or null),
    // then SIGNED_IN / SIGNED_OUT on subsequent changes. Using it as the single source of
    // truth avoids the double fetchProfile that happened when getSession() + onAuthStateChange
    // both triggered fetchProfile on the same login.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        setLoading(false);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función para traer los datos extendidos del empleado (Rol e Integridad)
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('empleados_info')
      .select('*, roles(nombre), empresas(nombre)')
      .eq('id', userId)
      .single();

    if (!error) setProfile(data);
  };

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, signOut }),
    [user, profile, loading, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácilmente en cualquier componente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};