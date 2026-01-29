'use client';

import { useState } from 'react';
import ScannerView from '@/components/ScannerView';

export default function ExportPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [format, setFormat] = useState('pdf');

  return (
    <div className="fade-in-up pb-5">
      
      {/* Overlay del Escáner (Solo se ve si showScanner es true) */}
      {showScanner && <ScannerView onClose={() => setShowScanner(false)} />}

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">Generación de Informes</h2>
        
        {/* Botón para activar el escáner (Simulación de herramienta) */}
        <button 
            onClick={() => setShowScanner(true)}
            className="btn btn-dark d-flex align-items-center gap-2 rounded-pill px-3"
        >
            <i className="bi bi-qr-code-scan"></i> <span className="d-none d-md-inline">Escanear Físico</span>
        </button>
      </div>

      <div className="row g-4">
        
        {/* COLUMNA IZQ: CONFIGURACIÓN */}
        <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-4">1. Configurar Parámetros</h5>
                
                {/* Selector de Periodo */}
                <div className="mb-4">
                    <label className="form-label small fw-bold text-secondary">PERIODO A AUDITAR</label>
                    <div className="input-group">
                        <input type="text" className="form-control fw-bold bg-light" value="01 Oct 2026 - 31 Oct 2026" readOnly />
                        <span className="input-group-text bg-white"><i className="bi bi-calendar4"></i></span>
                    </div>
                </div>

                {/* Tipo de Reporte */}
                <div className="mb-4">
                    <label className="form-label small fw-bold text-secondary">TIPO DE REPORTE</label>
                    
                    <div className={`card mb-2 cursor-pointer transition-all border-2 ${format === 'pdf' ? 'border-warning bg-warning bg-opacity-10' : 'border-light'}`}
                         onClick={() => setFormat('pdf')}>
                        <div className="card-body py-3 d-flex align-items-center gap-3">
                            <i className="bi bi-file-earmark-pdf fs-4 text-danger"></i>
                            <div>
                                <h6 className="fw-bold mb-0 text-dark">Informe Legal Completo</h6>
                                <small className="text-muted">Incluye hash de integridad y firmas.</small>
                            </div>
                        </div>
                    </div>

                    <div className={`card cursor-pointer transition-all border-2 ${format === 'csv' ? 'border-warning bg-warning bg-opacity-10' : 'border-light'}`}
                         onClick={() => setFormat('csv')}>
                        <div className="card-body py-3 d-flex align-items-center gap-3">
                            <i className="bi bi-file-earmark-spreadsheet fs-4 text-success"></i>
                            <div>
                                <h6 className="fw-bold mb-0 text-dark">Resumen Ejecutivo</h6>
                                <small className="text-muted">Solo totales de horas por empleado.</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botón de Acción Móvil y Desktop */}
                <button className="btn btn-warning w-100 py-3 text-white fw-bold rounded-3 shadow-sm mt-auto">
                    Generar Informe Oficial
                </button>
            </div>
        </div>

        {/* COLUMNA DER: VISTA PREVIA */}
        {/* d-none d-lg-block oculta esto en móviles para simplificar, como en Frame-5 */}
        <div className="col-lg-7 d-none d-lg-block">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-light">
                <h5 className="fw-bold mb-4">2. Vista Previa del Documento</h5>
                
                {/* Simulación de Hoja de Papel */}
                <div className="bg-white shadow mx-auto p-5" style={{ maxWidth: '500px', minHeight: '600px', transform: 'scale(0.95)' }}>
                    
                    <div className="border-bottom border-dark pb-3 mb-4 text-center">
                        <h4 className="fw-bold text-uppercase mb-1">Certificado de Registro</h4>
                        <small className="text-muted">Generado por ChronoWork System v1.0 • Ref: AUDIT-2026-X99</small>
                    </div>

                    <div className="table-responsive mb-5">
                        <table className="table table-sm small">
                            <thead className="table-light">
                                <tr><th>EMPLEADO</th><th className="text-end">HORAS TOTALES</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>Hugo Pérez</td><td className="text-end fw-bold">168h 30m</td></tr>
                                <tr><td>Ana Martínez</td><td className="text-end fw-bold">160h 00m</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Sello Digital */}
                    <div className="mt-5 pt-5 text-end">
                        <div className="d-inline-block border border-3 border-warning p-3 text-center" 
                             style={{ transform: 'rotate(-5deg)', opacity: 0.8 }}>
                            <h6 className="fw-bold text-warning mb-1">FIRMADO</h6>
                            <h6 className="fw-bold text-warning mb-0">DIGITALMENTE</h6>
                            <small className="text-warning font-monospace" style={{ fontSize: '0.6rem' }}>
                                Hash: 8f4a...22b1
                            </small>
                        </div>
                    </div>

                    <div className="mt-5 pt-5">
                         <div className="border-bottom w-50 mx-auto"></div>
                    </div>

                </div>
            </div>
        </div>

      </div>
    </div>
  );
}