import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center">
      <p className="text-chrono-blue font-bold uppercase text-xs tracking-widest mb-3">ChronoWork</p>
      <h1 className="text-8xl font-bold text-navy dark:text-zinc-100 font-[family-name:var(--font-jakarta)] mb-2">
        404
      </h1>
      <h2 className="text-xl font-bold text-navy dark:text-zinc-100 mb-3">
        Página no encontrada
      </h2>
      <p className="text-slate-400 dark:text-zinc-400 text-sm max-w-sm mb-8">
        La URL que buscas no existe o fue movida. Comprueba la dirección o vuelve al inicio.
      </p>
      <Link href="/"
        className="bg-navy dark:bg-zinc-700 text-white font-bold px-6 py-3 rounded-full hover:bg-slate-dark dark:hover:bg-zinc-600 transition-colors text-sm">
        Volver al inicio
      </Link>
    </div>
  );
}
