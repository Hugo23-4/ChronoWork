'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryCardProps {
  date: string;
  fullDate: string;
  entryTime: string;
  exitTime: string;
  location: string;
  duration: string;
  status: 'valid' | 'progress' | 'incident';
}

const styleMap = {
  progress: { card: 'border-chrono-blue border-2 shadow-sm bg-chrono-blue/10', badge: 'bg-chrono-blue text-white', text: 'EN CURSO' },
  incident: { card: 'border-red-400/25 bg-red-500/10', badge: 'bg-red-500/10 text-red-500', text: 'OLVIDO' },
  valid: { card: 'border-0 shadow-sm bg-white', badge: 'bg-emerald-500/10 text-emerald-500', text: 'VÁLIDO' },
};

export default function HistoryCard({ data }: { data: HistoryCardProps }) {
  const styles = styleMap[data.status];
  const today = new Date().toDateString();
  const cardDate = new Date(data.fullDate).toDateString();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);

  const dayLabel = cardDate === today ? 'Hoy'
    : cardDate === yesterday.toDateString() ? 'Ayer'
    : data.date.split(',')[0];

  return (
    <div className={cn('mb-3 p-3 rounded-2xl border', styles.card)}>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h5 className="font-bold mb-0 text-navy">{dayLabel}</h5>
          <small className="text-slate-500">{data.date}</small>
        </div>
        <span className={cn('rounded-full px-3 py-1 font-bold text-xs', styles.badge)}>{styles.text}</span>
      </div>

      {/* Body */}
      <div className="flex justify-between items-end mt-2">
        <div>
          <p className="mb-0 text-slate-500 text-sm">Entrada: {data.entryTime} · {data.location}</p>
          {data.status === 'incident' && (
            <small className="text-red-500 font-bold flex items-center gap-1 mt-2">
              <AlertTriangle className="w-3.5 h-3.5" /> No se registró salida
            </small>
          )}
        </div>
        <span className={cn('text-2xl font-bold', data.status === 'incident' ? 'text-red-500' : 'text-navy')}>
          {data.duration}
        </span>
      </div>
    </div>
  );
}