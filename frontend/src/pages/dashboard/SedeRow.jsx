const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

function Skel({ w = 'w-10' }) {
  return <div className={`h-4 ${w} rounded animate-pulse`}
              style={{ background: 'var(--color-border-light)' }} />;
}

export default function SedeRow({ rank, nombre, distrito, total, activos, enMant, loadingBienes }) {
  const pct = total > 0 ? Math.round((activos / total) * 100) : 0;

  const rankColor =
    rank === 1 ? '#f59e0b' :
    rank === 2 ? '#94a3b8' :
    rank === 3 ? '#b45309' : 'var(--color-text-faint)';

  return (
    <tr className="table-row transition-colors align-middle">

      {/* Nombre */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-black w-4 text-center shrink-0"
                style={{ color: rankColor }}>
            {rank}
          </span>
          <Icon name="account_balance" className="text-[17px] shrink-0"
                style={{ color: 'var(--color-text-faint)' }} />
          <span className="text-sm font-semibold truncate max-w-[180px]"
                style={{ color: 'var(--color-text-primary)' }}
                title={nombre}>
            {nombre}
          </span>
        </div>
      </td>

      {/* Ubicación */}
      <td className="px-5 py-3.5 text-sm whitespace-nowrap"
          style={{ color: 'var(--color-text-muted)' }}>
        {distrito || '—'}
      </td>

      {/* Total bienes */}
      <td className="px-5 py-3.5 text-right">
        {loadingBienes
          ? <Skel w="w-8" />
          : <span className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>
              {total.toLocaleString()}
            </span>
        }
      </td>

      {/* En mantenimiento */}
      <td className="px-5 py-3.5 text-center">
        {loadingBienes
          ? <Skel w="w-12" />
          : enMant > 0
            ? <span className="badge-pendiente">{enMant}</span>
            : <span style={{ color: 'var(--color-text-faint)' }} className="text-sm">—</span>
        }
      </td>

      {/* Activos % */}
      <td className="px-5 py-3.5 min-w-[110px]">
        {loadingBienes
          ? <div className="h-1.5 w-full rounded-full animate-pulse"
                 style={{ background: 'var(--color-border-light)' }} />
          : <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                   style={{ background: 'var(--color-border)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                     style={{ width: `${pct}%`, background: 'var(--color-primary)' }} />
              </div>
              <span className="text-[11px] w-8 text-right shrink-0 font-bold"
                    style={{ color: 'var(--color-text-muted)' }}>
                {pct}%
              </span>
            </div>
        }
      </td>
    </tr>
  );
}