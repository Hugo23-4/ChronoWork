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
  const getAvatarColor = (name: string) => {
    const colors = ['bg-chrono-blue', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-sky-500'];
    return colors[name ? name.charCodeAt(0) % colors.length : 0];
  };

  const handleOpenCreate = () => { setSelectedEmployeeId(null); setIsModalOpen(true); };
  const handleOpenEdit = (id: string) => { setSelectedEmployeeId(id); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedEmployeeId(null); };
  const handleSaveEmployee = () => { fetchEmpleados(); handleCloseModal(); };

  return (
    <div className="animate-fade-up">

      {/* Mobile Header */}
      <div className="lg:hidden bg-navy text-white px-4 py-3 mb-4 rounded-b-2xl shadow-sm -mx-4 -mt-4">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-lg">Equipo</h4>
          <span className="text-white/50 text-sm">{totalCount} Total</span>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex justify-between items-center mb-5">
        <div>
          <p className="text-chrono-blue font-bold uppercase text-xs mb-1 tracking-widest">Gestión</p>
          <h2 className="font-bold text-navy dark:text-zinc-100 text-2xl font-[family-name:var(--font-jakarta)]">Directorio de Personal</h2>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative w-[280px]">
            <Search className="w-4 h-4 absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input type="text" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-chrono-blue/20"
              placeholder="Buscar por nombre, DNI..." value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
          <button onClick={handleOpenCreate}
            className="bg-navy text-white px-5 py-2.5 rounded-full font-bold text-sm border-none cursor-pointer hover:bg-slate-dark transition-colors flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Mobile Search + Filters */}
      <div className="lg:hidden mb-4">
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input type="text" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-full text-sm outline-none focus:border-chrono-blue"
            placeholder="Buscar empleado..." value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
        </div>
        <div className="flex gap-2">
          {(['todos', 'activo', 'baja'] as const).map(f => (
            <button key={f} onClick={() => { setFilter(f); setCurrentPage(1); }}
              className={cn('text-xs py-1.5 px-4 rounded-full font-semibold border-none cursor-pointer transition-colors',
                filter === f ? 'bg-navy text-white' : 'bg-white text-slate-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700')}>
              {f === 'todos' ? 'Todos' : f === 'activo' ? 'Activos' : 'Bajas'}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-2xl overflow-hidden hidden lg:block">
        <table className="w-full">
          <thead className="bg-gray-50/80 dark:bg-zinc-800">
            <tr>
              {['Empleado', 'Cargo / Rol', 'Departamento', 'Estado', 'Contacto', 'Acciones'].map((h, i) => (
                <th key={h} className={cn('py-3.5 px-5 text-slate-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-wider text-left',
                  i === 4 && 'text-center', i === 5 && 'text-right')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10"><Loader2 className="w-7 h-7 text-chrono-blue animate-spin mx-auto" /></td></tr>
            ) : paginatedEmpleados.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400 dark:text-zinc-500">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                {search ? 'No se encontraron empleados' : 'No hay empleados registrados'}
              </td></tr>
            ) : paginatedEmpleados.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={cn(getAvatarColor(emp.nombre_completo), 'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0')}>
                      {getInitials(emp.nombre_completo)}
                    </div>
                    <div>
                      <div className="font-bold text-navy dark:text-zinc-100 text-sm">{emp.nombre_completo || 'Sin nombre'}</div>
                      <small className="text-chrono-blue text-xs">{emp.email || 'Sin email'}</small>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-navy dark:text-zinc-100 text-sm">{emp.puesto || 'Sin definir'}</td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-zinc-400 text-sm">{emp.departamento || 'Sin asignar'}</td>
                <td className="px-5 py-3.5">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.65rem] font-bold border',
                    emp.activo !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-slate-500 dark:text-zinc-400 border-gray-200')}>
                    {emp.activo !== false ? 'ACTIVO' : 'BAJA'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <div className="flex gap-1.5 justify-center">
                    {emp.email && (
                      <a href={`mailto:${emp.email}`} title="Enviar email"
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-blue-100 transition-colors">
                        <Mail className="w-3.5 h-3.5 text-chrono-blue" />
                      </a>
                    )}
                    {emp.telefono && (
                      <a href={`tel:${emp.telefono}`} title="Llamar"
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-emerald-100 transition-colors">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => handleOpenEdit(emp.id)} title="Editar"
                    className="bg-transparent border-none cursor-pointer text-amber-500 hover:text-amber-600 transition-colors p-1">
                    <Pencil className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && totalCount > 0 && (
          <div className="flex justify-between items-center p-3.5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50">
            <small className="text-slate-400 dark:text-zinc-500 text-xs">Mostrando {paginatedEmpleados.length} de {totalCount} empleados</small>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                className="text-xs py-1.5 px-3 rounded-full bg-white border border-gray-200 dark:border-zinc-700 font-semibold text-slate-500 dark:text-zinc-400 cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-40">
                ← Anterior
              </button>
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}
                className="text-xs py-1.5 px-3 rounded-full bg-navy text-white border-none font-semibold cursor-pointer hover:bg-slate-dark transition-colors disabled:opacity-40">
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {loading ? (
          <div className="text-center py-10"><Loader2 className="w-7 h-7 text-chrono-blue animate-spin mx-auto" /></div>
        ) : paginatedEmpleados.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-zinc-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            {search ? 'No se encontraron empleados' : 'No hay empleados registrados'}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {paginatedEmpleados.map((emp) => (
              <div key={emp.id} className="bg-white dark:bg-zinc-900 shadow-sm rounded-2xl p-3.5">
                <div className="flex items-center gap-3">
                  <div className={cn(getAvatarColor(emp.nombre_completo), 'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0')}>
                    {getInitials(emp.nombre_completo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h6 className="font-bold text-navy dark:text-zinc-100 text-sm truncate">{emp.nombre_completo || 'Sin nombre'}</h6>
                    <small className="text-slate-400 dark:text-zinc-500 text-xs block">{emp.puesto || 'Sin puesto'}</small>
                    <span className={cn('inline-block mt-1 rounded-full px-2 py-0.5 text-[0.6rem] font-bold',
                      emp.activo !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-slate-500 dark:text-zinc-400')}>
                      {emp.activo !== false ? 'ACTIVO' : 'BAJA'}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {emp.email && (
                      <a href={`mailto:${emp.email}`} title="Email"
                        className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 dark:border-zinc-700 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-chrono-blue" />
                      </a>
                    )}
                    {emp.telefono && (
                      <a href={`tel:${emp.telefono}`} title="Llamar"
                        className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 dark:border-zinc-700 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-emerald-500" />
                      </a>
                    )}
                    <button onClick={() => handleOpenEdit(emp.id)} title="Editar"
                      className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center cursor-pointer">
                      <Pencil className="w-4 h-4 text-amber-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 dark:border-zinc-700 flex items-center justify-center cursor-pointer disabled:opacity-40">←</button>
            <span className="flex items-center px-3 text-slate-400 dark:text-zinc-500 text-sm">{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
              className="w-10 h-10 rounded-full bg-navy text-white border-none flex items-center justify-center cursor-pointer disabled:opacity-40">→</button>
          </div>
        )}
      </div>

      {/* FAB Mobile */}
      <button onClick={handleOpenCreate}
        className="lg:hidden fixed bottom-[88px] right-4 w-14 h-14 bg-navy text-white rounded-full shadow-lg flex items-center justify-center border-none cursor-pointer hover:bg-slate-dark transition-colors z-40">
        <Plus className="w-6 h-6" />
      </button>

      <EmployeeFormModal employeeId={selectedEmployeeId} isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveEmployee} />
    </div>
  );
}
