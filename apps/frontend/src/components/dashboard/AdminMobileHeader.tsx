'use client';

import { useAuth } from '@/context/AuthContext';

export default function AdminMobileHeader() {
    const { profile } = useAuth();

    const getInitials = () => {
        if (!profile?.nombre_completo) return 'AD';
        const parts = profile.nombre_completo.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    };

    return (
        <div
            className="lg:hidden bg-navy text-white px-3 py-3 mb-4 rounded-b-2xl shadow-sm -mx-4 -mt-4"
        >
            <div className="flex justify-between items-center">
                {/* Logo + Badge */}
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg font-[family-name:var(--font-jakarta)]">ChronoWork</span>
                    <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        ADMIN
                    </span>
                </div>

                {/* Avatar */}
                <div
                    className="rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold w-9 h-9 text-[13px]"
                >
                    {getInitials()}
                </div>
            </div>
        </div>
    );
}
