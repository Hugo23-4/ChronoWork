import Link from 'next/link';
import { Clock, Shield, MapPin, BarChart3, Fingerprint, Zap } from 'lucide-react';

const features = [
  {
    icon: Clock,
    title: 'Fichaje Inteligente',
    description: 'Control de jornada con precisión milimétrica. Tu equipo ficha en un clic con validación geográfica.',
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    icon: Shield,
    title: 'Integridad del Dato',
    description: 'Cada registro es inmutable. Cumplimiento legal garantizado bajo la normativa española vigente.',
    gradient: 'from-emerald-500 to-teal-400',
  },
  {
    icon: MapPin,
    title: 'Geolocalización',
    description: 'Geovallas configurables por sede. Verifica que los fichajes se realizan desde la ubicación correcta.',
    gradient: 'from-violet-500 to-purple-400',
  },
  {
    icon: BarChart3,
    title: 'Analítica en Tiempo Real',
    description: 'Dashboard con métricas clave: activos, retrasos, horas semanales y tendencias del equipo.',
    gradient: 'from-orange-500 to-amber-400',
  },
  {
    icon: Fingerprint,
    title: 'Autenticación Biométrica',
    description: 'Face ID, Touch ID y Windows Hello. Acceso seguro sin contraseñas, sin fricción.',
    gradient: 'from-pink-500 to-rose-400',
  },
  {
    icon: Zap,
    title: 'Velocidad Vercel',
    description: 'Desplegado en el edge. Tiempo de carga inferior a 1 segundo, en cualquier dispositivo.',
    gradient: 'from-yellow-500 to-orange-400',
  },
];

const stats = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<1s', label: 'Carga' },
  { value: '256-bit', label: 'Cifrado' },
  { value: '100%', label: 'Normativa' },
];

export default function LandingPage() {
  return (
    <main className="bg-navy text-white min-h-screen overflow-hidden">

      {/* ═══════════════════════════════════════════════════════════════════
          NAVBAR
      ═══════════════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Clock className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="font-[family-name:var(--font-jakarta)] font-bold text-lg tracking-tight">
              ChronoWork
            </span>
          </div>

          {/* CTA */}
          <Link
            href="/login"
            className="no-underline bg-white text-navy px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-100 transition-all hover:shadow-lg hover:shadow-white/10 hover:-translate-y-px"
          >
            Acceder
          </Link>
        </div>
        {/* Gradient border */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-80 h-80 rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute top-[30%] right-[15%] w-64 h-64 rounded-full bg-violet-600/15 blur-[100px]" />
          <div className="absolute bottom-0 left-[40%] w-72 h-72 rounded-full bg-cyan-500/10 blur-[100px]" />
        </div>

        {/* Grid overlay */}
        <div className="login-grid-lines" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm mb-8 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-white/60 font-medium">
              Sistema activo — v4.0 Tailwind Edition
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-[family-name:var(--font-jakarta)] text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-[-0.04em] leading-[1.05] mb-6 animate-fade-up">
            Cada segundo
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
              cuenta.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: '0.1s' }}>
            La plataforma de registro de jornada diseñada para garantizar la{' '}
            <strong className="text-white/70">integridad del dato</strong>, la transparencia
            y el cumplimiento legal de tu empresa.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Link
              href="/login"
              className="no-underline group flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-full text-base font-bold shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
            >
              Comenzar Fichaje
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <button className="flex items-center gap-2 text-white/60 hover:text-white/90 px-6 py-4 rounded-full text-base font-medium transition-colors bg-transparent border border-white/10 hover:border-white/20 cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Saber más
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-y border-white/[0.06] py-8 md:py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-jakarta)] tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-white/40 mt-1 font-medium uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">
              Funcionalidades
            </span>
            <h2 className="font-[family-name:var(--font-jakarta)] text-3xl md:text-5xl font-bold tracking-tight">
              Todo lo que
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"> necesitas</span>
            </h2>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 md:p-7 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 cursor-default"
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <h3 className="font-bold text-lg mb-2 font-[family-name:var(--font-jakarta)] tracking-tight text-white/90">
                    {feature.title}
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />

          <h2 className="font-[family-name:var(--font-jakarta)] text-3xl md:text-5xl font-bold tracking-tight mb-6 relative z-10">
            ¿Preparado para<br />
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              modernizar tu empresa?
            </span>
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto relative z-10">
            Empieza a controlar la jornada de tu equipo de forma segura,
            transparente y conforme a la ley.
          </p>
          <Link
            href="/login"
            className="no-underline relative z-10 inline-flex items-center gap-2 bg-white text-navy px-8 py-4 rounded-full text-base font-bold hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/10 transition-all"
          >
            Empezar Ahora
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white/60">ChronoWork</span>
          </div>
          <p className="text-xs text-white/30">
            © 2026 LOOM S.L. · Extremadura · ISO 27001  · Todos los derechos reservados
          </p>
        </div>
      </footer>

    </main>
  );
}