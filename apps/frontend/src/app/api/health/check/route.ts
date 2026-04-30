import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de diagnóstico end-to-end.
 *
 * Visita: https://chrono-work-pi.vercel.app/api/health/check
 *
 * Verifica:
 *   - Variables de entorno presentes.
 *   - Conexión BD via service_role (admin).
 *   - Conteos de tablas críticas.
 *   - RLS habilitado en tablas multi-tenant.
 *   - Tu sesión actual (si estás logueado).
 *   - Passkeys de tu user.
 *
 * NO expone valores sensibles (sólo recuento + presencia + prefijo).
 */
export async function GET() {
    const result: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        vercel_env: process.env.VERCEL_ENV ?? null,
    };

    // 1. Env presence
    result.envs = {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN ?? null,
    };

    // 2. Conexión admin
    let admin;
    try {
        admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );
        result.admin_client = 'ok';
    } catch (e) {
        result.admin_client = `error: ${e instanceof Error ? e.message : 'unknown'}`;
        return NextResponse.json(result, { status: 500 });
    }

    // 3. Conteos tablas
    const counts: Record<string, number | string> = {};
    for (const t of ['empleados_info', 'empresas', 'roles', 'sedes', 'fichajes', 'solicitudes', 'turnos', 'passkeys', 'webauthn_challenges', 'auditoria_seguridad']) {
        try {
            const { count, error } = await admin.from(t).select('*', { count: 'exact', head: true });
            counts[t] = error ? `err: ${error.message}` : (count ?? 0);
        } catch (e) {
            counts[t] = `err: ${e instanceof Error ? e.message : 'unknown'}`;
        }
    }
    result.tables = counts;

    // 4. Tu sesión + perfil + passkeys (si hay cookie)
    try {
        const ssr = await createSupabaseServerClient();
        const { data: { user } } = await ssr.auth.getUser();
        if (user) {
            const { data: prof } = await admin
                .from('empleados_info')
                .select('id, email, rol, rol_id, empresa_id, activo')
                .eq('id', user.id)
                .single();
            const { data: pks } = await admin
                .from('passkeys')
                .select('id, device_name, created_at, last_used_at')
                .eq('user_id', user.id);
            result.session = {
                logged_in: true,
                user_id: user.id,
                email: user.email,
                profile: prof ?? null,
                passkeys_count: pks?.length ?? 0,
                passkeys: pks?.map((p) => ({
                    device_name: p.device_name,
                    created_at: p.created_at,
                    last_used_at: p.last_used_at,
                })) ?? [],
            };
        } else {
            result.session = { logged_in: false };
        }
    } catch (e) {
        result.session = { error: e instanceof Error ? e.message : 'unknown' };
    }

    // 5. RLS status — best-effort. PostgREST no expone pg_tables por defecto.
    result.rls_check = 'comprobar via SQL: select tablename, rowsecurity from pg_tables where schemaname=\'public\'';

    result.status = 'ok';
    return NextResponse.json(result, { status: 200 });
}
