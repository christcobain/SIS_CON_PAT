const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

function FiltroChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'var(--color-border-light)', color: 'var(--color-text-body)' }}>
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors leading-none">
        <span className="material-symbols-outlined text-[13px]">close</span>
      </button>
    </span>
  );
}

export default function BienesFiltros({
  filtros,
  onFiltroChange,
  onLimpiar,
  sedes          = [],
  tiposBien      = [],
  estadosFuncionamiento = [],
}) {
  const hayFiltros =
    filtros.search         ||
    filtros.sede_id        ||
    filtros.tipo_bien_id   ||
    filtros.estado_funcionamiento_id;

  return (
    <div className="card p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">

        {/* Search — busca en cód. patrimonial, N° serie, modelo */}
        <div className="md:col-span-4">
          <label className="form-label">Buscar</label>
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[17px]"
                  style={{ color: 'var(--color-text-faint)' }} />
            <input
              type="text"
              value={filtros.search || ''}
              onChange={(e) => onFiltroChange('search', e.target.value)}
              placeholder="Cód. patrimonial, N° serie, modelo..."
              className="form-input pl-9"
            />
            {filtros.search && (
              <button onClick={() => onFiltroChange('search', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-muted)' }}>
                <Icon name="close" className="text-[16px]" />
              </button>
            )}
          </div>
        </div>

        {/* Sede */}
        <div className="md:col-span-3">
          <label className="form-label">Sede</label>
          <select
            value={filtros.sede_id || ''}
            onChange={(e) => onFiltroChange('sede_id', e.target.value)}
            className="form-select">
            <option value="">Todas las sedes</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>

        {/* Tipo de bien */}
        <div className="md:col-span-2">
          <label className="form-label">Tipo de bien</label>
          <select
            value={filtros.tipo_bien_id || ''}
            onChange={(e) => onFiltroChange('tipo_bien_id', e.target.value)}
            className="form-select">
            <option value="">Todos</option>
            {tiposBien.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        {/* Estado funcionamiento */}
        <div className="md:col-span-2">
          <label className="form-label">Funcionamiento</label>
          <select
            value={filtros.estado_funcionamiento_id || ''}
            onChange={(e) => onFiltroChange('estado_funcionamiento_id', e.target.value)}
            className="form-select">
            <option value="">Todos</option>
            {estadosFuncionamiento.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>

        {/* Limpiar */}
        <div className="md:col-span-1">
          <button
            onClick={onLimpiar}
            disabled={!hayFiltros}
            title="Limpiar filtros"
            className="btn-secondary w-full gap-1.5 text-xs disabled:opacity-40"
            style={{ height: '42px' }}>
            <Icon name="filter_list_off" className="text-[16px]" />
          </button>
        </div>
      </div>

      {/* Chips de filtros activos */}
      {hayFiltros && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3"
             style={{ borderTop: '1px solid var(--color-border-light)' }}>
          {filtros.search && (
            <FiltroChip label={`"${filtros.search}"`} onRemove={() => onFiltroChange('search', '')} />
          )}
          {filtros.sede_id && (
            <FiltroChip
              label={`Sede: ${sedes.find((s) => String(s.id) === String(filtros.sede_id))?.nombre ?? filtros.sede_id}`}
              onRemove={() => onFiltroChange('sede_id', '')}
            />
          )}
          {filtros.tipo_bien_id && (
            <FiltroChip
              label={`Tipo: ${tiposBien.find((t) => String(t.id) === String(filtros.tipo_bien_id))?.nombre ?? filtros.tipo_bien_id}`}
              onRemove={() => onFiltroChange('tipo_bien_id', '')}
            />
          )}
          {filtros.estado_funcionamiento_id && (
            <FiltroChip
              label={`Func: ${estadosFuncionamiento.find((e) => String(e.id) === String(filtros.estado_funcionamiento_id))?.nombre ?? filtros.estado_funcionamiento_id}`}
              onRemove={() => onFiltroChange('estado_funcionamiento_id', '')}
            />
          )}
        </div>
      )}
    </div>
  );
}