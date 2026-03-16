import EmptyState from '../../../../components/feedback/EmptyState';
import ErrorState  from '../../../../components/feedback/ErrorState';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

function SkeletonRow() {
  return (
    <tr>
      {[60, 80, 40, 30].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="skeleton h-4 rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

const COLS = ['Nombre', 'Descripción', 'Estado', 'Acciones'];

export default function CatalogosTabla({
  items = [], loading, error, refetch,
  catalogoMeta,
  onEditar, onToggleEstado,
}) {
  return (
    <div className="table-wrapper">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {COLS.map((h, i) => (
                <th key={h} className={`px-5 py-3.5 ${i === COLS.length - 1 ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
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
                    icon={catalogoMeta?.icon ?? 'category'}
                    title={`Sin registros en ${catalogoMeta?.label ?? 'este catálogo'}`}
                    description="No hay elementos registrados. Crea el primero con el botón superior."
                  />
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  {/* Nombre + ID */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg flex items-center justify-center shrink-0"
                           style={{ background: 'var(--color-border-light)' }}>
                        <Icon name={catalogoMeta?.icon ?? 'label'}
                              className="text-[15px] text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black truncate"
                           style={{ color: 'var(--color-text-primary)' }}>
                          {item.nombre}
                        </p>
                        <p className="text-[10px] font-mono"
                           style={{ color: 'var(--color-text-muted)' }}>
                          ID #{item.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Descripción */}
                  <td className="px-5 py-3.5">
                    <p className="text-xs max-w-[340px] truncate"
                       style={{ color: 'var(--color-text-muted)' }}>
                      {item.descripcion || <span style={{ color: 'var(--color-text-faint)' }}>—</span>}
                    </p>
                  </td>

                  {/* Estado badge */}
                  <td className="px-5 py-3.5">
                    <span className={item.is_active ? 'badge-activo' : 'badge-inactivo'}>
                      <span className={`size-1.5 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                      {item.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* Acciones — siempre visibles, hover con color contextual */}
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end items-center gap-1">
                      <button onClick={() => onEditar(item)}
                        title="Editar" className="btn-icon p-1.5">
                        <Icon name="edit" className="text-[18px]" />
                      </button>
                      <button
                        onClick={() => onToggleEstado(item)}
                        title={item.is_active ? 'Desactivar' : 'Activar'}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color      = item.is_active ? '#ef4444' : '#22c55e';
                          e.currentTarget.style.background = item.is_active ? '#fef2f2' : '#f0fdf4';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color      = 'var(--color-text-muted)';
                          e.currentTarget.style.background = '';
                        }}>
                        <Icon name={item.is_active ? 'toggle_off' : 'toggle_on'} className="text-[18px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p className="table-count">
          {loading
            ? <span className="skeleton h-3 w-40 inline-block rounded" />
            : <>
                <strong style={{ color: 'var(--color-text-primary)' }}>{items.length}</strong>
                {' '}registro{items.length !== 1 ? 's' : ''}
              </>
          }
        </p>
      </div>
    </div>
  );
}