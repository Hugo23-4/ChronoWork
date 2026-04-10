import { NextRequest, NextResponse } from 'next/server';

/**
 * ─── WHY THIS MIDDLEWARE IS INTENTIONALLY EMPTY ───────────────────────────
 *
 * The project uses the standard Supabase browser client (`createClient` from
 * `@supabase/supabase-js`), which stores the session in localStorage.
 * Next.js middleware runs in the Edge Runtime, which has no access to the
 * browser environment or localStorage. Attempting to read the session here
 * would always return null, causing every authenticated user to be redirected
 * to /login on every request.
 *
 * ─── WHERE ROUTE PROTECTION LIVES INSTEAD ─────────────────────────────────
 *
 * Auth guards are enforced at the layout level (client-side), which CAN read
 * the Supabase session because they run in the browser:
 *
 *  - /dashboard/layout.tsx  → useAuth() + redirect to /login if no user
 *  - /admin/layout.tsx      → useAuth() + role check (rol_id === 1)
 *  - /inspector/layout.tsx  → session timer + role check
 *
 * This means there is a brief render of the layout shell before the redirect
 * fires, which is acceptable for an internal tool but not ideal for
 * public-facing apps.
 *
 * ─── HOW TO MIGRATE TO EDGE-LEVEL PROTECTION IN THE FUTURE ───────────────
 *
 * Replace `@supabase/supabase-js` with `@supabase/ssr` (already installed).
 * The SSR package stores the session in cookies instead of localStorage,
 * making it readable in the Edge Runtime. Migration steps:
 *
 *  1. Replace `lib/supabase.ts` with a `createBrowserClient` instance.
 *  2. Add a `lib/supabase-server.ts` with `createServerClient` using
 *     `cookies()` from `next/headers` for Server Components and Server Actions.
 *  3. Implement this middleware using `createServerClient` with
 *     `request/response` cookies to verify the session and redirect
 *     unauthenticated requests to /login at the edge — before any HTML is sent.
 *  4. Remove the client-side guards from layouts (or keep them as a fallback).
 *
 * Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Empty: no routes are intercepted until the SSR migration above is complete.
  matcher: [],
};
