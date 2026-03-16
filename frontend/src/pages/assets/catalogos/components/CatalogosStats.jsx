import { CATALOGOS_META } from '../catalogosMeta';

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

export default function CatalogosStats({ items = [], loading = false }) {
  const total   = items.length;
  const activos = items.filter((i) => i.is_active).length;
  const inactivos = total - activos;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        icon="category"       iconBg="bg-primary/10" iconColor="text-primary"
        label="Total registros" value={total}   loading={loading}
      />
      <KpiCard
        icon="check_circle"   iconBg="bg-emerald-100" iconColor="text-emerald-600"
        label="Activos"         value={activos}   loading={loading}
      />
      <KpiCard
        icon="cancel"         iconBg="bg-slate-100"   iconColor="text-slate-500"
        label="Inactivos"       value={inactivos} loading={loading}
      />
      <KpiCard
        icon="dataset"        iconBg="bg-blue-100"    iconColor="text-blue-600"
        label="Catálogos disponibles" value={CATALOGOS_META.length} loading={false}
      />
    </div>
  );
}