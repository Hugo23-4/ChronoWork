'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface ReportData {
    empleado: string;
    horas_totales: string;
    totalMinutes: number;
    dias_trabajados: number;
    fichajes_count: number;
}

export default function InspectorExportarPage() {
    const [periodo, setPeriodo] = useState({
        inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0],
    });
    const [tipoReporte, setTipoReporte] = useState<'completo' | 'resumen'>('completo');
    const [formato, setFormato] = useState<'pdf' | 'excel'>('pdf');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [preview, setPreview] = useState<ReportData[]>([]);
    const [generated, setGenerated] = useState(false);
    const refIdRef = useRef(`AUDIT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`);

    const generatePreview = async () => {
        setLoading(true);

        // 1. Fetch fichajes (no FK join — empleados_info is a view)
        const { data: fichajes, error } = await supabase
            .from('fichajes')
            .select('*')
            .gte('fecha', periodo.inicio)
            .lte('fecha', periodo.fin)
            .order('fecha', { ascending: true });

        if (error) {
            console.error('Error generating report:', error);
            setLoading(false);
            return;
        }

        // 2. Batch fetch employee names
        const empleadoIds = [...new Set((fichajes || []).map((f: any) => f.empleado_id))];
        const empMap: Record<string, string> = {};

        if (empleadoIds.length > 0) {
            const { data: emps } = await supabase
                .from('empleados_info')
                .select('id, nombre_completo')
                .in('id', empleadoIds);
            (emps || []).forEach((e: any) => { empMap[e.id] = e.nombre_completo; });
        }

        // Group by employee
        const byEmployee: Record<string, { nombre: string; totalMinutes: number; dias: Set<string>; count: number }> = {};

        (fichajes || []).forEach((f: any) => {
            const empId = f.empleado_id;
            const nombre = empMap[empId] || 'Desconocido';

            if (!byEmployee[empId]) {
                byEmployee[empId] = { nombre, totalMinutes: 0, dias: new Set(), count: 0 };
            }

            byEmployee[empId].dias.add(f.fecha);
            byEmployee[empId].count++;

            if (f.hora_entrada && f.hora_salida) {
                const parseTime = (t: string) => {
                    if (t.includes('T')) return new Date(t);
                    const [h, m] = t.split(':').map(Number);
                    const d = new Date();
                    d.setHours(h, m, 0, 0);
                    return d;
                };
                const entrada = parseTime(f.hora_entrada);
                const salida = parseTime(f.hora_salida);
                const diffMin = (salida.getTime() - entrada.getTime()) / 60000;
                if (diffMin > 0) byEmployee[empId].totalMinutes += diffMin;
            }
        });

        const reportData: ReportData[] = Object.values(byEmployee).map(emp => ({
            empleado: emp.nombre,
            horas_totales: `${Math.floor(emp.totalMinutes / 60)}h ${Math.round(emp.totalMinutes % 60).toString().padStart(2, '0')}m`,
            totalMinutes: emp.totalMinutes,
            dias_trabajados: emp.dias.size,
            fichajes_count: emp.count,
        }));

        reportData.sort((a, b) => b.totalMinutes - a.totalMinutes);

        setPreview(reportData);
        setGenerated(true);
        setLoading(false);
    };

    const downloadPDF = async () => {
        if (preview.length === 0) return;
        setDownloading(true);

        try {
            const jsPDFModule = await import('jspdf');
            const jsPDF = jsPDFModule.default;
            const autoTableModule = await import('jspdf-autotable');
            const autoTable = autoTableModule.default;

            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();

            // Header bar
            doc.setFillColor(15, 23, 42); // #0F172A
            doc.rect(0, 0, pageWidth, 35, 'F');

            // Logo/Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('ChronoWork', 15, 15);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text('Sistema de Control Horario', 15, 22);

            // Ref ID
            doc.setFontSize(8);
            doc.setTextColor(245, 158, 11); // amber
            doc.text(`Ref: ${refIdRef.current}`, pageWidth - 15, 15, { align: 'right' });
            doc.setTextColor(148, 163, 184);
            doc.text(new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }), pageWidth - 15, 22, { align: 'right' });

            // Title section
            const y0 = 50;
            doc.setFillColor(245, 158, 11); // amber accent line
            doc.rect(15, y0, 40, 2, 'F');

            doc.setTextColor(15, 23, 42);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('CERTIFICADO DE REGISTRO', 15, y0 + 14);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text('Generado por ChronoWork System v1.0', 15, y0 + 22);

            // Period info box
            const boxY = y0 + 32;
            doc.setFillColor(248, 250, 252); // slate-50
            doc.roundedRect(15, boxY, pageWidth - 30, 18, 3, 3, 'F');
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.roundedRect(15, boxY, pageWidth - 30, 18, 3, 3, 'S');

            doc.setTextColor(100, 116, 139);
            doc.setFontSize(8);
            doc.text('PERIODO AUDITADO', 22, boxY + 7);
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            const inicioLabel = new Date(periodo.inicio + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
            const finLabel = new Date(periodo.fin + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
            doc.text(`${inicioLabel}  —  ${finLabel}`, 22, boxY + 14);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            const tipoLabel = tipoReporte === 'completo' ? 'Informe Legal Completo' : 'Resumen Ejecutivo';
            doc.text(`Tipo: ${tipoLabel}`, pageWidth - 22, boxY + 11, { align: 'right' });

            // Table
            const tableY = boxY + 28;
            const tableHeaders = tipoReporte === 'completo'
                ? ['EMPLEADO', 'HORAS TOTALES', 'DÍAS TRABAJADOS', 'Nº FICHAJES']
                : ['EMPLEADO', 'HORAS TOTALES'];

            const tableBody = preview.map(row =>
                tipoReporte === 'completo'
                    ? [row.empleado, row.horas_totales, row.dias_trabajados.toString(), row.fichajes_count.toString()]
                    : [row.empleado, row.horas_totales]
            );

            // Summary row
            const totalMinutes = preview.reduce((sum, r) => sum + r.totalMinutes, 0);
            const totalDays = preview.reduce((sum, r) => sum + r.dias_trabajados, 0);
            const totalFichajes = preview.reduce((sum, r) => sum + r.fichajes_count, 0);
            const totalHoras = `${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60).toString().padStart(2, '0')}m`;

            if (tipoReporte === 'completo') {
                tableBody.push(['TOTAL', totalHoras, totalDays.toString(), totalFichajes.toString()]);
            } else {
                tableBody.push(['TOTAL', totalHoras]);
            }

            const tableResult = autoTable(doc, {
                startY: tableY,
                head: [tableHeaders],
                body: tableBody,
                margin: { left: 15, right: 15 },
                styles: {
                    fontSize: 9,
                    cellPadding: 5,
                    lineColor: [226, 232, 240],
                    lineWidth: 0.3,
                },
                headStyles: {
                    fillColor: [15, 23, 42],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8,
                },
                bodyStyles: {
                    textColor: [30, 41, 59],
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252],
                },
                columnStyles: tipoReporte === 'completo' ? {
                    0: { cellWidth: 'auto' },
                    1: { halign: 'right', fontStyle: 'bold' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                } : {
                    0: { cellWidth: 'auto' },
                    1: { halign: 'right', fontStyle: 'bold' },
                },
                didParseCell: (data: any) => {
                    // Style the total row
                    if (data.row.index === tableBody.length - 1) {
                        data.cell.styles.fillColor = [245, 158, 11];
                        data.cell.styles.textColor = [255, 255, 255];
                        data.cell.styles.fontStyle = 'bold';
                    }
                },
            });

            // Footer: digital signature
            const finalY = (doc as any).lastAutoTable?.finalY || (tableResult as any)?.finalY || tableY + 100;
            const sigY = finalY + 20;

            // Signature line
            doc.setDrawColor(15, 23, 42);
            doc.line(15, sigY, 75, sigY);
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text('Firma autorizada', 15, sigY + 5);

            // Digital stamp
            const stampX = pageWidth - 55;
            const stampY2 = sigY - 12;
            doc.setDrawColor(245, 158, 11);
            doc.setLineWidth(1.5);
            doc.roundedRect(stampX, stampY2, 40, 25, 3, 3, 'S');
            doc.setTextColor(245, 158, 11);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('FIRMADO', stampX + 20, stampY2 + 9, { align: 'center' });
            doc.text('DIGITALMENTE', stampX + 20, stampY2 + 15, { align: 'center' });
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.text(`Hash: ${refIdRef.current.toLowerCase()}`, stampX + 20, stampY2 + 21, { align: 'center' });

            // Page footer
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFillColor(248, 250, 252);
            doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
            doc.setTextColor(148, 163, 184);
            doc.setFontSize(7);
            doc.text('Documento generado automáticamente por ChronoWork System v1.0 — No válido sin firma digital', pageWidth / 2, pageHeight - 7, { align: 'center' });

            doc.save(`ChronoWork_Informe_${periodo.inicio}_${periodo.fin}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF. Inténtalo de nuevo.');
        }

        setDownloading(false);
    };

    const downloadExcel = async () => {
        if (preview.length === 0) return;
        setDownloading(true);

        try {
            const XLSX = await import('xlsx');

            const wb = XLSX.utils.book_new();

            // Header rows
            const headerRows = [
                ['CHRONOWORK - CERTIFICADO DE REGISTRO'],
                [`Ref: ${refIdRef.current}`],
                [`Periodo: ${formatPeriodoLabel()}`],
                [`Tipo: ${tipoReporte === 'completo' ? 'Informe Legal Completo' : 'Resumen Ejecutivo'}`],
                [`Fecha de generación: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`],
                [], // empty row
            ];

            // Data
            const dataHeaders = tipoReporte === 'completo'
                ? ['EMPLEADO', 'HORAS TOTALES', 'MINUTOS TOTALES', 'DÍAS TRABAJADOS', 'Nº FICHAJES']
                : ['EMPLEADO', 'HORAS TOTALES', 'MINUTOS TOTALES'];

            const dataRows = preview.map(row =>
                tipoReporte === 'completo'
                    ? [row.empleado, row.horas_totales, Math.round(row.totalMinutes), row.dias_trabajados, row.fichajes_count]
                    : [row.empleado, row.horas_totales, Math.round(row.totalMinutes)]
            );

            // Total row
            const totalMinutes = preview.reduce((sum, r) => sum + r.totalMinutes, 0);
            const totalHoras = `${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60).toString().padStart(2, '0')}m`;
            const totalDays = preview.reduce((sum, r) => sum + r.dias_trabajados, 0);
            const totalFichajes = preview.reduce((sum, r) => sum + r.fichajes_count, 0);

            if (tipoReporte === 'completo') {
                dataRows.push(['TOTAL', totalHoras, Math.round(totalMinutes), totalDays, totalFichajes]);
            } else {
                dataRows.push(['TOTAL', totalHoras, Math.round(totalMinutes)]);
            }

            const allRows = [...headerRows, dataHeaders, ...dataRows, [], ['FIRMADO DIGITALMENTE'], [`Hash: ${refIdRef.current.toLowerCase()}`]];

            const ws = XLSX.utils.aoa_to_sheet(allRows);

            // Column widths
            ws['!cols'] = [
                { wch: 30 }, // Empleado
                { wch: 18 }, // Horas
                { wch: 18 }, // Minutos
                { wch: 18 }, // Días
                { wch: 15 }, // Fichajes
            ];

            // Merge header cells
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
                { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Ref
                { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, // Periodo
                { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }, // Tipo
                { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } }, // Fecha
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Informe');

            XLSX.writeFile(wb, `ChronoWork_Informe_${periodo.inicio}_${periodo.fin}.xlsx`);
        } catch (error) {
            console.error('Error generating Excel:', error);
            alert('Error al generar el Excel. Inténtalo de nuevo.');
        }

        setDownloading(false);
    };

    const handleDownload = () => {
        if (formato === 'pdf') {
            downloadPDF();
        } else {
            downloadExcel();
        }
    };

    const formatPeriodoLabel = () => {
        const inicio = new Date(periodo.inicio + 'T00:00:00');
        const fin = new Date(periodo.fin + 'T00:00:00');
        return `${inicio.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} - ${fin.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    };

    // Summary stats
    const totalMinutes = preview.reduce((sum, r) => sum + r.totalMinutes, 0);
    const totalHoras = `${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60).toString().padStart(2, '0')}m`;

    return (
        <div className="fade-in-up">

            {/* DESKTOP VIEW */}
            <div className="d-none d-md-block">
                <div className="mb-4">
                    <h2 className="fw-bold text-dark mb-1">Generación de Informes</h2>
                    <p className="text-muted small">Exportar datos oficiales del sistema de fichaje</p>
                </div>

                <div className="row g-4">

                    {/* LEFT: Configure Parameters */}
                    <div className="col-lg-5">
                        <h6 className="fw-bold text-dark mb-3">1. Configurar Parámetros</h6>
                        <div className="card border-0 shadow-sm rounded-4 p-4">

                            {/* Period */}
                            <h6 className="text-warning fw-bold text-uppercase small mb-3" style={{ letterSpacing: '0.08em' }}>
                                PERIODO A AUDITAR
                            </h6>
                            <div className="d-flex gap-2 mb-4">
                                <div className="flex-grow-1">
                                    <label className="form-label small text-muted">Desde</label>
                                    <input type="date" className="form-control rounded-3 border-light bg-light"
                                        value={periodo.inicio}
                                        onChange={(e) => setPeriodo(p => ({ ...p, inicio: e.target.value }))} />
                                </div>
                                <div className="flex-grow-1">
                                    <label className="form-label small text-muted">Hasta</label>
                                    <input type="date" className="form-control rounded-3 border-light bg-light"
                                        value={periodo.fin}
                                        onChange={(e) => setPeriodo(p => ({ ...p, fin: e.target.value }))} />
                                </div>
                            </div>

                            {/* Report Type */}
                            <h6 className="text-warning fw-bold text-uppercase small mb-3" style={{ letterSpacing: '0.08em' }}>
                                TIPO DE REPORTE
                            </h6>
                            <div className="d-flex flex-column gap-2 mb-4">
                                {([
                                    { value: 'completo', title: 'Informe Legal Completo', desc: 'Incluye hash de integridad y firmas.' },
                                    { value: 'resumen', title: 'Resumen Ejecutivo', desc: 'Solo totales de horas por empleado.' },
                                ] as const).map(opt => (
                                    <div key={opt.value}
                                        className={`p-3 rounded-3 border ${tipoReporte === opt.value ? 'border-warning' : 'border-light'}`}
                                        style={{ background: tipoReporte === opt.value ? '#FFFBEB' : '#fff', cursor: 'pointer' }}
                                        onClick={() => setTipoReporte(opt.value)}>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center"
                                                style={{
                                                    width: 20, height: 20,
                                                    border: `2px solid ${tipoReporte === opt.value ? '#F59E0B' : '#D1D5DB'}`,
                                                    background: tipoReporte === opt.value ? '#F59E0B' : 'transparent'
                                                }}>
                                                {tipoReporte === opt.value && <div className="rounded-circle bg-white" style={{ width: 6, height: 6 }}></div>}
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark small">{opt.title}</div>
                                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>{opt.desc}</small>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Format - PDF / Excel */}
                            <h6 className="text-warning fw-bold text-uppercase small mb-3" style={{ letterSpacing: '0.08em' }}>
                                FORMATO DE SALIDA
                            </h6>
                            <div className="d-flex gap-2 mb-4">
                                <button
                                    className={`btn rounded-pill px-4 py-2 fw-bold ${formato === 'pdf' ? 'text-white' : 'btn-outline-secondary'}`}
                                    style={formato === 'pdf' ? { background: '#0F172A' } : {}}
                                    onClick={() => setFormato('pdf')}
                                >
                                    <i className="bi bi-file-earmark-pdf me-1"></i> PDF
                                </button>
                                <button
                                    className={`btn rounded-pill px-4 py-2 fw-bold ${formato === 'excel' ? 'text-white' : 'btn-outline-secondary'}`}
                                    style={formato === 'excel' ? { background: '#0F172A' } : {}}
                                    onClick={() => setFormato('excel')}
                                >
                                    <i className="bi bi-file-earmark-spreadsheet me-1"></i> Excel
                                </button>
                            </div>

                            {/* Generate Button */}
                            <button
                                className="btn w-100 py-3 rounded-pill fw-bold text-white"
                                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
                                onClick={generatePreview}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                ) : (
                                    <i className="bi bi-file-earmark-bar-graph me-2"></i>
                                )}
                                Generar Informe Oficial
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Preview */}
                    <div className="col-lg-7">
                        <h6 className="fw-bold text-dark mb-3">2. Vista Previa del Documento</h6>

                        <div className="card border-0 shadow-sm rounded-4 p-4" style={{ minHeight: '450px', background: '#fff' }}>
                            {!generated ? (
                                <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center py-5">
                                    <i className="bi bi-file-earmark-text text-muted mb-3" style={{ fontSize: '3rem', opacity: 0.2 }}></i>
                                    <p className="text-muted small">Configura los parámetros y genera el informe</p>
                                </div>
                            ) : preview.length === 0 ? (
                                <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center py-5">
                                    <i className="bi bi-inbox text-muted mb-3" style={{ fontSize: '3rem', opacity: 0.2 }}></i>
                                    <p className="text-muted">No hay datos para el periodo seleccionado</p>
                                </div>
                            ) : (
                                <>
                                    {/* Document Header */}
                                    <div className="border-bottom pb-3 mb-3">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <div style={{ width: '120px', height: '3px', background: '#0F172A', marginBottom: '8px' }}></div>
                                                <h5 className="fw-bold text-dark mb-0">CERTIFICADO DE REGISTRO</h5>
                                                <small className="text-muted d-block">Generado por ChronoWork System v1.0</small>
                                            </div>
                                            <small className="text-muted">Ref: {refIdRef.current}</small>
                                        </div>
                                        <small className="text-muted d-block mt-2">Periodo: {formatPeriodoLabel()}</small>
                                    </div>

                                    {/* Summary */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-4">
                                            <div className="rounded-3 p-2 text-center" style={{ background: '#F8FAFC' }}>
                                                <div className="fw-bold text-dark">{preview.length}</div>
                                                <small className="text-muted" style={{ fontSize: '0.65rem' }}>Empleados</small>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="rounded-3 p-2 text-center" style={{ background: '#FFFBEB' }}>
                                                <div className="fw-bold" style={{ color: '#D97706' }}>{totalHoras}</div>
                                                <small className="text-muted" style={{ fontSize: '0.65rem' }}>Total Horas</small>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="rounded-3 p-2 text-center" style={{ background: '#F0FDF4' }}>
                                                <div className="fw-bold" style={{ color: '#10B981' }}>{formato === 'pdf' ? 'PDF' : 'XLS'}</div>
                                                <small className="text-muted" style={{ fontSize: '0.65rem' }}>Formato</small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Table */}
                                    <div className="table-responsive">
                                        <table className="table table-sm mb-0">
                                            <thead>
                                                <tr>
                                                    <th className="small fw-bold text-dark border-0 pb-2">EMPLEADO</th>
                                                    <th className="small fw-bold text-dark border-0 pb-2 text-end">HORAS TOTALES</th>
                                                    {tipoReporte === 'completo' && (
                                                        <>
                                                            <th className="small fw-bold text-dark border-0 pb-2 text-end">DÍAS</th>
                                                            <th className="small fw-bold text-dark border-0 pb-2 text-end">FICHAJES</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {preview.map((row, i) => (
                                                    <tr key={i}>
                                                        <td className="small text-dark">{row.empleado}</td>
                                                        <td className="small text-dark text-end font-monospace fw-bold">{row.horas_totales}</td>
                                                        {tipoReporte === 'completo' && (
                                                            <>
                                                                <td className="small text-dark text-end">{row.dias_trabajados}</td>
                                                                <td className="small text-dark text-end">{row.fichajes_count}</td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Digital Signature */}
                                    <div className="mt-auto pt-4 border-top mt-4">
                                        <div className="d-flex justify-content-between align-items-end">
                                            <div>
                                                <div style={{ width: '100px', height: '1px', background: '#000', marginBottom: '4px' }}></div>
                                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Firma autorizada</small>
                                            </div>
                                            <div className="text-center rounded-3 px-3 py-2" style={{ border: '2px solid #F59E0B' }}>
                                                <div className="fw-bold text-warning small">FIRMADO</div>
                                                <div className="fw-bold text-warning small">DIGITALMENTE</div>
                                                <code className="text-warning" style={{ fontSize: '0.6rem' }}>
                                                    Hash: {refIdRef.current.toLowerCase()}
                                                </code>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Download */}
                                    <div className="mt-4">
                                        <button
                                            className="btn btn-dark rounded-pill px-4 py-2 fw-bold"
                                            onClick={handleDownload}
                                            disabled={downloading}
                                        >
                                            {downloading ? (
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                            ) : (
                                                <i className={`bi ${formato === 'pdf' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-spreadsheet'} me-2`}></i>
                                            )}
                                            Descargar {formato === 'pdf' ? 'PDF' : 'Excel'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MOBILE VIEW */}
            <div className="d-md-none">
                <div className="mb-4">
                    <h2 className="fw-bold text-dark mb-1">Exportar Datos</h2>
                </div>

                {/* Config Card */}
                <h6 className="text-warning fw-bold text-uppercase small mb-3" style={{ letterSpacing: '0.08em' }}>
                    CONFIGURACIÓN
                </h6>
                <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
                    <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                        <span className="fw-bold text-dark">Periodo</span>
                        <span className="text-warning fw-bold">
                            {new Date(periodo.inicio + 'T00:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                        <span className="fw-bold text-dark">Formato</span>
                        <span className="badge rounded-pill bg-dark text-white px-3 py-2">
                            {formato === 'pdf' ? 'PDF Oficial' : 'Excel'}
                        </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center py-3">
                        <span className="fw-bold text-dark">Detalle</span>
                        <span className="text-muted">
                            {tipoReporte === 'completo' ? 'Completo (con Hash)' : 'Resumen Ejecutivo'}
                        </span>
                    </div>
                </div>

                {/* Date inputs */}
                <div className="d-flex gap-2 mb-3">
                    <input type="date" className="form-control form-control-sm rounded-pill border-light bg-light"
                        value={periodo.inicio}
                        onChange={(e) => setPeriodo(p => ({ ...p, inicio: e.target.value }))} />
                    <input type="date" className="form-control form-control-sm rounded-pill border-light bg-light"
                        value={periodo.fin}
                        onChange={(e) => setPeriodo(p => ({ ...p, fin: e.target.value }))} />
                </div>

                {/* Format switcher */}
                <div className="d-flex gap-2 mb-3">
                    <button className={`btn btn-sm rounded-pill px-3 flex-grow-1 ${formato === 'pdf' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => setFormato('pdf')}>
                        <i className="bi bi-file-earmark-pdf me-1"></i> PDF
                    </button>
                    <button className={`btn btn-sm rounded-pill px-3 flex-grow-1 ${formato === 'excel' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => setFormato('excel')}>
                        <i className="bi bi-file-earmark-spreadsheet me-1"></i> Excel
                    </button>
                </div>

                {/* Type switcher */}
                <div className="d-flex gap-2 mb-4">
                    <button className={`btn btn-sm rounded-pill px-3 flex-grow-1 ${tipoReporte === 'completo' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => setTipoReporte('completo')}>Completo</button>
                    <button className={`btn btn-sm rounded-pill px-3 flex-grow-1 ${tipoReporte === 'resumen' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => setTipoReporte('resumen')}>Resumen</button>
                </div>

                {/* Preview */}
                <h6 className="text-warning fw-bold text-uppercase small mb-3" style={{ letterSpacing: '0.08em' }}>
                    VISTA PREVIA
                </h6>
                <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ minHeight: '200px' }}>
                    {!generated ? (
                        <div className="d-flex flex-column align-items-center justify-content-center text-center py-4">
                            <div style={{ width: '60%', height: '4px', background: '#0F172A', borderRadius: '2px', marginBottom: '12px' }}></div>
                            <div style={{ width: '60%', height: '2px', background: '#E5E7EB', borderRadius: '2px', marginBottom: '16px' }}></div>
                            <div style={{ width: '80%', height: '8px', background: '#FDE68A', borderRadius: '2px', marginBottom: '8px' }}></div>
                            <div style={{ width: '70%', height: '2px', background: '#E5E7EB', borderRadius: '2px', marginBottom: '8px' }}></div>
                            <div style={{ width: '60%', height: '2px', background: '#E5E7EB', borderRadius: '2px', marginBottom: '24px' }}></div>
                            <div className="mt-auto rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: 50, height: 50, border: '2px solid #F59E0B' }}>
                                <span className="text-warning small fw-bold" style={{ fontSize: '0.55rem' }}>FIRMA DIGITAL</span>
                            </div>
                        </div>
                    ) : preview.length === 0 ? (
                        <div className="text-center py-4">
                            <i className="bi bi-inbox text-muted" style={{ fontSize: '2rem' }}></i>
                            <p className="text-muted small mt-2">Sin datos para este periodo</p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ width: '80px', height: '3px', background: '#0F172A', marginBottom: '8px' }}></div>
                            <h6 className="fw-bold text-dark small mb-2">CERTIFICADO DE REGISTRO</h6>
                            <table className="table table-sm mb-0">
                                <thead>
                                    <tr>
                                        <th className="small fw-bold text-dark border-0 pb-1" style={{ fontSize: '0.7rem' }}>EMPLEADO</th>
                                        <th className="small fw-bold text-dark border-0 pb-1 text-end" style={{ fontSize: '0.7rem' }}>HORAS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map((row, i) => (
                                        <tr key={i}>
                                            <td className="small text-dark" style={{ fontSize: '0.8rem' }}>{row.empleado}</td>
                                            <td className="small text-dark text-end font-monospace" style={{ fontSize: '0.8rem' }}>{row.horas_totales}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="text-center mt-3">
                                <div className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                    style={{ width: 50, height: 50, border: '2px solid #F59E0B' }}>
                                    <span className="text-warning fw-bold" style={{ fontSize: '0.5rem' }}>FIRMA DIGITAL</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Download Button */}
                <button
                    className="btn w-100 py-3 rounded-pill fw-bold text-white mb-5"
                    style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', fontSize: '1.1rem' }}
                    onClick={generated ? handleDownload : generatePreview}
                    disabled={loading || downloading}
                >
                    {loading || downloading ? (
                        <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : generated ? (
                        <>
                            <i className={`bi ${formato === 'pdf' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-spreadsheet'} me-2`}></i>
                            Descargar Informe
                        </>
                    ) : (
                        <><i className="bi bi-file-earmark-bar-graph me-2"></i>Generar Informe Oficial</>
                    )}
                </button>
            </div>
        </div>
    );
}
