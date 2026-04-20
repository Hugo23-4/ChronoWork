'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-dvh bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center">
      <p className="text-chrono-blue font-bold uppercase text-xs tracking-widest mb-3">ChronoWork</p>
      <h1 className="text-5xl font-bold text-navy dark:text-zinc-100 font-[family-name:var(--font-jakarta)] mb-3">
        Algo salió mal
      </h1>
      <p className="text-slate-400 dark:text-zinc-400 text-sm max-w-sm mb-2">
        Se produjo un error inesperado. Puedes intentar de nuevo o volver al inicio.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs font-mono text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mb-6 max-w-sm break-all">
          {error.message}
        </p>
      )}
      <div className="flex gap-3 mt-6">
        <button onClick={reset}
          className="bg-navy dark:bg-zinc-700 text-white font-bold px-6 py-3 rounded-full hover:bg-slate-dark dark:hover:bg-zinc-600 transition-colors text-sm border-none cursor-pointer">
          Intentar de nuevo
        </button>
        <a href="/"
          className="bg-gray-100 dark:bg-zinc-800 text-navy dark:text-zinc-100 font-bold px-6 py-3 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm">
          Ir al inicio
        </a>
      </div>
    </div>
  );
}
