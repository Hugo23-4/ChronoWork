import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware de autenticación simplificado — solo protege rutas privadas.
 * No usa @supabase/ssr para evitar problemas con cookies en distintos entornos.
 * La protección real la hacen los propios layouts (useAuth + redirect).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Leer la cookie de sesión de Supabase (nombre estándar)
  const supabaseCookie = request.cookies.getAll().find(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );

  const hasSession = !!supabaseCookie?.value;

  // Rutas protegidas
  const isProtectedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/inspector') ||
    pathname.startsWith('/dashboard');

  // Sin sesión y ruta privada → login
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Con sesión y va al login → dashboard
  if (hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/inspector/:path*',
    '/dashboard/:path*',
    '/login',
  ],
};
