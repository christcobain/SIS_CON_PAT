import { useState, useEffect, useRef, useCallback } from 'react';
import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import { useAuthStore }  from '../../../../store/authStore';
import { useToast }      from '../../../../hooks/useToast';
import { usePermission } from '../../../../hooks/usePermission';
import mantenimientosService from '../../../../services/mantenimientos.service';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
const fmtD = iso => !iso ? '—' : new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'medium' });

const BADGE = {
  EN_PROCESO:            { label: 'En proceso',       color: '#1d4ed8', bg: 'rgb(37 99 235 / 0.1)'  },
  PENDIENTE_APROBACION:  { label: 'Pend. aprobación', color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   },
  APROBADO:              { label: 'Aprobado',         color: '#7c3aed', bg: 'rgb(124 58 237 / 0.1)' },
  ATENDIDO:              { label: 'Atendido',         color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)'  },
  DEVUELTO:              { label: 'Devuelto',         color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   },
  CANCELADO:             { label: 'Cancelado',        color: '#64748b', bg: 'var(--color-border-light)' },
};

const ACCION_ICON = {
  REGISTRADO: { icon: 'add_circle',   color: '#1d4ed8', label: 'Registrado'  },
  ENVIADO:    { icon: 'send',         color: '#b45309', label: 'Enviado'     },
  APROBADO:   { icon: 'check_circle', color: '#16a34a', label: 'Aprobado'    },
  DEVUELTO:   { icon: 'reply',        color: '#dc2626', label: 'Devuelto'    },
  CANCELADO:  { icon: 'cancel',       color: '#dc2626', label: 'Cancelado'   },
  ATENDIDO:   { icon: 'task_alt',     color: '#7c3aed', label: 'Atendido'    },
};

const ROL_LABEL = {
  ASISTSISTEMA: 'Asist. Sistemas',
  ADMINSEDE:    'Admin. Sede',
  COORDSISTEMA: 'Coord. Sistemas',
  SYSADMIN:     'Administrador',
};

const TABS = [
  { id: 'info',      label: 'Información', icon: 'info'           },
  { id: 'bienes',    label: 'Bienes',      icon: 'inventory_2'    },
  { id: 'imagenes',  label: 'Evidencias',  icon: 'photo_library'  },
  { id: 'historial', label: 'Historial',   icon: 'manage_history' },
];

// ── InfoRow ───────────────────────────────────────────────────────────────────
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

// ── Tab Información ───────────────────────────────────────────────────────────
function TabInfo({ m }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Datos generales</p>
        <InfoRow label="Sede"              value={m.sede_nombre}                icon="domain"         />
        <InfoRow label="Módulo"            value={m.modulo_nombre}              icon="grid_view"      />
        <InfoRow label="Propietario"       value={m.usuario_propietario_nombre} icon="person"         />
        <InfoRow label="Realizado por"     value={m.usuario_realiza_nombre}     icon="engineering"    />
        <InfoRow label="Fecha registro"    value={fmtT(m.fecha_registro)}       icon="calendar_today" />
        <InfoRow label="Fecha inicio"      value={fmtD(m.fecha_inicio_mant)}    icon="play_circle"    />
        <InfoRow label="Fecha término"     value={fmtD(m.fecha_termino_mant)}   icon="stop_circle"    />
        {m.motivo_cancelacion && (
          <InfoRow label="Motivo cancelación" value={m.detalle_cancelacion} icon="block" />
        )}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Flujo de aprobaciones</p>
        <div className="relative pl-3.5" style={{ borderLeft: '2px solid var(--color-border)' }}>
          <FlujoPaso label="Registrado"           nombre={m.usuario_realiza_nombre}        fecha={m.fecha_registro}             hecho={true} />
          <FlujoPaso label="Aprobado por Admin"   nombre={m.aprobado_por_adminsede_nombre} fecha={m.fecha_aprobacion_adminsede} hecho={!!m.aprobado_por_adminsede_id} />
          <FlujoPaso label="Conformidad / Firma"  nombre={m.usuario_propietario_nombre}    fecha={m.fecha_pdf_firmado}          hecho={m.estado_mantenimiento === 'ATENDIDO'} />
        </div>
      </div>
    </div>
  );
}

// ── Tab Bienes ────────────────────────────────────────────────────────────────
function TabBienes({ detalles = [] }) {
  if (!detalles.length) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Icon name="inventory_2" className="text-[44px]" style={{ color: 'var(--color-text-faint)' }} />
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>Sin bienes registrados</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {detalles.map((d, idx) => (
        <div key={d.id ?? d.bien_id} className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--color-border)' }}>
          {/* Cabecera del bien */}
          <div className="flex items-center gap-3 px-4 py-3"
            style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
            <span className="size-6 flex items-center justify-center rounded-full text-white text-[10px] font-black shrink-0"
              style={{ background: 'var(--color-primary)' }}>{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase" style={{ color: 'var(--color-text-primary)' }}>{d.tipo_bien_nombre}</p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                  Cód: <strong>{d.codigo_patrimonial || 'S/C'}</strong>
                </span>
                {d.marca_nombre && (
                  <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                    {d.marca_nombre} — {d.modelo}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {d.estado_funcionamiento_inicial_nombre && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: 'rgb(37 99 235 / 0.1)', color: '#1d4ed8' }}>
                  Inicial: {d.estado_funcionamiento_inicial_nombre}
                </span>
              )}
              {d.estado_funcionamiento_final_nombre && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: 'rgb(22 163 74 / 0.1)', color: '#16a34a' }}>
                  Final: {d.estado_funcionamiento_final_nombre}
                </span>
              )}
            </div>
          </div>

          {/* Informe técnico */}
          {(d.diagnostico_inicial || d.trabajo_realizado || d.diagnostico_final) ? (
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x"
              style={{ '--tw-divide-opacity': 1 }}>
              {[
                { label: 'Diagnóstico Inicial', value: d.diagnostico_inicial, icon: 'search_insights', color: '#1d4ed8' },
                { label: 'Trabajo Realizado',   value: d.trabajo_realizado,   icon: 'build',           color: '#b45309' },
                { label: 'Diagnóstico Final',   value: d.diagnostico_final,   icon: 'verified',        color: '#16a34a' },
              ].map(f => (
                <div key={f.label} className="p-3 space-y-1" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-1.5">
                    <Icon name={f.icon} className="text-[12px]" style={{ color: f.color }} />
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: f.color }}>{f.label}</p>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: f.value ? 'var(--color-text-body)' : 'var(--color-text-faint)' }}>
                    {f.value || 'No registrado'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3">
              <p className="text-[10px] italic" style={{ color: 'var(--color-text-faint)' }}>Informe técnico aún no registrado</p>
            </div>
          )}

          {d.observacion_detalle && (
            <div className="px-4 py-2.5 flex items-start gap-2"
              style={{ background: 'var(--color-surface-alt)', borderTop: '1px solid var(--color-border)' }}>
              <Icon name="comment" className="text-[12px] shrink-0 mt-0.5" style={{ color: 'var(--color-text-faint)' }} />
              <p className="text-[10px] italic" style={{ color: 'var(--color-text-muted)' }}>{d.observacion_detalle}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tab Evidencias ────────────────────────────────────────────────────────────
// Carga URLs firmadas desde el servicio, permite subir con descripcion y eliminar.
function TabImagenes({ mantenimientoId, imagenes = [], puedeGestionar, onImagenSubida, onImagenEliminada }) {
  const toast = useToast();
  const fileRef = useRef();
  const [descripcion,   setDescripcion]   = useState('');
  const [showForm,      setShowForm]      = useState(false);
  const [subiendo,      setSubiendo]      = useState(false);
  const [eliminandoId,  setEliminandoId]  = useState(null);
  const [imagenesUrls,  setImagenesUrls]  = useState({});
  const [loadingUrls,   setLoadingUrls]   = useState(false);
  const [selectedFile,  setSelectedFile]  = useState(null);

  // Carga URLs firmadas para cada imagen
  const cargarUrls = useCallback(async () => {
    if (!imagenes.length) { setImagenesUrls({}); return; }
    setLoadingUrls(true);
    const urls = {};
    await Promise.allSettled(
      imagenes.map(async img => {
        try {
          const data = await mantenimientosService.obtenerImagen(mantenimientoId, img.id);
          urls[img.id] = data.url;
        } catch {
          urls[img.id] = null;
        }
      })
    );
    setImagenesUrls(urls);
    setLoadingUrls(false);
  }, [mantenimientoId, imagenes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { cargarUrls(); }, [imagenes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = e => {
    const f = e.target.files?.[0];
    setSelectedFile(f ?? null);
  };

  const handleSubir = async () => {
    if (!selectedFile) { toast.error('Selecciona una imagen.'); return; }
    setSubiendo(true);
    try {
      const res = await mantenimientosService.subirImagen(mantenimientoId, selectedFile, descripcion.trim());
      toast.success(res?.message || 'Imagen subida correctamente.');
      setDescripcion('');
      setSelectedFile(null);
      setShowForm(false);
      if (fileRef.current) fileRef.current.value = '';
      await onImagenSubida?.();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  };

  const handleEliminar = async (imgId) => {
    setEliminandoId(imgId);
    try {
      const res = await mantenimientosService.eliminarImagen(mantenimientoId, imgId);
      toast.success(res?.message || 'Imagen eliminada.');
      await onImagenEliminada?.();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al eliminar la imagen.');
    } finally {
      setEliminandoId(null);
    }
  };

  if (loadingUrls && imagenes.length > 0) return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {imagenes.map(i => <div key={i.id} className="skeleton rounded-2xl aspect-video" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Formulario subir */}
      {puedeGestionar && (
        <div>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all"
              style={{ background: 'rgb(124 58 237 / 0.08)', color: '#7c3aed', border: '1px solid rgb(124 58 237 / 0.2)' }}
            >
              <Icon name="add_photo_alternate" className="text-[16px]" />
              Agregar evidencia fotográfica
            </button>
          ) : (
            <div className="p-4 rounded-2xl space-y-3"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                Nueva evidencia fotográfica
              </p>
              {/* Zona de selección */}
              <div
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer transition-all"
                style={{
                  border: `2px dashed ${selectedFile ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: selectedFile ? 'rgb(127 29 29 / 0.03)' : 'transparent',
                }}
              >
                <Icon name={selectedFile ? 'check_circle' : 'cloud_upload'}
                  className="text-[28px]"
                  style={{ color: selectedFile ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
                <p className="text-[11px] font-bold text-center" style={{ color: selectedFile ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                  {selectedFile ? selectedFile.name : 'Haz clic para seleccionar imagen'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>JPG, PNG, WEBP</p>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />
              </div>
              {/* Descripción */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Descripción (opcional)
                </p>
                <input
                  type="text"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Ej. Vista frontal del equipo antes de la limpieza..."
                  className="w-full text-xs rounded-xl px-3 py-2.5 transition-all"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                  onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
                  onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowForm(false); setDescripcion(''); setSelectedFile(null); }}
                  className="btn-secondary text-xs" disabled={subiendo}>Cancelar</button>
                <button onClick={handleSubir} disabled={subiendo || !selectedFile}
                  className="btn-primary flex items-center gap-2 text-xs disabled:opacity-50">
                  {subiendo ? <span className="btn-loading-spin" /> : <Icon name="upload" className="text-[14px]" />}
                  Subir imagen
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Galería */}
      {imagenes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Icon name="photo_library" className="text-[44px]" style={{ color: 'var(--color-text-faint)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>Sin evidencias fotográficas</p>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-faint)' }}>
            {puedeGestionar
              ? 'Agrega imágenes del trabajo realizado como evidencia.'
              : 'No se han subido imágenes para este mantenimiento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {imagenes.map(img => {
            const url = imagenesUrls[img.id];
            const isEliminando = eliminandoId === img.id;
            return (
              <div key={img.id} className="group relative rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--color-border)' }}>
                {/* Imagen */}
                <div className="aspect-video overflow-hidden flex items-center justify-center"
                  style={{ background: 'var(--color-surface-alt)' }}>
                  {url ? (
                    <img
                      src={url}
                      alt={img.descripcion || `Evidencia ${img.id}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <Icon name="broken_image" className="text-[32px]" style={{ color: 'var(--color-text-faint)' }} />
                  )}
                </div>
                {/* Info + acciones */}
                <div className="p-2.5 space-y-1" style={{ background: 'var(--color-surface)' }}>
                  {img.descripcion && (
                    <p className="text-[10px] font-semibold leading-snug line-clamp-2"
                      style={{ color: 'var(--color-text-body)' }}>{img.descripcion}</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
                      {fmtD(img.fecha_subida)}
                    </p>
                    <div className="flex items-center gap-1">
                      {url && (
                        <a href={url} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#1d4ed8' }}
                          title="Ver en tamaño completo">
                          <Icon name="open_in_new" className="text-[13px]" />
                        </a>
                      )}
                      {puedeGestionar && (
                        <button
                          onClick={() => handleEliminar(img.id)}
                          disabled={isEliminando}
                          className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: '#dc2626' }}
                          title="Eliminar imagen">
                          {isEliminando
                            ? <span className="btn-loading-spin" style={{ width: 13, height: 13, borderColor: '#fca5a5', borderTopColor: '#dc2626' }} />
                            : <Icon name="delete" className="text-[13px]" />
                          }
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab Historial ─────────────────────────────────────────────────────────────
function TabHistorial({ aprobaciones = [] }) {
  if (!aprobaciones.length) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Icon name="manage_history" className="text-[44px]" style={{ color: 'var(--color-text-faint)' }} />
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>Sin historial de acciones</p>
      <p className="text-xs text-center" style={{ color: 'var(--color-text-faint)' }}>
        Las acciones realizadas sobre este mantenimiento aparecerán aquí.
      </p>
    </div>
  );

  return (
    <div className="relative pl-7">
      {/* Línea de tiempo vertical */}
      <div className="absolute left-3 top-2 bottom-2 w-0.5 rounded-full"
        style={{ background: 'var(--color-border)' }} />

      <div className="space-y-3">
        {aprobaciones.map((a, idx) => {
          const cfg = ACCION_ICON[a.accion] ?? { icon: 'history', color: '#64748b', label: a.accion };
          return (
            <div key={a.id} className="relative flex gap-3 items-start">
              {/* Círculo en la línea */}
              <div
                className="absolute -left-7 size-6 rounded-full flex items-center justify-center shrink-0 z-10"
                style={{ background: `${cfg.color}15`, border: `2px solid ${cfg.color}35` }}
              >
                <Icon name={cfg.icon} className="text-[11px]" style={{ color: cfg.color }} />
              </div>

              {/* Tarjeta */}
              <div className="flex-1 rounded-xl p-3.5"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-black uppercase tracking-tight px-2.5 py-0.5 rounded-lg"
                      style={{ background: `${cfg.color}15`, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                      style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                      {ROL_LABEL[a.rol_aprobador] ?? a.rol_aprobador}
                    </span>
                  </div>
                  <p className="text-[9px] shrink-0" style={{ color: 'var(--color-text-faint)' }}>
                    {fmtT(a.fecha)}
                  </p>
                </div>

                {a.observacion && (
                  <div className="mt-2 flex items-start gap-2 p-2 rounded-lg"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                    <Icon name="comment" className="text-[12px] shrink-0 mt-0.5" style={{ color: 'var(--color-text-faint)' }} />
                    <p className="text-[10px] italic leading-relaxed" style={{ color: 'var(--color-text-body)' }}>
                      "{a.observacion}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ModalDetalleMantenimiento({
  open, onClose, item, actualizando, acciones, navegacion,
}) {
  const toast    = useToast();
  const user     = useAuthStore(s => s.user);
  const { can }  = usePermission();
  const fileFirmRef = useRef();

  const [tab,       setTab]       = useState('info');
  const [busy,      setBusy]      = useState(false);
  const [itemLocal, setItemLocal] = useState(null);

  useEffect(() => {
    if (open && item) {
      setTab('info');
      setItemLocal(item);
    }
    if (!open) setItemLocal(null);
  }, [open, item]);

  if (!itemLocal) return null;

  const m            = itemLocal;
  const estado       = m.estado_mantenimiento;
  const badge        = BADGE[estado] || BADGE.EN_PROCESO;
  const detalles     = m.detalles     ?? m.detalles_mantenimiento ?? [];
  const imagenes     = m.imagenes     ?? [];
  const aprobaciones = m.aprobaciones ?? m.historial ?? [];
  const totalBienes  = m.total_bienes ?? detalles.length;

  const esRealiza              = m.usuario_realiza_id == user?.id;
  const esAprobador            = can('ms-bienes:mantenimientos:add_mantenimientoaprobacion');
  const esAsistente            = can('ms-bienes:mantenimientos:add_mantenimiento');
  const puedeEnviar            = esAsistente  && (estado === 'EN_PROCESO' || estado === 'DEVUELTO');
  const puedeAprobar           = esAprobador  && estado === 'PENDIENTE_APROBACION' && !m.aprobado_por_adminsede_id;
  const puedeCancelar          = esAsistente  && estado !== 'ATENDIDO' && estado !== 'CANCELADO';
  const puedeDescargar         = esRealiza    && (estado === 'APROBADO' || estado === 'ATENDIDO') && m.pdf_path;
  const puedeSubirFirma        = esRealiza    && estado === 'APROBADO' && !m.tiene_pdf_firmado;
  const puedeGestionarImagenes = esAsistente  && (estado === 'EN_PROCESO' || estado === 'DEVUELTO');

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

  // Refrescar item local tras cambios en imágenes (no necesita refetch global)
  const refrescarItem = async () => {
    try {
      const actualizado = await mantenimientosService.obtener(m.id);
      setItemLocal(actualizado);
    } catch { /* silencioso, el usuario puede refrescar manualmente */ }
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
        <div className="flex" style={{ height: '70vh' }}>
          {/* ── Tabs laterales ── */}
          <div className="flex flex-col border-r shrink-0"
            style={{ borderColor: 'var(--color-border)', width: 152 }}>
            {TABS.map(({ id, label, icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex items-center gap-2 px-4 py-3.5 text-left text-[11px] font-bold transition-colors"
                style={{
                  background:  tab === id ? 'rgb(127 29 29 / 0.06)' : 'transparent',
                  color:       tab === id ? 'var(--color-primary)'  : 'var(--color-text-muted)',
                  borderRight: tab === id ? '2px solid var(--color-primary)' : '2px solid transparent',
                }}
              >
                <Icon name={icon} className="text-[16px]" />
                <span className="flex-1">{label}</span>
                {id === 'bienes' && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
                    style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                    {totalBienes}
                  </span>
                )}
                {id === 'imagenes' && imagenes.length > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
                    style={{ background: 'rgb(124 58 237 / 0.1)', color: '#7c3aed' }}>
                    {imagenes.length}
                  </span>
                )}
                {id === 'historial' && aprobaciones.length > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
                    style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                    {aprobaciones.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Contenido del tab ── */}
          <div className="flex-1 overflow-y-auto p-6 min-w-0">
            {tab === 'info'      && <TabInfo m={m} />}
            {tab === 'bienes'    && <TabBienes detalles={detalles} />}
            {tab === 'imagenes'  && (
              <TabImagenes
                mantenimientoId={m.id}
                imagenes={imagenes}
                puedeGestionar={puedeGestionarImagenes}
                onImagenSubida={refrescarItem}
                onImagenEliminada={refrescarItem}
              />
            )}
            {tab === 'historial' && <TabHistorial aprobaciones={aprobaciones} />}
          </div>

          {/* ── Panel lateral de estado y docs ── */}
          <aside className="w-52 shrink-0 p-4 space-y-3 overflow-y-auto border-l"
            style={{ borderColor: 'var(--color-border)' }}>
            {/* Estado */}
            <div className="card p-3 text-center space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}>Estado</p>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl"
                style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
              <p className="font-black text-xs font-mono"
                style={{ color: 'var(--color-primary)' }}>{m.numero_orden}</p>
            </div>

            {/* Resumen */}
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
              <p className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}>Documentación</p>

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

              {m.tiene_pdf_firmado && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl"
                  style={{ background: 'rgb(22 163 74 / 0.08)', border: '1px solid rgb(22 163 74 / 0.2)' }}>
                  <Icon name="task_alt" className="text-[14px]" style={{ color: '#16a34a' }} />
                  <span className="text-[10px] font-black" style={{ color: '#16a34a' }}>Acta firmada y subida</span>
                </div>
              )}

              {m.fecha_pdf && (
                <p className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
                  PDF: {fmtT(m.fecha_pdf)}
                </p>
              )}
            </div>
          </aside>
        </div>
      </ModalBody>

      {/* ── Footer ── */}
      <ModalFooter align="right" className="bg-slate-50 dark:bg-slate-900/80">
        <button onClick={onClose}
          className="px-6 py-2 text-[11px] font-black uppercase tracking-widest text-muted hover:text-body transition-colors">
          Cerrar Ficha
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          {puedeEnviar && (
            <button onClick={() => { onClose(); navegacion.abrirEnviar(m); }}
              className="btn-primary flex items-center gap-2">
              <Icon name="send" className="text-[16px]" />
              {estado === 'DEVUELTO' ? 'Reenviar a aprobación' : 'Enviar a aprobación'}
            </button>
          )}
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