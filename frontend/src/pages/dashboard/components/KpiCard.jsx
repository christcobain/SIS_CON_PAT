const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function KpiCard({ 
  icon, 
  label, 
  value, 
  sub, 
  barPct = 0, 
  loading = false, 
  onClick,
  variant = 'primary' 
}) {
  
  const variants = {
    primary: {
      bg: 'bg-primary/10',
      icon: 'text-primary',
      bar: 'bg-primary',
      glow: 'shadow-primary/20'
    },
    warning: {
      bg: 'bg-amber-500/10',
      icon: 'text-amber-600',
      bar: 'bg-amber-500',
      glow: 'shadow-amber-500/20'
    },
    info: {
      bg: 'bg-blue-500/10',
      icon: 'text-blue-600',
      bar: 'bg-blue-500',
      glow: 'shadow-blue-500/20'
    },
    danger: {
      bg: 'bg-red-500/10',
      icon: 'text-red-600',
      bar: 'bg-red-500',
      glow: 'shadow-red-500/20'
    }
  };

  const style = variants[variant] || variants.primary;

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden card p-5 transition-all duration-300 group
        ${onClick ? 'cursor-pointer hover:-translate-y-1.5 hover:shadow-xl hover:ring-1 hover:ring-primary/5' : ''}
      `}
    >
      {/* Efecto de brillo de fondo al hacer hover */}
      <div className={`absolute -right-4 -top-4 size-24 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${style.bg}`} />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${style.bg} ${style.glow} shadow-lg`}>
          <Icon name={icon} className={`text-[24px] ${style.icon}`} />
        </div>
        
        {sub && (
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-tighter">
               {sub}
             </span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
          {label}
        </p>

        {loading ? (
          <div className="h-8 mt-2 w-2/3 rounded-lg animate-pulse bg-slate-100 dark:bg-slate-800" />
        ) : (
          <div className="flex items-baseline gap-1 mt-1">
            <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {value ?? '0'}
            </h3>
            {barPct > 0 && (
              <span className={`text-[10px] font-bold ${style.icon}`}>
                {barPct}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Barra de progreso mejorada */}
      <div className="mt-5 relative h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${style.bar}`}
          style={{ width: loading ? '0%' : `${Math.min(barPct, 100)}%` }}
        />
        {/* Reflejo animado en la barra */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
      </div>
    </div>
  );
}