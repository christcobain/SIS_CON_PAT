import React from 'react';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

// ── Componente de Chip Refinado ───────────────────────────────────────────────
function FiltroChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface-alt/50 text-[11px] font-bold text-body animate-in fade-in zoom-in duration-200">
      <span className="text-faint text-[10px] uppercase tracking-wider">Filtro:</span>
      <span className="text-main">{label}</span>
      <button 
        onClick={onRemove} 
        className="ml-1 size-4 flex items-center justify-center rounded-full hover:bg-red-500 hover:text-white transition-all transition-colors"
      >
        <Icon name="close" className="text-[12px]" />
      </button>
    </span>
  );
}

export default function BienesFiltros({
  filtros,
  onFiltroChange,
  onLimpiar,
  sedes = [],
  tiposBien = [],
  estadosFuncionamiento = [],
}) {
  const hayFiltros =
    filtros.search ||
    filtros.sede_id ||
    filtros.tipo_bien_id ||
    filtros.estado_funcionamiento_id;

  return (
    <div className="card shadow-sm border border-border bg-surface overflow-hidden transition-all duration-300">
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          {/* Search — Búsqueda Principal */}
          <div className="md:col-span-4 lg:col-span-5">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">
              Búsqueda Inteligente
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <Icon 
                  name="search" 
                  className={`text-[18px] transition-colors ${filtros.search ? 'text-primary' : 'text-faint group-focus-within:text-primary'}`} 
                />
              </div>
              <input
                type="text"
                value={filtros.search || ''}
                onChange={(e) => onFiltroChange('search', e.target.value)}
                placeholder="Cód. patrimonial, serie, modelo..."
                className="form-input pl-10 pr-10 py-2.5 text-xs font-medium placeholder:text-faint focus:ring-4 focus:ring-primary/5 border-border hover:border-muted transition-all"
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

          {/* Sede */}
          <div className="md:col-span-3 lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">Sede</label>
            <select
              value={filtros.sede_id || ''}
              onChange={(e) => onFiltroChange('sede_id', e.target.value)}
              className="form-select text-xs font-bold py-2.5 cursor-pointer hover:bg-surface-alt/50 transition-colors"
            >
              <option value="">Todas</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          {/* Tipo de bien */}
          <div className="md:col-span-2 lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">Categoría</label>
            <select
              value={filtros.tipo_bien_id || ''}
              onChange={(e) => onFiltroChange('tipo_bien_id', e.target.value)}
              className="form-select text-xs font-bold py-2.5 cursor-pointer hover:bg-surface-alt/50 transition-colors"
            >
              <option value="">Cualquiera</option>
              {tiposBien.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>

          {/* Estado funcionamiento */}
          <div className="md:col-span-2 lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">Estado</label>
            <select
              value={filtros.estado_funcionamiento_id || ''}
              onChange={(e) => onFiltroChange('estado_funcionamiento_id', e.target.value)}
              className="form-select text-xs font-bold py-2.5 cursor-pointer hover:bg-surface-alt/50 transition-colors"
            >
              <option value="">Cualquiera</option>
              {estadosFuncionamiento.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>

          {/* Botón de Acción Limpiar */}
          <div className="md:col-span-1 lg:col-span-1">
            <button
              onClick={onLimpiar}
              disabled={!hayFiltros}
              title="Restablecer filtros"
              className={`flex items-center justify-center w-full h-[41px] rounded-xl border transition-all duration-200
                ${hayFiltros 
                  ? 'bg-red-500/5 border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20' 
                  : 'bg-surface border-border text-faint cursor-not-allowed opacity-50'}`}
            >
              <Icon name="filter_alt_off" className="text-[20px]" />
            </button>
          </div>
        </div>

        {/* ── Chips de Filtros Activos ── */}
        {hayFiltros && (
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-border/60">
            <span className="text-[9px] font-black text-faint uppercase tracking-widest mr-2">Activos:</span>
            
            {filtros.search && (
              <FiltroChip label={`"${filtros.search}"`} onRemove={() => onFiltroChange('search', '')} />
            )}
            
            {filtros.sede_id && (
              <FiltroChip
                label={sedes.find((s) => String(s.id) === String(filtros.sede_id))?.nombre ?? 'Sede'}
                onRemove={() => onFiltroChange('sede_id', '')}
              />
            )}
            
            {filtros.tipo_bien_id && (
              <FiltroChip
                label={tiposBien.find((t) => String(t.id) === String(filtros.tipo_bien_id))?.nombre ?? 'Tipo'}
                onRemove={() => onFiltroChange('tipo_bien_id', '')}
              />
            )}
            
            {filtros.estado_funcionamiento_id && (
              <FiltroChip
                label={estadosFuncionamiento.find((e) => String(e.id) === String(filtros.estado_funcionamiento_id))?.nombre ?? 'Estado'}
                onRemove={() => onFiltroChange('estado_funcionamiento_id', '')}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}