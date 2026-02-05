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
        const colors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-danger', 'bg-info'];
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
        <div className="fade-in-up pb-5">

            {/* ============================================
                HEADER MÓVIL (como Figma: "Equipo" + "X Total")
            ============================================ */}
            <div className="d-lg-none bg-dark text-white px-3 py-3 mb-4 rounded-bottom-4 shadow-sm"
                style={{ marginLeft: '-1rem', marginRight: '-1rem', marginTop: '-1rem' }}>
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="fw-bold mb-0">Equipo</h4>
                    <span className="text-white-50">{totalCount} Total</span>
                </div>
            </div>

            {/* ============================================
                HEADER DESKTOP
            ============================================ */}
            <div className="d-none d-lg-flex justify-content-between align-items-center mb-4">
                <div>
                    <h6 className="text-primary fw-bold text-uppercase small mb-1 tracking-wide">Gestión</h6>
                    <h2 className="fw-bold text-dark mb-0">Directorio de Personal</h2>
                </div>

                <div className="d-flex gap-3 align-items-center">
                    {/* Buscador Desktop */}
                    <div className="position-relative" style={{ width: '280px' }}>
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                        <input
                            type="text"
                            className="form-control ps-5 bg-light border-0 rounded-pill"
                            placeholder="Buscar por nombre, DNI..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        />
                    </div>

                    {/* Botón Nuevo Empleado */}
                    <button
                        onClick={handleOpenCreate}
                        className="btn btn-dark rounded-pill px-4 fw-bold d-flex align-items-center gap-2 shadow-sm"
                    >
                        <i className="bi bi-plus-lg"></i>
                        Nuevo Empleado
                    </button>
                </div>
            </div>

            {/* ============================================
                BUSCADOR + FILTROS MÓVIL
            ============================================ */}
            <div className="d-lg-none mb-4">
                {/* Buscador */}
                <div className="position-relative mb-3">
                    <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    <input
                        type="text"
                        className="form-control ps-5 border rounded-pill py-2"
                        placeholder="Buscar empleado..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    />
                </div>

                {/* Filtros */}
                <div className="d-flex gap-2">
                    <button
                        className={`btn btn-sm rounded-pill px-3 ${filter === 'todos' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => { setFilter('todos'); setCurrentPage(1); }}
                    >
                        Todos
                    </button>
                    <button
                        className={`btn btn-sm rounded-pill px-3 ${filter === 'activo' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => { setFilter('activo'); setCurrentPage(1); }}
                    >
                        Activos
                    </button>
                    <button
                        className={`btn btn-sm rounded-pill px-3 ${filter === 'baja' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => { setFilter('baja'); setCurrentPage(1); }}
                    >
                        Bajas
                    </button>
                </div>
            </div>

            {/* ============================================
                VISTA DESKTOP: TABLA (con columna Departamento)
            ============================================ */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden d-none d-lg-block">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4 py-3 text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>Empleado</th>
                                <th className="py-3 text-secondary small text-uppercase fw-bold">Cargo / Rol</th>
                                <th className="py-3 text-secondary small text-uppercase fw-bold">Departamento</th>
                                <th className="py-3 text-secondary small text-uppercase fw-bold">Estado</th>
                                <th className="py-3 text-center text-secondary small text-uppercase fw-bold">Contacto</th>
                                <th className="pe-4 py-3 text-end text-secondary small text-uppercase fw-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Cargando...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedEmpleados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-5 text-muted">
                                        <i className="bi bi-people fs-1 d-block mb-2 opacity-50"></i>
                                        {search ? 'No se encontraron empleados' : 'No hay empleados registrados'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedEmpleados.map((emp) => (
                                    <tr key={emp.id}>
                                        {/* Empleado + Email */}
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className={`${getAvatarColor(emp.nombre_completo)} rounded-circle d-flex align-items-center justify-content-center text-white fw-bold`}
                                                    style={{ width: '42px', height: '42px', fontSize: '0.85rem' }}>
                                                    {getInitials(emp.nombre_completo)}
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{emp.nombre_completo || 'Sin nombre'}</div>
                                                    <small className="text-primary">{emp.email || 'Sin email'}</small>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Cargo */}
                                        <td>
                                            <span className="text-dark">{emp.puesto || 'Sin definir'}</span>
                                        </td>

                                        {/* Departamento */}
                                        <td>
                                            <span className="text-secondary">{emp.departamento || 'Sin asignar'}</span>
                                        </td>

                                        {/* Estado */}
                                        <td>
                                            <span className={`badge rounded-pill px-3 py-2 ${emp.activo !== false
                                                ? 'bg-success bg-opacity-10 text-success border border-success'
                                                : 'bg-secondary bg-opacity-10 text-secondary border border-secondary'
                                                }`}>
                                                {emp.activo !== false ? 'ACTIVO' : 'BAJA'}
                                            </span>
                                        </td>

                                        {/* Contacto */}
                                        <td className="text-center">
                                            <div className="d-flex gap-2 justify-content-center">
                                                {emp.email && (
                                                    <a
                                                        href={`mailto:${emp.email}`}
                                                        className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
                                                        style={{ width: '32px', height: '32px' }}
                                                        title="Enviar email"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <i className="bi bi-envelope-fill text-primary"></i>
                                                    </a>
                                                )}
                                                {emp.telefono && (
                                                    <a
                                                        href={`tel:${emp.telefono}`}
                                                        className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
                                                        style={{ width: '32px', height: '32px' }}
                                                        title="Llamar"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <i className="bi bi-telephone-fill text-success"></i>
                                                    </a>
                                                )}
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="pe-4 text-end">
                                            <button
                                                onClick={() => handleOpenEdit(emp.id)}
                                                className="btn btn-link text-warning p-0"
                                                title="Editar"
                                            >
                                                <i className="bi bi-pencil-fill fs-5"></i>
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
                    <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                        <small className="text-muted">
                            Mostrando {paginatedEmpleados.length} de {filteredEmpleados.length} empleados
                        </small>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                ← Anterior
                            </button>
                            <button
                                className="btn btn-sm btn-outline-dark rounded-pill px-3"
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
            <div className="d-lg-none">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                ) : paginatedEmpleados.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="bi bi-people fs-1 d-block mb-2 opacity-50"></i>
                        {search ? 'No se encontraron empleados' : 'No hay empleados registrados'}
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {paginatedEmpleados.map((emp) => (
                            <div key={emp.id} className="card border-0 shadow-sm rounded-4 p-3">
                                <div className="d-flex align-items-center gap-3">
                                    {/* Avatar */}
                                    <div className={`${getAvatarColor(emp.nombre_completo)} rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0`}
                                        style={{ width: '50px', height: '50px' }}>
                                        {getInitials(emp.nombre_completo)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-grow-1 min-w-0">
                                        <h6 className="fw-bold text-dark mb-0 text-truncate">{emp.nombre_completo || 'Sin nombre'}</h6>
                                        <small className="text-muted d-block">{emp.puesto || 'Sin puesto'}</small>
                                        <span className={`badge rounded-pill mt-1 ${emp.activo !== false
                                            ? 'bg-success bg-opacity-10 text-success'
                                            : 'bg-secondary bg-opacity-10 text-secondary'
                                            }`} style={{ fontSize: '0.65rem' }}>
                                            {emp.activo !== false ? 'ACTIVO' : 'BAJA'}
                                        </span>
                                    </div>

                                    {/* Botones de acción: Email + Teléfono */}
                                    <div className="d-flex gap-2 flex-shrink-0">
                                        {emp.email && (
                                            <a
                                                href={`mailto:${emp.email}`}
                                                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: '40px', height: '40px' }}
                                                title="Enviar email"
                                            >
                                                <i className="bi bi-envelope-fill text-primary"></i>
                                            </a>
                                        )}
                                        {emp.telefono && (
                                            <a
                                                href={`tel:${emp.telefono}`}
                                                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: '40px', height: '40px' }}
                                                title="Llamar"
                                            >
                                                <i className="bi bi-telephone-fill text-success"></i>
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
                    <div className="d-flex justify-content-center gap-2 mt-4">
                        <button
                            className="btn btn-outline-secondary rounded-pill px-3"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            ←
                        </button>
                        <span className="d-flex align-items-center px-3 text-muted small">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            className="btn btn-outline-dark rounded-pill px-3"
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
                className="d-lg-none btn btn-primary position-fixed bottom-0 end-0 m-4 rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                style={{ width: '60px', height: '60px', zIndex: 1050, marginBottom: '80px' }}
            >
                <i className="bi bi-plus-lg fs-3 text-white"></i>
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
