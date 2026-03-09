'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function RoleSelectionPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hoveredCard, setHoveredCard] = useState<'admin' | 'personal' | null>(null);

    useEffect(() => {
        checkRole();
    }, [user]);

    const checkRole = async () => {
        if (!user) { router.push('/login'); return; }

        const { data } = await supabase
            .from('empleados_info')
            .select('rol, rol_id')
            .eq('id', user.id)
            .single();

        if (data?.rol === 'admin' || data?.rol_id === 2) {
            setIsAdmin(true);
            setLoading(false);
        } else {
            localStorage.setItem('chronowork_view_mode', 'personal');
            router.push('/dashboard');
        }
    };

    const handleSelection = (mode: 'admin' | 'personal') => {
        localStorage.setItem('chronowork_view_mode', mode);
        router.push(mode === 'admin' ? '/admin' : '/dashboard');
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
                <div className="spinner-border" style={{ color: '#3B82F6', width: 40, height: 40 }} />
            </div>
        );
    }

    if (!isAdmin) return null;

    const cards = [
        {
            id: 'admin' as const,
            icon: 'bi-shield-fill',
            label: 'Panel Admin',
            title: 'Gestión Administrativa',
            desc: 'Gestiona empleados, aprueba solicitudes, supervisa fichajes y configura el sistema.',
            features: ['Todos los fichajes del equipo', 'Aprobar solicitudes de vacaciones', 'Gestionar empleados y centros', 'Exportar reportes'],
            gradient: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            shadowColor: 'rgba(37,99,235,0.35)',
            accentColor: '#3B82F6',
            btnLabel: 'Entrar como Admin',
        },
        {
            id: 'personal' as const,
            icon: 'bi-person-fill',
            label: 'Vista Empleado',
            title: 'Mi Espacio Personal',
            desc: 'Consulta tus fichajes, gestiona tus solicitudes y accede a tu perfil personal.',
            features: ['Mis fichajes y horarios', 'Solicitar vacaciones o bajas', 'Mi perfil y contrato', 'Acceso biométrico'],
            gradient: 'linear-gradient(135deg, #059669, #047857)',
            shadowColor: 'rgba(5,150,105,0.3)',
            accentColor: '#10B981',
            btnLabel: 'Entrar como Empleado',
        },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0F172A',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Orbs de fondo */}
            <div style={{
                position: 'absolute', top: '-100px', left: '-100px',
                width: 400, height: 400, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-80px', right: '-80px',
                width: 320, height: 320, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Grid de fondo */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                pointerEvents: 'none',
            }} />

            {/* Header */}
            <div className="text-center mb-5 anim-fade-up" style={{ position: 'relative', zIndex: 1 }}>
                {/* Logo */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                    marginBottom: '1.25rem',
                }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                </div>
                <h1 style={{
                    color: 'white',
                    fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
                    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    marginBottom: '0.5rem',
                }}>
                    ¿Cómo accedes hoy?
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem', marginBottom: 0 }}>
                    Selecciona el modo de acceso para continuar
                </p>
            </div>

            {/* Cards */}
            <div style={{
                display: 'flex', gap: '1.25rem', flexWrap: 'wrap',
                justifyContent: 'center', width: '100%', maxWidth: 840,
                position: 'relative', zIndex: 1,
            }}>
                {cards.map((card, idx) => (
                    <div
                        key={card.id}
                        onClick={() => handleSelection(card.id)}
                        onMouseEnter={() => setHoveredCard(card.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className={`anim-fade-up anim-delay-${idx + 1}`}
                        style={{
                            flex: '1 1 320px', maxWidth: 400, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(20px)',
                            border: hoveredCard === card.id
                                ? `1.5px solid ${card.accentColor}50`
                                : '1.5px solid rgba(255,255,255,0.08)',
                            borderRadius: 24, padding: '2rem',
                            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                            transform: hoveredCard === card.id ? 'translateY(-4px)' : 'translateY(0)',
                            boxShadow: hoveredCard === card.id
                                ? `0 24px 50px ${card.shadowColor}, 0 0 0 1px ${card.accentColor}20`
                                : '0 8px 24px rgba(0,0,0,0.2)',
                        }}
                    >
                        {/* Icono */}
                        <div style={{
                            width: 64, height: 64, borderRadius: 18,
                            background: card.gradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 8px 20px ${card.shadowColor}`,
                            marginBottom: '1.25rem',
                        }}>
                            <i className={`bi ${card.icon}`} style={{ fontSize: '1.75rem', color: 'white' }} />
                        </div>

                        {/* Badge */}
                        <div style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                            background: `${card.accentColor}20`,
                            border: `1px solid ${card.accentColor}40`,
                            color: card.accentColor, fontSize: '0.7rem', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            marginBottom: '0.75rem',
                        }}>
                            {card.label}
                        </div>

                        <h3 style={{
                            color: 'white',
                            fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
                            fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em',
                            marginBottom: '0.625rem',
                        }}>
                            {card.title}
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                            {card.desc}
                        </p>

                        {/* Features */}
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem' }}>
                            {card.features.map((f) => (
                                <li key={f} style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    color: 'rgba(255,255,255,0.55)', fontSize: '0.8125rem',
                                    marginBottom: 8,
                                }}>
                                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${card.accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <i className="bi bi-check" style={{ fontSize: '0.6rem', color: card.accentColor, fontWeight: 700 }} />
                                    </div>
                                    {f}
                                </li>
                            ))}
                        </ul>

                        {/* CTA Button */}
                        <div style={{
                            width: '100%', padding: '12px 20px', borderRadius: 12,
                            background: hoveredCard === card.id ? card.gradient : 'rgba(255,255,255,0.08)',
                            color: 'white', fontWeight: 700, fontSize: '0.9rem',
                            textAlign: 'center', letterSpacing: '-0.01em',
                            transition: 'all 0.2s',
                            border: hoveredCard === card.id ? 'none' : '1px solid rgba(255,255,255,0.12)',
                            boxShadow: hoveredCard === card.id ? `0 4px 16px ${card.shadowColor}` : 'none',
                        }}>
                            {card.btnLabel}
                            <i className="bi bi-arrow-right ms-2" />
                        </div>
                    </div>
                ))}
            </div>

            <p className="anim-fade-up anim-delay-3 mt-4" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', position: 'relative', zIndex: 1 }}>
                Puedes cambiar de modo en cualquier momento desde el panel
            </p>
        </div>
    );
}
