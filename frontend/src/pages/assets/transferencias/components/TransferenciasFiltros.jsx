import { useMemo,useEffect } from 'react';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ESTADOS = [
  { id: 'PENDIENTE_APROBACION',  label: 'PENDIENTE_APROBACION',  icon: 'schedule' },
  { id: 'EN_ESPERA_CONFORMIDAD', label: 'EN_ESPERA_CONFORMIDAD',   icon: 'person' },
  { id: 'EN_RETORNO',            label: 'EN_RETORNO', icon: 'sync_alt' },
  { id: 'ATENDIDO',              label: 'ATENDIDO',   icon: 'task_alt' },
  { id: 'DEVUELTO',              label: 'DEVUELTO',   icon: 'reply' },
  { id: 'CANCELADO',             label: 'CANCELADO',  icon: 'block' },
];

export default function TransferenciasFiltros({
  filtros={},
  onFiltroChange,
  onLimpiar,
  activeTab
}) {
  const hayFiltros = useMemo(() => {
    return !!(filtros.search || filtros.estado || filtros.misTransferencias === false);
  }, [filtros]);
  
  return (
    <div className="card p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        
        {/* Búsqueda de Texto (Col 5 para mantener espacio) */}
        <div className="md:col-span-5">
          <label className="form-label">Buscar</label>
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
              style={{ color: 'var(--color-text-faint)' }} />
            <input
              type="text"
              className="form-input pl-9"
              value={filtros.search || ''}
              onChange={(e) => onFiltroChange('search', e.target.value)}
              placeholder="Nº orden, origen o destino..."
            />
          </div>
        </div>

        {/* Selector de Estado (Col 3) */}
        <div className="md:col-span-3">
          <label className="form-label">Estado</label>
          <select 
            className="form-select "
            value={filtros.estado || ''}
            onChange={(e) => onFiltroChange('estado', e.target.value)}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map(est => (
              <option key={est.id} value={est.id}>{est.label}</option>
            ))}
          </select>
        </div>

        {/*  Toggle de Mis Transferencias (Col 2) */}
        <div className="md:col-span-2">
          <label className="form-label">Alcance</label>
          <button
            onClick={() => onFiltroChange('misTransferencias', !filtros.misTransferencias)}
                            className={`flex items-center justify-center gap-2 w-full h-[42px] rounded-xl border transition-all text-xs font-bold ${
              filtros.misTransferencias                 
                ? 'bg-gray-100 border-transparent text-gray-500'
                : 'bg-primary/10 border-primary text-primary shadow-sm' 
            }`}
          >
            <Icon name={filtros.misTransferencias ? 'person' : 'public'} className="text-[18px]" />
            {filtros.misTransferencias ? 'Ver todos' : 'Mis Transferencias'}
          </button>
        </div>

        {/* Botón Limpiar (Col 2) */}
        <div className="md:col-span-2 ">
          <button
            onClick={onLimpiar}
            disabled={!hayFiltros}
            className="btn-secondary w-full gap-1.5 text-xs disabled:opacity-40"
          >
            <Icon name="filter_alt_off" className="text-[18px]" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Chips de filtros activos - Siguiendo el patrón de Locaciones */}
      {hayFiltros && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
          {filtros.search && (
            <FiltroChip label={`"${filtros.search}"`} onRemove={() => onFiltroChange('search', '')} />
          )}
          {filtros.estado && (
            <FiltroChip 
              label={`Estado: ${ESTADOS.find(e => e.id === filtros.estado)?.label}`} 
              onRemove={() => onFiltroChange('estado', '')} 
            />
          )}
          {!filtros.misTransferencias && (
            <FiltroChip 
              label="Ver todo el sistema" 
              variant="warning"
              onRemove={() => onFiltroChange('misTransferencias', true)} 
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
      <button onClick={onRemove}
        className="hover:text-red-500 transition-colors leading-none"
      >
        <Icon name="close" className="text-[12px]" />
      </button>
    </span>
  );
}