import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware de autenticación — protege rutas privadas a nivel servidor.
 * Usa @supabase/ssr que es la API oficial para Next.js 14+.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refrescamos la sesión (si hay cookie válida, la renueva automáticamente)
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Rutas que requieren sesión activa
  const isProtectedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/inspector') ||
    pathname.startsWith('/dashboard');

  // Si no hay sesión y la ruta es privada → redirigir a login
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si ya tiene sesión y va al login → redirigir a dashboard
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/inspector/:path*',
    '/dashboard/:path*',
    '/login',
  ],
};
