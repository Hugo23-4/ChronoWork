'use client';

import AuditCard from '@/components/AuditCard';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const auditLogs = [
  { id: 1, timestamp: '2026-10-26 08:00:05', fechaCorta: '26 Oct • 08:00', tipo: 'entrada' as const, titulo: 'Hugo Pérez', detalle: { label: 'Loc:', valorNuevo: '38.91, -6.34 (Valid)' }, actor: 'Hugo Pérez', hash: '0x7f8a...9c21', estado: 'VERIFICADO' },
  { id: 2, timestamp: '2026-10-25 19:42:10', fechaCorta: '25 Oct • 19:42', tipo: 'modificacion' as const, titulo: 'Corrección de Hora', detalle: { label: 'Salida:', valorAntiguo: '--:--', valorNuevo: '16:00' }, actor: 'Admin (RRHH)', hash: '0x3b1d...a8f4', estado: 'INTERVENIDO' },
  { id: 3, timestamp: '2026-10-25 08:05:00', fechaCorta: '25 Oct • 08:05', tipo: 'error' as const, titulo: 'Ana Martínez', detalle: { label: 'Error:', valorNuevo: 'Fuera de rango (5km)' }, actor: 'Ana Martínez', hash: '0xe2a1...00f1', estado: 'RECHAZADO' },
];

const statusBadge = (tipo: string) => {
  if (tipo === 'entrada') return 'bg-emerald-50 text-emerald-600';
  if (tipo === 'modificacion') return 'bg-amber-50 text-amber-600';
  return 'bg-red-50 text-red-500';
};

export default function AuditoriaPage() {
  return (
    <div className="animate-fade-up pb-6">
      {/* Security banner */}
      <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 text-sm flex items-center gap-3 shadow-sm mb-4" role="alert">
        <Lock className="w-5 h-5 shrink-0" />
        <div>
          <strong className="block uppercase text-xs tracking-widest">Modo Auditoría: Solo Lectura</strong>
          <small className="opacity-75">Los datos mostrados provienen del log inmutable. No pueden ser modificados.</small>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold mb-0 text-navy dark:text-zinc-100 font-[family-name:var(--font-jakarta)]">Registro de Integridad</h2>
        <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border-2 border-navy dark:border-zinc-600 text-navy dark:text-zinc-100 font-semibold text-sm cursor-pointer bg-transparent hover:bg-navy dark:hover:bg-zinc-700 hover:text-white transition-colors">
          <ShieldCheck className="w-4 h-4" /> Verificar Firmas
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-zinc-700/50">
              <tr className="text-slate-400 dark:text-zinc-400 text-[0.7rem] uppercase font-bold tracking-widest">
                <th className="py-3 pl-5 text-left">Timestamp (UTC)</th>
                <th className="py-3 text-left">Acción / Evento</th>
                <th className="py-3 text-left">Actor</th>
                <th className="py-3 text-left">Hash</th>
                <th className="py-3 pr-5 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
              {auditLogs.map(log => (
                <tr key={log.id} className={log.tipo === 'modificacion' ? 'bg-amber-500/5' : ''}>
                  <td className="pl-5 py-3 font-mono text-slate-400 dark:text-zinc-400 text-sm">{log.timestamp}</td>
                  <td className="py-3">
                    <div className="font-bold text-navy dark:text-zinc-100 text-sm">{log.titulo}</div>
                    <small className="text-slate-400 dark:text-zinc-400">
                      {log.detalle.valorAntiguo && <span className="line-through text-red-400 mr-1">{log.detalle.label} {log.detalle.valorAntiguo}</span>}
                      {log.detalle.valorAntiguo && <ArrowRight className="inline w-3 h-3 mx-1 text-slate-400" />}
                      {!log.detalle.valorAntiguo && log.detalle.label + ' '}
                      {log.detalle.valorNuevo}
                    </small>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', log.actor.includes('Admin') ? 'bg-red-500' : 'bg-chrono-blue')} />
                      <span className="text-sm text-navy dark:text-zinc-100">{log.actor}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="font-mono text-sm text-slate-400 dark:text-zinc-400">{log.hash}</span>
                    <div className="h-0.5 mt-1 rounded-full w-[40%]" style={{ background: log.tipo === 'entrada' ? '#10B981' : '#F59E0B' }} />
                  </td>
                  <td className="pr-5 py-3">
                    <span className={cn('rounded-full px-3 py-1 uppercase text-xs font-bold', statusBadge(log.tipo))}>
                      {log.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden mt-3">
        <h6 className="text-slate-400 dark:text-zinc-400 uppercase mb-3 px-1 text-xs font-bold tracking-widest">Últimos Movimientos</h6>
        {auditLogs.map(log => <AuditCard key={log.id} data={log} />)}
      </div>
    </div>
  );
}