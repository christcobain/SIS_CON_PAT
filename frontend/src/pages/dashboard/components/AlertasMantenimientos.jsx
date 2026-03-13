const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

function ItemMantenimiento({ item, onVer }) {
  const urgente = item.urgente;

  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl transition-colors"
      style={
        urgente
          ? { background: '#fef2f2', border: '1px solid #fecaca' }
          : { border: '1px solid var(--color-border-light)', background: 'var(--color-surface)' }
      }
      onMouseEnter={(e) => {
        if (!urgente) e.currentTarget.style.background = 'var(--color-surface-alt)';
      }}
      onMouseLeave={(e) => {
        if (!urgente) e.currentTarget.style.background = 'var(--color-surface)';
      }}
    >
      <div className="flex items-center gap-4">
        {/* Bloque de fecha */}
        <div
          className="rounded-xl p-2.5 flex flex-col items-center justify-center min-w-[52px] shrink-0"
          style={
            urgente
              ? { background: '#ef4444', color: '#fff' }
              : { background: 'var(--color-border-light)', color: 'var(--color-text-body)' }
          }
        >
          <span className="text-[9px] uppercase font-black tracking-widest leading-none">
            {item.mes}
          </span>
          <span className="text-xl font-black leading-tight mt-0.5">{item.dia}</span>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className="font-black text-sm"
              style={{ color: urgente ? '#7f1d1d' : 'var(--color-text-primary)' }}
            >
              {item.titulo}
            </h4>
            {urgente && (
              <span className="badge badge-cancelado">Urgente</span>
            )}
          </div>
          <p
            className="text-xs mt-0.5"
            style={{ color: urgente ? '#dc2626' : 'var(--color-text-muted)' }}
          >
            {item.descripcion}
          </p>
        </div>
      </div>

      {/* Botón */}
      <button
        onClick={() => onVer(item)}
        className={`shrink-0 font-bold text-xs px-4 py-2 rounded-xl transition-colors ml-4
          ${urgente
            ? 'border border-red-200 text-red-700 hover:bg-red-100'
            : 'btn-secondary'
          }`}
      >
        {urgente ? 'Programar' : 'Ver Plan'}
      </button>
    </div>
  );
}

function SkeletonItem() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl"
         style={{ border: '1px solid var(--color-border-light)' }}>
      <div className="skeleton rounded-xl min-w-[52px] h-14" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
      <div className="skeleton h-8 w-20 rounded-xl" />
    </div>
  );
}

export default function AlertasMantenimientos({ items = [], loading = false, onVer }) {
  if (loading) {
    return (
      <div className="card p-4 flex flex-col gap-3">
        {[1, 2, 3].map((i) => <SkeletonItem key={i} />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>
        <Icon name="event_available" className="text-[44px] block mb-3"
              style={{ color: 'var(--color-border)' }} />
        <p className="text-sm font-semibold">Sin mantenimientos próximos</p>
      </div>
    );
  }

  return (
    <div className="card p-4 flex flex-col gap-3">
      {items.map((item) => (
        <ItemMantenimiento key={item.id} item={item} onVer={onVer} />
      ))}
    </div>
  );
}