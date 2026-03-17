import { useAuthStore } from '../../../../store/authStore';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

const BADGE = {
  EN_PROCESO:            { label: 'En proceso',         cls: 'badge-en-proceso'   },
  PENDIENTE_APROBACION:  { label: 'Pend. aprobación',   cls: 'badge-pendiente'    },
  EN_ESPERA_CONFORMIDAD: { label: 'Espera conformidad', cls: 'badge-en-proceso'   },
  ATENDIDO:              { label: 'Atendido',           cls: 'badge-atendido'     },
  DEVUELTO:              { label: 'Devuelto',           cls: 'badge-devuelto'     },
  CANCELADO:             { label: 'Cancelado',          cls: 'badge-cancelado'    },
};

const COLS = [
  { label: 'N° Orden'           },
  { label: 'Estado'             },
  { label: 'Bienes'             },
  { label: 'Fecha registro'     },
  { label: 'Fecha inicio'       },
  { label: 'Acciones', right: true },
];

function AccionesFila({ item, role, onVerDetalle, onAprobar, onDevolver, onEnviar, onCancelar }) {
  const { estado } = item;
  const puedeAprobar  = ['SYSADMIN', 'coordSistema', 'adminSede'].includes(role);
  const puedeEnviar   = ['SYSADMIN', 'coordSistema', 'asistSistema'].includes(role);
  const puedeDevolver = puedeAprobar;
  const puedeCancelar = estado !== 'ATENDIDO' && estado !== 'CANCELADO';

  return (
    <div className="flex justify-end gap-1 flex-wrap">
      <button onClick={() => onVerDetalle(item)} title="Ver detalle"
        className="size-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer">
        <Icon name="visibility" className="text-[19px]" />
      </button>

      {estado === 'PENDIENTE_APROBACION' && puedeAprobar && (
        <button onClick={() => onAprobar(item)} title="Aprobar"
          className="size-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
          style={{ color: '#16a34a' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgb(22 163 74 / 0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <Icon name="check_circle" className="text-[19px]" />
        </button>
      )}

      {estado === 'PENDIENTE_APROBACION' && puedeDevolver && (
        <button onClick={() => onDevolver(item)} title="Devolver"
          className="size-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
          style={{ color: '#b45309' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgb(180 83 9 / 0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <Icon name="reply" className="text-[19px]" />
        </button>
      )}

      {(estado === 'EN_PROCESO' || estado === 'DEVUELTO') && puedeEnviar && (
        <button onClick={() => onEnviar(item)} title="Enviar a aprobación"
          className="size-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
          style={{ color: '#1d4ed8' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgb(37 99 235 / 0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <Icon name="send" className="text-[19px]" />
        </button>
      )}

      {puedeCancelar && puedeEnviar && (
        <button onClick={() => onCancelar(item)} title="Cancelar"
          className="size-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
          style={{ color: '#dc2626' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgb(220 38 38 / 0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <Icon name="cancel" className="text-[19px]" />
        </button>
      )}
    </div>
  );
}

export default function MantenimientosTabla({
  items = [], loading,
  onVerDetalle, onAprobar, onDevolver, onEnviar, onCancelar,
}) {
  const role = useAuthStore(s => s.role);

  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="skeleton h-14 rounded-xl" />
      ))}
    </div>
  );

  if (!items.length) return (
    <div className="text-center py-16 card rounded-xl">
      <Icon name="engineering" className="text-[48px] text-faint" />
      <p className="text-sm font-semibold mt-3 text-muted">No se encontraron mantenimientos</p>
      <p className="text-xs text-faint mt-1">Ajusta los filtros o registra una nueva orden</p>
    </div>
  );

  return (
    <div className="table-wrapper shadow-sm border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.label} className={`px-5 py-4 text-[10px] uppercase font-black tracking-widest text-faint ${c.right ? 'text-right' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(m => {
              const badge = BADGE[m.estado] ?? { label: m.estado, cls: '' };
              return (
                <tr key={m.id} className="hover:bg-surface-alt/70 transition-colors border-b border-border group">
                  <td className="px-5 py-4">
                    <p className="font-black text-xs font-mono" style={{ color: 'var(--color-primary)' }}>{m.numero_orden}</p>
                    <p className="text-[10px] text-muted mt-0.5">{m.total_bienes ?? 0} bien(es)</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={badge.cls} style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 8px', borderRadius: '9999px' }}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center size-6 rounded-lg text-[11px] font-black"
                      style={{ background: 'rgb(127 29 29 / 0.08)', color: 'var(--color-primary)' }}>
                      {m.total_bienes ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-muted">{fmtT(m.fecha_registro)}</td>
                  <td className="px-5 py-4 text-xs text-muted">{fmtT(m.fecha_inicio)}</td>
                  <td className="px-5 py-4">
                    <AccionesFila item={m} role={role}
                      onVerDetalle={onVerDetalle} onAprobar={onAprobar}
                      onDevolver={onDevolver} onEnviar={onEnviar} onCancelar={onCancelar} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}