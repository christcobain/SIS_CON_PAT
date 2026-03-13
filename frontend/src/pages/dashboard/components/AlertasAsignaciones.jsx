const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ESTADO_CFG = {
  PENDIENTE_APROBACION:  { label: 'Pend. Aprobación', cls: 'badge-pendiente' },
  EN_PROCESO:            { label: 'En Proceso',        cls: 'badge-atendido'  },
  DEVUELTO:              { label: 'Devuelto',          cls: 'badge-devuelto'  },
  ATENDIDO:              { label: 'Atendido',          cls: 'badge-activo'    },
  CANCELADO:             { label: 'Cancelado',         cls: 'badge-cancelado' },
};

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

function CardAsignacion({ item, onVer }) {
  const cfg = ESTADO_CFG[item.estado] ?? { label: item.estado, cls: 'badge-inactivo' };
  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex gap-3 min-w-0">
          <div
            className="size-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(127,29,29,0.08)' }}
          >
            <Icon name={item.icono} className="text-[22px] text-primary" />
          </div>
          <div className="min-w-0">
            <h3
              className="font-black text-sm leading-tight truncate"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {item.bien}
            </h3>
            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {item.codigo}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              →{' '}
              <span className="font-semibold" style={{ color: 'var(--color-text-body)' }}>
                {item.destinatario}
              </span>
            </p>
          </div>
        </div>
        <PrioridadBadge nivel={item.prioridad} />
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid var(--color-border-light)' }}
      >
        <div className="flex items-center gap-2">
          <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
          <span className="text-[10px] italic" style={{ color: 'var(--color-text-muted)' }}>
            {item.tiempo}
          </span>
        </div>
        <button onClick={() => onVer(item)} className="btn-primary text-xs px-3 py-1.5">
          Revisar
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="skeleton size-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
      </div>
      <div className="flex justify-between pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
        <div className="skeleton h-5 w-24 rounded-full" />
        <div className="skeleton h-7 w-16 rounded-xl" />
      </div>
    </div>
  );
}

export default function AlertasAsignaciones({ items = [], loading = false, onVer }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="card p-12 text-center"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <Icon name="check_circle" className="text-[44px] block mb-3"
              style={{ color: 'var(--color-border)' }} />
        <p className="text-sm font-semibold">Sin asignaciones para este filtro</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => (
        <CardAsignacion key={item.id} item={item} onVer={onVer} />
      ))}
    </div>
  );
}