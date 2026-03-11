'use client';

import { useState } from 'react';
import ScannerView from '@/components/ScannerView';

export default function ExportPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [format, setFormat] = useState('pdf');

  return (
    <div className="fade-in-up pb-6">
      
      {/* Overlay del Escáner (Solo se ve si showScanner es true) */}
      {showScanner && <ScannerView onClose={() => setShowScanner(false)} />}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold mb-0 text-navy">Generación de Informes</h2>
        
        {/* Botón para activar el escáner (Simulación de herramienta) */}
        <button 
            onClick={() => setShowScanner(true)}
            className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none flex items-center gap-2 rounded-full px-3"
        >
            <i className="bi bi-qr-code-scan"></i> <span className="hidden md:inline">Escanear Físico</span>
        </button>
      </div>

      <div className="row gap-4">
        
        {/* COLUMNA IZQ: CONFIGURACIÓN */}
        <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-2xl p-4 h-full">
                <h5 className="font-bold mb-4">1. Configurar Parámetros</h5>
                
                {/* Selector de Periodo */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold text-slate-500">PERIODO A AUDITAR</label>
                    <div className="relative">
                        <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm font-bold bg-gray-50" value="01 Oct 2026 - 31 Oct 2026" readOnly />
                        <span className="input-group-text bg-white"><i className="bi bi-calendar4"></i></span>
                    </div>
                </div>

                {/* Tipo de Reporte */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 text-sm font-bold text-slate-500">TIPO DE REPORTE</label>
                    
                    <div className={`card mb-2 cursor-pointer transition-all border-2 ${format === 'pdf' ? 'border-warning bg-amber-500 bg-opacity-10' : 'border-light'}`}
                         onClick={() => setFormat('pdf')}>
                        <div className="p-4 py-3 flex items-center gap-3">
                            <i className="bi bi-file-earmark-pdf text-xl text-red-500"></i>
                            <div>
                                <h6 className="font-bold mb-0 text-navy">Informe Legal Completo</h6>
                                <small className="text-slate-400">Incluye hash de integridad y firmas.</small>
                            </div>
                        </div>
                    </div>

                    <div className={`card cursor-pointer transition-all border-2 ${format === 'csv' ? 'border-warning bg-amber-500 bg-opacity-10' : 'border-light'}`}
                         onClick={() => setFormat('csv')}>
                        <div className="p-4 py-3 flex items-center gap-3">
                            <i className="bi bi-file-earmark-spreadsheet text-xl text-emerald-500"></i>
                            <div>
                                <h6 className="font-bold mb-0 text-navy">Resumen Ejecutivo</h6>
                                <small className="text-slate-400">Solo totales de horas por empleado.</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botón de Acción Móvil y Desktop */}
                <button className="bg-amber-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-amber-600 transition-colors cursor-pointer border-none w-full py-3 text-white font-bold rounded-lg shadow-sm mt-auto">
                    Generar Informe Oficial
                </button>
            </div>
        </div>

        {/* COLUMNA DER: VISTA PREVIA */}
        {/* hidden lg:block oculta esto en móviles para simplificar, como en Frame-5 */}
        <div className="col-lg-7 hidden lg:block">
            <div className="card border-0 shadow-sm rounded-2xl p-4 h-full bg-gray-50">
                <h5 className="font-bold mb-4">2. Vista Previa del Documento</h5>
                
                {/* Simulación de Hoja de Papel */}
                <div className="bg-white shadow-md mx-auto p-6" style={{ maxWidth: '500px', minHeight: '600px', transform: 'scale(0.95)' }}>
                    
                    <div className="border-b border-dark pb-3 mb-4 text-center">
                        <h4 className="font-bold uppercase mb-1">Certificado de Registro</h4>
                        <small className="text-slate-400">Generado por ChronoWork System v1.0 • Ref: AUDIT-2026-X99</small>
                    </div>

                    <div className="table-responsive mb-6">
                        <table className="w-full table-sm text-sm">
                            <thead className="table-light">
                                <tr><th>EMPLEADO</th><th className="text-right">HORAS TOTALES</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>Hugo Pérez</td><td className="text-right font-bold">168h 30m</td></tr>
                                <tr><td>Ana Martínez</td><td className="text-right font-bold">160h 00m</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Sello Digital */}
                    <div className="mt-6 pt-5 text-right">
                        <div className="d-inline-block border border-3 border-warning p-3 text-center" 
                             style={{ transform: 'rotate(-5deg)', opacity: 0.8 }}>
                            <h6 className="font-bold text-amber-500 mb-1">FIRMADO</h6>
                            <h6 className="font-bold text-amber-500 mb-0">DIGITALMENTE</h6>
                            <small className="text-amber-500 font-mono" style={{ fontSize: '0.6rem' }}>
                                Hash: 8f4a...22b1
                            </small>
                        </div>
                    </div>

                    <div className="mt-6 pt-5">
                         <div className="border-b w-50 mx-auto"></div>
                    </div>

                </div>
            </div>
        </div>

      </div>
    </div>
  );
}