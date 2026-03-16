import { useState } from 'react';
import EmptyState from '../../../../components/feedback/EmptyState';
import ErrorState  from '../../../../components/feedback/ErrorState';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function LocacionesTabla({
  activeTab, 
  items = [], 
  loading, 
  error, 
  refetch,
  totalItems = 0, 
  onVerDetalle, 
  onEditar, 
  onToggleEstado,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagActual = Math.min(page, totalPages);
  // const slice = items.slice((pagActual - 1) * pageSize, pagActual * pageSize);
  const COLUMNAS = {
    sedes: [
      { label: 'Sede / Identificador', align: 'text-left' },
      { label: 'Dirección Local',     align: 'text-left' },
      { label: 'Ubicación',           align: 'text-left' },
      { label: 'Estado',              align: 'text-left' },
      { label: 'Acciones',            align: 'text-right' },
    ],
    modulos: [
      { label: 'Nombre del Módulo',   align: 'text-left' },
      { label: 'Fecha Registro',      align: 'text-left' },
      { label: 'Estado',              align: 'text-left' },
      { label: 'Acciones',            align: 'text-right' },
    ],
    ubicaciones: [
      { label: 'Nombre / Zona',       align: 'text-left' },
      { label: 'Descripción',         align: 'text-left' },
      { label: 'Estado',              align: 'text-left' },
      { label: 'Acciones',            align: 'text-right' },
    ],
  }[activeTab] || [];
  const getEstadoStyle = (activo) => {
  return activo 
    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
    : 'bg-slate-500/10 text-slate-500 border-slate-500/20';
};
  if (loading && items.length === 0)
    return <EmptyState icon="hourglass_top" title="Cargando locaciones..." />;

  if (error)
    return <ErrorState message={error} onRetry={refetch} />;

  if (items.length === 0)
    return <EmptyState icon="search_off" title="No se encontraron registros" />;

  return (
    <div className="table-wrapper animate-fade-in">
      <div className="table-container ">
        <table className="table w-full">
          <thead>
            <tr className="bg-surface-alt/50 border-b border-border-light">
              {COLUMNAS.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 ${col.align} text-[11px] font-black uppercase text-faint`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody >
            {items.map(item => (
              <tr key={item.id} className="hover:bg-surface-alt/40 transition-colors group">
                
                {/* IDENTIFICADOR PRINCIPAL (Basado en el tipo) */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon name={activeTab === 'sedes' ? 'apartment' : activeTab === 'modulos' ? 'widgets' : 'fmd_good'} className="text-[18px] text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-body uppercase truncate leading-tight">
                        {item.nombre}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-muted uppercase tracking-tight">
                        ID: {item.id}
                      </div>
                    </div>
                  </div>
                </td>

                {/* COLUMNAS DINÁMICAS SEGÚN TAB */}
                {activeTab === 'sedes' && (
                  <>
                    <td className="px-4 py-3 text-xs text-body italic line-clamp-1 max-w-[200px]">
                      {item.direccion || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[10px] font-bold text-main uppercase">
                        {item.distrito_nombre || 'No definido'}
                      </div>
                      <div className="text-[9px] text-faint uppercase">
                        {[item.provincia_nombre, item.departamento_nombre].filter(Boolean).join(' • ')}
                      </div>
                    </td>
                  </>
                )}

                {activeTab === 'modulos' && (
                  <td className="px-4 py-3 text-xs font-bold text-muted uppercase">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                )}

                {activeTab === 'ubicaciones' && (
                  <td className="px-4 py-3 text-xs text-body italic">
                    {item.descripcion || 'Sin descripción'}
                  </td>
                )}

                {/* ESTADO SISTEMA (Mismo Badge de Transferencias/Bienes) */}
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getEstadoStyle(item.is_active)}`}>
                    {item.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>

                {/* ACCIONES (Patrón Idéntico) */}
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button 
                      onClick={() => onVerDetalle(item)} 
                        className="size-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors"
                      title="Ver detalles"
                    >
                      <Icon name="visibility" className="text-[20px]" />
                    </button>

                    <button 
                      onClick={() => onEditar(item)} 
                      className="size-8 flex items-center justify-center rounded-lg hover:bg-amber-100 text-amber-600 transition-colors"
                      title="Editar registro"
                    >
                      <Icon name="edit" className="text-[19px]" />
                    </button>

                    <button 
                      onClick={() => onToggleEstado(item)} 
                      className={`size-8 flex items-center justify-center rounded-lg transition-colors ${
                        item.is_active 
                          ? 'hover:bg-red-100 text-red-500' 
                          : 'hover:bg-green-100 text-green-600'
                      }`}
                      title={item.is_active ? 'Desactivar' : 'Activar'}
                    >
                      <Icon name={item.is_active ? 'block' : 'check_circle'} className="text-[20px]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER (Mismo patrón de paginación) */}
      <div className="table-footer px-6 py-4 bg-surface-alt/50 border-t border-border flex flex-wrap items-center justify-between gap-4">
        <p className="text-[11px] text-faint font-medium uppercase tracking-tight">
          Mostrando <span className="text-main font-black">{items.length}</span> de <span className="text-main font-black">{totalItems}</span> registros
        </p>
        <div className="flex items-center gap-1.5">
          <button  
          onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagActual === 1}
            className="size-8 flex items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-alt disabled:opacity-30 transition-colors"
          >
            <Icon name="chevron_left" className="text-[18px]" /></button>

          {/* <button className="page-btn-active">1</button> */}

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - pagActual) <= 1)
              .map((pg, i, arr) => (
                <div key={pg} className="flex items-center gap-1">
                  {i > 0 && arr[i-1] !== pg - 1 && <span className="text-muted text-xs mx-0.5">...</span>}
                  <button
                    onClick={() => setPage(pg)}
                    className={`min-size-8 px-2.5 flex items-center justify-center rounded-lg font-black text-xs transition-all
                      ${pagActual === pg 
                        ? 'bg-primary text-white shadow-md shadow-primary/20 border border-primary' 
                        : 'bg-surface border border-border text-body hover:border-muted'}`}
                  >
                    {pg}
                  </button>
                </div>
              ))}
          </div>


          <button  
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pagActual === totalPages}
            className="size-8 flex items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-surface-alt disabled:opacity-30 transition-colors"
          >
            <Icon name="chevron_right" className="text-[18px]" />
            </button>
        </div>
      </div>
    </div>
  );
}