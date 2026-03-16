import React from 'react';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

// ── Componente de KPI Estándar (Reutilizando el patrón anterior) ─────────────
function KpiCard({ icon, colorClass, label, value, loading }) {
  const colorMap = {
    amber:   "text-amber-500 bg-amber-500/10 border-amber-500/20",
    orange:  "text-orange-500 bg-orange-500/10 border-orange-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    slate:   "text-slate-500 bg-slate-500/10 border-slate-500/20",
  };

  const selectedColor = colorMap[colorClass] || colorMap.slate;

  return (
    <div className="card group hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 cursor-default overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="p-4 flex items-center gap-4 relative z-10">
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
                {value ?? 0}
              </h3>
            )}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-[2px] bg-primary/20 w-0 group-hover:w-full transition-all duration-700" />
    </div>
  );
}

export default function TransferenciasStats({ data = [], loading }) {
  // Lógica de filtrado optimizada
  const stats = {
    pendientes: data.filter(t => t.estado === 'PENDIENTE_APROBACION').length,
    espera: data.filter(t => t.estado === 'EN_ESPERA_CONFORMIDAD').length,
    retorno:    data.filter(t => t.estado === 'EN_RETORNO').length,
    atendidos:  data.filter(t => t.estado === 'ATENDIDO').length,
    devuelto:  data.filter(t => t.estado === 'DEVUELTO').length,
    cancelado:  data.filter(t => t.estado === 'CANCELADO').length,
    otros:      data.filter(t => !['PENDIENTE_APROBACION','EN_ESPERA_CONFORMIDAD', 'EN_RETORNO', 'ATENDIDO','DEVUELTO','CANCELADO'].includes(t.estado)).length,
  };

  const CARDS = [
    { 
      label: 'Pendiente Aprobación', 
      val: stats.pendientes, 
      icon: 'pending_actions', 
      color: 'amber' 
    },
    { 
      label: 'Bienes en Retorno',  
      val: stats.retorno,    
      icon: 'swap_calls', 
      color: 'orange' 
    },
    { 
      label: 'Transf. Atendidas', 
      val: stats.atendidos,  
      icon: 'task_alt', 
      color: 'emerald' 
    },
    { 
      label: 'Otros Procesos', 
      val: stats.otros,      
      icon: 'layers', 
      color: 'slate' 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {CARDS.map((c, i) => (
        <KpiCard
          key={i}
          label={c.label}
          value={c.val}
          icon={c.icon}
          colorClass={c.color}
          loading={loading}
        />
      ))}
    </div>
  );
}