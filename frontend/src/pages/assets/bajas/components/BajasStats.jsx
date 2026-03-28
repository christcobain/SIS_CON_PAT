import { useMemo } from 'react';

const Icon = ({ name, style = {} }) => (
  <span className="material-symbols-outlined leading-none select-none text-[22px]" style={style}>{name}</span>
);

// Mismo KpiCard de referencia
function KpiCard({ icon, label, value, loading, accentColor }) {
  return (
    <div className="card p-4 flex items-center gap-4 relative overflow-hidden group cursor-default">
      <div className="size-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accentColor}18` }}>
        <Icon name={icon} style={{ color: accentColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        {loading
          ? <div className="skeleton h-7 w-12 mt-1 rounded-md" />
          : <p className="text-2xl font-black mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{value ?? 0}</p>
        }
      </div>
      <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700"
        style={{ background: `${accentColor}35` }} />
    </div>
  );
}

export default function BajasStats({ items = [], loading = false }) {
  const stats = useMemo(() => {
    // Mapeo según ESTADO_CHOICES de models.py
    return {
      pendientes: items.filter(m => m.estado_baja === 'PENDIENTE_APROBACION').length,
      atendidos:  items.filter(m => m.estado_baja === 'ATENDIDO').length,
      devueltos:  items.filter(m => m.estado_baja === 'DEVUELTO').length,
      cancelados: items.filter(m => m.estado_baja === 'CANCELADO').length,
    };
  }, [items]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard 
        icon="pending_actions" 
        label="Pendientes Aprobación" 
        value={stats.pendientes} 
        loading={loading} 
        accentColor="#b45309" // Amber (mismo que referencia)
      />
      <KpiCard 
        icon="task_alt" 
        label="Atendidos (Baja Definitiva)" 
        value={stats.atendidos} 
        loading={loading} 
        accentColor="#16a34a" // Green (mismo que referencia)
      />
      <KpiCard 
        icon="assignment_return" 
        label="Devueltos p/Corrección" 
        value={stats.devueltos} 
        loading={loading} 
        accentColor="#e11d48" // Rose/Red (mismo que referencia)
      />
      <KpiCard 
        icon="cancel" 
        label="Cancelados" 
        value={stats.cancelados} 
        loading={loading} 
        accentColor="#64748b" // Slate (mismo que referencia)
      />
    </div>
  );
}