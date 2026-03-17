import { useMemo } from 'react';

const Icon = ({ name, style = {} }) => (
  <span className="material-symbols-outlined leading-none select-none text-[22px]" style={style}>{name}</span>
);

function KpiCard({ icon, label, value, sublabel, loading, accentColor }) {
  return (
    <div className="card p-4 flex items-center gap-4 relative overflow-hidden group cursor-default">
      <div className="size-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accentColor}18` }}>
        <Icon name={icon} style={{ color: accentColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        {loading
          ? <div className="skeleton h-7 w-12 mt-1 rounded-md" />
          : <p className="text-2xl font-black mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{value ?? 0}</p>
        }
        {sublabel && <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>{sublabel}</p>}
      </div>
      <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700"
        style={{ background: `${accentColor}35` }} />
    </div>
  );
}

export default function TransferenciasStats({ data = [], loading = false }) {
  const stats = useMemo(() => {
    const traslados   = data.filter(t => t.tipo === 'TRASLADO_SEDE');
    const asignaciones = data.filter(t => t.tipo === 'ASIGNACION_INTERNA');
    return {
      total:       data.length,
      pendientes:  data.filter(t => t.estado_transferencia === 'PENDIENTE_APROBACION').length,
      atendidos:   data.filter(t => t.estado_transferencia === 'ATENDIDO').length,
      devueltos:   data.filter(t => t.estado_transferencia === 'DEVUELTO').length,
      traslados:   traslados.length,
      asignaciones: asignaciones.length,
    };
  }, [data]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard icon="swap_horiz"       label="Total"              value={stats.total}       loading={loading} accentColor="var(--color-primary)" />
      <KpiCard icon="pending_actions"  label="Pendientes"         value={stats.pendientes}  loading={loading} accentColor="#b45309" />
      <KpiCard icon="task_alt"         label="Atendidos"          value={stats.atendidos}   loading={loading} accentColor="#16a34a" />
      <KpiCard icon="local_shipping"   label="Traslados / Asign." value={`${stats.traslados} / ${stats.asignaciones}`} loading={loading} accentColor="#1d4ed8" />
    </div>
  );
}