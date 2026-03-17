const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ROLE_CFG = {
  SYSADMIN:     { icon: 'shield_person',  bg: 'rgb(127 29 29 / 0.12)', color: 'var(--color-primary)' },
  coorSistema: { icon: 'hub',            bg: 'rgb(37 99 235 / 0.12)', color: '#1d4ed8'              },
  adminSede:    { icon: 'corporate_fare', bg: 'rgb(124 58 237 / 0.12)', color: '#7c3aed'             },
  asistSistema: { icon: 'person_edit',    bg: 'rgb(180 83 9 / 0.12)',  color: '#b45309'              },
  segurSede:    { icon: 'security',       bg: 'rgb(194 65 12 / 0.12)', color: '#c2410c'              },
  userCorte: { icon: 'person',         bg: 'rgb(71 85 105 / 0.12)', color: '#64748b'              },
};
const DEFAULT_CFG = {
  icon: 'manage_accounts',
  bg: 'var(--color-border-light)',
  color: 'var(--color-text-muted)',
};

export default function RoleCard({ role, isSelected, onClick }) {
  const cfg        = ROLE_CFG[role.name] ?? DEFAULT_CFG;
  const permCount  = role.permissions?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className="relative w-full flex items-center gap-3 px-4 py-4 text-left transition-all duration-200"
      style={{
        background:   isSelected ? 'var(--color-surface-alt)' : 'transparent',
        borderBottom: '1px solid var(--color-border)',
        borderLeft:   isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
        opacity:      role.is_active ? 1 : 0.55,
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--color-border-light)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div
        className="size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200"
        style={{
          background: cfg.bg,
          transform:  isSelected ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        <Icon name={cfg.icon} className="text-[20px]" style={{ color: cfg.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-black tracking-tight truncate"
          style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
          {role.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
            style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
            {permCount} perm.
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold"
            style={{ color: role.is_active ? '#16a34a' : 'var(--color-text-muted)' }}>
            <span className={`size-1.5 rounded-full ${role.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
            {role.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {isSelected && (
        <Icon name="chevron_right" className="text-[18px] shrink-0"
          style={{ color: 'var(--color-primary)' }} />
      )}
    </button>
  );
}