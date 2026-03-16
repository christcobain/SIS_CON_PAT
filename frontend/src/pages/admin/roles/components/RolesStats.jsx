const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

function StatCard({ icon, iconBg, iconColor, label, value, loading }) {
  return (
    <div className="kpi-card">
      <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon name={icon} className={`text-[22px] ${iconColor}`} />
      </div>
      <div>
        {loading
          ? <div className="skeleton h-6 w-10 mb-1" />
          : <p className="text-2xl font-black leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              {value ?? 0}
            </p>
        }
        <p className="text-[10px] font-bold uppercase tracking-wider"
           >
          {label}
        </p>
      </div>
    </div>
  );
}

export default function RolesStats({ roles = [], loading = false }) {
  const total    = roles.length;
  const activos  = roles.filter((r) => r.is_active).length;
  const inactivos= total - activos;
  const conPerms = roles.filter((r) => (r.total_permissions ?? 0) > 0).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <StatCard
        icon="admin_panel_settings" iconBg="bg-primary/10" iconColor="text-primary"
        label="Total Roles" value={total} loading={loading}
      />
      <StatCard
        icon="verified_user" iconBg="bg-emerald-100" iconColor="text-emerald-600"
        label="Roles Activos" value={activos} loading={loading}
      />
      <StatCard
        icon="shield_lock" iconBg="bg-slate-100" iconColor="text-slate-200"
        label="Inactivos" value={inactivos} loading={loading}
      />
      <StatCard
        icon="key" iconBg="bg-amber-100" iconColor="text-amber-600"
        label="Con Permisos" value={conPerms} loading={loading}
      />
    </div>
  );
}