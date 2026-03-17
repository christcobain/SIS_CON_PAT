import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/authStore';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

const BADGE = {
  PENDIENTE_APROBACION:  { label: 'Pendiente',         cls: 'badge-pendiente'  },
  EN_ESPERA_CONFORMIDAD: { label: 'Espera conform.',   cls: 'badge-en-proceso' },
  EN_RETORNO:            { label: 'En retorno',         cls: 'badge-en-proceso' },
  ATENDIDO:              { label: 'Atendido',           cls: 'badge-atendido'   },
  DEVUELTO:              { label: 'Devuelto',           cls: 'badge-devuelto'   },
  CANCELADO:             { label: 'Cancelado',          cls: 'badge-cancelado'  },
};

function filtrarItems(items, filtros) {
  if (!filtros?.search) return items;
  const q = filtros.search.toLowerCase();
  return items.filter(t =>
    t.numero_orden?.toLowerCase().includes(q) ||
    t.sede_origen_nombre?.toLowerCase().includes(q) ||
    t.sede_destino_nombre?.toLowerCase().includes(q) ||
    t.usuario_origen_nombre?.toLowerCase().includes(q) ||
    t.usuario_destino_nombre?.toLowerCase().includes(q)
  );
}

function AccionesFila({ item, role, onVerDetalle, onEditar, onCancelar, onDownload }) {
  const estado = item.estado_transferencia;
  const esRegistrador = item.usuario_origen_id === useAuthStore.getState().user?.id;
  const puedeEditar = (estado === 'DEVUELTO') && esRegistrador;
  const puedeCancelar = !['ATENDIDO', 'CANCELADO'].includes(estado);
  const puedeDownload = estado === 'ATENDIDO' && (item.pdf_path || item.tiene_pdf_firmado);

  return (
    <div className="flex justify-end gap-1">
      <button onClick={() => onVerDetalle(item)} title="Ver detalle"
        className="size-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer">
        <Icon name="visibility" className="text-[19px]" />
      </button>
      {puedeEditar && (
        <button onClick={() => onEditar(item)} title="Reenviar"
          className="size-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
          style={{ color: '#b45309' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgb(180 83 9 / 0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <Icon name="send" className="text-[19px]" />
        </button>
      )}
      {puedeDownload && (
        <button onClick={() => onDownload(item.id)} title="Descargar PDF"
          className="size-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
          style={{ color: '#1d4ed8' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgb(37 99 235 / 0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <Icon name="picture_as_pdf" className="text-[19px]" />
        </button>
      )}
      {puedeCancelar && (
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

export default function TransferenciasTabla({
  items = [], filtros = {}, loading, error, refetch,
  activeTab, onVerDetalle, onEditar, onCancelar, onDownload,
}) {
  const filtrados = useMemo(() => filtrarItems(items, filtros), [items, filtros]);
  const role = useAuthStore(s => s.role);
  const esTraslado = activeTab === 'TRASLADO_SEDE';

  const COLS_TRASLADO = ['N° Orden', 'Origen → Destino', 'Responsable destino', 'Motivo', 'Bienes', 'Estado', 'Fecha', 'Acciones'];
  const COLS_ASIG     = ['N° Orden', 'Destinatario', 'Módulo / Ubic. destino', 'Bienes', 'Aprobado por', 'Estado', 'Fecha', 'Acciones'];
  const COLS = esTraslado ? COLS_TRASLADO : COLS_ASIG;

  if (loading) return (
    <div className="table-wrapper rounded-2xl overflow-hidden">
      <table className="table w-full">
        <thead><tr>{COLS.map(c => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {Array.from({ length: 5 }, (_, i) => (
            <tr key={i} className="border-b border-border">
              {COLS.map((_, j) => <td key={j}><div className="skeleton h-4 rounded" /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!filtrados.length) return (
    <div className="text-center py-16 card rounded-xl">
      <Icon name="swap_horiz" className="text-[48px] text-faint" />
      <p className="text-sm font-semibold mt-3 text-muted">No se encontraron transferencias</p>
    </div>
  );

  return (
    <div className="table-wrapper shadow-sm border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>{COLS.map(c => <th key={c} className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-faint">{c}</th>)}</tr>
          </thead>
          <tbody>
            {filtrados.map(t => {
              const badge  = BADGE[t.estado_transferencia] ?? { label: t.estado_transferencia, cls: '' };
              const bienes = t.bienes ?? [];
              return (
                <tr key={t.id} className="hover:bg-surface-alt/70 transition-colors border-b border-border group">
                  <td className="px-4 py-3">
                    <p className="font-black text-xs font-mono" style={{ color: 'var(--color-primary)' }}>{t.numero_orden}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                      {t.tipo === 'TRASLADO_SEDE' ? 'Traslado' : 'Asignación'}
                    </p>
                  </td>

                  {esTraslado ? (
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {t.sede_origen_nombre ?? '—'}
                      </p>
                      <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                        <Icon name="arrow_forward" className="text-[12px]" />
                        {t.sede_destino_nombre ?? '—'}
                      </p>
                    </td>
                  ) : (
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{t.usuario_destino_nombre ?? '—'}</p>
                    </td>
                  )}

                  {esTraslado ? (
                    <td className="px-4 py-3">
                      <p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{t.usuario_destino_nombre ?? '—'}</p>
                    </td>
                  ) : (
                    <td className="px-4 py-3">
                      <p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{t.modulo_destino_nombre ?? '—'}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t.ubicacion_destino_nombre ?? '—'}</p>
                    </td>
                  )}

                  {esTraslado && (
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ background: 'var(--color-border-light)', color: 'var(--color-text-body)' }}>
                        {t.motivo_transferencia_nombre ?? '—'}
                      </span>
                    </td>
                  )}

                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center size-6 rounded-lg text-[11px] font-black"
                      style={{ background: 'rgb(127 29 29 / 0.08)', color: 'var(--color-primary)' }}>
                      {bienes.length}
                    </span>
                  </td>

                  {!esTraslado && (
                    <td className="px-4 py-3">
                      <p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{t.aprobado_por_adminsede_nombre ?? '—'}</p>
                    </td>
                  )}

                  <td className="px-4 py-3">
                    <span className={badge.cls}
                      style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 8px', borderRadius: '9999px' }}>
                      {badge.label}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{fmtT(t.fecha_registro)}</p>
                  </td>

                  <td className="px-4 py-3">
                    <AccionesFila item={t} role={role}
                      onVerDetalle={onVerDetalle} onEditar={onEditar}
                      onCancelar={onCancelar} onDownload={onDownload} />
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