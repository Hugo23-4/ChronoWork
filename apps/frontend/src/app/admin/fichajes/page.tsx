'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type ProcessedFichaje = {
    id: string;
    empleado_nombre: string;
    date: string;
    entry: string;
    exit: string;
    total: string;
    status: 'valid' | 'progress' | 'incident';
};

// Genera las últimas N etiquetas de mes (formato: "YYYY-MM")
function getLastMonths(n: number): { label: string; value: string }[] {
    const months: { label: string; value: string }[] = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        months.push({ label: label.charAt(0).toUpperCase() + label.slice(1), value });
    }
    return months;
}

export default function AdminFichajesPage() {
    const { user } = useAuth();
    const [fichajes, setFichajes] = useState<ProcessedFichaje[]>([]);
    const [loading, setLoading] = useState(true);
    const monthOptions = getLastMonths(6);
    const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value); // Mes actual

    useEffect(() => {
        fetchAllFichajes(selectedMonth);
    }, [user, selectedMonth]);

    const fetchAllFichajes = async (month: string) => {
        setLoading(true);
        try {
            const [year, mon] = month.split('-');
            const from = `${year}-${mon}-01`;
            const lastDay = new Date(Number(year), Number(mon), 0).getDate();
            const to = `${year}-${mon}-${lastDay}`;

            const { data, error } = await supabase
                .from('fichajes')
                .select('*, empleados_info(nombre_completo)')
                .gte('fecha', from)
                .lte('fecha', to)
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) throw error;
            if (data) setFichajes(processFichajes(data));
        } catch (err) {
            console.error('Error cargando fichajes:', err);
        } finally {
            setLoading(false);
        }
    };

    const processFichajes = (data: any[]) => {
        return data.map((f) => {
            try {
                let start: Date;
                if (f.hora_entrada.includes('T') || f.hora_entrada.includes('Z')) {
                    start = new Date(f.hora_entrada);
                } else {
                    const [hours, minutes, seconds] = f.hora_entrada.split(':').map(Number);
                    start = new Date(f.fecha);
                    start.setHours(hours, minutes, seconds || 0);
                }

                let end: Date | null = null;
                if (f.hora_salida) {
                    if (f.hora_salida.includes('T') || f.hora_salida.includes('Z')) {
                        end = new Date(f.hora_salida);
                    } else {
                        const [hours, minutes, seconds] = f.hora_salida.split(':').map(Number);
                        end = new Date(f.fecha);
                        end.setHours(hours, minutes, seconds || 0);
                    }
                }

                const now = new Date();

                const dateStr = isNaN(start.getTime())
                    ? f.fecha
                    : start.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

                const entryTime = isNaN(start.getTime())
                    ? f.hora_entrada
                    : start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                const exitTime = !end || isNaN(end.getTime())
                    ? (f.hora_salida || '--:--')
                    : end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                let duration = '--h --m';
                if (end && !isNaN(end.getTime()) && !isNaN(start.getTime())) {
                    const diff = end.getTime() - start.getTime();
                    const h = Math.floor(diff / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    duration = `${h}h ${m.toString().padStart(2, '0')}m`;
                } else if (!f.hora_salida && !isNaN(start.getTime())) {
                    const isToday = start.toDateString() === now.toDateString();
                    if (isToday) {
                        const diff = now.getTime() - start.getTime();
                        const h = Math.floor(diff / (1000 * 60 * 60));
                        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        duration = `${h}h ${m}m`;
                    }
                }

                let status: 'valid' | 'progress' | 'incident' = 'valid';
                if (!f.hora_salida && !isNaN(start.getTime())) {
                    const isToday = start.toDateString() === now.toDateString();
                    status = isToday ? 'progress' : 'incident';
                }

                return {
                    id: f.id,
                    empleado_nombre: f.empleados_info?.nombre_completo || 'Sin nombre',
                    date: dateStr.charAt(0).toUpperCase() + dateStr.slice(1),
                    entry: entryTime,
                    exit: exitTime,
                    total: duration,
                    status: status
                };
            } catch (parseError) {
                console.error('Error parsing fichaje:', parseError, f);
                return {
                    id: f.id,
                    empleado_nombre: f.empleados_info?.nombre_completo || 'Sin nombre',
                    date: f.fecha || '-',
                    entry: f.hora_entrada || '-',
                    exit: f.hora_salida || '--:--',
                    total: '--h --m',
                    status: 'incident' as const
                };
            }
        });
    };

    const handleExportPDF = () => alert('📄 Exportación a PDF - Funcionalidad en desarrollo');
    const handleExportExcel = () => alert('📊 Exportación a Excel - Funcionalidad en desarrollo');

    const getBadgeClass = (status: string) => {
        switch (status) {
            case 'valid': return 'bg-success bg-opacity-10 text-success';
            case 'incident': return 'bg-danger bg-opacity-10 text-danger';
            case 'progress': return 'bg-primary bg-opacity-10 text-primary border border-primary';
            default: return 'bg-secondary';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'valid': return 'VÁLIDO';
            case 'incident': return 'INCIDENCIA';
            case 'progress': return 'EN CURSO';
            default: return '-';
        }
    };

    return (
        <>
            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <h2 className="fw-bold mb-0 text-dark">Fichajes del Personal</h2>

                <div className="d-flex gap-2">
                    <select
                        className="form-select fw-bold border-0 shadow-sm rounded-pill px-4"
                        style={{ width: 'auto', minWidth: '180px' }}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        {monthOptions.map((m) => (
                            <option key={m.value} value={m.value}>📅 {m.label}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleExportExcel}
                        className="btn btn-success fw-bold rounded-pill px-4 d-none d-md-flex align-items-center gap-2"
                    >
                        <i className="bi bi-file-earmark-excel"></i>
                        Excel
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="btn btn-danger fw-bold rounded-pill px-4 d-none d-md-flex align-items-center gap-2"
                    >
                        <i className="bi bi-file-pdf"></i>
                        PDF
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                </div>
            ) : fichajes.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                    <i className="bi bi-clock-history display-1 text-muted opacity-25"></i>
                    <h5 className="mt-3 text-muted">No hay fichajes registrados</h5>
                    <p className="text-muted small">Los fichajes aparecerán aquí cuando los empleados registren entradas</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden d-none d-md-block">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="py-3 text-secondary small text-uppercase fw-bold">Empleado</th>
                                        <th className="py-3 text-secondary small text-uppercase fw-bold">Fecha</th>
                                        <th className="py-3 text-secondary small text-uppercase fw-bold">Entrada</th>
                                        <th className="py-3 text-secondary small text-uppercase fw-bold">Salida</th>
                                        <th className="py-3 text-secondary small text-uppercase fw-bold">Total</th>
                                        <th className="py-3 text-secondary small text-uppercase fw-bold">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fichajes.map((f) => (
                                        <tr key={f.id}>
                                            <td className="py-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                                        style={{ width: '32px', height: '32px' }}>
                                                        <i className="bi bi-person-fill text-primary small"></i>
                                                    </div>
                                                    <span className="fw-semibold">{f.empleado_nombre}</span>
                                                </div>
                                            </td>
                                            <td className="py-3">{f.date}</td>
                                            <td className="py-3 fw-bold">{f.entry}</td>
                                            <td className="py-3 fw-bold">{f.exit}</td>
                                            <td className="py-3">{f.total}</td>
                                            <td className="py-3">
                                                <span className={`badge rounded-pill px-3 py-1 ${getBadgeClass(f.status)}`}>
                                                    {getStatusLabel(f.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="d-md-none">
                        <div className="d-grid gap-3 pb-5">
                            {fichajes.map((f) => (
                                <div key={f.id} className="card border-0 shadow-sm rounded-4 p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: '36px', height: '36px' }}>
                                                <i className="bi bi-person-fill text-primary"></i>
                                            </div>
                                            <div>
                                                <div className="fw-bold">{f.empleado_nombre}</div>
                                                <small className="text-muted">{f.date}</small>
                                            </div>
                                        </div>
                                        <span className={`badge rounded-pill px-2 py-1 small ${getBadgeClass(f.status)}`}>
                                            {getStatusLabel(f.status)}
                                        </span>
                                    </div>

                                    <div className="d-flex justify-content-between mt-2 small">
                                        <div>
                                            <div className="text-muted">Entrada</div>
                                            <div className="fw-bold">{f.entry}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted">Salida</div>
                                            <div className="fw-bold">{f.exit}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted">Total</div>
                                            <div className="fw-semibold">{f.total}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
