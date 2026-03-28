const Icon = ({ name, style = {} }) => (
  <span className="material-symbols-outlined leading-none select-none text-[18px]" style={style}>{name}</span>
);

const ESTADOS_BAJA = [
  { value: 'PENDIENTE_APROBACION', label: 'Pendiente aprobación' },
  { value: 'ATENDIDO',             label: 'Atendido' },
  { value: 'DEVUELTO',             label: 'Devuelto' },
  { value: 'CANCELADO',            label: 'Cancelado' },
];

function FInput({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <Icon
        name="search"
        style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: value ? 'var(--color-primary)' : 'var(--color-text-faint)',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm rounded-xl py-2.5 pr-4 transition-all"
        style={{
          paddingLeft: 40,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          outline: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
        onBlur={(e) => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
      />
    </div>
  );
}

function FSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm rounded-xl px-3 py-2.5 cursor-pointer transition-all shrink-0"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        outline: 'none',
      }}
      onFocus={(e) => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={(e) => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    >
      {children}
    </select>
  );
}

export default function BajasFiltros({ filtros, onChange, onLimpiar, sedes = [] }) {
  const hayFiltros = filtros.estado_baja || filtros.sede_elabora_id || filtros.misInformes;

  return (
    <div className="card p-4 flex items-center gap-3 flex-wrap">
      <FInput
        value={filtros.search || ''}
        onChange={(v) => onChange('search', v)}
        placeholder="Buscar por N° informe..."
      />

      <FSelect value={filtros.estado_baja || ''} onChange={(v) => onChange('estado_baja', v)}>
        <option value="">Todos los estados</option>
        {ESTADOS_BAJA.map((e) => (
          <option key={e.value} value={e.value}>{e.label}</option>
        ))}
      </FSelect>

      {sedes.length > 0 && (
        <FSelect value={filtros.sede_elabora_id || ''} onChange={(v) => onChange('sede_elabora_id', v)}>
          <option value="">Todas las sedes</option>
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </FSelect>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange('misInformes', !filtros.misInformes)}
          className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all"
          style={{
            background: filtros.misInformes ? 'rgb(127 29 29 / 0.08)' : 'var(--color-surface)',
            border: `1px solid ${filtros.misInformes ? 'rgb(127 29 29 / 0.3)' : 'var(--color-border)'}`,
            color: filtros.misInformes ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        >
          <Icon name={filtros.misInformes ? 'person' : 'public'} />
          {filtros.misInformes ? 'Mis informes' : 'Todos'}
        </button>

        {hayFiltros && (
          <button
            onClick={onLimpiar}
            className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            <Icon name="filter_list_off" />Limpiar
          </button>
        )}
      </div>
    </div>
  );
}