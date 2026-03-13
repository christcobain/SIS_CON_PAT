const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const PLACEHOLDER = {
  sedes:       'Nombre, dirección, empresa...',
  modulos:     'Nombre de módulo...',
  ubicaciones: 'Nombre o descripción...',
};

export default function LocacionesFiltros({
  filtros, onFiltroChange, empresas = [], activeTab, onLimpiar,
}) {
  const hayFiltros = filtros.search || filtros.is_active !== '' || filtros.empresa_id;

  return (
    <div className="card p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">

        {/* Búsqueda texto — siempre visible */}
        <div className={activeTab === 'sedes' ? 'md:col-span-5' : 'md:col-span-7'}>
          <label className="form-label">Buscar</label>
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
              style={{ color: 'var(--color-text-faint)' }} />
            <input
              type="text"
              value={filtros.search || ''}
              onChange={(e) => onFiltroChange('search', e.target.value)}
              placeholder={PLACEHOLDER[activeTab]}
              className="form-input pl-9"
            />
          </div>
        </div>

        {/* Filtro empresa — solo en tab Sedes */}
        {activeTab === 'sedes' && (
          <div className="md:col-span-3">
            <label className="form-label">Empresa</label>
            <select
              value={filtros.empresa_id || ''}
              onChange={(e) => onFiltroChange('empresa_id', e.target.value)}
              className="form-select"
            >
              <option value="">Todas las empresas</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Estado — siempre visible */}
        <div className="md:col-span-2">
          <label className="form-label">Estado</label>
          <select
            value={filtros.is_active ?? ''}
            onChange={(e) => onFiltroChange('is_active', e.target.value)}
            className="form-select"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        {/* Limpiar */}
        <div className="md:col-span-2">
          <button
            onClick={onLimpiar}
            disabled={!hayFiltros}
            className="btn-secondary w-full gap-1.5 text-xs disabled:opacity-40"
            style={{ height: '42px' }}
          >
            <Icon name="filter_list_off" className="text-[16px]" />
            Limpiar
          </button>
        </div>

      </div>

      {/* Chips de filtros activos */}
      {hayFiltros && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
          {filtros.search && (
            <FiltroChip label={`"${filtros.search}"`} onRemove={() => onFiltroChange('search', '')} />
          )}
          {filtros.empresa_id && (
            <FiltroChip
              label={`Empresa: ${empresas.find((e) => String(e.id) === String(filtros.empresa_id))?.nombre ?? filtros.empresa_id}`}
              onRemove={() => onFiltroChange('empresa_id', '')}
            />
          )}
          {filtros.is_active !== '' && (
            <FiltroChip
              label={filtros.is_active === 'true' ? 'Solo activos' : 'Solo inactivos'}
              onRemove={() => onFiltroChange('is_active', '')}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FiltroChip({ label, onRemove }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: 'var(--color-border-light)', color: 'var(--color-text-body)' }}
    >
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors leading-none">
        <span className="material-symbols-outlined text-[13px]">close</span>
      </button>
    </span>
  );
}