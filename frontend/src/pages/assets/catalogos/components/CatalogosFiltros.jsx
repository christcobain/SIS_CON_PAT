import React from 'react';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ESTADOS = [
  { value: '',     label: 'Todos los estados' },
  { value: 'true',  label: 'Solo Activos'   },
  { value: 'false', label: 'Solo Inactivos' },
];

export default function CatalogosFiltros({ filtros, onFiltroChange, onLimpiar }) {
  const hayFiltros = filtros.search || filtros.is_active !== '';

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 bg-surface p-1">
      
      {/* Buscador de Catálogo */}
      <div className="flex-1 min-w-[280px]">
        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">
          Filtrar Catálogo
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
            value={filtros.search}
            onChange={(e) => onFiltroChange('search', e.target.value)}
            placeholder="Buscar por nombre, descripción..."
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

      {/* Selector de Estado */}
      <div className="min-w-[160px]">
        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">
          Disponibilidad
        </label>
        <select
          value={filtros.is_active}
          onChange={(e) => onFiltroChange('is_active', e.target.value)}
          className="form-select text-xs font-bold py-2.5 cursor-pointer hover:bg-surface-alt/50 transition-colors"
        >
          {ESTADOS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Botón Limpiar Dinámico */}
      <div className="flex items-center">
        <button
          onClick={onLimpiar}
          disabled={!hayFiltros}
          className={`flex items-center justify-center gap-2 px-4 h-[41px] rounded-xl border transition-all duration-200 text-[10px] font-black uppercase tracking-widest
            ${hayFiltros 
              ? 'bg-red-500/5 border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20' 
              : 'bg-surface border-border text-faint cursor-not-allowed opacity-40'}`}
        >
          <Icon name={hayFiltros ? 'filter_alt_off' : 'filter_list'} className="text-[18px]" />
          <span className="hidden md:inline">Limpiar</span>
        </button>
      </div>

    </div>
  );
}