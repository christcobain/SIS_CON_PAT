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

function FInput({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Icon name="search"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none"
        style={{ color: value ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm rounded-xl py-2.5 pr-4 transition-all"
        style={{ paddingLeft: 40, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
        onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
        onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }} />
    </div>
  );
}

function FSelect({ value, onChange, children }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="text-sm rounded-xl px-3 py-2.5 cursor-pointer transition-all shrink-0"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)', outline: 'none' }}
      onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}>
      {children}
    </select>
  );
}

export default function TransferenciasFiltros({ filtros, onFiltroChange, onLimpiar, activeTab }) {
  const hayFiltros = filtros.search || filtros.estado;
  return (
    <div className="card p-4 flex items-center gap-3 flex-wrap">
      <FInput value={filtros.search || ''} onChange={v => onFiltroChange('search', v)}
        placeholder="Buscar por N° orden, sede, usuario..." />

      <FSelect value={filtros.estado || ''} onChange={v => onFiltroChange('estado', v)}>
        <option value="">Todos los estados</option>
        {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
      </FSelect>

      <button
        onClick={() => onFiltroChange('misTransferencias', !filtros.misTransferencias)}
        className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all shrink-0"
        style={{
          background: filtros.misTransferencias ? 'rgb(127 29 29 / 0.08)' : 'var(--color-surface)',
          border: `1px solid ${filtros.misTransferencias ? 'rgb(127 29 29 / 0.3)' : 'var(--color-border)'}`,
          color: filtros.misTransferencias ? 'var(--color-primary)' : 'var(--color-text-muted)',
        }}>
        <Icon name={filtros.misTransferencias ? 'person' : 'public'} className="text-[18px]" />
        {filtros.misTransferencias ? 'Mis órdenes' : 'Todas'}
      </button>

      {hayFiltros && (
        <button onClick={onLimpiar}
          className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all shrink-0"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
          <Icon name="filter_list_off" className="text-[18px]" />Limpiar
        </button>
      )}
    </div>
  );
}