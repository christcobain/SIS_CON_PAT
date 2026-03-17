import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/authStore';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

const BADGE = {
  EN_PROCESO:            { label: 'En proceso',         color: '#1d4ed8', bg: 'rgb(37 99 235 / 0.1)'  },
  PENDIENTE_APROBACION:  { label: 'Pend. aprobación',   color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   },
  EN_ESPERA_CONFORMIDAD: { label: 'Espera conformidad', color: '#7c3aed', bg: 'rgb(124 58 237 / 0.1)' },
  ATENDIDO:              { label: 'Atendido',           color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)'  },
  DEVUELTO:              { label: 'Devuelto',           color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   },
  CANCELADO:             { label: 'Cancelado',          color: '#64748b', bg: 'var(--color-border-light)' },
};

function filtrar(items, filtros) {
  if (!filtros?.search) return items;
  const q = filtros.search.toLowerCase();
  return items.filter(m =>
    m.numero_orden?.toLowerCase().includes(q) ||
    m.sede_nombre?.toLowerCase().includes(q) ||
    m.usuario_propietario_nombre?.toLowerCase().includes(q)
  );
}

function AccionesFila({ item, role, onVerDetalle, onAprobar, onDevolver, onEnviar, onCancelar }) {
  const estado = item.estado_mantenimiento;
  const puedeAprobar  = ['SYSADMIN', 'coordSistema', 'adminSede'].includes(role);
  const puedeEnviar   = ['SYSADMIN', 'coordSistema', 'asistSistema'].includes(role);
  const puedeCancelar = !['ATENDIDO', 'CANCELADO'].includes(estado);

  return (
    <div className="flex justify-end gap-1">
      <button onClick={() => onVerDetalle(item)} title="Ver detalle"
        className="size-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer">
        <Icon name="visibility" className="text-[19px]" />
      </button>
      {(estado === 'EN_PROCESO' || estado === 'DEVUELTO') && puedeEnviar && (
        <button onClick={() => onEnviar(item)} title="Enviar a aprobación"
          className="size-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
          style={{ color: '#1d4ed8' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgb(37 99 235 / 0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <Icon name="send" className="text-[19px]" />
        </button>
      )}
      {estado === 'PENDIENTE_APROBACION' && puedeAprobar && (
        <>
          <button onClick={() => onAprobar(item)} title="Aprobar"
            className="size-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
            style={{ color: '#16a34a' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgb(22 163 74 / 0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <Icon name="check_circle" className="text-[19px]" />
          </button>
          <button onClick={() => onDevolver(item)} title="Devolver"
            className="size-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
            style={{ color: '#b45309' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgb(180 83 9 / 0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <Icon name="reply" className="text-[19px]" />
          </button>
        </>
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
  items = [], filtros = {}, loading,
  onVerDetalle, onAprobar, onDevolver, onEnviar, onCancelar,
}) {
  const role     = useAuthStore(s => s.role);
  const filtrados = useMemo(() => filtrar(items, filtros), [items, filtros]);

  const COLS = ['N° Orden', 'Sede', 'Propietario', 'Bienes', 'Estado', 'Registro', 'Inicio', 'Aprobado por', 'Acciones'];

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
                <th key={c} className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-faint">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map(m => {
              const badge  = BADGE[m.estado_mantenimiento] ?? { label: m.estado_mantenimiento, color: 'var(--color-text-muted)', bg: 'var(--color-border-light)' };
              const detalles = m.detalles_mantenimiento ?? [];
              const totalBienes = m.total_bienes ?? detalles.length;
              return (
                <tr key={m.id} className="hover:bg-surface-alt/70 transition-colors border-b border-border group">
                  <td className="px-4 py-3">
                    <p className="font-black text-xs font-mono" style={{ color: 'var(--color-primary)' }}>{m.numero_orden}</p>
                    {m.pdf_path && (
                      <span className="text-[9px] font-bold" style={{ color: '#1d4ed8' }}>📄 PDF</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{m.sede_nombre ?? '—'}</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{m.modulo_nombre ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{m.usuario_propietario_nombre ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center size-6 rounded-lg text-[11px] font-black"
                      style={{ background: 'rgb(127 29 29 / 0.08)', color: 'var(--color-primary)' }}>
                      {totalBienes}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-xl"
                      style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                    {m.tiene_imagenes && (
                      <span className="text-[9px] block mt-1" style={{ color: '#7c3aed' }}>📷 Con imágenes</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{fmtT(m.fecha_registro)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{fmtT(m.fecha_inicio_mant)}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{m.aprobado_por_adminsede_nombre ?? '—'}</p>
                    {m.fecha_aprobacion_adminsede && (
                      <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{fmtT(m.fecha_aprobacion_adminsede)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
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