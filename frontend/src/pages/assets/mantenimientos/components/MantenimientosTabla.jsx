import Can from '../../../../components/auth/Can';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

const BADGE = {
  EN_PROCESO:           { label: 'En proceso',         color: '#1d4ed8', bg: 'rgb(37 99 235 / 0.1)'  },
  PENDIENTE_APROBACION: { label: 'Pend. aprobación',   color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   },
  APROBADO:             { label: 'Pend. Firma',     color: '#7c3aed', bg: 'rgb(124 58 237 / 0.1)' },
  ATENDIDO:             { label: 'Atendido',           color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)'  },
  DEVUELTO:             { label: 'Devuelto',           color: '#e11d48', bg: 'rgb(225 29 72 / 0.1)'  },
  CANCELADO:            { label: 'Cancelado',          color: '#64748b', bg: 'rgb(100 116 139 / 0.1)' },
};

function AccionesFila({ item, role, onVerDetalle, onEnviar, onGestionar, onCancelar, onDescargarPDF }) {
  const isOwner = true; 
  const canApprove = ['ADMINSEDE', 'COORDSISTEMA', 'SYSADMIN'].includes(role);

  return (
    <div className="flex items-center justify-end gap-1">
      <button onClick={() => onVerDetalle(item)} className="p-2 hover:bg-surface-alt rounded-lg transition-colors text-muted hover:text-primary" title="Ver Detalle">
        <Icon name="visibility" className="text-[18px]" />
      </button>

      {item.estado_mantenimiento === 'EN_PROCESO' && isOwner && (
        <button onClick={() => onEnviar(item)} className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600" title="Enviar a Aprobación">
          <Icon name="send" className="text-[18px]" />
        </button>
      )}

      {item.estado_mantenimiento === 'PENDIENTE_APROBACION' && canApprove && (
        <button onClick={() => onGestionar(item, 'aprobar')} className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-600" title="Gestionar Aprobación">
          <Icon name="fact_check" className="text-[18px]" />
        </button>
      )}

      {( item.estado_mantenimiento === 'ATENDIDO') && (
        <button onClick={() => onDescargarPDF(item.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600" title="Descargar Documento">
          <Icon name="picture_as_pdf" className="text-[18px]" />
        </button>
      )}
      <Can perform="ms-bienes:mantenimientos:delete_mantenimiento">
          {!['ATENDIDO', 'CANCELADO'].includes(item.estado_mantenimiento) && (
        <button onClick={() => onCancelar(item)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-faint hover:text-red-500" title="Cancelar Orden">
          <Icon name="cancel" className="text-[18px]" />
        </button>
      )}
      </Can>
      
    </div>
  );
} 

export default function MantenimientosTabla({ items, loading, error, onVerDetalle, onEnviar, onGestionar, onCancelar, onDescargarPDF, role }) {
  if (loading) return (
    <div className="card p-12 flex flex-col items-center justify-center gap-4">
      <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-xs font-bold text-faint uppercase tracking-widest">Cargando mantenimientos...</p>
    </div>
  );

  if (error) return (
    <div className="card p-12 text-center">
      <Icon name="error" className="text-red-500 text-4xl mb-2" />
      <p className="text-sm font-bold text-body">{error}</p>
    </div>
  );

  return (
    <div className="table-wrapper shadow-sm border rounded-2xl overflow-hidden bg-surface">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="bg-surface-alt/50 border-b border-border">
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-left">Orden</th>
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-left">Sede / Ubicación</th>
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-left">Estado</th>
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-left">Registro</th>
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-left">Inicio</th>
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-left">Aprobación Admin.</th>
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((m) => {
              const badge = BADGE[m.estado_mantenimiento] || BADGE.EN_PROCESO;
              return (
                <tr key={m.id} className="hover:bg-surface-alt/30 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-primary r" >
                      {m.numero_orden}
                    </p>
                    <p className="text-[10px] text-faint font-medium">Realiza: {m.usuario_realiza_nombre || `ID: ${m.usuario_realiza_id}`}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-body font-medium">{m.sede_nombre || `Sede ${m.sede_id}`}</p>
                    <p className="text-[10px] text-faint">Resp: {m.usuario_propietario_nombre || 'No asignado'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-xl"
                      style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                    {m.tiene_imagenes && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold mt-1 text-purple-600">
                        <Icon name="image" className="text-[12px]" /> Multimedia
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted">{fmtT(m.fecha_registro)}</td>
                  <td className="px-4 py-3 text-[11px] text-muted">{m.fecha_inicio_mant ? new Date(m.fecha_inicio_mant).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    {m.estado_mantenimiento === 'CANCELADO' ? (
                      <span className="text-red-500 font-bold text-[10px] uppercase">
                        Cancelado
                      </span>
                    ) : m.fecha_aprobacion_adminsede ? (
                      <div>
                        <p className="text-[10px] font-bold text-body">
                          {m.aprobado_por_adminsede_nombre || 'Admin'}
                        </p>
                        <p className="text-[9px] text-faint">
                          {fmtT(m.fecha_aprobacion_adminsede)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-faint text-[10px]">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <AccionesFila 
                      item={m} 
                      role={role}
                      onVerDetalle={onVerDetalle} 
                      onEnviar={onEnviar}
                      onGestionar={onGestionar} 
                      onCancelar={onCancelar}
                      onDescargarPDF={onDescargarPDF}
                    />
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