const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

function KpiCard({ icon, iconBg, iconColor, label, value, loading }) {
  return (
    <div className="kpi-card">
      <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon name={icon} className={`text-[22px] ${iconColor}`} />
      </div>
      <div>
        {loading
          ? <div className="skeleton h-6 w-10 mb-1" />
          : <p className="text-2xl font-black leading-tight"
               style={{ color: 'var(--color-text-primary)' }}>{value ?? 0}</p>
        }
        <p className="text-[10px] font-bold uppercase tracking-wider"
           style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      </div>
    </div>
  );
}

export default function BienesStats({ bienes = [], loading = false }) {
  const total      = bienes.length;
  const activos    = bienes.filter((b) => b.is_active).length;
  const inactivos  = total - activos;
  const operativos = bienes.filter(
    (b) => b.estado_funcionamiento_nombre?.toUpperCase().includes('OPERATIVO')
  ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        icon="inventory_2"    iconBg="bg-primary/10"   iconColor="text-primary"
        label="Total bienes"  value={total}    loading={loading}
      />
      <KpiCard
        icon="check_circle"   iconBg="bg-emerald-100"  iconColor="text-emerald-600"
        label="Activos"       value={activos}  loading={loading}
      />
      <KpiCard
        icon="cancel"         iconBg="bg-slate-100"    iconColor="text-slate-500"
        label="Inactivos"     value={inactivos} loading={loading}
      />
      <KpiCard
        icon="power_settings_new" iconBg="bg-blue-100" iconColor="text-blue-600"
        label="Operativos"    value={operativos} loading={loading}
      />
    </div>
  );
}