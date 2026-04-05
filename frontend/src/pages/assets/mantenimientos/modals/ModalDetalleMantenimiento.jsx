import { useState, useEffect, useRef } from 'react';
import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import { useAuthStore }  from '../../../../store/authStore';
import { useToast }      from '../../../../hooks/useToast';
import { usePermission } from '../../../../hooks/usePermission';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

const BADGE = {
  EN_PROCESO:            { label: 'En proceso',       color: '#1d4ed8', bg: 'rgb(37 99 235 / 0.1)'  },
  PENDIENTE_APROBACION:  { label: 'Pend. aprobación', color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   },
  APROBADO:              { label: 'Aprobado',         color: '#7c3aed', bg: 'rgb(124 58 237 / 0.1)' },
  ATENDIDO:              { label: 'Atendido',         color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)'  },
  DEVUELTO:              { label: 'Devuelto',         color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   },
  CANCELADO:             { label: 'Cancelado',        color: '#64748b', bg: 'var(--color-border-light)' },
};

const ACCION_CFG = {
  ENVIADO:    { icon: 'check_circle', color: '#16a34a' },
  REGISTRADO: { icon: 'check_circle', color: '#16a34a' },
  APROBADO:   { icon: 'check_circle', color: '#16a34a' },
  DEVUELTO:   { icon: 'reply',        color: '#b45309' },
  CANCELADO:  { icon: 'cancel',       color: '#dc2626' },
  ATENDIDO:   { icon: 'front_hand',   color: '#7c3aed' },
};

const TABS = [
  { id: 'info',      label: 'Información', icon: 'info'           },
  { id: 'bienes',    label: 'Bienes',      icon: 'inventory_2'    },
  { id: 'imagenes',  label: 'Evidencias',  icon: 'photo_library'  },
  { id: 'historial', label: 'Historial',   icon: 'manage_history' },
];

// ── Sub-componentes de visualización (sin cambios de diseño) ──────────────────
function InfoRow({ label, value, icon }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
      <Icon name={icon ?? 'info'} className="text-[15px] mt-0.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} />
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

function FlujoPaso({ label, nombre, fecha, hecho }) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: hecho ? 'rgb(22 163 74 / 0.12)' : 'var(--color-border-light)' }}>
        <Icon name={hecho ? 'check_circle' : 'radio_button_unchecked'} className="text-[15px]"
          style={{ color: hecho ? '#16a34a' : 'var(--color-text-faint)' }} />
      </div>
      <div className="pb-4 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: hecho ? 'var(--color-text-primary)' : 'var(--color-text-faint)' }}>{label}</p>
        {hecho && nombre && <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-body)' }}>{nombre}</p>}
        {hecho && fecha  && <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{fmtT(fecha)}</p>}
        {!hecho && <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>Pendiente</p>}
      </div>
    </div>
  );
}

function TabInfo({ m }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Datos generales</p>
        <InfoRow label="Sede"              value={m.sede_nombre}                icon="domain"         />
        <InfoRow label="Módulo"            value={m.modulo_nombre}              icon="grid_view"      />
        <InfoRow label="Propietario"       value={m.usuario_propietario_nombre} icon="person"         />
        <InfoRow label="Fecha registro"    value={fmtT(m.fecha_registro)}       icon="calendar_today" />
        <InfoRow label="Fecha inicio"      value={fmtT(m.fecha_inicio_mant)}    icon="play_circle"    />
        <InfoRow label="Fecha término"     value={fmtT(m.fecha_termino_mant)}   icon="stop_circle"    />
        {m.motivo_cancelacion && <InfoRow label="Motivo cancelación" value={m.detalle_cancelacion} icon="block" />}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Flujo de aprobaciones</p>
        <div className="relative pl-3.5" style={{ borderLeft: '2px solid var(--color-border)' }}>
          <FlujoPaso label="Registrado por:"       nombre={null}                            fecha={m.fecha_registro}             hecho={true}                             />
          <FlujoPaso label="Aprobado Admin. Sede:" nombre={m.aprobado_por_adminsede_nombre} fecha={m.fecha_aprobacion_adminsede} hecho={!!m.aprobado_por_adminsede_id}    />
          <FlujoPaso label="Confirmado por:"       nombre={m.usuario_propietario_nombre}    fecha={m.fecha_pdf_firmado}          hecho={m.estado_mantenimiento === 'ATENDIDO'} />
        </div>
      </div>
    </div>
  );
}

function TabBienes({ detalles = [] }) {
  if (!detalles.length) return (
    <div className="text-center py-10">
      <Icon name="inventory_2" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
      <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Sin bienes registrados</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {detalles.map(d => (
        <div key={d.id} className="p-4 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgb(127 29 29 / 0.08)' }}>
                <Icon name="devices" className="text-[18px]" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="grid">
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{d.tipo_bien_nombre}</p>
                <span className="text-[10px] font-mono bg-surface-alt px-1.5 py-0.5 rounded border border-border self-start">Marca: {d.marca_nombre}</span>
                <span className="text-[10px] font-mono bg-surface-alt px-1.5 py-0.5 rounded border border-border self-start">Modelo: {d.modelo}</span>
                <span className="text-[10px] font-mono bg-surface-alt px-1.5 py-0.5 rounded border border-border self-start">Cód. Pat. {d.codigo_patrimonial || 'S/C'}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
// acciones:  { enviarAprobacion, aprobarMant, devolverMant, cancelarMant, descargarPDFMant, subirFirmadoMant, subirImagenMant }
// navegacion: { abrirEnviar, abrirAprobacion, abrirCancelar, abrirEditar }
export default function ModalDetalleMantenimiento({
  open, onClose, item, actualizando, acciones, navegacion,
}) {
  const toast    = useToast();
  const user     = useAuthStore(s => s.user);
  const { can }  = usePermission();
  const fileFirmRef = useRef();
  const fileImgRef  = useRef();

  const [tab,  setTab]  = useState('info');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) setTab('info'); }, [open]);

  if (!item) return null;

  const m           = item;
  const estado      = m.estado_mantenimiento;
  const badge       = BADGE[estado] || BADGE.EN_PROCESO;
  const detalles    = m.detalles    ?? m.detalles_mantenimiento ?? [];
  const imagenes    = m.imagenes    ?? [];
  const aprobaciones = m.aprobaciones ?? m.historial ?? [];
  const totalBienes = m.total_bienes ?? detalles.length;

  // Permisos
  const esRealiza     = m.usuario_realiza_id == user?.id;
  const esAprobador   = can('ms-bienes:mantenimientos:add_mantenimientoaprobacion');
  const esAsistente   = can('ms-bienes:mantenimientos:add_mantenimiento');

  const puedeEnviar   = esAsistente && (estado === 'EN_PROCESO' || estado === 'DEVUELTO');
  const puedeAprobar  = esAprobador && estado === 'PENDIENTE_APROBACION' && !m.aprobado_por_adminsede_id;
  const puedeCancelar = esAsistente && estado !== 'ATENDIDO' && estado !== 'CANCELADO';
  const puedeDescargar = esRealiza  && estado === 'APROBADO' && m.pdf_path;
  const puedeSubirFirma = esRealiza && estado === 'APROBADO' && !m.pdf_firmado_path;
  const puedeSubirImagen = esAsistente && (estado === 'EN_PROCESO' || estado === 'DEVUELTO');

  // Ejecutor interno para acciones directas (descarga, subir archivos)
  const ejecutar = async (fn, ...args) => {
    if (!fn) return;
    setBusy(true);
    try {
      const res = await fn(...args);
      if (res?.message) toast.success(res.message);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al procesar la acción.');
    } finally {
      setBusy(false);
    }
  };

  const handleDescargar = () => ejecutar(acciones.descargarPDFMant, m.id);
  const handleSubirFirmado = async e => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    await ejecutar(acciones.subirFirmadoMant, m.id, archivo, user?.id);
    if (fileFirmRef.current) fileFirmRef.current.value = '';
  };
  const handleSubirImagen = async e => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    await ejecutar(acciones.subirImagenMant, m.id, archivo);
    if (fileImgRef.current) fileImgRef.current.value = '';
  };

  return (
    <Modal open={open} onClose={onClose} size="2xl">
      <ModalHeader
        icon="engineering"
        title={`Orden: ${m.numero_orden}`}
        subtitle={m.sede_nombre}
        onClose={onClose}
      />

      <ModalBody className="p-0">
        <div className="flex h-[70vh]">
          {/* ── Tabs laterales ── */}
          <div className="flex flex-col border-r" style={{ borderColor: 'var(--color-border)', minWidth: 140 }}>
            {TABS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex items-center gap-2 px-4 py-3.5 text-left text-[11px] font-bold transition-colors"
                style={{
                  background: tab === id ? 'rgb(127 29 29 / 0.06)' : 'transparent',
                  color: tab === id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  borderRight: tab === id ? '2px solid var(--color-primary)' : '2px solid transparent',
                }}
              >
                <Icon name={icon} className="text-[16px]" />
                {label}
                {id === 'bienes'    && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md ml-auto" style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>{totalBienes}</span>}
                {id === 'imagenes'  && imagenes.length > 0 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md ml-auto" style={{ background: 'rgb(124 58 237 / 0.1)', color: '#7c3aed' }}>{imagenes.length}</span>}
                {id === 'historial' && aprobaciones.length > 0 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md ml-auto" style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>{aprobaciones.length}</span>}
              </button>
            ))}
          </div>

          {/* ── Contenido del tab ── */}
          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'info'      && <TabInfo    m={m} />}
            {tab === 'bienes'    && <TabBienes  detalles={detalles} />}
            {tab === 'imagenes'  && <div className="text-sm text-muted">Sin galería configurada</div>}
            {tab === 'historial' && <div className="text-sm text-muted">Sin historial disponible</div>}
          </div>

          {/* ── Panel lateral de estado y docs ── */}
          <aside className="w-52 shrink-0 p-4 space-y-3 overflow-y-auto" style={{ borderLeft: '1px solid var(--color-border)' }}>
            <div className="card p-3 text-center space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Estado</p>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl"
                style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
              <p className="font-black text-xs font-mono" style={{ color: 'var(--color-primary)' }}>{m.numero_orden}</p>
            </div>

            <div className="card p-3 space-y-2">
              {[
                { label: 'Bienes',   value: totalBienes,         icon: 'inventory_2'    },
                { label: 'Imágenes', value: imagenes.length,     icon: 'photo_camera'   },
                { label: 'Acciones', value: aprobaciones.length, icon: 'manage_history' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Icon name={s.icon} className="text-[13px]" style={{ color: 'var(--color-text-faint)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
                  </div>
                  <span className="text-xs font-black" style={{ color: 'var(--color-text-primary)' }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Documentación */}
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Documentación</p>

              {puedeDescargar && (
                <button onClick={handleDescargar} disabled={busy}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase cursor-pointer disabled:opacity-50"
                  style={{ background: 'rgb(37 99 235 / 0.08)', color: '#1d4ed8', border: '1px solid rgb(37 99 235 / 0.2)' }}>
                  <Icon name="download" className="text-[15px]" />Descargar PDF
                </button>
              )}

              {puedeSubirFirma && (
                <>
                  <input ref={fileFirmRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleSubirFirmado} />
                  <button onClick={() => fileFirmRef.current?.click()} disabled={busy}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase cursor-pointer disabled:opacity-50"
                    style={{ background: 'rgb(127 29 29 / 0.08)', color: 'var(--color-primary)', border: '1px solid rgb(127 29 29 / 0.2)' }}>
                    <Icon name="upload_file" className="text-[15px]" />Subir acta firmada
                  </button>
                </>
              )}

              {m.pdf_firmado_path && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl"
                  style={{ background: 'rgb(22 163 74 / 0.08)', border: '1px solid rgb(22 163 74 / 0.2)' }}>
                  <Icon name="task_alt" className="text-[14px]" style={{ color: '#16a34a' }} />
                  <span className="text-[10px] font-black" style={{ color: '#16a34a' }}>Acta firmada y subida</span>
                </div>
              )}

              {m.fecha_pdf && (
                <p className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>PDF generado: {fmtT(m.fecha_pdf)}</p>
              )}

              {puedeSubirImagen && (
                <>
                  <input ref={fileImgRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleSubirImagen} />
                  <button onClick={() => fileImgRef.current?.click()} disabled={busy}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase cursor-pointer disabled:opacity-50"
                    style={{ background: 'rgb(124 58 237 / 0.08)', color: '#7c3aed', border: '1px solid rgb(124 58 237 / 0.2)' }}>
                    <Icon name="add_photo_alternate" className="text-[15px]" />Agregar evidencia
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      </ModalBody>

      {/* ── Footer con acciones de flujo ── */}
      <ModalFooter align="right" className="bg-slate-50 dark:bg-slate-900/80">
        <button onClick={onClose}
          className="px-6 py-2 text-[11px] font-black uppercase tracking-widest text-muted hover:text-body transition-colors">
          Cerrar Ficha
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Enviar / Reenviar a aprobación → abre ModalEnviarAprobacion */}
          {puedeEnviar && (
            <button onClick={() => { onClose(); navegacion.abrirEnviar(m); }}
              className="btn-primary flex items-center gap-2">
              <Icon name="send" className="text-[16px]" />
              {estado === 'DEVUELTO' ? 'Reenviar a aprobación' : 'Enviar a aprobación'}
            </button>
          )}

          {/* Aprobar / Devolver → abre ModalAprobacionMantenimiento */}
          {puedeAprobar && (
            <>
              <button
                onClick={() => { onClose(); navegacion.abrirAprobacion({ ...m, _modo: 'devolver' }); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
                style={{ background: 'rgb(180 83 9 / 0.1)', color: '#b45309', border: '1px solid rgb(180 83 9 / 0.25)' }}>
                <Icon name="reply" className="text-[16px]" />Devolver
              </button>
              <button
                onClick={() => { onClose(); navegacion.abrirAprobacion({ ...m, _modo: 'aprobar' }); }}
                className="btn-primary flex items-center gap-2">
                <Icon name="check_circle" className="text-[16px]" />Aprobar
              </button>
            </>
          )}

          {/* Cancelar → abre ModalCancelarMantenimiento */}
          {puedeCancelar && (
            <button
              onClick={() => { onClose(); navegacion.abrirCancelar(m); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
              style={{ background: 'rgb(220 38 38 / 0.08)', color: '#dc2626', border: '1px solid rgb(220 38 38 / 0.2)' }}>
              <Icon name="cancel" className="text-[16px]" />Cancelar
            </button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}