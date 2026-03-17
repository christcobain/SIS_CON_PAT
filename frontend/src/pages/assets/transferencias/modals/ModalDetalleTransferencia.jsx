import { useState, useRef } from 'react';
import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import { useAuthStore } from '../../../../store/authStore';
import { useToast }     from '../../../../hooks/useToast';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

const ESTADO_BADGE = {
  PENDIENTE_APROBACION:  { label: 'Pendiente aprobación',  cls: 'badge-pendiente'  },
  ATENDIDO:              { label: 'Atendido',              cls: 'badge-atendido'   },
  DEVUELTO:              { label: 'Devuelto',              cls: 'badge-devuelto'   },
  CANCELADO:             { label: 'Cancelado',             cls: 'badge-cancelado'  },
  EN_ESPERA_CONFORMIDAD: { label: 'Espera conformidad',    cls: 'badge-en-proceso' },
};

const ACCION_CFG = {
  APROBADO:         { icon: 'check_circle', color: '#16a34a' },
  RECHAZADO:        { icon: 'cancel',       color: '#dc2626' },
  DEVUELTO:         { icon: 'reply',        color: '#b45309' },
  CANCELADO:        { icon: 'block',        color: '#64748b' },
  APROBADO_SALIDA:  { icon: 'output',       color: '#7c3aed' },
  APROBADO_ENTRADA: { icon: 'input',        color: '#1d4ed8' },
};

const ROL_LABEL = {
  REGISTRADOR:    'Registrador',
  COORDSISTEMA:   'Coord. Sistema',
  ADMINSEDE:      'Admin Sede',
  SEGUR_SALIDA:   'Segur. Salida',
  SEGUR_ENTRADA:  'Segur. Entrada',
};

const TABS = [
  { id: 'ruta',      label: 'Ruta y Logística',   icon: 'alt_route'    },
  { id: 'bienes',    label: 'Bienes Transferidos', icon: 'inventory_2'  },
  { id: 'seguimiento', label: 'Seguimiento',       icon: 'analytics'    },
];

function Campo({ label, value, icon }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
      <div className="size-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--color-border-light)' }}>
        <Icon name={icon} className="text-[16px]" style={{ color: 'var(--color-text-faint)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-[11px] font-bold mt-0.5 leading-tight" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

function TabRuta({ item }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"
          style={{ color: 'var(--color-text-muted)' }}>
          <Icon name="upload" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />
          Origen
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Sede origen"     value={item.sede_origen_nombre}     icon="location_on" />
          <Campo label="Módulo origen"   value={item.modulo_origen_nombre}   icon="grid_view"   />
          <Campo label="Ubicación"       value={item.ubicacion_origen_nombre} icon="place"      />
          <Campo label="Responsable"     value={item.usuario_origen_nombre}  icon="person"      />
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1rem' }}>
        <p className="text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"
          style={{ color: 'var(--color-text-muted)' }}>
          <Icon name="download" className="text-[14px]" style={{ color: '#16a34a' }} />
          Destino
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Sede destino"    value={item.sede_destino_nombre}    icon="location_on" />
          <Campo label="Módulo destino"  value={item.modulo_destino_nombre}  icon="grid_view"   />
          <Campo label="Ubicación"       value={item.ubicacion_destino_nombre} icon="place"     />
          <Campo label="Destinatario"    value={item.usuario_destino_nombre} icon="person_check"/>
          {item.piso_destino && <Campo label="Piso"          value={`Piso ${item.piso_destino}`} icon="stairs" />}
        </div>
      </div>
      {(item.motivo_nombre || item.descripcion) && (
        <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1rem' }}>
          <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Motivo y descripción
          </p>
          {item.motivo_nombre && (
            <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-primary)' }}>{item.motivo_nombre}</p>
          )}
          {item.descripcion && (
            <p className="text-sm italic" style={{ color: 'var(--color-text-body)', lineHeight: 1.6 }}>{item.descripcion}</p>
          )}
        </div>
      )}
    </div>
  );
}

function TabBienes({ bienes = [] }) {
  if (!bienes.length) return (
    <div className="text-center py-10">
      <Icon name="inventory_2" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
      <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Sin bienes registrados</p>
    </div>
  );
  return (
    <div className="table-wrapper rounded-xl overflow-hidden">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Cód. Patrimonial</th>
            <th>Descripción</th>
            <th>Marca / Modelo</th>
            <th>N° Serie</th>
          </tr>
        </thead>
        <tbody>
          {bienes.map(b => (
            <tr key={b.id} className="hover:bg-surface-alt/60">
              <td className="font-mono text-xs font-black" style={{ color: 'var(--color-primary)' }}>
                {b.codigo_patrimonial}
              </td>
              <td>
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{b.tipo_bien_nombre}</p>
              </td>
              <td className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {b.marca_nombre} · {b.modelo}
              </td>
              <td className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {b.numero_serie || 'S/N'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabSeguimiento({ item }) {
  const aprobaciones = item.aprobaciones ?? [];
  const isCancelado  = item.estado === 'CANCELADO';
  const isDevuelto   = item.estado === 'DEVUELTO';

  return (
    <div className="space-y-4">
      {(isCancelado || isDevuelto) && (
        <div className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: 'rgb(220 38 38 / 0.06)', border: '1px solid rgb(220 38 38 / 0.2)' }}>
          <Icon name="gpp_bad" className="text-[20px] shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#dc2626' }}>
              {isCancelado ? 'Operación anulada' : 'Devolución de activos'}
            </p>
            <p className="text-sm mt-1 italic" style={{ color: 'var(--color-text-body)' }}>
              {item.cancelacion_nombre || item.motivo_devolucion || 'Sin motivo registrado'}
            </p>
          </div>
        </div>
      )}

      {aprobaciones.length === 0 ? (
        <div className="text-center py-8">
          <Icon name="pending_actions" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Sin historial de aprobaciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {aprobaciones.map((ap, i) => {
            const cfg = ACCION_CFG[ap.accion] ?? { icon: 'info', color: 'var(--color-text-muted)' };
            return (
              <div key={ap.id ?? i} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="size-8 rounded-full flex items-center justify-center" style={{ background: `${cfg.color}18` }}>
                    <Icon name={cfg.icon} className="text-[16px]" style={{ color: cfg.color }} />
                  </div>
                  {i < aprobaciones.length - 1 && (
                    <div className="w-px flex-1 mt-1" style={{ background: 'var(--color-border)' }} />
                  )}
                </div>
                <div className="pb-4 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase" style={{ color: cfg.color }}>{ap.accion}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                      {ROL_LABEL[ap.rol_aprobador_nombre] ?? ap.rol_aprobador_nombre ?? ap.rol_aprobador}
                    </span>
                  </div>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                    {fmtT(ap.fecha)}
                  </p>
                  {ap.detalle && (
                    <p className="text-[11px] mt-1 italic" style={{ color: 'var(--color-text-body)' }}>{ap.detalle}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ModalDetalleTransferencia({
  open, onClose, item, actualizando, acciones, onAccionExitosa,
}) {
  const [tab, setTab] = useState('ruta');
  const role    = useAuthStore(s => s.role);
  const toast   = useToast();
  const fileRef = useRef();

  if (!item) return null;

  const {
    numero_orden, estado, bienes = [], tipo,
    pdf_path, tiene_pdf_firmado, pdf_firmado_path,
  } = item;

  const esAsignacion = tipo === 'ASIGNACION_INTERNA';
  const esTraslado   = tipo === 'TRASLADO_SEDE';
  const badge        = ESTADO_BADGE[estado] ?? { label: estado, cls: '' };

  const puedeAprobarAdmin  = ['SYSADMIN', 'coordSistema', 'adminSede'].includes(role);
  const puedeAprobarSegur  = role === 'segurSede';
  const puedeDevolver      = puedeAprobarAdmin;

  const handleDescarga = async () => {
    try {
      await acciones.descargarPDF?.(item.id);
    } catch { toast.error('No se pudo descargar el PDF.'); }
  };

  const handleSubirFirmado = async e => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    try {
      await acciones.subirFirmado?.(item.id, archivo);
      toast.success('Acta firmada subida exitosamente.');
      onAccionExitosa?.();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al subir el acta firmada.');
    }
  };

  const ejecutarAccion = async (fn, ...args) => {
    try {
      const res = await fn(...args);
      if (res?.success === false) { toast.error(res.error); return; }
      onAccionExitosa?.();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error en la operación.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader
        icon="sync_alt"
        title={`Transferencia ${numero_orden}`}
        subtitle={`${esTraslado ? 'Traslado entre sedes' : 'Asignación interna'} — ${bienes.length} bien(es)`}
        onClose={onClose}
      />

      <ModalBody padding={false}>
        <div className="flex h-full">
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex gap-6 px-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2"
                  style={{ borderBottomColor: tab === t.id ? 'var(--color-primary)' : 'transparent', color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                  <Icon name={t.icon} className="text-[16px]" />{t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: '60vh' }}>
              {tab === 'ruta'       && <TabRuta       item={item} />}
              {tab === 'bienes'     && <TabBienes     bienes={bienes} />}
              {tab === 'seguimiento' && <TabSeguimiento item={item} />}
            </div>
          </div>

          <aside className="w-56 shrink-0 p-4 space-y-4 overflow-y-auto"
            style={{ borderLeft: '1px solid var(--color-border)' }}>

            <div className="card p-3 text-center space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>N° Orden</p>
              <p className="font-black text-xs font-mono" style={{ color: 'var(--color-primary)' }}>{numero_orden}</p>
              <span className={`${badge.cls} text-[9px] font-black uppercase tracking-widest`}
                style={{ padding: '3px 8px', borderRadius: '9999px', display: 'inline-block' }}>
                {badge.label}
              </span>
            </div>

            <div className="card p-3 space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Resumen</p>
              {[
                { label: 'Bienes',   value: bienes.length,              icon: 'inventory_2'  },
                { label: 'Tipo',     value: esAsignacion ? 'Asignación' : 'Traslado', icon: 'sync_alt' },
                { label: 'Registro', value: fmtT(item.fecha_registro),  icon: 'calendar_today' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon name={s.icon} className="text-[13px] shrink-0" style={{ color: 'var(--color-text-faint)' }} />
                    <span className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
                  </div>
                  <span className="text-xs font-black shrink-0" style={{ color: 'var(--color-text-primary)' }}>{s.value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Documentación</p>

              {(pdf_path || estado === 'ATENDIDO') && (
                <button onClick={handleDescarga}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                  style={{ background: 'rgb(37 99 235 / 0.08)', color: '#1d4ed8', border: '1px solid rgb(37 99 235 / 0.2)' }}>
                  <Icon name="picture_as_pdf" className="text-[16px]" />Descargar PDF
                </button>
              )}

              {esAsignacion && estado === 'ATENDIDO' && !tiene_pdf_firmado && !pdf_firmado_path && (
                <>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={handleSubirFirmado} />
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                    style={{ background: 'rgb(127 29 29 / 0.08)', color: 'var(--color-primary)', border: '1px solid rgb(127 29 29 / 0.2)' }}>
                    <Icon name="upload_file" className="text-[16px]" />Subir acta firmada
                  </button>
                  <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-faint)' }}>
                    Sube el scan del acta firmada físicamente por el destinatario.
                  </p>
                </>
              )}

              {(tiene_pdf_firmado || pdf_firmado_path) && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl"
                  style={{ background: 'rgb(22 163 74 / 0.08)', border: '1px solid rgb(22 163 74 / 0.2)' }}>
                  <Icon name="task_alt" className="text-[16px]" style={{ color: '#16a34a' }} />
                  <div>
                    <p className="text-[10px] font-black" style={{ color: '#16a34a' }}>Acta firmada</p>
                    <p className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>Documento subido</p>
                  </div>
                </div>
              )}

              {esTraslado && estado === 'ATENDIDO' && !pdf_firmado_path && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                  <Icon name="info" className="text-[14px] mt-0.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} />
                  <p className="text-[9px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    PDF oficial generado automáticamente al completar el flujo de aprobaciones.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </ModalBody>

      <ModalFooter align="space">
        <button onClick={onClose} className="btn-secondary">Cerrar</button>

        <div className="flex items-center gap-2 flex-wrap">
          {estado === 'PENDIENTE_APROBACION' && puedeAprobarAdmin && (
            <>
              <button
                onClick={() => ejecutarAccion(acciones.devolverAprobacion, item.id, 'Devuelto desde panel')}
                disabled={actualizando}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer"
                style={{ background: 'rgb(180 83 9 / 0.1)', color: '#b45309', border: '1px solid rgb(180 83 9 / 0.25)' }}>
                <Icon name="reply" className="text-[16px]" />Devolver
              </button>
              <button
                onClick={() => ejecutarAccion(acciones.aprobarAdminSede, item.id)}
                disabled={actualizando}
                className="btn-primary flex items-center gap-2">
                {actualizando ? <span className="btn-loading-spin" /> : <Icon name="verified" className="text-[16px]" />}
                {esAsignacion ? 'Aprobar asignación' : 'Aprobar traslado'}
              </button>
            </>
          )}

          {esTraslado && estado === 'PENDIENTE_APROBACION' && puedeAprobarSegur && (
            <>
              <button
                onClick={() => ejecutarAccion(acciones.aprobarSalidaSeguridad, item.id)}
                disabled={actualizando}
                className="btn-primary flex items-center gap-2">
                <Icon name="output" className="text-[16px]" />Aprobar salida
              </button>
              <button
                onClick={() => ejecutarAccion(acciones.aprobarEntradaSeguridad, item.id)}
                disabled={actualizando}
                className="btn-primary flex items-center gap-2">
                <Icon name="input" className="text-[16px]" />Aprobar entrada
              </button>
            </>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}