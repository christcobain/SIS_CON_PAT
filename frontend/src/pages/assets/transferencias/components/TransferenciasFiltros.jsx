import React, { useMemo } from 'react';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ESTADOS = [
  { id: 'PENDIENTE_APROBACION',  label: 'Pendiente Aprobación',  icon: 'schedule' },
  { id: 'EN_ESPERA_CONFORMIDAD', label: 'En Espera Conformidad', icon: 'person' },
  { id: 'EN_RETORNO',            label: 'En Retorno',            icon: 'sync_alt' },
  { id: 'ATENDIDO',              label: 'Atendido',              icon: 'task_alt' },
  { id: 'DEVUELTO',              label: 'Devuelto',              icon: 'reply' },
  { id: 'CANCELADO',             label: 'Cancelado',             icon: 'block' },
];

// ── Componente de Chip Refinado ───────────────────────────────────────────────
function FiltroChip({ label, onRemove, variant = 'default' }) {
  const styles = {
    default: 'bg-surface-alt/50 border-border text-body',
    warning: 'bg-amber-500/10 border-amber-200 text-amber-700 dark:text-amber-500',
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold animate-in fade-in zoom-in duration-200 ${styles[variant]}`}>
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

export default function TransferenciasFiltros({
  filtros = {},
  onFiltroChange,
  onLimpiar,
  activeTab
}) {
  const hayFiltros = useMemo(() => {
    return !!(filtros.search || filtros.estado || filtros.misTransferencias === false);
  }, [filtros]);

  return (
    <div className="card shadow-sm border border-border bg-surface overflow-hidden transition-all duration-300">
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          {/* Búsqueda Principal */}
          <div className="md:col-span-5 lg:col-span-5">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">
              Rastreo de Transferencia
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
                placeholder="Nº orden, origen o destino..."
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

          {/* Selector de Estado */}
          <div className="md:col-span-3 lg:col-span-3">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">Estado</label>
            <select 
              className="form-select text-xs font-bold py-2.5 cursor-pointer hover:bg-surface-alt/50 transition-colors"
              value={filtros.estado || ''}
              onChange={(e) => onFiltroChange('estado', e.target.value)}
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map(est => (
                <option key={est.id} value={est.id}>{est.label}</option>
              ))}
            </select>
          </div>

          {/* Toggle de Alcance (Alcance Global vs Personal) */}
          <div className="md:col-span-2 lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">Alcance</label>
            <button
              onClick={() => onFiltroChange('misTransferencias', !filtros.misTransferencias)}
              className={`flex items-center justify-center gap-2.5 w-full h-[41px] rounded-xl border transition-all duration-200 text-[11px] font-black uppercase tracking-tight
                ${filtros.misTransferencias 
                  ? 'bg-surface border-border text-muted hover:border-primary/40 hover:text-primary' 
                  : 'bg-primary/5 border-primary/20 text-primary shadow-sm shadow-primary/5' 
                }`}
            >
              <Icon 
                name={filtros.misTransferencias ? 'person' : 'public'} 
                className={`text-[18px] ${filtros.misTransferencias ? 'opacity-40' : 'animate-pulse'}`} 
              />
              {filtros.misTransferencias ? 'Solo Mías' : 'Todo el Sistema'}
            </button>
          </div>

          {/* Botón Limpiar */}
          <div className="md:col-span-2 lg:col-span-2">
            <button
              onClick={onLimpiar}
              disabled={!hayFiltros}
              title="Restablecer filtros"
              className={`flex items-center justify-center gap-2 w-full h-[41px] rounded-xl border transition-all duration-200 text-[10px] font-black uppercase tracking-[0.1em]
                ${hayFiltros 
                  ? 'bg-red-500/5 border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20' 
                  : 'bg-surface border-border text-faint cursor-not-allowed opacity-50'}`}
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
            
            {filtros.estado && (
              <FiltroChip 
                label={ESTADOS.find(e => e.id === filtros.estado)?.label} 
                onRemove={() => onFiltroChange('estado', '')} 
              />
            )}
            
            {!filtros.misTransferencias && (
              <FiltroChip 
                label="Sistema Global" 
                variant="warning"
                onRemove={() => onFiltroChange('misTransferencias', true)} 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}