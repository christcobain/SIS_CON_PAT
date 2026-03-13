const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function KpiCard({ icon, iconBg, iconColor, label, value, sub, barColor, barPct, loading, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`card p-5 transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon name={icon} className={`text-[22px] ${iconColor}`} />
        </div>
        {sub && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
            {sub}
          </span>
        )}
      </div>

      <p className="text-[10px] font-black uppercase tracking-widest"
         style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>

      {loading
        ? <div className="h-7 mt-1.5 w-24 rounded animate-pulse"
               style={{ background: 'var(--color-border-light)' }} />
        : <h3 className="text-2xl font-black mt-1" style={{ color: 'var(--color-text-primary)' }}>
            {value ?? '—'}
          </h3>
      }

      <div className="mt-4 w-full h-1.5 rounded-full overflow-hidden"
           style={{ background: 'var(--color-border)' }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: loading ? '0%' : `${Math.min(barPct ?? 0, 100)}%` }}
        />
      </div>
    </div>
  );
}