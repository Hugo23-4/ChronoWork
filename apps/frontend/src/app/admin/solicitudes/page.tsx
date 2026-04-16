'use client';

import AdminRequestsManager from '@/components/admin/AdminRequestsManager';

export default function AdminSolicitudesPage() {
    return (
        <div className="animate-fade-up">
            <div className="mb-5">
                <p className="text-chrono-blue font-bold uppercase text-xs mb-1 tracking-widest">Admin</p>
                <h2 className="font-bold text-navy dark:text-zinc-100 text-2xl font-[family-name:var(--font-jakarta)]">Gestión de Solicitudes</h2>
                <p className="text-slate-400 dark:text-zinc-500 text-sm mt-1">Aprueba o rechaza las solicitudes del equipo</p>
            </div>

            <AdminRequestsManager />
        </div>
    );
}
