import SedeRow from './SedeRow';

export default function DashboardTabla({ sedes, sedeStats, loadingStats, navigate }) {
  return (
    <div className="card border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-full bg-primary animate-pulse" />
          <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Estado de Operatividad por Sede
          </h3>
        </div>
        <button 
          onClick={() => navigate('/locaciones')} 
          className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors"
        >
          Ver Reporte Completo
          <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-1">arrow_forward</span>
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase tracking-[0.15em] text-slate-400">
              <th className="px-6 py-4 font-black">Ranking y Ubicación</th>
              <th className="px-6 py-4 font-black text-center">Patrimonio</th>
              <th className="px-6 py-4 font-black">Incidencias</th>
              <th className="px-6 py-4 font-black">Nivel de Operatividad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {sedes?.slice(0, 10).map((s, i) => (
              <SedeRow 
                key={s.id} 
                rank={i + 1} 
                nombre={s.nombre}
                distrito={s.distrito_nombre}
                total={sedeStats[s.id]?.total || 0}
                enMant={sedeStats[s.id]?.enMant || 0}
                activos={(sedeStats[s.id]?.total - sedeStats[s.id]?.enMant) || 0}
                loadingBienes={loadingStats}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}