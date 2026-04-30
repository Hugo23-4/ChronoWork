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
        // fetchProfile no debe BLOQUEAR el setLoading(false). Si la query
        // tarda (RLS / red), liberamos loading igual y el profile llega
        // cuando llegue (componentes lo consumen reactivamente).
        fetchProfile(session.user.id).catch((e) => console.error('[fetchProfile]', e));
        setLoading(false);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función para traer los datos extendidos del empleado (Rol e Integridad).
  // Wrap con timeout para que un join lento (RLS empresas) no cuelgue indefinido.
  const fetchProfile = async (userId: string) => {
    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('profile timeout 6s') }), 6000)
    );
    const queryPromise = supabase
      .from('empleados_info')
      .select('*, roles(nombre), empresas(nombre)')
      .eq('id', userId)
      .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => ({ data: res.data, error: res.error }));

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
    if (error) {
      console.error('[fetchProfile]', error);
      // Fallback: query mínima sin joins por si RLS empresas/roles bloquea.
      const { data: basic } = await supabase
        .from('empleados_info')
        .select('id, nombre_completo, email, rol, rol_id, empresa_id, dni, telefono, puesto, departamento, sede_id, activo')
        .eq('id', userId)
        .single();
      if (basic) setProfile(basic as EmpleadoProfile);
      return;
    }
    if (data) setProfile(data);
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