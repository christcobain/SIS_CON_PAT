import React from 'react';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

// ── Componente de KPI Estándar del Proyecto ──────────────────────────────────
function KpiCard({ icon, colorClass, label, value, loading, trend }) {

  const colorMap = {
    primary: "text-primary bg-primary/10 border-primary/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    amber:   "text-amber-500 bg-amber-500/10 border-amber-500/20",
    blue:    "text-blue-500 bg-blue-500/10 border-blue-500/20",
    slate:   "text-slate-500 bg-slate-500/10 border-slate-500/20",
  };

  const selectedColor = colorMap[colorClass] || colorMap.primary;

  return (
    <div className="card group hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 cursor-default overflow-hidden relative">
      {/* Sutil gradiente de fondo al hacer hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="p-4 flex items-center gap-4 relative z-10">
        {/* Contenedor del Icono */}
        <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 duration-500 ${selectedColor}`}>
          <Icon name={icon} className="text-[24px]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-1 truncate">
            {label}
          </p>
          
          <div className="flex items-baseline gap-2">
            {loading ? (
              <div className="skeleton h-8 w-16 mb-1 rounded-md" />
            ) : (
              <h3 className="text-2xl font-black text-main tracking-tight leading-none">
                {value?.toLocaleString() ?? 0}
              </h3>
            )}
            
            {/* Badge de tendencia o contexto (Opcional) */}
            {!loading && trend && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trend > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-400'}`}>
                {trend > 0 ? `+${trend}` : trend}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Barra de progreso decorativa inferior (opcional para dar detalle UI) */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-primary/20 w-0 group-hover:w-full transition-all duration-700" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KpiCard
        icon="inventory_2"
        colorClass="primary"
        label="Total Bienes Patrimoniales"
        value={total}
        loading={loading}
      />
      <KpiCard
        icon="check_circle"
        colorClass="emerald"
        label="Bienes Activos"
        value={activos}
        loading={loading}
      />
      <KpiCard
        icon="running_with_errors"
        colorClass="amber"
        label="Bienes Inactivos"
        value={inactivos}
        loading={loading}
      />
      <KpiCard
        icon="settings_input_component"
        colorClass="blue"
        label="Operativos"
        value={operativos}
        loading={loading}
      />
    </div>
  );
}