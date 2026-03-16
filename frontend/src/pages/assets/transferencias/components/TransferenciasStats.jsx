export default function TransferenciasStats({ data = [], loading }) {
  const stats = {
    pendientes: data.filter(t => t.estado === 'PENDIENTE_APROBACION').length,
    espera: data.filter(t => t.estado === 'EN_ESPERA_CONFORMIDAD').length,
    retorno:    data.filter(t => t.estado === 'EN_RETORNO').length,
    atendidos:  data.filter(t => t.estado === 'ATENDIDO').length,
    devuelto:  data.filter(t => t.estado === 'DEVUELTO').length,
    cancelado:  data.filter(t => t.estado === 'CANCELADO').length,
    otros:      data.filter(t => !['PENDIENTE_APROBACION', 'EN_RETORNO', 'ATENDIDO'].includes(t.estado)).length,
  };

  const CARDS = [
    { label: 'Por Aprobar', val: stats.pendientes, icon: 'pending_actions', bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'En Retorno',  val: stats.retorno,    icon: 'assignment_return', bg: 'bg-orange-50', text: 'text-orange-600' },
    { label: 'Finalizados', val: stats.atendidos,  icon: 'task_alt', bg: 'bg-green-50', text: 'text-green-600' },
    { label: 'Otros Estados', val: stats.otros,    icon: 'inventory_2', bg: 'bg-blue-50', text: 'text-blue-600' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((c, i) => (
        <div key={i} className="kpi-card">
          <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${c.bg} ${c.text}`}>
            <span className="material-symbols-outlined text-[24px]">{c.icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-faint truncate">{c.label}</p>
            <div className="flex items-baseline gap-1">
              {loading ? (
                <div className="skeleton h-5 w-8 mb-1" />
              ) : (
                <span className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>{c.val}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}