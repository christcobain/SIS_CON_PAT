import { usePermission } from '../../../../hooks/usePermission';
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

const getDynamicIcon = (nombre = '') => {
  const n = nombre.toUpperCase();
  if (n.includes('CPU') || n.includes('LAPTOP') || n.includes('COMPU')) return 'computer';
  if (n.includes('MONITOR') || n.includes('PANTALLA')) return 'desktop_windows';
  if (n.includes('IMPRESORA') || n.includes('COPIADORA')) return 'print';
  if (n.includes('SCANNER')) return 'scanner';
  if (n.includes('SWITCH') || n.includes('ROUTER') || n.includes('RED')) return 'device_hub';
  if (n.includes('TECLADO')) return 'keyboard';
  if (n.includes('MOUSE')) return 'mouse';
  if (n.includes('UPS') || n.includes('BATERIA') || n.includes('VOLTAJE')) return 'battery_charging_full';
  if (n.includes('CELULAR') || n.includes('MOVIL') || n.includes('TELEFONO')) return 'smartphone';
  if (n.includes('CAMARA') || n.includes('SEGURIDAD')) return 'videocam';
  if (n.includes('PROYECTOR')) return 'videogame_asset';
  if (n.includes('SILLA') || n.includes('MUEBLE') || n.includes('ESCRITORIO')) return 'chair';
  return 'inventory_2';
};

const getDynamicColor = (text) => {
  if (!text) return '#64748b';
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash % 360)}, 65%, 45%)`;
};

function FilaBien({ b, onVerDetalle, onEditar, puedeEditar }) {
  const colorTipo = getDynamicColor(b.tipo_bien_nombre);
  const colorEstado = getDynamicColor(b.estado_bien_nombre);
  const colorFunc = getDynamicColor(b.estado_funcionamiento_nombre);

  return (
    <tr className="hover:bg-surface-alt/70 transition-colors border-b border-border group">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
               style={{ background: `${colorTipo}15` }}>
            <Icon name={getDynamicIcon(b.tipo_bien_nombre)} className="text-[20px]" 
                  style={{ color: colorTipo }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {b.tipo_bien_nombre ?? '—'}
            </p>
            {b.tipo_tecnico && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md mt-1 inline-block"
                    style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                {b.tipo_tecnico}
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="px-5 py-3.5">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{b.marca_nombre ?? '—'}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{b.modelo ?? 'S/M'}</p>
      </td>

      <td className="px-5 py-3.5">
        <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>S/N: {b.numero_serie ?? 'S/N'}</p>
        <p className="text-xs font-black font-mono mt-0.5" style={{ color: 'var(--color-primary)' }}>{b.codigo_patrimonial ?? '—'}</p>
      </td>

      <td className="px-5 py-3.5">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{b.sede_nombre}</p>
        {b.modulo_nombre && <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{b.modulo_nombre}</p>}
      </td>

      <td className="px-5 py-3.5">
        <p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{b.usuario_asignado_nombre}</p>
        {b.piso != null && <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>Piso {b.piso}</p>}
      </td>

      <td className="px-5 py-3.5">
        <div className="flex flex-col gap-1">
          <span className="px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wide w-fit"
                style={{ background: `${colorEstado}10`, color: colorEstado, borderColor: `${colorEstado}30` }}>
            {b.estado_bien_nombre ?? '—'}
          </span>
          <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase w-fit text-white"
                style={{ background: colorFunc }}>
            {b.estado_funcionamiento_nombre ?? '—'}
          </span>
        </div>
      </td>

      <td className="px-5 py-3.5 text-right">
        <div className="flex justify-end items-center gap-1">
          <button onClick={() => onVerDetalle(b)} className="size-8 flex items-center justify-center rounded-lg hover:bg-surface-alt transition-colors">
            <Icon name="visibility" className="text-[19px] text-muted" />
          </button>
          {puedeEditar && (
            <button onClick={() => onEditar(b)} className="size-8 flex items-center justify-center rounded-lg hover:bg-amber-500/10 text-amber-600 transition-colors">
              <Icon name="edit" className="text-[19px]" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function BienesTabla({ items = [], loading, error, refetch, onVerDetalle, onEditar }) {
  const { can } = usePermission();
  const puedeEditar = can('ms-bienes:bienes:change_bien');

  if (loading) return (
    <div className="table-wrapper rounded-2xl overflow-hidden shadow-sm border bg-surface">
      <table className="table w-full">
        <thead><tr>{COLS.map(c => <th key={c.label} className="px-5 py-4">{c.label}</th>)}</tr></thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-border">
              {COLS.map((_, j) => <td key={j} className="px-5 py-4"><div className="skeleton h-4 w-full rounded" /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (error) return <div className="card p-8"><ErrorState message={error} onRetry={refetch} /></div>;

  if (!items.length) return (
    <div className="text-center py-16 card rounded-xl shadow-sm border bg-surface">
      <Icon name="inventory_2" className="text-[48px] text-faint" />
      <p className="text-sm font-semibold mt-3 text-muted">No se encontraron registros</p>
    </div>
  );

  return (
    <div className="table-wrapper shadow-sm border rounded-2xl overflow-hidden bg-surface">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.label} className={`px-5 py-4 text-[10px] uppercase font-black tracking-widest text-faint ${c.width ?? ''} ${c.right ? 'text-right' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(b => (
              <FilaBien key={b.id} b={b} onVerDetalle={onVerDetalle} onEditar={onEditar} puedeEditar={puedeEditar} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}