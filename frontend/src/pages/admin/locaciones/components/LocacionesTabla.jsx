import EmptyState from '../../../../components/feedback/EmptyState';
import ErrorState  from '../../../../components/feedback/ErrorState';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const TAB_META = {
  sedes: {
    cols: [
      { label: 'Nombre / ID',        width: 'w-[30%]' },
      { label: 'Dirección',          width: 'w-[18%]' },
      { label: 'Distrito / Región',  width: 'w-[22%]' },
      { label: 'Estado',             width: 'w-[10%]' },
      { label: 'Acciones',           width: '',  right: true },
    ],
  },
  modulos: {
    cols: [
      { label: 'Nombre del Módulo',  width: 'w-[50%]' },
      { label: 'Fecha de Registro',  width: 'w-[25%]' },
      { label: 'Estado',             width: 'w-[15%]' },
      { label: 'Acciones',           width: '',  right: true },
    ],
  },
  ubicaciones: {
    cols: [
      { label: 'Nombre',             width: 'w-[28%]' },
      { label: 'Descripción',        width: 'w-[42%]' },
      { label: 'Estado',             width: 'w-[12%]' },
      { label: 'Acciones',           width: '',  right: true },
    ],
  },
};

function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="skeleton h-4 rounded" style={{ width: i === 0 ? '70%' : '50%' }} />
        </td>
      ))}
    </tr>
  );
}

function TextMuted({ children }) {
  return <span style={{ color: 'var(--color-text-muted)' }}>{children}</span>;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Badge estado unificado ────────────────────────────────────────────────────
function EstadoBadge({ active }) {
  return (
    <span className={active ? 'badge-activo' : 'badge-inactivo'}>
      <span className={`size-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-slate-400'}`} />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

// ── Acciones: SIEMPRE visibles, hover con color contextual ───────────────────
// Patrón unificado con UsuariosTabla: los iconos están siempre presentes,
// el hover revela el color de la acción (rojo/verde para toggle).
function AccionesCell({ item, onVerDetalle, onEditar, onToggleEstado }) {
  return (
    <div className="flex justify-end items-center gap-1">
      <button
        onClick={() => onVerDetalle(item)}
        title="Ver detalle"
        className="btn-icon p-1.5"
      >
        <Icon name="visibility" className="text-[18px]" />
      </button>
      <button
        onClick={() => onEditar(item)}
        title="Editar"
        className="btn-icon p-1.5"
      >
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
        }}
      >
        <Icon name={item.is_active ? 'toggle_off' : 'toggle_on'} className="text-[18px]" />
      </button>
    </div>
  );
}

// ── Filas por tipo ────────────────────────────────────────────────────────────
function FilaSede({ item, onVerDetalle, onEditar, onToggleEstado }) {
  return (
    <tr>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl flex items-center justify-center shrink-0"
               style={{ background: 'var(--color-border-light)' }}>
            <Icon name="location_city" className="text-[18px] text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black leading-tight truncate"
               style={{ color: 'var(--color-text-primary)' }}>
              {item.nombre}
            </p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              ID #{item.id}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-xs truncate max-w-[160px]" style={{ color: 'var(--color-text-muted)' }}>
          {item.direccion || <TextMuted>—</TextMuted>}
        </p>
      </td>
      <td className="px-5 py-3.5">
        <div className="min-w-0">
          {item.distrito_nombre && (
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-body)' }}>
              {item.distrito_nombre}
            </p>
          )}
          {(item.provincia_nombre || item.departamento_nombre) && (
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {[item.provincia_nombre, item.departamento_nombre].filter(Boolean).join(', ')}
            </p>
          )}
          {!item.distrito_nombre && !item.provincia_nombre && <TextMuted>—</TextMuted>}
        </div>
      </td>
      <td className="px-5 py-3.5"><EstadoBadge active={item.is_active} /></td>
      <td className="px-5 py-3.5">
        <AccionesCell item={item} onVerDetalle={onVerDetalle} onEditar={onEditar} onToggleEstado={onToggleEstado} />
      </td>
    </tr>
  );
}

function FilaModulo({ item, onVerDetalle, onEditar, onToggleEstado }) {
  return (
    <tr>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl flex items-center justify-center shrink-0"
               style={{ background: 'var(--color-border-light)' }}>
            <Icon name="widgets" className="text-[18px] text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black leading-tight truncate"
               style={{ color: 'var(--color-text-primary)' }}>
              {item.nombre}
            </p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              ID #{item.id}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {formatDate(item.created_at)}
        </p>
      </td>
      <td className="px-5 py-3.5"><EstadoBadge active={item.is_active} /></td>
      <td className="px-5 py-3.5">
        <AccionesCell item={item} onVerDetalle={onVerDetalle} onEditar={onEditar} onToggleEstado={onToggleEstado} />
      </td>
    </tr>
  );
}

function FilaUbicacion({ item, onVerDetalle, onEditar, onToggleEstado }) {
  const desc = item.descripcion ?? '';
  return (
    <tr>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl flex items-center justify-center shrink-0"
               style={{ background: 'var(--color-border-light)' }}>
            <Icon name="room" className="text-[18px] text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black leading-tight truncate"
               style={{ color: 'var(--color-text-primary)' }}>
              {item.nombre}
            </p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              ID #{item.id}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-xs max-w-[300px]" style={{ color: 'var(--color-text-muted)' }}>
          {desc
            ? <>{desc.slice(0, 60)}{desc.length > 60 ? '…' : ''}</>
            : <TextMuted>Sin descripción</TextMuted>
          }
        </p>
      </td>
      <td className="px-5 py-3.5"><EstadoBadge active={item.is_active} /></td>
      <td className="px-5 py-3.5">
        <AccionesCell item={item} onVerDetalle={onVerDetalle} onEditar={onEditar} onToggleEstado={onToggleEstado} />
      </td>
    </tr>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function LocacionesTabla({
  activeTab, items = [], loading, error, refetch,
  totalItems = 0, onVerDetalle, onEditar, onToggleEstado,
}) {
  const meta    = TAB_META[activeTab] ?? TAB_META.sedes;
  const numCols = meta.cols.length;

  const renderFila = (item) => {
    const props = { key: item.id, item, onVerDetalle, onEditar, onToggleEstado };
    if (activeTab === 'sedes')       return <FilaSede      {...props} />;
    if (activeTab === 'modulos')     return <FilaModulo    {...props} />;
    if (activeTab === 'ubicaciones') return <FilaUbicacion {...props} />;
    return null;
  };

  return (
    <div className="table-wrapper">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {meta.cols.map((col) => (
                <th
                  key={col.label}
                  className={`px-5 py-3.5 ${col.width ?? ''} ${col.right ? 'text-right' : ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={numCols} />)
            ) : error ? (
              <tr>
                <td colSpan={numCols} className="py-6">
                  <ErrorState message={error} onRetry={refetch} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={numCols} className="py-6">
                  <EmptyState
                    icon="search_off"
                    title="No se encontraron registros"
                    description="Ajusta los filtros o registra un nuevo elemento."
                  />
                </td>
              </tr>
            ) : items.map(renderFila)}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p className="table-count">
          {loading ? (
            <span className="skeleton h-3 w-40 inline-block rounded" />
          ) : (
            <>
              Mostrando{' '}
              <strong style={{ color: 'var(--color-text-primary)' }}>{items.length}</strong>
              {' '}de{' '}
              <strong style={{ color: 'var(--color-text-primary)' }}>{totalItems}</strong>
              {' '}registros
            </>
          )}
        </p>
        <div className="pagination">
          <button disabled className="page-btn">
            <Icon name="chevron_left" className="text-[18px]" />
          </button>
          <button className="page-btn-active">1</button>
          <button disabled className="page-btn">
            <Icon name="chevron_right" className="text-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}