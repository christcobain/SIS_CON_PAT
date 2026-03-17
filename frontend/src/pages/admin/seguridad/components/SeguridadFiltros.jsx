const Icon = ({ name, style = {} }) => (
  <span className="material-symbols-outlined leading-none select-none text-[18px]" style={style}>{name}</span>
);

function FInput({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <Icon name="badge"
        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: value ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm rounded-xl py-2.5 pr-4 transition-all"
        style={{ paddingLeft: 40, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
        onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
        onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
      />
    </div>
  );
}

function FSelect({ value, onChange, children }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="text-sm rounded-xl px-3 py-2.5 cursor-pointer transition-all shrink-0"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)', outline: 'none' }}
      onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    >
      {children}
    </select>
  );
}

export default function SeguridadFiltros({ activeTab, filtros, onChange, onBuscar, loading }) {
  const { dni = '', status = '', exitoso = '', tipo = '', bloqueado = '' } = filtros;

  return (
    <div className="card p-4 flex items-center gap-3 flex-wrap">
      <FInput value={dni} onChange={v => onChange('dni', v)} placeholder="Filtrar por DNI..." />

      {activeTab === 'historial' && (
        <FSelect value={status} onChange={v => onChange('status', v)}>
          <option value="">Todos los estados</option>
          <option value="active">Activa</option>
          <option value="logout">Cerrada</option>
          <option value="expired">Expirada</option>
        </FSelect>
      )}

      {activeTab === 'intentos' && (
        <>
          <FSelect value={exitoso} onChange={v => onChange('exitoso', v)}>
            <option value="">Todos</option>
            <option value="true">Exitosos</option>
            <option value="false">Fallidos</option>
          </FSelect>
          <FSelect value={tipo} onChange={v => onChange('tipo', v)}>
            <option value="">Todos los tipos</option>
            <option value="success">Exitoso</option>
            <option value="invalid_password">Clave inválida</option>
            <option value="user_not_found">No encontrado</option>
            <option value="locked">Bloqueado</option>
            <option value="password_expired">Clave expirada</option>
            <option value="force_password_change">Cambio requerido</option>
            <option value="multiple_sessions">Sesión múltiple</option>
          </FSelect>
        </>
      )}

      {activeTab === 'credenciales' && (
        <FSelect value={bloqueado} onChange={v => onChange('bloqueado', v)}>
          <option value="">Todos</option>
          <option value="true">Bloqueados</option>
          <option value="false">Sin bloqueo</option>
        </FSelect>
      )}

      <button onClick={onBuscar} disabled={loading}
        className="btn-primary flex items-center gap-2 px-4 shrink-0">
        {loading
          ? <span className="btn-loading-spin" />
          : <Icon name="search" />
        }
        Buscar
      </button>
    </div>
  );
}