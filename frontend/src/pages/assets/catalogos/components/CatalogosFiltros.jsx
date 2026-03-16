const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ESTADOS = [
  { value: '',      label: 'Todos'     },
  { value: 'true',  label: 'Activos'   },
  { value: 'false', label: 'Inactivos' },
];

export default function CatalogosFiltros({ filtros, onFiltroChange, onLimpiar }) {
  const hayFiltros = filtros.search || filtros.is_active !== '';

  return (
    <div className="flex items-center gap-3 flex-wrap">

      {/* Buscador */}
      <div className="relative flex-1 min-w-[200px]">
        <Icon name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[17px] pointer-events-none"
              style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          value={filtros.search}
          onChange={(e) => onFiltroChange('search', e.target.value)}
          placeholder="Buscar por nombre o descripción..."
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm"
          style={{
            background: 'var(--color-surface)',
            border:     '1px solid var(--color-border)',
            color:      'var(--color-text-primary)',
            outline:    'none',
          }}
          onFocus={(e)  => e.currentTarget.style.border = '1px solid var(--color-primary)'}
          onBlur={(e)   => e.currentTarget.style.border = '1px solid var(--color-border)'}
        />
        {filtros.search && (
          <button onClick={() => onFiltroChange('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}>
            <Icon name="close" className="text-[16px]" />
          </button>
        )}
      </div>

      {/* Filtro estado */}
      <select
        value={filtros.is_active}
        onChange={(e) => onFiltroChange('is_active', e.target.value)}
        className="text-sm rounded-xl px-3 py-2"
        style={{
          background: 'var(--color-surface)',
          border:     '1px solid var(--color-border)',
          color:      'var(--color-text-body)',
          outline:    'none',
        }}>
        {ESTADOS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Limpiar */}
      {hayFiltros && (
        <button onClick={onLimpiar} className="btn-ghost text-xs flex items-center gap-1">
          <Icon name="filter_list_off" className="text-[16px]" />
          Limpiar
        </button>
      )}
    </div>
  );
}