'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLogProps {
  id: number;
  timestamp: string;
  fechaCorta: string;
  tipo: 'entrada' | 'modificacion' | 'error';
  titulo: string;
  detalle: { label: string; valorAntiguo?: string; valorNuevo: string; };
  actor: string;
  hash: string;
  estado: string;
}

export default function AuditCard({ data }: { data: AuditLogProps }) {
  const cardStyle = {
    modificacion: 'border-amber-400 border-2 bg-amber-500/10',
    error: 'border-red-400/25 bg-red-500/10',
    entrada: 'border-0 shadow-sm bg-white',
  }[data.tipo];

  const titleColor = {
    modificacion: 'text-amber-600',
    error: 'text-red-500',
    entrada: 'text-emerald-500',
  }[data.tipo];

  return (
    <div className={cn('mb-3 p-3 rounded-2xl border', cardStyle)}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span className={cn('text-[0.7rem] font-bold uppercase', titleColor)}>
          {data.tipo === 'modificacion' ? 'MODIFICACIÓN MANUAL' : data.tipo === 'error' ? 'INTENTO FALLIDO' : 'ENTRADA REGISTRADA'}
        </span>
        <small className="text-slate-400 font-mono">{data.fechaCorta}</small>
      </div>

      <h5 className="font-bold mb-2 text-navy">{data.titulo}</h5>

      <div className="mb-3">
        {data.detalle.valorAntiguo && (
          <span className="line-through text-red-500 mr-2 opacity-75">
            {data.detalle.label} {data.detalle.valorAntiguo}
          </span>
        )}
        <span className="font-bold text-navy inline-flex items-center gap-1">
          {data.detalle.valorAntiguo && <ArrowRight className="w-4 h-4 text-slate-400" />}
          {!data.detalle.valorAntiguo && data.detalle.label + ' '}
          {data.detalle.valorNuevo}
        </span>
      </div>

      <hr className="opacity-25 my-2" />

      {/* Footer */}
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-2">
          <div className={cn('rounded-full w-2.5 h-2.5', data.tipo === 'modificacion' ? 'bg-red-500' : 'bg-chrono-blue')} />
          <small className="font-bold text-navy">{data.actor}</small>
        </div>
        <small className="font-mono text-amber-600 text-[0.7rem]">Hash: {data.hash.substring(0, 10)}...</small>
      </div>
    </div>
  );
}