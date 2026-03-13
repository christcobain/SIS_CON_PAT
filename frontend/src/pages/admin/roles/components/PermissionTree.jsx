const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const MS_ICON = {
  'ms-bienes':   'inventory_2',
  'ms-usuarios': 'group',
  'ms-reportes': 'assessment',
};

const APPS_OCULTAS = ['token_blacklist', 'contenttypes', 'auth', 'sessions'];

// ─────────────────────────────────────────────────────────────────────────────
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
      <div
        className="h-full flex flex-col items-center justify-center"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
        }}
      >
        <div
          className="w-8 h-8 rounded-full animate-spin mb-4 border-4"
          style={{ borderColor: 'var(--color-border-light)', borderTopColor: 'var(--color-primary)' }}
        />
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Cargando permisos...
        </p>
      </div>
    );
  }

  const treeFiltrado = tree
    .map((ms) => ({
      ...ms,
      apps: (ms.apps ?? []).filter((app) => !APPS_OCULTAS.includes(app.app_label)),
    }))
    .filter((ms) => ms.apps.length > 0);

  const totalSeleccionados = selectedIds.length;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="px-5 py-4 flex items-center justify-between gap-4 shrink-0"
        style={{
          background: 'var(--color-surface-alt)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div>
          <h3 className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>
            Permisos —{' '}
            <span style={{ color: 'var(--color-primary)' }}>{rolNombre}</span>
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {esSysadmin
              ? 'SYSADMIN tiene acceso total. Los cambios no se aplican.'
              : `${totalSeleccionados} permiso${totalSeleccionados !== 1 ? 's' : ''} seleccionado${totalSeleccionados !== 1 ? 's' : ''}`}
          </p>
        </div>

        {!esSysadmin && (
          <button onClick={onSave} disabled={actualizando} className="btn-primary">
            <Icon name="save" className="text-[17px]" />
            {actualizando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        )}
      </div>

      {/* ── Árbol scrollable ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-7">
        {treeFiltrado.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16"
            style={{ color: 'var(--color-text-faint)' }}
          >
            <Icon name="lock_open" className="text-5xl mb-3" />
            <p className="text-sm font-medium">Sin permisos en el sistema.</p>
          </div>
        ) : (
          treeFiltrado.map((ms) => (
            <MsSection
              key={ms.ms_name}
              ms={ms}
              selectedIds={selectedIds}
              onToggle={onToggle}
              disabled={esSysadmin}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Sección de microservicio ──────────────────────────────────────────────────
function MsSection({ ms, selectedIds, onToggle, disabled }) {
  const totalMs = ms.apps.reduce((a, app) => a + (app.permissions?.length ?? 0), 0);
  const asignadosMs = ms.apps.reduce(
    (a, app) => a + (app.permissions?.filter((p) => selectedIds.includes(p.id)).length ?? 0),
    0
  );

  return (
    <div>
      {/* Cabecera MS */}
      <div
        className="flex items-center gap-2.5 pb-2.5 mb-4"
        style={{ borderBottom: '1px solid var(--color-border-light)' }}
      >
        <Icon name={MS_ICON[ms.ms_name] ?? 'dns'} className="text-[20px] text-primary" />
        <h4
          className="font-black uppercase tracking-wider text-[10px] flex-1"
          style={{ color: 'var(--color-text-body)' }}
        >
          {ms.ms_name.replace('ms-', '')}
        </h4>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}
        >
          {asignadosMs}/{totalMs}
        </span>
      </div>

      {/* Grid de apps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ms.apps.map((app) => (
          <AppCard
            key={app.app_label}
            app={app}
            selectedIds={selectedIds}
            onToggle={onToggle}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

// ── Card de app ───────────────────────────────────────────────────────────────
function AppCard({ app, selectedIds, onToggle, disabled }) {
  const perms        = app.permissions ?? [];
  const asignados    = perms.filter((p) => selectedIds.includes(p.id)).length;
  const todosActivos = asignados === perms.length && perms.length > 0;

  const toggleAll = () => {
    if (disabled) return;
    perms.forEach((p) => {
      const tiene = selectedIds.includes(p.id);
      if (todosActivos && tiene)    onToggle(p.id);
      if (!todosActivos && !tiene)  onToggle(p.id);
    });
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--color-surface-alt)',
        border: '1px solid var(--color-border-light)',
      }}
    >
      {/* Header app */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{ borderBottom: '1px solid var(--color-border-light)' }}
      >
        <p
          className="text-[10px] font-black uppercase tracking-wider truncate flex-1 mr-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {app.app_label}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-faint)' }}>
            {asignados}/{perms.length}
          </span>
          {!disabled && (
            <button
              onClick={toggleAll}
              className="text-[10px] font-black transition-opacity"
              style={{ color: 'var(--color-primary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {todosActivos ? 'Quitar' : 'Todos'}
            </button>
          )}
        </div>
      </div>

      {/* Lista de permisos */}
      <div className="p-2 space-y-0.5">
        {perms.map((perm) => {
          const checked = selectedIds.includes(perm.id);
          return (
            <label
              key={perm.id}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors
                          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              style={{
                background: checked ? 'var(--color-surface)' : 'transparent',
                border:     checked ? '1px solid var(--color-border)' : '1px solid transparent',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => !disabled && onToggle(perm.id)}
                disabled={disabled}
                className="w-3.5 h-3.5 rounded shrink-0"
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <div className="min-w-0">
                <p
                  className="text-[11px] font-bold leading-none truncate"
                  style={{ color: 'var(--color-text-body)' }}
                >
                  {perm.codename}
                </p>
                <p
                  className="text-[10px] leading-tight mt-0.5 truncate"
                  style={{ color: 'var(--color-text-muted)' }}
                >
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