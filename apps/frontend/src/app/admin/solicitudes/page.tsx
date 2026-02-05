'use client';

import AdminRequestsManager from '@/components/admin/AdminRequestsManager';

export default function AdminSolicitudesPage() {
    return (
        <>
            <div className="mb-4">
                <h2 className="fw-bold text-dark mb-1">Gestión de Solicitudes</h2>
                <p className="text-secondary">Aprueba o rechaza las solicitudes del equipo</p>
            </div>

            <AdminRequestsManager />
        </>
    );
}
