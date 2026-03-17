const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const MS_ICON = {
  'ms-bienes':   'inventory_2',
  'ms-usuarios': 'group',
  'ms-reportes': 'assessment',
};

const APPS_OCULTAS = ['token_blacklist', 'contenttypes', 'auth', 'sessions'];

function AppSection({ app, selectedIds, onToggle, disabled }) {
  const perms      = app.permissions ?? [];
  const selCount   = perms.filter(p => selectedIds.includes(p.id)).length;
  const allSelected = selCount === perms.length && perms.length > 0;

  const toggleAll = () => {
    if (disabled) return;
    perms.forEach(p => {
      const marcado = selectedIds.includes(p.id);
      if (allSelected && marcado)   onToggle(p.id);
      if (!allSelected && !marcado) onToggle(p.id);
    });
  };

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}>

      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}>
            {app.app_label}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
            style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
            {selCount}/{perms.length}
          </span>
        </div>
        {!disabled && (
          <button onClick={toggleAll}
            className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all"
            style={{ color: allSelected ? '#dc2626' : 'var(--color-primary)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-border-light)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            {allSelected ? 'Quitar todos' : 'Marcar todos'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1 p-2"
        style={{ background: 'var(--color-surface)' }}>
        {perms.map(perm => {
          const isChecked = selectedIds.includes(perm.id);
          return (
            <label key={perm.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150"
              style={{
                background:  isChecked ? 'var(--color-surface-alt)' : 'transparent',
                border:     `1px solid ${isChecked ? 'var(--color-border)' : 'transparent'}`,
                cursor:      disabled ? 'not-allowed' : 'pointer',
                opacity:     disabled ? 0.65 : 1,
              }}>
              <div className="relative flex items-center justify-center shrink-0 size-4">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => !disabled && onToggle(perm.id)}
                  disabled={disabled}
                  className="appearance-none size-4 rounded transition-all shrink-0"
                  style={{
                    border:      `2px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background:   isChecked ? 'var(--color-primary)' : 'transparent',
                    cursor:       disabled ? 'not-allowed' : 'pointer',
                  }}
                />
                {isChecked && (
                  <Icon name="check" className="absolute text-[11px] pointer-events-none"
                    style={{ color: '#fff' }} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black leading-tight truncate"
                  style={{ color: isChecked ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                  {perm.codename}
                </p>
                <p className="text-[9px] font-medium uppercase tracking-tighter truncate mt-0.5"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {perm.name}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function PermissionTree({
  tree = [],
  selectedIds = [],
  onToggle,
  loading,
  actualizando,
  onSave,
  rolNombre,
  esSysadmin = false,
}) {
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="w-10 h-10 rounded-full animate-spin mb-4"
          style={{ border: '4px solid var(--color-border)', borderTopColor: 'var(--color-primary)' }} />
        <p className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}>
          Sincronizando árbol...
        </p>
      </div>
    );
  }

  const treeFiltrado = tree
    .map(ms => ({ ...ms, apps: (ms.apps ?? []).filter(a => !APPS_OCULTAS.includes(a.app_label)) }))
    .filter(ms => ms.apps.length > 0);

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-2xl"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

      <div className="px-6 py-4 flex items-center justify-between gap-4 shrink-0"
        style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>
              Gestión de permisos
            </h3>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold"
              style={{ background: 'rgb(127 29 29 / 0.1)', color: 'var(--color-primary)', border: '1px solid rgb(127 29 29 / 0.2)' }}>
              {rolNombre}
            </span>
          </div>
          <p className="text-[11px] mt-1 font-bold flex items-center gap-1"
            style={{ color: esSysadmin ? '#b45309' : 'var(--color-text-muted)' }}>
            <Icon name={esSysadmin ? 'shield' : 'rule'} className="text-[14px]" />
            {esSysadmin
              ? 'Nivel de sistema — acceso total, no editable.'
              : `${selectedIds.length} privilegios otorgados.`}
          </p>
        </div>
        {!esSysadmin && (
          <button onClick={onSave} disabled={actualizando}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-sm shrink-0">
            <Icon name={actualizando ? 'sync' : 'cloud_upload'}
              className={`text-[18px] ${actualizando ? 'animate-spin' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {actualizando ? 'Guardando...' : 'Guardar cambios'}
            </span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {treeFiltrado.map(ms => (
          <div key={ms.microservice}>
            <div className="flex items-center gap-2 mb-3">
              <Icon name={MS_ICON[ms.microservice] ?? 'api'} className="text-[18px]"
                style={{ color: 'var(--color-primary)' }} />
              <p className="text-[11px] font-black uppercase tracking-widest"
                style={{ color: 'var(--color-text-body)' }}>
                {ms.microservice}
              </p>
            </div>
            <div className="ml-5 space-y-2">
              {ms.apps.map(app => (
                <AppSection
                  key={app.app_label}
                  app={app}
                  selectedIds={selectedIds}
                  onToggle={onToggle}
                  disabled={esSysadmin || actualizando}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}