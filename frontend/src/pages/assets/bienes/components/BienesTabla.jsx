import EmptyState from '../../../../components/feedback/EmptyState';
import ErrorState  from '../../../../components/feedback/ErrorState';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const COLS = [
  { label: 'Bien / Código',       width: 'w-[28%]' },
  { label: 'Tipo / Categoría',    width: 'w-[18%]' },
  { label: 'Marca / Modelo',      width: 'w-[16%]' },
  { label: 'Estado',              width: 'w-[10%]' },
  { label: 'Funcionamiento',      width: 'w-[14%]' },
  { label: 'Acciones',            width: '',  right: true },
];

// Badge de estado del bien (Bueno, Regular, Malo…)
const ESTADO_BIEN_CLS = (nombre) => ({
  'BUENO':          'badge-activo',
  'REGULAR':        'badge-pendiente',
  'MALO':           'badge-cancelado',
  'DADO DE BAJA':   'badge-cancelado',
}[nombre?.toUpperCase()] ?? 'badge-inactivo');

function SkeletonRow() {
  return (
    <tr>
      {[55, 35, 35, 20, 25, 15].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="skeleton h-4 rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

function FilaBien({ item, onVerDetalle, onEditar }) {
  return (
    <tr>
      {/* Bien / Código patrimonial */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl flex items-center justify-center shrink-0"
               style={{ background: 'var(--color-border-light)' }}>
            <Icon name="inventory_2" className="text-[17px] text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black leading-tight truncate"
               style={{ color: 'var(--color-text-primary)' }}>
              {item.codigo_patrimonial
                ? <span className="font-mono">{item.codigo_patrimonial}</span>
                : <span style={{ color: 'var(--color-text-faint)' }}>Sin código</span>
              }
            </p>
            {item.numero_serie && (
              <p className="text-[10px] font-mono mt-0.5"
                 style={{ color: 'var(--color-text-muted)' }}>
                S/N: {item.numero_serie}
              </p>
            )}
            <p className="text-[9px] font-mono mt-0.5"
               style={{ color: 'var(--color-text-faint)' }}>
              ID #{item.id}
            </p>
          </div>
        </div>
      </td>

      {/* Tipo / Categoría */}
      <td className="px-5 py-3.5">
        <p className="text-xs font-semibold truncate"
           style={{ color: 'var(--color-text-primary)' }}>
          {item.tipo_bien_nombre || '—'}
        </p>
        {item.categoria_bien_nombre && (
          <p className="text-[10px] truncate mt-0.5"
             style={{ color: 'var(--color-text-muted)' }}>
            {item.categoria_bien_nombre}
          </p>
        )}
      </td>

      {/* Marca / Modelo */}
      <td className="px-5 py-3.5">
        <p className="text-xs font-semibold truncate"
           style={{ color: 'var(--color-text-body)' }}>
          {item.marca_nombre || '—'}
        </p>
        {item.modelo && (
          <p className="text-[10px] truncate mt-0.5"
             style={{ color: 'var(--color-text-muted)' }}>
            {item.modelo}
          </p>
        )}
      </td>

      {/* Estado del bien */}
      <td className="px-5 py-3.5">
        <span className={`badge ${ESTADO_BIEN_CLS(item.estado_bien_nombre)}`}>
          {item.estado_bien_nombre || '—'}
        </span>
      </td>

      {/* Estado de funcionamiento */}
      <td className="px-5 py-3.5">
        <span className="badge badge-inactivo text-[9px]">
          {item.estado_funcionamiento_nombre || '—'}
        </span>
      </td>

      {/* Acciones — siempre visibles, hover contextual */}
      <td className="px-5 py-3.5">
        <div className="flex justify-end items-center gap-1">
          <button
            onClick={() => onVerDetalle(item)}
            title="Ver detalle"
            className="btn-icon p-1.5">
            <Icon name="visibility" className="text-[18px]" />
          </button>
          <button
            onClick={() => onEditar(item)}
            title="Editar"
            className="btn-icon p-1.5">
            <Icon name="edit" className="text-[18px]" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function BienesTabla({
  items = [], loading, error, refetch,
  onVerDetalle, onEditar,
}) {
  return (
    <div className="table-wrapper">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {COLS.map((col) => (
                <th key={col.label}
                    className={`px-5 py-3.5 ${col.width ?? ''} ${col.right ? 'text-right' : ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : error ? (
              <tr>
                <td colSpan={COLS.length} className="py-6">
                  <ErrorState message={error} onRetry={refetch} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="py-6">
                  <EmptyState
                    icon="inventory_2"
                    title="Sin bienes registrados"
                    description="No se encontraron bienes con los filtros actuales. Intenta ajustar los criterios de búsqueda."
                  />
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <FilaBien
                  key={item.id}
                  item={item}
                  onVerDetalle={onVerDetalle}
                  onEditar={onEditar}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p className="table-count">
          {loading ? (
            <span className="skeleton h-3 w-40 inline-block rounded" />
          ) : (
            <>
              <strong style={{ color: 'var(--color-text-primary)' }}>{items.length}</strong>
              {' '}bien{items.length !== 1 ? 'es' : ''}
            </>
          )}
        </p>
      </div>
    </div>
  );
}