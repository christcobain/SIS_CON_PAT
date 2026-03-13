const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ROLE_CFG = {
  SYSADMIN:     { icon: 'shield_person',   iconBg: 'bg-primary/10',  iconColor: 'text-primary'    },
  COORDSISTEMA: { icon: 'hub',             iconBg: 'bg-blue-100',    iconColor: 'text-blue-600'   },
  ADMINSEDE:    { icon: 'corporate_fare',  iconBg: 'bg-purple-100',  iconColor: 'text-purple-600' },
  ASISTSISTEMA: { icon: 'person_edit',     iconBg: 'bg-amber-100',   iconColor: 'text-amber-600'  },
  SEGURSEDE:    { icon: 'security',        iconBg: 'bg-orange-100',  iconColor: 'text-orange-600' },
  USUARIOFINAL: { icon: 'person',          iconBg: 'bg-slate-100',   iconColor: 'text-slate-500'  },
};
const DEFAULT_CFG = { icon: 'manage_accounts', iconBg: 'bg-slate-100', iconColor: 'text-slate-500' };

export default function RoleCard({ role, isSelected, onClick }) {
  const cfg       = ROLE_CFG[role.name] ?? DEFAULT_CFG;
  const permCount = role.permissions?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
      style={{
        borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
        background: isSelected ? 'rgba(127,29,29,0.05)' : 'transparent',
        borderBottom: '1px solid var(--color-border-light)',
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--color-surface-alt)'; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Ícono */}
      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
        <Icon name={cfg.icon} className={`text-[19px] ${cfg.iconColor}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p
            className="text-[12.5px] font-black leading-tight truncate"
            style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
          >
            {role.name}
          </p>
          {role.name === 'SYSADMIN' && (
            <span
              className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: 'rgba(127,29,29,0.1)', color: 'var(--color-primary)' }}
            >
              System
            </span>
          )}
          {!role.is_active && (
            <span
              className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}
            >
              Inactivo
            </span>
          )}
        </div>
        <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
          {role.description || 'Sin descripción'}
        </p>
      </div>

      {/* Badge count + chevron */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {permCount > 0 && (
          <span className="text-[9px] font-black" style={{ color: 'var(--color-text-faint)' }}>
            {permCount}p
          </span>
        )}
        <Icon
          name="chevron_right"
          className="text-[18px]"
          style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-faint)' }}
        />
      </div>
    </button>
  );
}