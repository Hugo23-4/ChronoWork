'use client';

import { useState } from 'react';
import ScannerView from '@/components/ScannerView';
import { QrCode, Calendar, FileText, Sheet } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ExportPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [format, setFormat] = useState('pdf');

  return (
    <div className="animate-fade-up pb-6">
      {showScanner && <ScannerView onClose={() => setShowScanner(false)} />}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold mb-0 text-navy dark:text-zinc-100 font-[family-name:var(--font-jakarta)]">Generación de Informes</h2>
        <button onClick={() => setShowScanner(true)}
          className="bg-navy text-white px-4 py-2 rounded-full font-semibold hover:bg-slate-800 transition-colors cursor-pointer border-none flex items-center gap-2 text-sm">
          <QrCode className="w-4 h-4" /> <span className="hidden md:inline">Escanear Físico</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Config */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-4 h-full">
            <h5 className="font-bold mb-4 text-navy dark:text-zinc-100">1. Configurar Parámetros</h5>

            <div className="mb-4">
              <label className="block text-[0.65rem] font-bold text-slate-400 dark:text-zinc-400 mb-2 uppercase tracking-widest">PERIODO A AUDITAR</label>
              <div className="relative">
                <input type="text" className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-gray-50 dark:bg-zinc-700 dark:text-zinc-100 text-sm font-bold outline-none" value="01 Oct 2026 - 31 Oct 2026" readOnly />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[0.65rem] font-bold text-slate-400 dark:text-zinc-400 mb-2 uppercase tracking-widest">TIPO DE REPORTE</label>
              {[
                { value: 'pdf', Icon: FileText, iconColor: 'text-red-500', label: 'Informe Legal Completo', desc: 'Incluye hash de integridad y firmas.' },
                { value: 'csv', Icon: Sheet, iconColor: 'text-emerald-500', label: 'Resumen Ejecutivo', desc: 'Solo totales de horas por empleado.' },
              ].map(opt => (
                <div key={opt.value} onClick={() => setFormat(opt.value)}
                  className={cn('mb-2 rounded-xl cursor-pointer transition-all border-2 p-3 flex items-center gap-3',
                    format === opt.value ? 'border-amber-400 bg-amber-500/10' : 'border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-700/50 hover:border-gray-200')}>
                  <opt.Icon className={cn('w-5 h-5 shrink-0', opt.iconColor)} />
                  <div>
                    <h6 className="font-bold mb-0 text-navy dark:text-zinc-100 text-sm">{opt.label}</h6>
                    <small className="text-slate-400 dark:text-zinc-400">{opt.desc}</small>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl border-none cursor-pointer hover:bg-amber-600 transition-colors shadow-sm mt-auto">
              Generar Informe Oficial
            </button>
          </div>
        </div>

        {/* Right: Preview (desktop only) */}
        <div className="lg:col-span-7 hidden lg:block">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-4 h-full">
            <h5 className="font-bold mb-4 text-navy dark:text-zinc-100">2. Vista Previa del Documento</h5>
            <div className="bg-gray-50 rounded-xl p-8 mx-auto" style={{ maxWidth: '500px', minHeight: '500px' }}>
              <div className="bg-white shadow-md p-6 mx-auto" style={{ transform: 'scale(0.95)' }}>
                <div className="border-b border-gray-200 pb-3 mb-4 text-center">
                  <h4 className="font-bold uppercase mb-1 text-navy">Certificado de Registro</h4>
                  <small className="text-slate-400">Generado por ChronoWork System v1.0 · Ref: AUDIT-2026-X99</small>
                </div>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="text-left py-2 text-navy font-bold">EMPLEADO</th><th className="text-right py-2 text-navy font-bold">HORAS TOTALES</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr><td className="py-2">Hugo Pérez</td><td className="text-right font-bold py-2">168h 30m</td></tr>
                      <tr><td className="py-2">Ana Martínez</td><td className="text-right font-bold py-2">160h 00m</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 pt-5 text-right">
                  <div className="inline-block border-2 border-amber-500 p-3 text-center" style={{ transform: 'rotate(-5deg)', opacity: 0.8 }}>
                    <h6 className="font-bold text-amber-500 mb-1">FIRMADO</h6>
                    <h6 className="font-bold text-amber-500 mb-0">DIGITALMENTE</h6>
                    <small className="text-amber-500 font-mono text-[0.6rem]">Hash: 8f4a...22b1</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}