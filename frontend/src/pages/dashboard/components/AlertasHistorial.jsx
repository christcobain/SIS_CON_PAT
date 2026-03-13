const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

function FilaHistorial({ ev }) {
  return (
    <tr>
      {/* Ícono acción */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="size-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-border-light)' }}
          >
            <Icon name={ev.icono} className={`text-[18px] ${ev.color}`} />
          </div>
          <p className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>
            {ev.accion}
          </p>
        </div>
      </td>

      {/* Detalle */}
      <td className="px-5 py-3.5">
        <p className="text-xs truncate max-w-[380px]" style={{ color: 'var(--color-text-muted)' }}>
          {ev.detalle}
        </p>
      </td>

      {/* Tiempo */}
      <td className="px-5 py-3.5 text-right">
        <span className="text-[11px] font-bold whitespace-nowrap"
              style={{ color: 'var(--color-text-faint)' }}>
          {ev.tiempo}
        </span>
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[55, 75, 20].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="skeleton h-4 rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function AlertasHistorial({ items = [], loading = false }) {
  const COLS = ['Acción', 'Detalle', 'Tiempo'];

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
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="px-5 py-16 text-center">
                  <Icon name="history" className="text-[44px] block mb-3"
                        style={{ color: 'var(--color-border)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    Sin actividad registrada
                  </p>
                </td>
              </tr>
            ) : (
              items.map((ev, i) => <FilaHistorial key={i} ev={ev} />)
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p className="table-count">
          <strong style={{ color: 'var(--color-text-primary)' }}>{items.length}</strong>
          {' '}evento{items.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}