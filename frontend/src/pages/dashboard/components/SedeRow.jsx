const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

function Skel({ w = 'w-10', h = 'h-4' }) {
  return <div className={`${h} ${w} rounded-full animate-pulse bg-slate-100 dark:bg-slate-800`} />;
}

export default function SedeRow({ 
  rank, 
  nombre, 
  distrito, 
  total = 0, 
  activos = 0, 
  enMant = 0, 
  loadingBienes = false 
}) {
  const pct = total > 0 ? Math.round((activos / total) * 100) : 0;

  const getRankStyle = (r) => {
    if (r === 1) return 'bg-amber-50 text-amber-600 ring-amber-200 border-amber-100';
    if (r === 2) return 'bg-slate-50 text-slate-500 ring-slate-200 border-slate-100';
    if (r === 3) return 'bg-orange-50 text-orange-700 ring-orange-200 border-orange-100';
    return 'text-slate-400 bg-transparent ring-transparent border-transparent';
  };

  return (
    <tr className="group transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-default">
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className={`
            size-8 shrink-0 flex items-center justify-center rounded-xl text-[12px] font-black 
            border shadow-sm transition-all duration-500 group-hover:rotate-[360deg]
            ${getRankStyle(rank)}
          `}>
            {rank}
          </div>
          
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
              {nombre}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <Icon name="near_me" className="text-[11px]" />
              {distrito || 'Sede Central'}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-5">
        {loadingBienes ? (
          <div className="flex justify-center"><Skel w="w-12" /></div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-[15px] font-black text-slate-900 dark:text-white tracking-tighter">
              {total.toLocaleString()}
            </span>
            <span className="text-[8px] uppercase font-black text-slate-300 tracking-widest">Activos</span>
          </div>
        )}
      </td>

      <td className="px-6 py-5">
        {loadingBienes ? (
          <Skel w="w-16" />
        ) : enMant > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-800/50">
              <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-tight">{enMant} En Revisión</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full w-fit border border-emerald-100 dark:border-emerald-800/50">
            <Icon name="check_circle" className="text-[14px]" />
            <span className="text-[10px] font-black uppercase tracking-tight">Optimizado</span>
          </div>
        )}
      </td>

      <td className="px-6 py-5 min-w-[180px]">
        {loadingBienes ? (
          <div className="space-y-2">
            <Skel w="w-full" h="h-2" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-end leading-none">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Rendimiento Sede</span>
              <span className={`text-[12px] font-black tracking-tighter ${pct < 50 ? 'text-red-500' : pct < 85 ? 'text-amber-500' : 'text-primary'}`}>
                {pct}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full p-[2px] shadow-inner border border-slate-50 dark:border-slate-800">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out relative
                  ${pct < 50 ? 'bg-gradient-to-r from-red-400 to-red-600' : pct < 85 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-primary to-blue-600'}
                `}
                style={{ width: `${pct}%` }} 
              >
                <div className="absolute top-0 right-0 h-full w-4 bg-white/20 rounded-full blur-[2px]" />
              </div>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}