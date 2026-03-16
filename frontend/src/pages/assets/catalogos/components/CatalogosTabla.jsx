import EmptyState from '../../../../components/feedback/EmptyState';
import ErrorState  from '../../../../components/feedback/ErrorState';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const COLS = [
  { label: 'Nombre / Registro', width: 'w-[35%]' },
  { label: 'Descripción',       width: 'w-[40%]' },
  { label: 'Estado',            width: 'w-[15%]' },
  { label: 'Acciones',          width: '',  right: true },
];

// Estilos para el estado (Activo / Inactivo)
const getStatusStyle = (isActive) => {
  return isActive 
    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
    : 'bg-slate-500/10 text-slate-500 border-slate-500/20';
};

function FilaCatalogo({ item, meta, onEditar, onToggleEstado }) {
  return (
    <tr className="hover:bg-surface-alt/50 transition-colors border-b border-border-light/50">
      
      {/* 1. Nombre e ID */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon name={meta?.icon || 'label'} className="text-[20px] text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-main truncate">
              {item.nombre}
            </p>
            <p className="text-[10px] font-mono text-muted mt-0.5 tracking-tight">
              ID: #{String(item.id).padStart(4, '0')}
            </p>
          </div>
        </div>
      </td>

      {/* 2. Descripción */}
      <td className="px-6 py-4">
        <p className="text-xs text-muted leading-relaxed line-clamp-2 max-w-md">
          {item.descripcion || <span className="opacity-30 italic text-[10px]">Sin descripción registrada</span>}
        </p>
      </td>

      {/* 3. Estado (Estilo Píldora) */}
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getStatusStyle(item.is_active)}`}>
          {item.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </td>

      {/* 4. Acciones (Siempre visibles) */}
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end items-center gap-1.5">
          <button
            onClick={() => onEditar(item)}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-amber-100 text-amber-600 transition-colors"
            title="Editar registro"
          >
            <Icon name="edit" className="text-[19px]" />
          </button>
          
          <button
            onClick={() => onToggleEstado(item)}
            className={`size-9 flex items-center justify-center rounded-xl transition-all border border-border-light ${
              item.is_active 
                ? 'bg-surface-variant hover:bg-red-50 text-muted hover:text-red-600' 
                : 'bg-surface-variant hover:bg-emerald-50 text-muted hover:text-emerald-600'
            }`}
            title={item.is_active ? 'Desactivar' : 'Activar'}
          >
            <Icon name={item.is_active ? 'toggle_on' : 'toggle_off'} className="text-[22px]" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CatalogosTabla({
  items = [], loading, error, refetch,
  catalogoMeta,
  onEditar, onToggleEstado,
}) {
  return (
    <div className="table-wrapper shadow-sm border border-border-light rounded-2xl overflow-hidden">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr >
              {COLS.map((col) => (
                <th 
                  key={col.label}
                  className={`px-6 py-4 text-[10px] uppercase font-black tracking-widest text-faint ${col.width ?? ''} ${col.right ? 'text-right' : ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody >
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border-light/50">
                   <td className="px-6 py-4"><div className="skeleton h-10 w-10 rounded-xl" /></td>
                   <td className="px-6 py-4"><div className="skeleton h-4 w-full rounded" /></td>
                   <td className="px-6 py-4"><div className="skeleton h-4 w-20 rounded-full" /></td>
                   <td className="px-6 py-4"><div className="skeleton h-9 w-20 ml-auto rounded-xl" /></td>
                </tr>
              ))
            ) : error ? (
              <tr><td colSpan={COLS.length} className="py-12"><ErrorState message={error} onRetry={refetch} /></td></tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="py-12">
                  <EmptyState 
                    icon={catalogoMeta?.icon ?? 'category'} 
                    title={`Sin registros`} 
                    description={`No hay elementos en el catálogo de ${catalogoMeta?.label?.toLowerCase() || 'este catálogo'}.`} 
                  />
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <FilaCatalogo
                  key={item.id}
                  item={item}
                  meta={catalogoMeta}
                  onEditar={onEditar}
                  onToggleEstado={onToggleEstado}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer px-6 py-4 bg-surface-variant/20 border-t border-border-light flex justify-between items-center">
        <p className="text-xs text-faint">
          Total: <b className="text-main">{items.length}</b> elementos en {catalogoMeta?.label || 'Catálogo'}
        </p>
      </div>
    </div>
  );
}