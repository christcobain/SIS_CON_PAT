import React from 'react';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const PLACEHOLDER = {
  sedes:       'Nombre de sede, dirección...',
  modulos:     'Buscar módulo...',
  ubicaciones: 'Nombre o descripción...',
};

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

export default function LocacionesFiltros({
  filtros,
  onFiltroChange,
  empresas = [],
  activeTab,
  onLimpiar,
}) {
  const hayFiltros = filtros.search || filtros.is_active !== '' || filtros.empresa_id;

  // Nombre de empresa seleccionada para el chip
  const empresaSeleccionada = empresas.find(
    (e) => String(e.id) === String(filtros.empresa_id)
  );

  return (
    <div className="card shadow-sm border border-border bg-surface overflow-hidden transition-all duration-300">
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

          {/* Búsqueda Principal */}
          <div className={activeTab === 'sedes' ? 'md:col-span-4 lg:col-span-5' : 'md:col-span-7 lg:col-span-8'}>
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">
              Localizar {activeTab}
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <Icon
                  name="location_on"
                  className={`text-[18px] transition-colors ${filtros.search ? 'text-primary' : 'text-faint group-focus-within:text-primary'}`}
                />
              </div>
              <input
                type="text"
                value={filtros.search || ''}
                onChange={(e) => onFiltroChange('search', e.target.value)}
                placeholder={PLACEHOLDER[activeTab]}
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

          {/* Filtro Empresa — solo para Sedes */}
          {activeTab === 'sedes' && (
            <div className="md:col-span-4 lg:col-span-3">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">
                Entidad / Empresa
              </label>
              <select
                value={filtros.empresa_id || ''}
                onChange={(e) => onFiltroChange('empresa_id', e.target.value)}
                className="form-select text-xs font-bold py-2.5 cursor-pointer hover:bg-surface-alt/50 transition-colors"
              >
                <option value="">Todas las empresas</option>
                {empresas.map((e) => (
                  <option key={e.id} value={String(e.id)}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Estado (antes "Disponibilidad") */}
          <div className="md:col-span-2 lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">
              Estado
            </label>
            <select
              value={filtros.is_active ?? ''}
              onChange={(e) => onFiltroChange('is_active', e.target.value)}
              className="form-select text-xs font-bold py-2.5 cursor-pointer hover:bg-surface-alt/50 transition-colors"
            >
              <option value="">Cualquiera</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          {/* Botón Limpiar */}
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

        {/* Chips de Filtros Activos */}
        {hayFiltros && (
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-border/60">
            <span className="text-[9px] font-black text-faint uppercase tracking-widest mr-2">Filtrando por:</span>

            {filtros.search && (
              <FiltroChip label={`"${filtros.search}"`} onRemove={() => onFiltroChange('search', '')} />
            )}

            {filtros.empresa_id && (
              <FiltroChip
                label={`Empresa: ${empresaSeleccionada?.nombre ?? `ID ${filtros.empresa_id}`}`}
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
    </div>
  );
}