const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ROLES_SISTEMA = [
  'SYSADMIN', 'COORDSISTEMA', 'ADMINSEDE', 'ASISTSISTEMA', 'SEGURSEDE', 'USUARIOFINAL',
];

export default function UsuariosFiltros({ filtros, onFiltroChange,  onLimpiar, activeTab }) {
  const hayFiltros = filtros.search || filtros.role || filtros.sede_id || filtros.is_active !== '';

  // Solo mostrar filtros relevantes por tab
  const esDependencias = activeTab === 'dependencias';

  return (
    <div className="card p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

        {/* Búsqueda */}
        <div className="md:col-span-2">
          <label className="form-label">Buscar</label>
          <div className="relative">
            <Icon name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
              style={{ color: 'var(--color-text-faint)' }} />
            <input
              type="text"
              value={filtros.search}
              onChange={(e) => onFiltroChange('search', e.target.value)}
              placeholder={esDependencias
                ? 'Buscar por nombre de dependencia…'
                : 'Buscar por nombre, apellido o DNI…'}
              className="form-input pl-9"
            />
          </div>
        </div>

        {/* Rol (solo en tab usuarios) */}
        {!esDependencias && (
          <div>
            <label className="form-label">Rol</label>
            <select
              value={filtros.role}
              onChange={(e) => onFiltroChange('role', e.target.value)}
              className="form-select"
            >
              <option value="">Todos los roles</option>
              {ROLES_SISTEMA.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        {/* Estado */}
        <div>
          <label className="form-label">Estado</label>
          <select
            value={filtros.is_active}
            onChange={(e) => onFiltroChange('is_active', e.target.value)}
            className="form-select"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Chips de filtros activos */}
      {hayFiltros && (
        <div className="flex items-center gap-2 flex-wrap mt-3 pt-3"
             style={{ borderTop: '1px solid var(--color-border-light)' }}>
          <span className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}>
            Filtros activos:
          </span>
          {filtros.search && (
            <Chip label={`"${filtros.search}"`} onRemove={() => onFiltroChange('search', '')} />
          )}
          {filtros.role && (
            <Chip label={filtros.role} onRemove={() => onFiltroChange('role', '')} />
          )}
          {filtros.is_active !== '' && (
            <Chip
              label={filtros.is_active === 'true' ? 'Activos' : 'Inactivos'}
              onRemove={() => onFiltroChange('is_active', '')}
            />
          )}
          <button onClick={onLimpiar}
            className="text-[10px] font-black transition-colors ml-1"
            style={{ color: 'var(--color-primary)' }}>
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: 'var(--color-border-light)', color: 'var(--color-text-body)' }}>
      {label}
      <button onClick={onRemove} className="hover:opacity-60 transition-opacity leading-none">
        <span className="material-symbols-outlined text-[12px]">close</span>
      </button>
    </span>
  );
}