const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ESTADO_CFG = {
  PENDIENTE_APROBACION:  { label: 'Pend. Aprobación', cls: 'badge-pendiente' },
  EN_PROCESO:            { label: 'En Proceso',        cls: 'badge-atendido'  },
  EN_ESPERA_CONFORMIDAD: { label: 'Esp. Conformidad',  cls: 'badge-inactivo'  },
  EN_RETORNO:            { label: 'En Retorno',        cls: 'badge-devuelto'  },
  DEVUELTO:              { label: 'Devuelto',          cls: 'badge-devuelto'  },
  ATENDIDO:              { label: 'Atendido',          cls: 'badge-activo'    },
  CANCELADO:             { label: 'Cancelado',         cls: 'badge-cancelado' },
};

const TIPO_CFG = {
  SALIDA:             { label: 'Salida Temporal',    icon: 'logout',         iconBg: 'bg-orange-100',  iconText: 'text-orange-600'  },
  ENTRADA:            { label: 'Entrada de Activos', icon: 'login',          iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
  TRASLADO_SEDE:      { label: 'Traslado de Sede',   icon: 'swap_horiz',     iconBg: 'bg-blue-100',    iconText: 'text-blue-600'    },
  ASIGNACION_INTERNA: { label: 'Asignación Interna', icon: 'assignment_ind', iconBg: 'bg-primary/10',  iconText: 'text-primary'     },
};

function EstadoBadge({ estado }) {
  const c = ESTADO_CFG[estado] ?? { label: estado, cls: 'badge-inactivo' };
  return <span className={`badge ${c.cls}`}>{c.label}</span>;
}

function PrioridadBadge({ nivel }) {
  const styles = {
    ALTA:  { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' },
    MEDIA: { background: 'var(--color-border-light)', color: 'var(--color-text-body)', border: '1px solid var(--color-border)' },
    BAJA:  { background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-light)' },
  };
  return (
    <span
      className="text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide"
      style={styles[nivel] ?? styles.BAJA}
    >
      {nivel}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[70, 50, 50, 60, 30, 40].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="skeleton h-4 rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Fila de movimiento ────────────────────────────────────────────────────────
// Patrón idéntico a FilaUsuario / FilaSede: acciones siempre visibles,
// columna de nombre con ícono + subtexto, hover con color contextual.
function FilaMovimiento({ item, onVer }) {
  const tipo = TIPO_CFG[item.tipo] ?? TIPO_CFG.TRASLADO_SEDE;

  return (
    <tr>
      {/* Tipo */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${tipo.iconBg}`}>
            <Icon name={tipo.icon} className={`text-[18px] ${tipo.iconText}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black leading-tight truncate"
               style={{ color: 'var(--color-text-primary)' }}>
              {tipo.label}
            </p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              ID #{item.id}
            </p>
          </div>
        </div>
      </td>

      {/* Origen → Destino */}
      <td className="px-5 py-3.5">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {item.origen}
        </p>
        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          <Icon name="arrow_forward" className="text-[11px]" />
          {item.destino}
        </p>
      </td>

      {/* Solicitante */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full flex items-center justify-center shrink-0"
               style={{ background: 'rgba(127,29,29,0.1)' }}>
            <Icon name="person" className="text-[14px] text-primary" />
          </div>
          <span className="text-sm truncate" style={{ color: 'var(--color-text-body)' }}>
            {item.solicitante}
          </span>
        </div>
      </td>

      {/* Fecha + Estado */}
      <td className="px-5 py-3.5">
        <p className="text-sm" style={{ color: 'var(--color-text-body)' }}>{item.fecha}</p>
        <div className="mt-1"><EstadoBadge estado={item.estado} /></div>
      </td>

      {/* Prioridad */}
      <td className="px-5 py-3.5">
        <PrioridadBadge nivel={item.prioridad} />
      </td>

      {/* Acción — siempre visible, mismo patrón btn-secondary */}
      <td className="px-5 py-3.5 text-right">
        <button
          onClick={() => onVer(item)}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          Ver Detalle
        </button>
      </td>
    </tr>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
const COLS = ['Tipo', 'Origen / Destino', 'Solicitante', 'Fecha / Estado', 'Prioridad', ''];

export default function AlertasTablaMovimientos({ items = [], loading = false, onVer }) {
  return (
    <div className="table-wrapper">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {COLS.map((h) => (
                <th key={h} className="px-5 py-3.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="px-5 py-16 text-center">
                  <Icon
                    name="inbox"
                    className="text-[44px] block mb-3"
                    style={{ color: 'var(--color-border)' }}
                  />
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    Sin registros para este filtro
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <FilaMovimiento key={item.id} item={item} onVer={onVer} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p className="table-count">
          <strong style={{ color: 'var(--color-text-primary)' }}>{items.length}</strong>
          {' '}registro{items.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}