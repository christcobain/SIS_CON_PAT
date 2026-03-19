import { useEffect, useState } from 'react';
import { useCatalogos } from '../../../../hooks/useCatalogos';
import { useLocaciones } from '../../../../hooks/useLocaciones';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ESTADOS = [
  { value: 'PENDIENTE_APROBACION',  label: 'Pendiente aprobación'  },
  { value: 'EN_ESPERA_CONFORMIDAD', label: 'Espera conformidad'     },
  { value: 'EN_RETORNO',            label: 'En retorno'             },
  { value: 'ATENDIDO',              label: 'Atendido'               },
  { value: 'DEVUELTO',              label: 'Devuelto'               },
  { value: 'CANCELADO',             label: 'Cancelado'              },
];

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

function FInput({ value, onChange, placeholder, icon = 'search' }) {
  return (
    <div className="relative group">
      <Icon
        name={icon}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none"
        style={{ color: value ? 'var(--color-primary)' : 'var(--color-text-faint)' }}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input pl-10 pr-10 py-2.5 text-xs font-medium placeholder:text-faint focus:ring-4 focus:ring-primary/5 border-border hover:border-muted transition-all w-full"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-red-500 transition-colors"
        >
          <Icon name="backspace" className="text-[16px]" />
        </button>
      )}
    </div>
  );
}

function FSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="form-select text-xs font-bold py-2.5 cursor-pointer hover:bg-surface-alt/50 transition-colors"
    >
      {children}
    </select>
  );
}

export default function TransferenciasFiltros({ filtros, onFiltroChange, onLimpiar, activeTab }) {
  const { fetchCatalogos, motivosTransferencia = [] } = useCatalogos();
  const { sedes = [] } = useLocaciones();

  useEffect(() => {
    fetchCatalogos(['motivosTransferencia']);
  }, []);

  const esTraslado = activeTab === 'TRASLADO_SEDE';

  const hayFiltros = filtros.search || filtros.estado || filtros.sede_destino_id || filtros.motivo_id;

  const sedeDestSel = sedes.find(s => String(s.id) === String(filtros.sede_destino_id));
  const motivoSel   = motivosTransferencia.find(m => String(m.id) === String(filtros.motivo_id));

  return (
    <div className="card shadow-sm border border-border bg-surface overflow-hidden transition-all duration-300">
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

          {/* Búsqueda por N° orden o usuario */}
          <div className="md:col-span-3">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">
              Buscar
            </label>
            <FInput
              value={filtros.search || ''}
              onChange={v => onFiltroChange('search', v)}
              placeholder="N° orden, sede, usuario..."
              icon="search"
            />
          </div>

          {/* Estado */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">
              Estado
            </label>
            <FSelect value={filtros.estado || ''} onChange={v => onFiltroChange('estado', v)}>
              <option value="">Todos los estados</option>
              {ESTADOS.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </FSelect>
          </div>

          {/* Sede destino — solo traslados */}
          {esTraslado && (
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">
                Sede destino
              </label>
              <FSelect value={filtros.sede_destino_id || ''} onChange={v => onFiltroChange('sede_destino_id', v)}>
                <option value="">Todas las sedes</option>
                {sedes.filter(s => s.is_active !== false).map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </FSelect>
            </div>
          )}

          {/* Motivo de transferencia */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1">
              Motivo
            </label>
            <FSelect value={filtros.motivo_id || ''} onChange={v => onFiltroChange('motivo_id', v)}>
              <option value="">Todos los motivos</option>
              {motivosTransferencia.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </FSelect>
          </div>

          {/* Mis órdenes toggle */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1 opacity-0 select-none">
              Vista
            </label>
            <button
              onClick={() => onFiltroChange('misTransferencias', !filtros.misTransferencias)}
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-3 h-[41px] rounded-xl transition-all w-full justify-center"
              style={{
                background: filtros.misTransferencias ? 'rgb(127 29 29 / 0.08)' : 'var(--color-surface)',
                border: `1px solid ${filtros.misTransferencias ? 'rgb(127 29 29 / 0.3)' : 'var(--color-border)'}`,
                color: filtros.misTransferencias ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              <Icon name={filtros.misTransferencias ? 'person' : 'public'} className="text-[18px]" />
              {filtros.misTransferencias ? 'Mis órdenes' : 'Todas'}
            </button>
          </div>

          {/* Botón limpiar */}
          <div className="md:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2 block ml-1 opacity-0 select-none">
              Limpiar
            </label>
            <button
              onClick={onLimpiar}
              disabled={!hayFiltros}
              className={`flex items-center justify-center gap-2 w-full h-[41px] rounded-xl border transition-all duration-200 text-[10px] font-black uppercase tracking-widest
                ${hayFiltros
                  ? 'bg-red-500/5 border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20'
                  : 'bg-surface border-border text-faint cursor-not-allowed opacity-40'}`}
            >
              <Icon name="filter_alt_off" className="text-[18px]" />
            </button>
          </div>
        </div>

        {/* Chips de filtros activos */}
        {hayFiltros && (
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-border/60">
            <span className="text-[9px] font-black text-faint uppercase tracking-widest mr-2">Filtrando por:</span>

            {filtros.search && (
              <FiltroChip label={`"${filtros.search}"`} onRemove={() => onFiltroChange('search', '')} />
            )}
            {filtros.estado && (
              <FiltroChip
                label={ESTADOS.find(e => e.value === filtros.estado)?.label || filtros.estado}
                onRemove={() => onFiltroChange('estado', '')}
              />
            )}
            {filtros.sede_destino_id && (
              <FiltroChip
                label={`Destino: ${sedeDestSel?.nombre ?? `Sede #${filtros.sede_destino_id}`}`}
                onRemove={() => onFiltroChange('sede_destino_id', '')}
              />
            )}
            {filtros.motivo_id && (
              <FiltroChip
                label={`Motivo: ${motivoSel?.nombre ?? `ID ${filtros.motivo_id}`}`}
                onRemove={() => onFiltroChange('motivo_id', '')}
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