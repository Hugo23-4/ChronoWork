'use client';

import { useAuth } from '@/context/AuthContext';

export default function AdminMobileHeader() {
    const { profile } = useAuth();

    // Obtener iniciales del nombre
    const getInitials = () => {
        if (!profile?.nombre_completo) return 'AD';
        const parts = profile.nombre_completo.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    };

    return (
        <div className="d-lg-none bg-dark text-white px-3 py-3 mb-4 rounded-bottom-4 shadow-sm"
            style={{ marginLeft: '-1rem', marginRight: '-1rem', marginTop: '-1rem' }}>
            <div className="d-flex justify-content-between align-items-center">
                {/* Logo + Badge */}
                <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold fs-5">ChronoWork</span>
                    <span className="badge bg-primary px-2 py-1 rounded-pill" style={{ fontSize: '10px' }}>
                        ADMIN
                    </span>
                </div>

                {/* Avatar */}
                <div
                    className="rounded-circle bg-warning d-flex align-items-center justify-content-center text-dark fw-bold"
                    style={{ width: '36px', height: '36px', fontSize: '13px' }}
                >
                    {getInitials()}
                </div>
            </div>
        </div>
    );
}
