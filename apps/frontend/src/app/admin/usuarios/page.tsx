'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import EmployeeFormModal from '@/components/admin/EmployeeFormModal';
import { Search, Plus, Mail, Phone, Pencil, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const FILTERS = [
  { key: 'todos' as const, label: 'Todos' },
  { key: 'activo' as const, label: 'Activos' },
  { key: 'baja' as const, label: 'Bajas' },
];

export default function UsuariosPage() {
  const { profile } = useAuth();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'activo' | 'baja'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  useEffect(() => { fetchEmpleados(); }, [currentPage, filter, search, profile?.empresa_id]);

  const fetchEmpleados = async () => {
    if (!profile?.empresa_id) return;
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = currentPage * itemsPerPage - 1;
    let query = supabase
      .from('empleados_info')
      .select('*, roles(nombre)', { count: 'exact' })
      .eq('empresa_id', profile.empresa_id)
      .order('nombre_completo', { ascending: true })
      .range(from, to);
    if (filter === 'activo') query = query.eq('activo', true);
    else if (filter === 'baja') query = query.eq('activo', false);
    if (search) query = query.or(`nombre_completo.ilike.%${search}%,dni.ilike.%${search}%,email.ilike.%${search}%`);
    const { data, error, count } = await query;
    if (error) console.error('Error fetching empleados:', error);
    if (data) { setEmpleados(data); setTotalCount(count || 0); }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const paginatedEmpleados = empleados;

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';

  const avatarGradients = [
    'from-[#007AFF] to-[#5856D6]',
    'from-[#34C759] to-[#30B0C7]',
    'from-[#FF9500] to-[#FF3B30]',
    'from-[#AF52DE] to-[#FF2D55]',
    'from-[#5AC8FA] to-[#007AFF]',
  ];
  const getAvatarGradient = (name: string) => avatarGradients[name ? name.charCodeAt(0) % avatarGradients.length : 0];

  const handleOpenCreate = () => { setSelectedEmployeeId(null); setIsModalOpen(true); };
  const handleOpenEdit = (id: string) => { setSelectedEmployeeId(id); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedEmployeeId(null); };
  const handleSaveEmployee = () => { fetchEmpleados(); handleCloseModal(); };

  return (
    <div className="animate-fade-up">

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between mb-4 px-1">
        <div>
          <h1 className="cw-title-1 text-[--color-label-primary] dark:text-white">Equipo</h1>
          <p className="text-[13px] text-[--color-label-secondary] dark:text-[#aeaeb2] mt-0.5">{totalCount} en total</p>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex justify-between items-end mb-7">
        <div>
          <p className="text-[12px] font-medium text-[--color-label-secondary] dark:text-[#aeaeb2] mb-2">Gestión</p>
          <h1 className="cw-title-1 text-[--color-label-primary] dark:text-white">Directorio de personal</h1>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative w-[300px]">
            <Search className="w-4 h-4 absolute top-1/2 left-3.5 -translate-y-1/2 text-[--color-label-secondary]" />
            <input
              type="text"
              className="w-full pl-10 pr-4 h-10 bg-systemGray-6 dark:bg-white/8 border-0 rounded-[14px] text-[14px] text-[--color-label-primary] dark:text-white placeholder:text-[--color-label-tertiary] outline-none focus:ring-[3px] focus:ring-ios-blue/25 transition-all"
              placeholder="Buscar por nombre, DNI, email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-ios-blue text-white px-4 h-10 rounded-full font-semibold text-[14px] border-none cursor-pointer hover:bg-[#0066D9] active:scale-[0.97] transition-all flex items-center gap-2"
            style={{ boxShadow: '0 4px 14px rgba(0,122,255,0.25)' }}
          >
            <Plus className="w-4 h-4" /> Nuevo empleado
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Mobile search */}
        <div className="lg:hidden relative w-full">
          <Search className="w-4 h-4 absolute top-1/2 left-3.5 -translate-y-1/2 text-[--color-label-secondary]" />
          <input
            type="text"
            className="w-full pl-10 pr-4 h-10 bg-systemGray-6 dark:bg-white/8 border-0 rounded-[14px] text-[14px] text-[--color-label-primary] dark:text-white placeholder:text-[--color-label-tertiary] outline-none focus:ring-[3px] focus:ring-ios-blue/25 transition-all"
            placeholder="Buscar empleado…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* Segmented control */}
        <div className="cw-segmented w-full sm:w-auto">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              data-active={filter === f.key}
              onClick={() => { setFilter(f.key); setCurrentPage(1); }}
              className="cw-segmented-item flex-1 sm:flex-initial"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="cw-surface overflow-hidden hidden lg:block">
        <table className="w-full">
          <thead className="bg-systemGray-6/50 dark:bg-white/3 border-b border-[--color-separator] dark:border-white/8">
            <tr>
              {['Empleado', 'Cargo', 'Departamento', 'Estado', 'Contacto', ''].map((h, i) => (
                <th
                  key={i}
                  className={cn(
                    'py-3 px-5 text-[--color-label-secondary] dark:text-[#aeaeb2] text-[12px] font-medium text-left',
                    i === 4 && 'text-center',
                    i === 5 && 'text-right',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[--color-separator] dark:divide-white/8">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12"><Loader2 className="w-6 h-6 text-ios-blue animate-spin mx-auto" /></td></tr>
            ) : paginatedEmpleados.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-14 text-[--color-label-secondary] dark:text-[#aeaeb2]">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-[15px] font-medium text-[--color-label-primary] dark:text-white">{search ? 'Sin resultados' : 'Aún no hay empleados'}</p>
                <p className="text-[13px] mt-1">{search ? 'Prueba con otra búsqueda.' : 'Crea el primero con el botón superior.'}</p>
              </td></tr>
            ) : paginatedEmpleados.map((emp) => (
              <tr key={emp.id} className="group hover:bg-systemGray-6/40 dark:hover:bg-white/3 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-[12px] shrink-0 bg-gradient-to-br', getAvatarGradient(emp.nombre_completo))}>
                      {getInitials(emp.nombre_completo)}
                    </div>
                    <div>
                      <div className="font-semibold text-[14px] text-[--color-label-primary] dark:text-white">{emp.nombre_completo || 'Sin nombre'}</div>
                      <div className="text-[12px] text-[--color-label-secondary] dark:text-[#aeaeb2]">{emp.email || 'Sin email'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-[14px] text-[--color-label-primary] dark:text-white">{emp.puesto || '—'}</td>
                <td className="px-5 py-4 text-[14px] text-[--color-label-secondary] dark:text-[#aeaeb2]">{emp.departamento || '—'}</td>
                <td className="px-5 py-4">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                    emp.activo !== false
                      ? 'bg-[#34C759]/12 text-[#1F8C3D] dark:text-[#34C759]'
                      : 'bg-systemGray-5 dark:bg-white/8 text-[--color-label-secondary] dark:text-[#aeaeb2]'
                  )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', emp.activo !== false ? 'bg-[#34C759]' : 'bg-systemGray-2')} />
                    {emp.activo !== false ? 'Activo' : 'Baja'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-1.5 justify-center">
                    {emp.email && (
                      <a href={`mailto:${emp.email}`} title="Enviar email"
                        className="w-8 h-8 rounded-full bg-systemGray-6 dark:bg-white/6 flex items-center justify-center hover:bg-ios-blue/12 transition-colors">
                        <Mail className="w-3.5 h-3.5 text-ios-blue" />
                      </a>
                    )}
                    {emp.telefono && (
                      <a href={`tel:${emp.telefono}`} title="Llamar"
                        className="w-8 h-8 rounded-full bg-systemGray-6 dark:bg-white/6 flex items-center justify-center hover:bg-[#34C759]/15 transition-colors">
                        <Phone className="w-3.5 h-3.5 text-[#34C759]" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => handleOpenEdit(emp.id)}
                    title="Editar"
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-systemGray-6 dark:bg-white/6 hover:bg-ios-blue/12 hover:text-ios-blue text-[--color-label-secondary] w-8 h-8 rounded-full inline-flex items-center justify-center cursor-pointer border-none"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && totalCount > 0 && (
          <div className="flex justify-between items-center px-5 py-3 border-t border-[--color-separator] dark:border-white/8">
            <small className="text-[12px] text-[--color-label-secondary] dark:text-[#aeaeb2]">Mostrando {paginatedEmpleados.length} de {totalCount}</small>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="text-[13px] py-1.5 px-3 rounded-full bg-systemGray-6 dark:bg-white/6 hover:bg-systemGray-5 dark:hover:bg-white/10 border-0 font-medium text-[--color-label-primary] dark:text-white cursor-pointer transition-colors disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(p => p + 1)}
                className="text-[13px] py-1.5 px-3 rounded-full bg-ios-blue text-white border-0 font-semibold cursor-pointer hover:bg-[#0066D9] transition-colors disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {loading ? (
          <div className="text-center py-10"><Loader2 className="w-6 h-6 text-ios-blue animate-spin mx-auto" /></div>
        ) : paginatedEmpleados.length === 0 ? (
          <div className="text-center py-12 text-[--color-label-secondary] dark:text-[#aeaeb2]">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-[15px] font-medium text-[--color-label-primary] dark:text-white">{search ? 'Sin resultados' : 'Sin empleados'}</p>
            <p className="text-[13px] mt-1">{search ? 'Prueba con otra búsqueda.' : 'Crea el primero con el botón flotante.'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {paginatedEmpleados.map((emp) => (
              <div key={emp.id} className="cw-surface p-3.5">
                <div className="flex items-center gap-3">
                  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0 bg-gradient-to-br', getAvatarGradient(emp.nombre_completo))}>
                    {getInitials(emp.nombre_completo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px] text-[--color-label-primary] dark:text-white truncate">{emp.nombre_completo || 'Sin nombre'}</div>
                    <div className="text-[12px] text-[--color-label-secondary] dark:text-[#aeaeb2] truncate">{emp.puesto || 'Sin puesto'}</div>
                    <span className={cn('inline-flex items-center gap-1.5 mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      emp.activo !== false ? 'bg-[#34C759]/12 text-[#1F8C3D] dark:text-[#34C759]' : 'bg-systemGray-5 dark:bg-white/8 text-[--color-label-secondary]'
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', emp.activo !== false ? 'bg-[#34C759]' : 'bg-systemGray-2')} />
                      {emp.activo !== false ? 'Activo' : 'Baja'}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {emp.email && (
                      <a href={`mailto:${emp.email}`} title="Email"
                        className="w-10 h-10 rounded-full bg-systemGray-6 dark:bg-white/6 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-ios-blue" />
                      </a>
                    )}
                    <button onClick={() => handleOpenEdit(emp.id)} title="Editar"
                      className="w-10 h-10 rounded-full bg-ios-blue/12 flex items-center justify-center cursor-pointer border-none">
                      <Pencil className="w-4 h-4 text-ios-blue" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-5">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
              className="w-10 h-10 rounded-full bg-systemGray-6 dark:bg-white/6 border-0 flex items-center justify-center cursor-pointer disabled:opacity-40">←</button>
            <span className="flex items-center px-3 text-[--color-label-secondary] dark:text-[#aeaeb2] text-[13px]">{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
              className="w-10 h-10 rounded-full bg-ios-blue text-white border-none flex items-center justify-center cursor-pointer disabled:opacity-40">→</button>
          </div>
        )}
      </div>

      {/* FAB Mobile */}
      <button
        onClick={handleOpenCreate}
        className="lg:hidden fixed bottom-[88px] right-4 w-14 h-14 bg-ios-blue text-white rounded-full flex items-center justify-center border-none cursor-pointer hover:bg-[#0066D9] active:scale-95 transition-all z-40"
        style={{ boxShadow: '0 8px 24px rgba(0,122,255,0.35)' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      <EmployeeFormModal employeeId={selectedEmployeeId} isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveEmployee} />
    </div>
  );
}
