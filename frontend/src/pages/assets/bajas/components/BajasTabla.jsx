import Can from '../../../../components/auth/Can';
import { useAuthStore } from '../../../../store/authStore'; 

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

// Formateador de referencia
const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

// Colores según models.py y referencia visual
const BADGE_BAJA = {
  PENDIENTE_APROBACION: { label: 'Pend. aprobación',   color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   },
  ATENDIDO:             { label: 'Atendido (Baja)',   color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)'  },
  DEVUELTO:             { label: 'Devuelto',          color: '#e11d48', bg: 'rgb(225 29 72 / 0.1)'  },
  CANCELADO:            { label: 'Cancelado',          color: '#64748b', bg: 'rgb(100 116 139 / 0.1)' },
};

function AccionesFila({ item, userId, userRole, onVerDetalle, onGestionar, onCancelar, onDescargarPDF }) {
  // Lógica de acciones basada en roles y estados (Ref. Mantenimientos)
  const isRegistrador = userId === item.usuario_elabora_id;
  const canApprove = ['adminsede', 'coordsistema', 'SYSADMIN'].includes(userRole);

  return (
    <div className="flex items-center justify-end gap-1">
      <button onClick={() => onVerDetalle(item)} className="p-2 hover:bg-surface-alt rounded-lg transition-colors text-muted hover:text-primary" title="Ver Detalle">
        <Icon name="visibility" className="text-[18px]" />
      </button>

      {/* Aprobador gestiona (Aprobar/Devolver) */}
      {item.estado_baja === 'PENDIENTE_APROBACION' && canApprove && (
        <>
          <button onClick={() => onGestionar(item, 'aprobar')} className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600" title="Aprobar Baja">
            <Icon name="check_circle" className="text-[18px]" />
          </button>
          <button onClick={() => onGestionar(item, 'devolver')} className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-600" title="Devolver p/Corrección">
            <Icon name="assignment_return" className="text-[18px]" />
          </button>
        </>
      )}

      {/* Descarga PDF si está Atendido o Pendiente (según lógica de negocio) */}
      {['ATENDIDO', 'PENDIENTE_APROBACION'].includes(item.estado_baja) && item.pdf_path && (
        <button onClick={() => onDescargarPDF(item.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600" title="Descargar Informe PDF">
          <Icon name="picture_as_pdf" className="text-[18px]" />
        </button>
      )}

      {/* Cancelar (add_baja permission) */}
      <Can perform="ms-bienes:bajas:delete_baja">
          {/* Lógica: Solo registrador cancela si no está Atendido/Cancelado */}
          {!['ATENDIDO', 'CANCELADO'].includes(item.estado_baja) && isRegistrador && (
        <button onClick={() => onCancelar(item)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-faint hover:text-red-500" title="Cancelar Informe">
          <Icon name="cancel" className="text-[18px]" />
        </button>
      )}
      </Can>
      
    </div>
  );
} 

export default function BajasTabla({ items, loading, error, onVerDetalle, onGestionar, onCancelar, onDescargarPDF }) {
  // Obtener info de sesión para acciones de fila
  const userId = useAuthStore(s => s.userId);
  const userRole = useAuthStore(s => s.role); // Suponiendo que el rol viene del store

  if (loading) return (
    <div className="card p-12 flex flex-col items-center justify-center gap-4">
      <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-xs font-bold text-faint uppercase tracking-widest">Cargando informes de baja...</p>
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
            {/* Cabecera idéntica en estilo, cambian nombres de columna */}
            <tr className="bg-surface-alt/50 border-b border-border">
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-left">Informe</th>
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-left">Sede Elabora</th>
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-left">Estado</th>
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-left">N° Bienes</th>
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-left">Registro</th>
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-left">Aprobación Final</th>
              <th className="px-4 py-4 text-[10px] uppercase font-black tracking-widest text-faint text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((m) => {
              const badge = BADGE_BAJA[m.estado_baja] || BADGE_BAJA.PENDIENTE_APROBACION;
              return (
                <tr key={m.id} className="hover:bg-surface-alt/30 transition-colors group">
                  {/* Columna Informe */}
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-primary">
                      {m.numero_informe}
                    </p>
                    <p className="text-[10px] text-faint font-medium">Elabora: {m.nombre_elabora}</p>
                  </td>
                  {/* Columna Sede */}
                  <td className="px-4 py-3">
                    <p className="text-xs text-body font-medium">{m.sede_elabora_nombre}</p>
                    <p className="text-[10px] text-faint">{m.modulo_elabora_nombre || 'Sin módulo'}</p>
                  </td>
                  {/* Columna Estado */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-xl"
                      style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </td>
                  {/* Columna Total Bienes (del serializer) */}
                  <td className="px-4 py-3 text-sm font-bold text-body text-center">{m.total_bienes}</td>
                  {/* Columna Registro */}
                  <td className="px-4 py-3 text-[11px] text-muted">{fmtT(m.fecha_registro)}</td>
                  {/* Columna Aprobación (Adapta lógica de referencia) */}
                  <td className="px-4 py-3">
                    {m.estado_baja === 'CANCELADO' ? (
                      <span className="text-red-500 font-bold text-[10px] uppercase">
                        Cancelado
                      </span>
                    ) : m.fecha_aprobacion ? (
                      <div>
                        <p className="text-[10px] font-bold text-body">
                          {m.nombre_coordsistema || 'Aprobador'}
                        </p>
                        <p className="text-[9px] text-faint">
                          {fmtT(m.fecha_aprobacion)}
                        </p>
                      </div>
                    ) : m.estado_baja === 'DEVUELTO' ? (
                        <span className="text-amber-600 font-bold text-[10px] uppercase">
                          Devuelto
                        </span>
                    ) : (
                      <span className="text-faint text-[10px]">
                        Pendiente
                      </span>
                    )}
                  </td>
                  {/* Columna Acciones */}
                  <td className="px-4 py-3">
                    <AccionesFila 
                      item={m} 
                      userId={userId}
                      userRole={userRole}
                      onVerDetalle={onVerDetalle} 
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