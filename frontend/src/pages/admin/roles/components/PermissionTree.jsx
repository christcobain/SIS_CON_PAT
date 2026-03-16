const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const MS_ICON = {
  'ms-bienes':   'inventory_2',
  'ms-usuarios': 'group',
  'ms-reportes': 'assessment',
};

const APPS_OCULTAS = ['token_blacklist', 'contenttypes', 'auth', 'sessions'];

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
      <div className="h-full flex flex-col items-center justify-center bg-surface border border-border rounded-2xl">
        <div className="w-10 h-10 rounded-full animate-spin mb-4 border-4 border-border/30 border-t-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Sincronizando Árbol...</p>
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
    <div className="flex flex-col h-full overflow-hidden bg-surface border border-border rounded-2xl shadow-sm">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex items-center justify-between gap-4 shrink-0 bg-surface-alt/50 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-main">Gestión de Permisos</h3>
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold border border-primary/20">
              {rolNombre}
            </span>
          </div>
          <p className={`text-[11px] mt-1 font-bold ${esSysadmin ? 'text-amber-600' : 'text-muted'}`}>
            <Icon name={esSysadmin ? 'shield' : 'rule'} className="text-[14px] align-middle mr-1" />
            {esSysadmin
              ? 'Nivel de Sistema: Acceso total restringido para edición.'
              : `${totalSeleccionados} privilegios otorgados a este rol.`}
          </p>
        </div>

        {!esSysadmin && (
          <button 
            onClick={onSave} 
            disabled={actualizando} 
            className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <Icon name={actualizando ? 'sync' : 'cloud_upload'} className={`text-[18px] ${actualizando ? 'animate-spin' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {actualizando ? 'Procesando...' : 'Aplicar Cambios'}
            </span>
          </button>
        )}
      </div>

      {/* ── Árbol scrollable ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
        {treeFiltrado.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-faint opacity-30">
            <Icon name="lock_open" className="text-6xl mb-4" />
            <p className="text-sm font-bold uppercase tracking-tighter">No hay esquemas de permisos</p>
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6 group">
        <div className="size-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
          <Icon name={MS_ICON[ms.ms_name] ?? 'dns'} className="text-[20px]" />
        </div>
        <div className="flex flex-col flex-1">
          <h4 className="font-black uppercase tracking-[0.2em] text-[11px] text-main leading-none">
            {ms.ms_name.replace('ms-', '')}
          </h4>
          <span className="text-[10px] text-muted font-bold mt-1 uppercase">Infraestructura del Microservicio</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-alt border border-border shadow-sm">
          <div className="size-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black text-main uppercase">
            {asignadosMs} / {totalMs} <span className="text-faint ml-1">Permisos</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  const perms = app.permissions ?? [];
  const asignados = perms.filter((p) => selectedIds.includes(p.id)).length;
  const todosActivos = asignados === perms.length && perms.length > 0;

  const toggleAll = (e) => {
    e.preventDefault();
    if (disabled) return;
    perms.forEach((p) => {
      const tiene = selectedIds.includes(p.id);
      if (todosActivos && tiene) onToggle(p.id);
      if (!todosActivos && !tiene) onToggle(p.id);
    });
  };

  return (
    <div className="group rounded-2xl overflow-hidden bg-surface-alt/30 border border-border/60 hover:border-primary/30 transition-all hover:shadow-md">
      {/* Header app */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-alt/50 border-b border-border/40 group-hover:bg-primary/5 transition-colors">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted truncate leading-none">
            {app.app_label}
          </p>
          <span className="text-[9px] font-bold text-faint uppercase">{asignados} de {perms.length}</span>
        </div>
        
        {!disabled && (
          <button
            onClick={toggleAll}
            className={`text-[9px] font-black px-2 py-1 rounded-md transition-all uppercase tracking-tighter
              ${todosActivos 
                ? 'bg-red-50 text-red-600 border border-red-100' 
                : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white'
              }`}
          >
            {todosActivos ? 'Remover' : 'Marcar Todos'}
          </button>
        )}
      </div>

      {/* Lista de permisos */}
      <div className="p-2 space-y-1 bg-surface/40">
        {perms.map((perm) => {
          const isChecked = selectedIds.includes(perm.id);
          return (
            <label
              key={perm.id}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
                ${isChecked 
                  ? 'bg-white border-primary/20 shadow-sm' 
                  : 'bg-transparent border-transparent grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:bg-white/50 hover:border-border'
                }
              `}
            >
              <div className="relative flex items-center justify-center shrink-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => !disabled && onToggle(perm.id)}
                  disabled={disabled}
                  className="peer appearance-none size-4 rounded border-2 border-border checked:bg-primary checked:border-primary transition-all shrink-0"
                />
                <Icon name="check" className="absolute text-[12px] text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
              </div>

              <div className="min-w-0">
                <p className={`text-[11px] font-black leading-tight truncate transition-colors ${isChecked ? 'text-primary' : 'text-main'}`}>
                  {perm.codename}
                </p>
                <p className="text-[9.5px] font-medium text-muted truncate mt-0.5 opacity-80 uppercase tracking-tighter">
                  {perm.name}
                </p>
              </div>

              {isChecked && (
                <div className="absolute right-3">
                  <div className="size-1 rounded-full bg-primary animate-ping" />
                </div>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}