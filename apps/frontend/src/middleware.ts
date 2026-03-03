import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware mínimo — no protege rutas en el edge.
 *
 * Por qué: el supabase client del proyecto usa localStorage para la sesión
 * (createClient estándar del browser). El middleware corre en Edge Runtime
 * y no puede leer localStorage. Bloquear rutas aquí significa que nadie
 * autenticado podría entrar jamás.
 *
 * La protección real la hacen los layouts de cada sección:
 *  - /admin/layout.tsx  → useAuth + role check
 *  - /dashboard/layout.tsx → useAuth + redirect
 *  - /inspector/layout.tsx → session timer + role check
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

// Solo ejecutar en rutas que realmente lo necesitan en el futuro
export const config = {
  matcher: [],
};
