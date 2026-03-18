import { useAuthStore } from '../../../../store/authStore';
import ErrorState from '../../../../components/feedback/ErrorState';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const COLS = [
  { label: 'Tipo / Categoría',    width: 'w-[22%]' },
  { label: 'Marca / Modelo',      width: 'w-[16%]' },
  { label: 'N° Serie / Cód. Pat', width: 'w-[16%]' },
  { label: 'Sede / Módulo',       width: 'w-[16%]' },
  { label: 'Custodio',            width: 'w-[14%]' },
  { label: 'Estado / Func.',      width: 'w-[10%]' },
  { label: 'Acciones',            width: '',        right: true },
];

const ICON_TIPO = (nombre = '') => {
  const n = nombre.toUpperCase();
  if (n.includes('CPU') || n.includes('COMPU')) return 'computer';
  if (n.includes('MONITOR'))   return 'desktop_windows';
  if (n.includes('IMPRESORA')) return 'print';
  if (n.includes('SCANNER'))   return 'scanner';
  if (n.includes('SWITCH'))    return 'device_hub';
  if (n.includes('TECLADO'))   return 'keyboard';
  if (n.includes('MOUSE'))     return 'mouse';
  if (n.includes('UPS') || n.includes('ESTABI')) return 'power';
  return 'devices';
};

const ESTADO_CLS = (e = '') => {
  const u = e.toUpperCase();
  if (u === 'ACTIVO') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  if (u.includes('TRASLADO') || u.includes('ASIGNACI')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  if (u.includes('BAJA')) return 'bg-red-500/10 text-red-600 border-red-500/20';
  return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
};

const FUNC_CLS = (n = '') => {
  const u = n.toUpperCase();
  if (u === 'OPERATIVO')   return 'bg-blue-600 text-white';
  if (u === 'AVERIADO')    return 'bg-amber-500 text-white';
  if (u === 'INOPERATIVO') return 'bg-red-500 text-white';
  return 'bg-slate-400 text-white';
};

const CHIP_MAP = {
  CPU:       { color: '#1d4ed8' },
  MONITOR:   { color: '#7c3aed' },
  IMPRESORA: { color: '#b45309' },
  SCANNER:   { color: '#0f766e' },
  SWITCH:    { color: '#be185d' },
};

function FilaBien({ b, onVerDetalle, onEditar, puedeEditar }) {
  const chip = b.tipo_tecnico ? CHIP_MAP[b.tipo_tecnico] : null;

  const sedeLabel = b.sede_nombre ?? (b.sede_id ? `Sede #${b.sede_id}` : '—');
  const moduloLabel = b.modulo_nombre ?? (b.modulo_id ? `Mód. #${b.modulo_id}` : null);
  const custodioLabel = b.usuario_asignado_nombre ?? (b.usuario_asignado_id ? `Usuario #${b.usuario_asignado_id}` : '—');

  return (
    <tr className="hover:bg-surface-alt/70 transition-colors border-b border-border group">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgb(127 29 29 / 0.08)' }}>
            <Icon name={ICON_TIPO(b.tipo_bien_nombre)} className="text-[20px]"
              style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {b.tipo_bien_nombre ?? '—'}
              </p>
              {chip && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
                  style={{ background: `${chip.color}18`, color: chip.color }}>
                  {b.tipo_tecnico}
                </span>
              )}
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {b.categoria_bien_nombre ?? '—'}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-3.5">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{b.marca_nombre ?? '—'}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{b.modelo ?? 'S/M'}</p>
      </td>

      <td className="px-5 py-3.5">
        <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>S/N: {b.numero_serie ?? 'S/N'}</p>
        <p className="text-xs font-black font-mono" style={{ color: 'var(--color-primary)' }}>
          {b.codigo_patrimonial ?? 'SIN CÓD.'}
        </p>
      </td>

      <td className="px-5 py-3.5">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{sedeLabel}</p>
        {moduloLabel && (
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{moduloLabel}</p>
        )}
      </td>

      <td className="px-5 py-3.5">
        <p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{custodioLabel}</p>
        {b.piso != null && (
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>Piso {b.piso}</p>
        )}
      </td>

      <td className="px-5 py-3.5">
        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wide block w-fit mb-1 ${ESTADO_CLS(b.estado_bien_nombre)}`}>
          {b.estado_bien_nombre ?? '—'}
        </span>
        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase block w-fit ${FUNC_CLS(b.estado_funcionamiento_nombre)}`}>
          {b.estado_funcionamiento_nombre ?? '—'}
        </span>
      </td>

      <td className="px-5 py-3.5 text-right">
        <div className="flex justify-end items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onVerDetalle(b)} title="Ver detalle"
            className="size-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer">
            <Icon name="visibility" className="text-[19px]" />
          </button>
          {puedeEditar && (
            <button onClick={() => onEditar(b)} title="Editar (SYSADMIN)"
              className="size-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
              style={{ color: '#b45309' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgb(180 83 9 / 0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              <Icon name="edit" className="text-[19px]" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function BienesTabla({ items = [], loading, error, refetch, onVerDetalle, onEditar }) {
  const role       = useAuthStore(s => s.role);
  const puedeEditar = role === 'SYSADMIN';

  if (loading) return (
    <div className="table-wrapper rounded-2xl overflow-hidden">
      <table className="table w-full">
        <thead><tr>{COLS.map(c => <th key={c.label}>{c.label}</th>)}</tr></thead>
        <tbody>
          {Array.from({ length: 6 }, (_, i) => (
            <tr key={i} className="border-b border-border">
              {COLS.map((_, j) => (
                <td key={j} className="px-5 py-4"><div className="skeleton h-4 w-full rounded" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (error) return <div className="card p-8"><ErrorState message={error} onRetry={refetch} /></div>;

  if (!items.length) return (
    <div className="text-center py-16 card rounded-xl">
      <Icon name="inventory_2" className="text-[48px] text-faint" />
      <p className="text-sm font-semibold mt-3 text-muted">No se encontraron bienes</p>
      <p className="text-xs text-faint mt-1">Ajusta los filtros o registra un nuevo bien</p>
    </div>
  );

  return (
    <div className="table-wrapper shadow-sm border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.label}
                  className={`px-5 py-4 text-[10px] uppercase font-black tracking-widest text-faint ${c.width ?? ''} ${c.right ? 'text-right' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(b => (
              <FilaBien key={b.id} b={b}
                onVerDetalle={onVerDetalle} onEditar={onEditar}
                puedeEditar={puedeEditar} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}