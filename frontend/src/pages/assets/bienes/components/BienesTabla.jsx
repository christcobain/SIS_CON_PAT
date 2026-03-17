import { useAuthStore } from '../../../../store/authStore';
import ErrorState from '../../../../components/feedback/ErrorState';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const COLS = [
  { label: 'Tipo / Categoría',   width: 'w-[24%]' },
  { label: 'Marca / Modelo',     width: 'w-[20%]' },
  { label: 'N° Serie / Cód. Pat', width: 'w-[22%]' },
  { label: 'Estado del Bien',    width: 'w-[14%]' },
  { label: 'Funcionamiento',     width: 'w-[14%]' },
  { label: 'Acciones',           width: '',         right: true },
];

const getIconByTipo = (nombre = '') => {
  const n = nombre.toUpperCase();
  if (n.includes('CPU') || n.includes('COMPU') || n.includes('LAPTOP')) return 'computer';
  if (n.includes('MONITOR'))   return 'desktop_windows';
  if (n.includes('IMPRESORA')) return 'print';
  if (n.includes('SCANNER'))   return 'scanner';
  if (n.includes('SWITCH'))    return 'device_hub';
  if (n.includes('TECLADO'))   return 'keyboard';
  if (n.includes('MOUSE'))     return 'mouse';
  if (n.includes('WEBCAM'))    return 'videocam';
  if (n.includes('PROYECTOR')) return 'videocam';
  if (n.includes('UPS') || n.includes('ESTABI')) return 'power';
  return 'devices';
};

const getEstadoBienStyle = (estado = '') => {
  const e = estado.toUpperCase();
  if (e === 'ACTIVO')           return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  if (e.includes('TRASLADO'))   return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  if (e.includes('BAJA'))       return 'bg-red-500/10 text-red-600 border-red-500/20';
  if (e === 'ASIGNADO')         return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
};

const getFuncionaStyle = (nombre = '') => {
  const n = nombre.toUpperCase();
  if (n === 'OPERATIVO')  return 'bg-blue-600 text-white shadow-sm';
  if (n === 'AVERIADO')   return 'bg-amber-500 text-white';
  if (n === 'INOPERATIVO' || n === 'MALO') return 'bg-red-500 text-white';
  return 'bg-slate-400 text-white';
};

function FilaBien({ item, onVerDetalle, onEditar, puedeEditar }) {
  const iconName = getIconByTipo(item.tipo_bien_nombre);
  return (
    <tr className="hover:bg-surface-alt/70 transition-colors border-b border-border group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon name={iconName} className="text-[20px] text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-main truncate">{item.tipo_bien_nombre || '—'}</p>
            <p className="text-[10px] text-muted truncate mt-0.5 uppercase tracking-tight">{item.categoria_bien_nombre || 'General'}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-xs font-semibold text-main truncate">{item.marca_nombre || '—'}</p>
        <p className="text-[10px] text-muted truncate mt-0.5">{item.modelo || 'S/M'}</p>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted font-medium">S/N: {item.numero_serie || 'No registrado'}</span>
          <span className="text-xs font-black text-primary font-mono tracking-tight">{item.codigo_patrimonial || 'SIN CÓDIGO'}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getEstadoBienStyle(item.estado_bien_nombre)}`}>
          {item.estado_bien_nombre || '—'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase tracking-widest ${getFuncionaStyle(item.estado_funcionamiento_nombre)}`}>
          {item.estado_funcionamiento_nombre || '—'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onVerDetalle(item)}
            title="Ver detalle"
            className="size-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer"
          >
            <Icon name="visibility" className="text-[19px]" />
          </button>
          {puedeEditar && (
            <button
              onClick={() => onEditar(item)}
              title="Editar bien (solo SYSADMIN)"
              className="size-8 flex items-center justify-center rounded-lg hover:bg-amber-500/10 text-amber-600 transition-colors cursor-pointer"
            >
              <Icon name="edit" className="text-[19px]" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function BienesTabla({ items = [], loading, error, refetch, onVerDetalle, onEditar }) {
  const role = useAuthStore(s => s.role);
  const puedeEditar = role === 'SYSADMIN';

  return (
    <div className="table-wrapper shadow-sm border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              {COLS.map(col => (
                <th key={col.label}
                  className={`px-6 py-4 text-[10px] uppercase font-black tracking-widest text-faint ${col.width ?? ''} ${col.right ? 'text-right' : ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 6 }, (_, j) => (
                    <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-full rounded" /></td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr><td colSpan={COLS.length} className="py-12">
                <ErrorState message={error} onRetry={refetch} />
              </td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={COLS.length} className="py-16 text-center">
                <Icon name="inventory_2" className="text-[48px] text-faint mb-3" />
                <p className="text-sm font-semibold text-muted">No se encontraron bienes</p>
                <p className="text-xs text-faint mt-1">Ajusta los filtros o registra un nuevo bien</p>
              </td></tr>
            ) : (
              items.map(item => (
                <FilaBien key={item.id} item={item}
                  onVerDetalle={onVerDetalle} onEditar={onEditar}
                  puedeEditar={puedeEditar} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}