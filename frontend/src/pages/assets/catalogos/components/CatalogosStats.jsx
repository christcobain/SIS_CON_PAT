import React from 'react';
import { CATALOGOS_META } from '../catalogosMeta';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

// ── Componente de KPI Estándar (Patrón Profesional Unificado) ────────────────
function KpiCard({ icon, colorClass, label, value, loading }) {
  const colorMap = {
    primary: "text-primary bg-primary/10 border-primary/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    slate:   "text-slate-500 bg-slate-500/10 border-slate-500/20",
    indigo:  "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  };

  const selectedColor = colorMap[colorClass] || colorMap.primary;

  return (
    <div className="card group hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 cursor-default overflow-hidden relative">
      {/* Reflejo de luz sutil en hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="p-4 flex items-center gap-4 relative z-10">
        {/* Icono con efecto de elevación */}
        <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 duration-500 ${selectedColor}`}>
          <Icon name={icon} className="text-[24px]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-1 truncate">
            {label}
          </p>
          
          <div className="flex items-baseline">
            {loading ? (
              <div className="skeleton h-8 w-16 mb-1 rounded-md" />
            ) : (
              <h3 className="text-2xl font-black text-main tracking-tight leading-none">
                {value ?? 0}
              </h3>
            )}
          </div>
        </div>
      </div>

      {/* Acento visual inferior animado */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-primary/20 w-0 group-hover:w-full transition-all duration-700" />
    </div>
  );
}

export default function CatalogosStats({ items = [], loading = false }) {
  const total = items.length;
  const activos = items.filter((i) => i.is_active).length;
  const inactivos = total - activos;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KpiCard
        icon="inventory"
        colorClass="primary"
        label="Total Registros"
        value={total}
        loading={loading}
      />
      
      <KpiCard
        icon="verified"
        colorClass="emerald"
        label="Registros Activos"
        value={activos}
        loading={loading}
      />

      <KpiCard
        icon="unpublished"
        colorClass="slate"
        label="Registros Inactivos"
        value={inactivos}
        loading={loading}
      />

      <KpiCard
        icon="account_tree"
        colorClass="indigo"
        label="Estructuras Maestras"
        value={CATALOGOS_META.length}
        loading={false}
      />
    </div>
  );
}