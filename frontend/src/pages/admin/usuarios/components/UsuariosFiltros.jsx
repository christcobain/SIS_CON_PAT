import React from 'react';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ROLES_SISTEMA = [
  'SYSADMIN', 'COORDSISTEMA', 'ADMINSEDE', 'ASISTSISTEMA', 'SEGURSEDE', 'USUARIOCORTE',
];

// ── Componente de Chip Refinado ───────────────────────────────────────────────
function FiltroChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface-alt/50 text-[11px] font-bold text-body animate-in fade-in zoom-in duration-200">
      <span className="text-faint text-[10px] uppercase tracking-wider font-black">Filtro:</span>
      <span className="text-main">{label}</span>
      <button 
        onClick={onRemove} 
        className="ml-1 size-4 flex items-center justify-center rounded-full hover:bg-red-500 hover:text-white transition-all"
      >
        <Icon name="close" className="text-[12px]" />
      </button>
    </span>
  );
}

export default function UsuariosFiltros({ filtros, onFiltroChange, onLimpiar, activeTab }) {
  const hayFiltros = filtros.search || filtros.role || filtros.sede_id || filtros.is_active !== '';
  const esDependencias = activeTab === 'dependencias';

  return (
    <div className="card shadow-sm border border-border bg-surface overflow-hidden transition-all duration-300 mb-6">
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

          {/* Búsqueda Principal — Se expande si no hay selector de Rol */}
          <div className={esDependencias ? 'md:col-span-8 lg:col-span-9' : 'md:col-span-5 lg:col-span-6'}>
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">
              {esDependencias ? 'Buscar Dependencia' : 'Búsqueda de USuarios'}
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <Icon 
                  name={esDependencias ? 'corporate_fare' : 'person_search'} 
                  className={`text-[18px] transition-colors ${filtros.search ? 'text-primary' : 'text-faint group-focus-within:text-primary'}`} 
                />
              </div>
              <input
                type="text"
                value={filtros.search || ''}
                onChange={(e) => onFiltroChange('search', e.target.value)}
                placeholder={esDependencias 
                  ? 'Nombre de la dependencia o unidad...' 
                  : 'DNI, nombres o apellidos...'}
                className="form-input pl-10 pr-10 py-2.5 text-xs font-medium placeholder:text-faint focus:ring-4 focus:ring-primary/5 border-border hover:border-muted transition-all w-full"
              />
              {filtros.search && (
                <button 
                  onClick={() => onFiltroChange('search', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-red-500 transition-colors"
                >
                  <Icon name="backspace" className="text-[16px]" />
                </button>
              )}
            </div>
          </div>

          {/* Rol (Solo visible en pestaña de usuarios) */}
          {!esDependencias && (
            <div className="md:col-span-3 lg:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">Roles</label>
              <select
                value={filtros.role || ''}
                onChange={(e) => onFiltroChange('role', e.target.value)}
                className="form-select text-xs font-bold py-2.5 cursor-pointer hover:bg-surface-alt/50 transition-colors"
              >
                <option value="">Todos los roles</option>
                {ROLES_SISTEMA.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {/* Estado */}
          <div className="md:col-span-2 lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">Estado</label>
            <select
              value={filtros.is_active}
              onChange={(e) => onFiltroChange('is_active', e.target.value)}
              className="form-select text-xs font-bold py-2.5 cursor-pointer hover:bg-surface-alt/50 transition-colors"
            >
              <option value="">Cualquiera</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          {/* Botón de Acción Limpiar */}
          <div className="md:col-span-2 lg:col-span-2">
            <button
              onClick={onLimpiar}
              disabled={!hayFiltros}
              className={`flex items-center justify-center gap-2 w-full h-[41px] rounded-xl border transition-all duration-200 text-[10px] font-black uppercase tracking-widest
                ${hayFiltros 
                  ? 'bg-red-500/5 border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20' 
                  : 'bg-surface border-border text-faint cursor-not-allowed opacity-40'}`}
            >
              <Icon name="filter_alt_off" className="text-[18px]" />
              Limpiar
            </button>
          </div>
        </div>

        {/* ── Chips de Filtros Activos ── */}
        {hayFiltros && (
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-border/60">
            <span className="text-[9px] font-black text-faint uppercase tracking-widest mr-2">Filtros Activos:</span>
            
            {filtros.search && (
              <FiltroChip label={`"${filtros.search}"`} onRemove={() => onFiltroChange('search', '')} />
            )}
            
            {filtros.role && (
              <FiltroChip label={filtros.role} onRemove={() => onFiltroChange('role', '')} />
            )}
            
            {filtros.is_active !== '' && (
              <FiltroChip
                label={filtros.is_active === 'true' ? 'Solo Activos' : 'Solo Inactivos'}
                onRemove={() => onFiltroChange('is_active', '')}
              />
            )}
            
            <button 
              onClick={onLimpiar}
              className="text-[9px] font-black text-primary hover:text-primary-hover uppercase tracking-tighter ml-2 underline underline-offset-4"
            >
              Borrar todo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}