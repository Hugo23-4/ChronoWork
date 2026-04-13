'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, FileSpreadsheet, BarChart3, Loader2, Inbox, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import Toast from '@/components/ui/Toast';

interface ReportData { empleado: string; horas_totales: string; totalMinutes: number; dias_trabajados: number; fichajes_count: number; }
interface FichajeExport { empleado_id: string; fecha: string; hora_entrada: string | null; hora_salida: string | null; empleados_info: { nombre_completo: string } | null; }

// Split a date range into per-month chunks to avoid unbounded queries
const getMonthChunks = (inicio: string, fin: string): Array<[string, string]> => {
    const chunks: Array<[string, string]> = [];
    const endDate = new Date(fin + 'T00:00:00');
    let current = new Date(inicio + 'T00:00:00');
    current = new Date(current.getFullYear(), current.getMonth(), 1);
    while (current <= endDate) {
        const chunkStart = current.toISOString().split('T')[0];
        const lastOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        const chunkEnd = lastOfMonth <= endDate ? lastOfMonth.toISOString().split('T')[0] : fin;
        const effectiveStart = chunkStart < inicio ? inicio : chunkStart;
        chunks.push([effectiveStart, chunkEnd]);
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return chunks;
};

export default function InspectorExportarPage() {
    const [periodo, setPeriodo] = useState({ inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], fin: new Date().toISOString().split('T')[0] });
    const [tipoReporte, setTipoReporte] = useState<'completo' | 'resumen'>('completo');
    const [formato, setFormato] = useState<'pdf' | 'excel'>('pdf');
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState<{ loaded: number; total: number } | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [preview, setPreview] = useState<ReportData[]>([]);
    const [generated, setGenerated] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const refIdRef = useRef(`AUDIT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`);

    const generatePreview = async () => {
        setLoading(true);
        const chunks = getMonthChunks(periodo.inicio, periodo.fin);
        setLoadingProgress({ loaded: 0, total: chunks.length });

        const allFichajes: FichajeExport[] = [];
        for (let i = 0; i < chunks.length; i++) {
            const [from, to] = chunks[i];
            const { data, error } = await supabase
                .from('fichajes')
                .select('empleado_id, fecha, hora_entrada, hora_salida, empleados_info(nombre_completo)')
                .gte('fecha', from)
                .lte('fecha', to)
                .order('fecha', { ascending: true })
                .limit(1000);
            if (error) { console.error('Error fetching chunk:', error); setLoading(false); setLoadingProgress(null); return; }
            allFichajes.push(...(data || []) as FichajeExport[]);
            setLoadingProgress({ loaded: i + 1, total: chunks.length });
        }

        const byEmployee: Record<string, { nombre: string; totalMinutes: number; dias: Set<string>; count: number }> = {};
        const parseTime = (t: string) => { if (t.includes('T')) return new Date(t); const [h, m] = t.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d; };
        allFichajes.forEach(f => {
            const empId = f.empleado_id;
            const nombre = f.empleados_info?.nombre_completo ?? 'Desconocido';
            if (!byEmployee[empId]) byEmployee[empId] = { nombre, totalMinutes: 0, dias: new Set(), count: 0 };
            byEmployee[empId].dias.add(f.fecha); byEmployee[empId].count++;
            if (f.hora_entrada && f.hora_salida) {
                const diffMin = (parseTime(f.hora_salida).getTime() - parseTime(f.hora_entrada).getTime()) / 60000;
                if (diffMin > 0) byEmployee[empId].totalMinutes += diffMin;
            }
        });

        const reportData: ReportData[] = Object.values(byEmployee).map(emp => ({ empleado: emp.nombre, horas_totales: `${Math.floor(emp.totalMinutes / 60)}h ${Math.round(emp.totalMinutes % 60).toString().padStart(2, '0')}m`, totalMinutes: emp.totalMinutes, dias_trabajados: emp.dias.size, fichajes_count: emp.count }));
        reportData.sort((a, b) => b.totalMinutes - a.totalMinutes);
        setPreview(reportData); setGenerated(true); setLoading(false); setLoadingProgress(null);
    };

    const downloadPDF = async () => {
        if (preview.length === 0) return; setDownloading(true);
        try {
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;
            const doc = new jsPDF('p', 'mm', 'a4'); const pageWidth = doc.internal.pageSize.getWidth();
            doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, 35, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.text('ChronoWork', 15, 15);
            doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184); doc.text('Sistema de Control Horario', 15, 22);
            doc.setFontSize(8); doc.setTextColor(245, 158, 11); doc.text(`Ref: ${refIdRef.current}`, pageWidth - 15, 15, { align: 'right' });
            doc.setTextColor(148, 163, 184); doc.text(new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }), pageWidth - 15, 22, { align: 'right' });
            const y0 = 50; doc.setFillColor(245, 158, 11); doc.rect(15, y0, 40, 2, 'F');
            doc.setTextColor(15, 23, 42); doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.text('CERTIFICADO DE REGISTRO', 15, y0 + 14);
            doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139); doc.text('Generado por ChronoWork System v1.0', 15, y0 + 22);
            const boxY = y0 + 32; doc.setFillColor(248, 250, 252); doc.roundedRect(15, boxY, pageWidth - 30, 18, 3, 3, 'F'); doc.setDrawColor(226, 232, 240); doc.roundedRect(15, boxY, pageWidth - 30, 18, 3, 3, 'S');
            doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.text('PERIODO AUDITADO', 22, boxY + 7);
            doc.setTextColor(15, 23, 42); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
            doc.text(`${new Date(periodo.inicio + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}  —  ${new Date(periodo.fin + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`, 22, boxY + 14);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(`Tipo: ${tipoReporte === 'completo' ? 'Informe Legal Completo' : 'Resumen Ejecutivo'}`, pageWidth - 22, boxY + 11, { align: 'right' });
            const tableY = boxY + 28;
            const tableHeaders = tipoReporte === 'completo' ? ['EMPLEADO', 'HORAS TOTALES', 'DÍAS TRABAJADOS', 'Nº FICHAJES'] : ['EMPLEADO', 'HORAS TOTALES'];
            const tableBody = preview.map(row => tipoReporte === 'completo' ? [row.empleado, row.horas_totales, row.dias_trabajados.toString(), row.fichajes_count.toString()] : [row.empleado, row.horas_totales]);
            const totalMinutes = preview.reduce((sum, r) => sum + r.totalMinutes, 0);
            const totalHoras = `${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60).toString().padStart(2, '0')}m`;
            const totalDays = preview.reduce((sum, r) => sum + r.dias_trabajados, 0);
            const totalFichajes = preview.reduce((sum, r) => sum + r.fichajes_count, 0);
            tableBody.push(tipoReporte === 'completo' ? ['TOTAL', totalHoras, totalDays.toString(), totalFichajes.toString()] : ['TOTAL', totalHoras]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tableResult = autoTable(doc, { startY: tableY, head: [tableHeaders], body: tableBody, margin: { left: 15, right: 15 }, styles: { fontSize: 9, cellPadding: 5, lineColor: [226, 232, 240], lineWidth: 0.3 }, headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 }, bodyStyles: { textColor: [30, 41, 59] }, alternateRowStyles: { fillColor: [248, 250, 252] }, columnStyles: tipoReporte === 'completo' ? { 0: { cellWidth: 'auto' }, 1: { halign: 'right', fontStyle: 'bold' }, 2: { halign: 'center' }, 3: { halign: 'center' } } : { 0: { cellWidth: 'auto' }, 1: { halign: 'right', fontStyle: 'bold' } }, didParseCell: (data: any) => { if (data.row.index === tableBody.length - 1) { data.cell.styles.fillColor = [245, 158, 11]; data.cell.styles.textColor = [255, 255, 255]; data.cell.styles.fontStyle = 'bold'; } } });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const finalY = (doc as any).lastAutoTable?.finalY || (tableResult as any)?.finalY || tableY + 100;
            const sigY = finalY + 20; doc.setDrawColor(15, 23, 42); doc.line(15, sigY, 75, sigY); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text('Firma autorizada', 15, sigY + 5);
            const stampX = pageWidth - 55; const stampY2 = sigY - 12; doc.setDrawColor(245, 158, 11); doc.setLineWidth(1.5); doc.roundedRect(stampX, stampY2, 40, 25, 3, 3, 'S');
            doc.setTextColor(245, 158, 11); doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('FIRMADO', stampX + 20, stampY2 + 9, { align: 'center' }); doc.text('DIGITALMENTE', stampX + 20, stampY2 + 15, { align: 'center' });
            doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.text(`Hash: ${refIdRef.current.toLowerCase()}`, stampX + 20, stampY2 + 21, { align: 'center' });
            const pageHeight = doc.internal.pageSize.getHeight(); doc.setFillColor(248, 250, 252); doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
            doc.setTextColor(148, 163, 184); doc.setFontSize(7); doc.text('Documento generado automáticamente por ChronoWork System v1.0 — No válido sin firma digital', pageWidth / 2, pageHeight - 7, { align: 'center' });
            doc.save(`ChronoWork_Informe_${periodo.inicio}_${periodo.fin}.pdf`);
        } catch (error) { console.error('Error generating PDF:', error); setToast({ message: 'Error al generar el PDF. Inténtalo de nuevo.', type: 'error' }); }
        setDownloading(false);
    };

    const downloadExcel = async () => {
        if (preview.length === 0) return; setDownloading(true);
        try {
            const ExcelJS = (await import('exceljs')).default;
            const workbook = new ExcelJS.Workbook(); workbook.creator = 'ChronoWork System v1.0'; workbook.created = new Date();
            const sheet = workbook.addWorksheet('Informe');
            sheet.columns = [{ key: 'col1', width: 32 }, { key: 'col2', width: 20 }, { key: 'col3', width: 20 }, { key: 'col4', width: 20 }, { key: 'col5', width: 16 }];
            sheet.addRow(['CHRONOWORK - CERTIFICADO DE REGISTRO']); sheet.mergeCells('A1:E1');
            sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }; sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
            [[`Ref: ${refIdRef.current}`], [`Periodo: ${formatPeriodoLabel()}`], [`Tipo: ${tipoReporte === 'completo' ? 'Informe Legal Completo' : 'Resumen Ejecutivo'}`], [`Fecha: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`]].forEach(r => { sheet.addRow(r); sheet.mergeCells(`A${sheet.lastRow!.number}:E${sheet.lastRow!.number}`); sheet.lastRow!.getCell(1).font = { italic: true, color: { argb: 'FF64748B' } }; });
            sheet.addRow([]);
            const headers = tipoReporte === 'completo' ? ['EMPLEADO', 'HORAS TOTALES', 'MINUTOS TOTALES', 'DÍAS TRABAJADOS', 'Nº FICHAJES'] : ['EMPLEADO', 'HORAS TOTALES', 'MINUTOS TOTALES'];
            const headerRow = sheet.addRow(headers); headerRow.eachCell(cell => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; cell.alignment = { horizontal: 'center' }; });
            preview.forEach((row, idx) => { const values = tipoReporte === 'completo' ? [row.empleado, row.horas_totales, Math.round(row.totalMinutes), row.dias_trabajados, row.fichajes_count] : [row.empleado, row.horas_totales, Math.round(row.totalMinutes)]; const dataRow = sheet.addRow(values); if (idx % 2 === 0) dataRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; }); });
            const totalMinutes = preview.reduce((sum, r) => sum + r.totalMinutes, 0);
            const totalHoras = `${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60).toString().padStart(2, '0')}m`;
            const totals = tipoReporte === 'completo' ? ['TOTAL', totalHoras, Math.round(totalMinutes), preview.reduce((s, r) => s + r.dias_trabajados, 0), preview.reduce((s, r) => s + r.fichajes_count, 0)] : ['TOTAL', totalHoras, Math.round(totalMinutes)];
            const totalRow = sheet.addRow(totals); totalRow.eachCell(cell => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } }; });
            sheet.addRow([]); sheet.addRow(['FIRMADO DIGITALMENTE']); sheet.addRow([`Hash: ${refIdRef.current.toLowerCase()}`]);
            const buffer = await workbook.xlsx.writeBuffer(); const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `ChronoWork_Informe_${periodo.inicio}_${periodo.fin}.xlsx`; a.click(); URL.revokeObjectURL(url);
        } catch (error) { console.error('Error generating Excel:', error); }
        setDownloading(false);
    };

    const handleDownload = () => formato === 'pdf' ? downloadPDF() : downloadExcel();
    const formatPeriodoLabel = () => { const i = new Date(periodo.inicio + 'T00:00:00'); const f = new Date(periodo.fin + 'T00:00:00'); return `${i.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} - ${f.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`; };
    const totalMinutes = preview.reduce((sum, r) => sum + r.totalMinutes, 0);
    const totalHoras = `${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60).toString().padStart(2, '0')}m`;

    return (
        <div className="animate-fade-up">
            {/* Desktop */}
            <div className="hidden md:block">
                <div className="mb-5"><h2 className="font-bold text-navy text-2xl mb-1 font-[family-name:var(--font-jakarta)]">Generación de Informes</h2><p className="text-slate-400 text-sm">Exportar datos oficiales del sistema de fichaje</p></div>
                <div className="grid grid-cols-12 gap-5">
                    {/* Left: Configure */}
                    <div className="col-span-5">
                        <h6 className="font-bold text-navy mb-3">1. Configurar Parámetros</h6>
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h6 className="text-amber-500 font-bold uppercase text-xs mb-3 tracking-[0.08em]">PERIODO A AUDITAR</h6>
                            <div className="flex gap-2 mb-5">
                                <div className="flex-1"><label className="block text-xs text-slate-400 mb-1.5">Desde</label><input type="date" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm" value={periodo.inicio} onChange={e => setPeriodo(p => ({ ...p, inicio: e.target.value }))} /></div>
                                <div className="flex-1"><label className="block text-xs text-slate-400 mb-1.5">Hasta</label><input type="date" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm" value={periodo.fin} onChange={e => setPeriodo(p => ({ ...p, fin: e.target.value }))} /></div>
                            </div>
                            <h6 className="text-amber-500 font-bold uppercase text-xs mb-3 tracking-[0.08em]">TIPO DE REPORTE</h6>
                            <div className="flex flex-col gap-2 mb-5">
                                {([{ value: 'completo' as const, title: 'Informe Legal Completo', desc: 'Incluye hash de integridad y firmas.' }, { value: 'resumen' as const, title: 'Resumen Ejecutivo', desc: 'Solo totales de horas por empleado.' }]).map(opt => (
                                    <div key={opt.value} onClick={() => setTipoReporte(opt.value)}
                                        className={cn('p-3 rounded-xl border-[1.5px] cursor-pointer transition-all flex items-center gap-3', tipoReporte === opt.value ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300')}>
                                        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0', tipoReporte === opt.value ? 'border-amber-500 bg-amber-500' : 'border-gray-300')}>
                                            {tipoReporte === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <div><div className="font-bold text-navy text-sm">{opt.title}</div><small className="text-slate-400 text-xs">{opt.desc}</small></div>
                                    </div>
                                ))}
                            </div>
                            <h6 className="text-amber-500 font-bold uppercase text-xs mb-3 tracking-[0.08em]">FORMATO DE SALIDA</h6>
                            <div className="flex gap-2 mb-5">
                                <button onClick={() => setFormato('pdf')} className={cn('flex-1 py-2.5 rounded-full font-bold text-sm border-none cursor-pointer transition-all flex items-center justify-center gap-2', formato === 'pdf' ? 'bg-navy text-white' : 'bg-gray-100 text-slate-500 hover:bg-gray-200')}>
                                    <FileText className="w-4 h-4" /> PDF
                                </button>
                                <button onClick={() => setFormato('excel')} className={cn('flex-1 py-2.5 rounded-full font-bold text-sm border-none cursor-pointer transition-all flex items-center justify-center gap-2', formato === 'excel' ? 'bg-navy text-white' : 'bg-gray-100 text-slate-500 hover:bg-gray-200')}>
                                    <FileSpreadsheet className="w-4 h-4" /> Excel
                                </button>
                            </div>
                            <button onClick={generatePreview} disabled={loading}
                                className="w-full py-3 rounded-full font-bold text-white border-none cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-500/25">
                                {loading ? <><Loader2 className="w-5 h-5 animate-spin" />{loadingProgress ? `Cargando datos... ${loadingProgress.loaded} / ${loadingProgress.total} meses` : 'Procesando...'}</> : <><BarChart3 className="w-5 h-5" /> Generar Informe Oficial</>}
                            </button>
                        </div>
                    </div>
                    {/* Right: Preview */}
                    <div className="col-span-7">
                        <h6 className="font-bold text-navy mb-3">2. Vista Previa del Documento</h6>
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 min-h-[450px]">
                            {!generated ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12"><FileText className="w-12 h-12 text-slate-200 mb-3" /><p className="text-slate-400 text-sm">Configura los parámetros y genera el informe</p></div>
                            ) : preview.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12"><Inbox className="w-12 h-12 text-slate-200 mb-3" /><p className="text-slate-400">No hay datos para el periodo seleccionado</p></div>
                            ) : (<>
                                <div className="border-b border-gray-100 pb-3 mb-3">
                                    <div className="flex justify-between items-start"><div><div className="w-[120px] h-[3px] bg-navy mb-2" /><h5 className="font-bold text-navy">CERTIFICADO DE REGISTRO</h5><small className="text-slate-400 block">Generado por ChronoWork System v1.0</small></div><small className="text-slate-400">Ref: {refIdRef.current}</small></div>
                                    <small className="text-slate-400 block mt-2">Periodo: {formatPeriodoLabel()}</small>
                                </div>
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="rounded-lg p-2 text-center bg-slate-50"><div className="font-bold text-navy">{preview.length}</div><small className="text-slate-400 text-[0.65rem]">Empleados</small></div>
                                    <div className="rounded-lg p-2 text-center bg-amber-50"><div className="font-bold text-amber-600">{totalHoras}</div><small className="text-slate-400 text-[0.65rem]">Total Horas</small></div>
                                    <div className="rounded-lg p-2 text-center bg-emerald-50"><div className="font-bold text-emerald-600">{formato === 'pdf' ? 'PDF' : 'XLS'}</div><small className="text-slate-400 text-[0.65rem]">Formato</small></div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full"><thead><tr><th className="text-xs font-bold text-navy pb-2 text-left">EMPLEADO</th><th className="text-xs font-bold text-navy pb-2 text-right">HORAS TOTALES</th>{tipoReporte === 'completo' && <><th className="text-xs font-bold text-navy pb-2 text-right">DÍAS</th><th className="text-xs font-bold text-navy pb-2 text-right">FICHAJES</th></>}</tr></thead>
                                        <tbody className="divide-y divide-gray-50">{preview.map((row, i) => (<tr key={i}><td className="text-sm text-navy py-2">{row.empleado}</td><td className="text-sm text-navy text-right font-mono font-bold py-2">{row.horas_totales}</td>{tipoReporte === 'completo' && <><td className="text-sm text-navy text-right py-2">{row.dias_trabajados}</td><td className="text-sm text-navy text-right py-2">{row.fichajes_count}</td></>}</tr>))}</tbody></table>
                                </div>
                                <div className="mt-auto pt-4 border-t border-gray-100 mt-4">
                                    <div className="flex justify-between items-end"><div><div className="w-[100px] h-px bg-navy mb-1" /><small className="text-slate-400 text-[0.7rem]">Firma autorizada</small></div><div className="text-center rounded-lg px-3 py-2 border-2 border-amber-500"><div className="font-bold text-amber-500 text-sm">FIRMADO</div><div className="font-bold text-amber-500 text-sm">DIGITALMENTE</div><code className="text-amber-500 text-[0.6rem]">Hash: {refIdRef.current.toLowerCase()}</code></div></div>
                                </div>
                                <div className="mt-4">
                                    <button onClick={handleDownload} disabled={downloading}
                                        className="bg-navy text-white px-5 py-2.5 rounded-full font-bold border-none cursor-pointer hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm">
                                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Descargar {formato === 'pdf' ? 'PDF' : 'Excel'}
                                    </button>
                                </div>
                            </>)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden">
                <div className="mb-4"><h2 className="font-bold text-navy text-xl mb-1 font-[family-name:var(--font-jakarta)]">Exportar Datos</h2></div>
                <h6 className="text-amber-500 font-bold uppercase text-xs mb-3 tracking-[0.08em]">CONFIGURACIÓN</h6>
                <div className="bg-white rounded-2xl p-3.5 mb-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100"><span className="font-bold text-navy text-sm">Periodo</span><span className="text-amber-500 font-bold text-sm">{(() => { const i = new Date(periodo.inicio + 'T00:00:00'); const f = new Date(periodo.fin + 'T00:00:00'); const fmt = (d: Date) => d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }); if (i.getFullYear() === f.getFullYear() && i.getMonth() === f.getMonth()) return fmt(i); if (i.getFullYear() === f.getFullYear()) return `${i.toLocaleDateString('es-ES', { month: 'short' })} – ${fmt(f)}`; return `${fmt(i)} – ${fmt(f)}`; })()}</span></div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100"><span className="font-bold text-navy text-sm">Formato</span><span className="bg-navy text-white text-xs px-3 py-1.5 rounded-full font-bold">{formato === 'pdf' ? 'PDF Oficial' : 'Excel'}</span></div>
                    <div className="flex justify-between items-center py-3"><span className="font-bold text-navy text-sm">Detalle</span><span className="text-slate-400 text-sm">{tipoReporte === 'completo' ? 'Completo (con Hash)' : 'Resumen Ejecutivo'}</span></div>
                </div>
                <div className="flex gap-2 mb-3">
                    <input type="date" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-full bg-gray-50 text-sm outline-none" value={periodo.inicio} onChange={e => setPeriodo(p => ({ ...p, inicio: e.target.value }))} />
                    <input type="date" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-full bg-gray-50 text-sm outline-none" value={periodo.fin} onChange={e => setPeriodo(p => ({ ...p, fin: e.target.value }))} />
                </div>
                <div className="flex gap-2 mb-3">
                    <button onClick={() => setFormato('pdf')} className={cn('flex-1 px-3 py-2 rounded-full text-xs font-bold border-[1.5px] cursor-pointer transition-all flex items-center justify-center gap-1', formato === 'pdf' ? 'bg-navy text-white border-navy' : 'bg-transparent text-slate-500 border-gray-200')}><FileText className="w-3.5 h-3.5" /> PDF</button>
                    <button onClick={() => setFormato('excel')} className={cn('flex-1 px-3 py-2 rounded-full text-xs font-bold border-[1.5px] cursor-pointer transition-all flex items-center justify-center gap-1', formato === 'excel' ? 'bg-navy text-white border-navy' : 'bg-transparent text-slate-500 border-gray-200')}><FileSpreadsheet className="w-3.5 h-3.5" /> Excel</button>
                </div>
                <div className="flex gap-2 mb-4">
                    <button onClick={() => setTipoReporte('completo')} className={cn('flex-1 px-3 py-2 rounded-full text-xs font-bold border-[1.5px] cursor-pointer transition-all', tipoReporte === 'completo' ? 'bg-navy text-white border-navy' : 'bg-transparent text-slate-500 border-gray-200')}>Completo</button>
                    <button onClick={() => setTipoReporte('resumen')} className={cn('flex-1 px-3 py-2 rounded-full text-xs font-bold border-[1.5px] cursor-pointer transition-all', tipoReporte === 'resumen' ? 'bg-navy text-white border-navy' : 'bg-transparent text-slate-500 border-gray-200')}>Resumen</button>
                </div>
                <h6 className="text-amber-500 font-bold uppercase text-xs mb-3 tracking-[0.08em]">VISTA PREVIA</h6>
                <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 min-h-[200px]">
                    {!generated ? (
                        <div className="flex flex-col items-center justify-center text-center py-6">
                            <div className="w-[60%] h-1 bg-navy rounded mb-3" /><div className="w-[60%] h-0.5 bg-gray-200 rounded mb-4" /><div className="w-[80%] h-2 bg-amber-200 rounded mb-2" /><div className="w-[70%] h-0.5 bg-gray-200 rounded mb-2" /><div className="w-[60%] h-0.5 bg-gray-200 rounded mb-6" />
                            <div className="w-[50px] h-[50px] rounded-full border-2 border-amber-500 flex items-center justify-center"><span className="text-amber-500 text-[0.55rem] font-bold">FIRMA DIGITAL</span></div>
                        </div>
                    ) : preview.length === 0 ? (
                        <div className="text-center py-6"><Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-slate-400 text-sm">Sin datos para este periodo</p></div>
                    ) : (
                        <div>
                            <div className="w-20 h-[3px] bg-navy rounded mb-2" /><h6 className="font-bold text-navy text-sm mb-2">CERTIFICADO DE REGISTRO</h6>
                            <table className="w-full"><thead><tr><th className="text-[0.7rem] font-bold text-navy pb-1 text-left">EMPLEADO</th><th className="text-[0.7rem] font-bold text-navy pb-1 text-right">HORAS</th></tr></thead><tbody className="divide-y divide-gray-50">{preview.map((row, i) => (<tr key={i}><td className="text-[0.8rem] text-navy py-1.5">{row.empleado}</td><td className="text-[0.8rem] text-navy text-right font-mono py-1.5">{row.horas_totales}</td></tr>))}</tbody></table>
                            <div className="text-center mt-3"><div className="w-[50px] h-[50px] rounded-full border-2 border-amber-500 inline-flex items-center justify-center"><span className="text-amber-500 font-bold text-[0.5rem]">FIRMA DIGITAL</span></div></div>
                        </div>
                    )}
                </div>
                <button onClick={generated ? handleDownload : generatePreview} disabled={loading || downloading}
                    className="w-full py-3.5 rounded-full font-bold text-white mb-6 border-none cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg shadow-lg shadow-amber-500/25">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" />{loadingProgress ? `${loadingProgress.loaded} / ${loadingProgress.total} meses` : 'Procesando...'}</> : downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : generated ? <><Download className="w-5 h-5" /> Descargar Informe</> : <><BarChart3 className="w-5 h-5" /> Generar Informe Oficial</>}
                </button>
            </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    );
}
