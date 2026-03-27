const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

function StatCard({ icon, iconBg, iconColor, label, value, loading, accent }) {
  return (
    <div
      className="kpi-card"
      style={accent ? { borderLeft: `3px solid ${accent}` } : {}}
    >
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
           style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

export default function AlertasStats({
  totalPendientes  = 0,
  transfPendientes = 0,
  mantPendientes   = 0,
  historialHoy     = 0,
  loading          = false,
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon="pending_actions"
        iconBg="bg-amber-100" iconColor="text-amber-600"
        label="Total Pendientes" value={totalPendientes}
        accent="#d97706" loading={loading}
      />
      <StatCard
        icon="swap_horiz"
        iconBg="bg-blue-100" iconColor="text-blue-600"
        label="Transf. Pendientes" value={transfPendientes}
        accent="#2563eb" loading={loading}
      />
      <StatCard
        icon="engineering"
        iconBg="bg-primary/10" iconColor="text-primary"
        label="Mant. Pendientes" value={mantPendientes}
        loading={loading}
      />
      <StatCard
        icon="history"
        iconBg="bg-slate-100" iconColor="text-slate-500"
        label="Aprobados Hoy" value={historialHoy}
        loading={loading}
      />
    </div>
  );
}