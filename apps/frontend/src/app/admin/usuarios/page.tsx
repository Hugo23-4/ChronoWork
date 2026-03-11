'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import EmployeeFormModal from '@/components/admin/EmployeeFormModal';

interface Empleado {
    id: string;
    nombre_completo: string;
    email: string;
    dni: string;
    puesto: string;
    telefono: string;
    departamento: string;
    rol: string;
    rol_id: number;
    roles?: { nombre: string };
    activo?: boolean;
}

export default function UsuariosPage() {
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'todos' | 'activo' | 'baja'>('todos');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;

    // Estados para el modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    useEffect(() => {
        fetchEmpleados();
    }, [currentPage, filter]);

    const fetchEmpleados = async () => {
        setLoading(true);

        const { data, error, count } = await supabase
            .from('empleados_info')
            .select('*, roles(nombre)', { count: 'exact' })
            .order('nombre_completo', { ascending: true });

        if (error) {
            console.error('Error fetching empleados:', error);
        }

        if (data) {
            setEmpleados(data);
            setTotalCount(count || data.length);
        }
        setLoading(false);
    };

    // Filtrar empleados
    const filteredEmpleados = empleados.filter(emp => {
        const searchLower = search.toLowerCase();
        const matchesSearch = !search ||
            emp.nombre_completo?.toLowerCase().includes(searchLower) ||
            emp.dni?.toLowerCase().includes(searchLower) ||
            emp.email?.toLowerCase().includes(searchLower) ||
            emp.puesto?.toLowerCase().includes(searchLower) ||
            emp.departamento?.toLowerCase().includes(searchLower);

        let matchesFilter = true;
        if (filter === 'activo') {
            matchesFilter = emp.activo !== false;
        } else if (filter === 'baja') {
            matchesFilter = emp.activo === false;
        }

        return matchesSearch && matchesFilter;
    });

    // Paginación
    const totalPages = Math.ceil(filteredEmpleados.length / itemsPerPage);
    const paginatedEmpleados = filteredEmpleados.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Obtener iniciales para avatar
    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    // Colores de avatar según inicial
    const getAvatarColor = (name: string) => {
        const colors = ['bg-chrono-blue', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-sky-500'];
        const index = name ? name.charCodeAt(0) % colors.length : 0;
        return colors[index];
    };

    // Handlers para modal
    const handleOpenCreate = () => {
        setSelectedEmployeeId(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (id: string) => {
        setSelectedEmployeeId(id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEmployeeId(null);
    };

    const handleSaveEmployee = () => {
        fetchEmpleados(); // Recargar lista
        handleCloseModal();
    };

    return (
        <div className="fade-in-up pb-6">

            {/* ============================================
                HEADER MÓVIL (como Figma: "Equipo" + "X Total")
            ============================================ */}
            <div className="lg:hidden bg-navy text-white px-3 py-3 mb-4 rounded-b-2xl shadow-sm"
                style={{ marginLeft: '-1rem', marginRight: '-1rem', marginTop: '-1rem' }}>
                <div className="flex justify-between items-center">
                    <h4 className="font-bold mb-0">Equipo</h4>
                    <span className="text-white/50">{totalCount} Total</span>
                </div>
            </div>

            {/* ============================================
                HEADER DESKTOP
            ============================================ */}
            <div className="hidden lg:flex justify-between items-center mb-4">
                <div>
                    <h6 className="text-chrono-blue font-bold uppercase text-sm mb-1 tracking-wide">Gestión</h6>
                    <h2 className="font-bold text-navy mb-0">Directorio de Personal</h2>
                </div>

                <div className="flex gap-3 items-center">
                    {/* Buscador Desktop */}
                    <div className="relative" style={{ width: '280px' }}>
                        <i className="bi bi-search absolute top-1/2 left-0 -translate-y-1/2 ml-3 text-slate-400"></i>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm ps-5 bg-gray-50 border-0 rounded-full"
                            placeholder="Buscar por nombre, DNI..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        />
                    </div>

                    {/* Botón Nuevo Empleado */}
                    <button
                        onClick={handleOpenCreate}
                        className="bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none rounded-full px-4 font-bold flex items-center gap-2 shadow-sm"
                    >
                        <i className="bi bi-plus-lg"></i>
                        Nuevo Empleado
                    </button>
                </div>
            </div>

            {/* ============================================
                BUSCADOR + FILTROS MÓVIL
            ============================================ */}
            <div className="lg:hidden mb-4">
                {/* Buscador */}
                <div className="relative mb-3">
                    <i className="bi bi-search absolute top-1/2 left-0 -translate-y-1/2 ml-3 text-slate-400"></i>
                    <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:border-chrono-blue focus:ring-2 focus:ring-chrono-blue/10 focus:bg-white outline-none transition-colors text-sm ps-5 border rounded-full py-2"
                        placeholder="Buscar empleado..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    />
                </div>

                {/* Filtros */}
                <div className="flex gap-2">
                    <button
                        className={`text-sm py-1.5 px-3 rounded-full px-3 ${filter === 'todos' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => { setFilter('todos'); setCurrentPage(1); }}
                    >
                        Todos
                    </button>
                    <button
                        className={`text-sm py-1.5 px-3 rounded-full px-3 ${filter === 'activo' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => { setFilter('activo'); setCurrentPage(1); }}
                    >
                        Activos
                    </button>
                    <button
                        className={`text-sm py-1.5 px-3 rounded-full px-3 ${filter === 'baja' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => { setFilter('baja'); setCurrentPage(1); }}
                    >
                        Bajas
                    </button>
                </div>
            </div>

            {/* ============================================
                VISTA DESKTOP: TABLA (con columna Departamento)
            ============================================ */}
            <div className="card border-0 shadow-sm rounded-2xl overflow-hidden hidden lg:block">
                <div className="table-responsive">
                    <table className="w-full table-hover align-middle mb-0">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="ps-4 py-3 text-slate-500 text-sm uppercase font-bold" style={{ letterSpacing: '0.05em' }}>Empleado</th>
                                <th className="py-3 text-slate-500 text-sm uppercase font-bold">Cargo / Rol</th>
                                <th className="py-3 text-slate-500 text-sm uppercase font-bold">Departamento</th>
                                <th className="py-3 text-slate-500 text-sm uppercase font-bold">Estado</th>
                                <th className="py-3 text-center text-slate-500 text-sm uppercase font-bold">Contacto</th>
                                <th className="pe-4 py-3 text-right text-slate-500 text-sm uppercase font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-6">
                                        <div className="animate-spin text-chrono-blue" role="status">
                                            <span className="sr-only">Cargando...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedEmpleados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-6 text-slate-400">
                                        <i className="bi bi-people text-4xl block mb-2 opacity-50"></i>
                                        {search ? 'No se encontraron empleados' : 'No hay empleados registrados'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedEmpleados.map((emp) => (
                                    <tr key={emp.id}>
                                        {/* Empleado + Email */}
                                        <td className="ps-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`${getAvatarColor(emp.nombre_completo)} rounded-full flex items-center justify-center text-white font-bold`}
                                                    style={{ width: '42px', height: '42px', fontSize: '0.85rem' }}>
                                                    {getInitials(emp.nombre_completo)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-navy">{emp.nombre_completo || 'Sin nombre'}</div>
                                                    <small className="text-chrono-blue">{emp.email || 'Sin email'}</small>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Cargo */}
                                        <td>
                                            <span className="text-navy">{emp.puesto || 'Sin definir'}</span>
                                        </td>

                                        {/* Departamento */}
                                        <td>
                                            <span className="text-slate-500">{emp.departamento || 'Sin asignar'}</span>
                                        </td>

                                        {/* Estado */}
                                        <td>
                                            <span className={`badge rounded-full px-3 py-2 ${emp.activo !== false
                                                ? 'bg-emerald-500 bg-opacity-10 text-emerald-500 border border-success'
                                                : 'bg-slate-500 bg-opacity-10 text-slate-500 border border-slate-500'
                                                }`}>
                                                {emp.activo !== false ? 'ACTIVO' : 'BAJA'}
                                            </span>
                                        </td>

                                        {/* Contacto */}
                                        <td className="text-center">
                                            <div className="flex gap-2 justify-center">
                                                {emp.email && (
                                                    <a
                                                        href={`mailto:${emp.email}`}
                                                        className="text-sm py-1.5 px-3 btn-light rounded-full flex items-center justify-center"
                                                        style={{ width: '32px', height: '32px' }}
                                                        title="Enviar email"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <i className="bi bi-envelope-fill text-chrono-blue"></i>
                                                    </a>
                                                )}
                                                {emp.telefono && (
                                                    <a
                                                        href={`tel:${emp.telefono}`}
                                                        className="text-sm py-1.5 px-3 btn-light rounded-full flex items-center justify-center"
                                                        style={{ width: '32px', height: '32px' }}
                                                        title="Llamar"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <i className="bi bi-telephone-fill text-emerald-500"></i>
                                                    </a>
                                                )}
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="pe-4 text-right">
                                            <button
                                                onClick={() => handleOpenEdit(emp.id)}
                                                className="bg-transparent border-none cursor-pointer text-amber-500 p-0"
                                                title="Editar"
                                            >
                                                <i className="bi bi-pencil-fill text-lg"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación Desktop */}
                {!loading && filteredEmpleados.length > 0 && (
                    <div className="flex justify-between items-center p-3 border-t bg-gray-50">
                        <small className="text-slate-400">
                            Mostrando {paginatedEmpleados.length} de {filteredEmpleados.length} empleados
                        </small>
                        <div className="flex gap-2">
                            <button
                                className="text-sm py-1.5 px-3 btn-outline-secondary rounded-full px-3"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                ← Anterior
                            </button>
                            <button
                                className="text-sm py-1.5 px-3 btn-outline-dark rounded-full px-3"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                Siguiente →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================
                VISTA MOBILE: TARJETAS (con teléfono + email)
            ============================================ */}
            <div className="lg:hidden">
                {loading ? (
                    <div className="text-center py-6">
                        <div className="animate-spin text-chrono-blue" role="status">
                            <span className="sr-only">Cargando...</span>
                        </div>
                    </div>
                ) : paginatedEmpleados.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                        <i className="bi bi-people text-4xl block mb-2 opacity-50"></i>
                        {search ? 'No se encontraron empleados' : 'No hay empleados registrados'}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {paginatedEmpleados.map((emp) => (
                            <div key={emp.id} className="card border-0 shadow-sm rounded-2xl p-3">
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className={`${getAvatarColor(emp.nombre_completo)} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
                                        style={{ width: '50px', height: '50px' }}>
                                        {getInitials(emp.nombre_completo)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-grow min-w-0">
                                        <h6 className="font-bold text-navy mb-0 truncate">{emp.nombre_completo || 'Sin nombre'}</h6>
                                        <small className="text-slate-400 block">{emp.puesto || 'Sin puesto'}</small>
                                        <span className={`badge rounded-full mt-1 ${emp.activo !== false
                                            ? 'bg-emerald-500 bg-opacity-10 text-emerald-500'
                                            : 'bg-slate-500 bg-opacity-10 text-slate-500'
                                            }`} style={{ fontSize: '0.65rem' }}>
                                            {emp.activo !== false ? 'ACTIVO' : 'BAJA'}
                                        </span>
                                    </div>

                                    {/* Botones de acción: Email + Teléfono */}
                                    <div className="flex gap-2 shrink-0">
                                        {emp.email && (
                                            <a
                                                href={`mailto:${emp.email}`}
                                                className="bg-white text-navy px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200 rounded-full flex items-center justify-center"
                                                style={{ width: '40px', height: '40px' }}
                                                title="Enviar email"
                                            >
                                                <i className="bi bi-envelope-fill text-chrono-blue"></i>
                                            </a>
                                        )}
                                        {emp.telefono && (
                                            <a
                                                href={`tel:${emp.telefono}`}
                                                className="bg-white text-navy px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200 rounded-full flex items-center justify-center"
                                                style={{ width: '40px', height: '40px' }}
                                                title="Llamar"
                                            >
                                                <i className="bi bi-telephone-fill text-emerald-500"></i>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Paginación Mobile */}
                {!loading && totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <button
                            className="bg-white text-navy border border-gray-200 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer rounded-full px-3"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            ←
                        </button>
                        <span className="flex items-center px-3 text-slate-400 text-sm">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            className="btn btn-outline-dark rounded-full px-3"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            →
                        </button>
                    </div>
                )}
            </div>

            {/* FAB (Mobile) */}
            <button
                onClick={handleOpenCreate}
                className="lg:hidden bg-navy text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-dark transition-colors cursor-pointer border-none fixed bottom-0 right-0 m-4 rounded-full shadow-lg flex items-center justify-center"
                style={{ width: '60px', height: '60px', zIndex: 1050, marginBottom: '80px' }}
            >
                <i className="bi bi-plus-lg text-2xl text-white"></i>
            </button>

            {/* MODAL DE EMPLEADO */}
            <EmployeeFormModal
                employeeId={selectedEmployeeId}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveEmployee}
            />

        </div>
    );
}
