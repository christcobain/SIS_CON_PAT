import { useState, useEffect, useRef } from 'react';
import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import { useMantenimientos } from '../../../../hooks/useMantenimientos';
import { useAuthStore }      from '../../../../store/authStore';
import { useToast }          from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

const BADGE_MAP = {
  EN_PROCESO:            { label: 'En proceso',         color: '#1d4ed8', bg: 'rgb(37 99 235 / 0.1)' },
  PENDIENTE_APROBACION:  { label: 'Pend. aprobación',   color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'  },
  EN_ESPERA_CONFORMIDAD: { label: 'Espera conformidad', color: '#7c3aed', bg: 'rgb(124 58 237 / 0.1)'},
  ATENDIDO:              { label: 'Atendido',           color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)' },
  DEVUELTO:              { label: 'Devuelto',           color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'  },
  CANCELADO:             { label: 'Cancelado',          color: '#64748b', bg: 'var(--color-border-light)' },
};

const ROL_LABEL = {
  ASISTSISTEMA: 'Asist. Sistemas',
  ADMINSEDE:    'Admin Sede',
  PROPIETARIO:  'Propietario',
};

const ACCION_CFG = {
  APROBADO:   { icon: 'check_circle', color: '#16a34a' },
  DEVUELTO:   { icon: 'reply',        color: '#b45309' },
  CANCELADO:  { icon: 'cancel',       color: '#dc2626' },
  CONFIRMADO: { icon: 'front_hand',   color: '#7c3aed' },
};

const TABS = [
  { id: 'info',    label: 'Información',  icon: 'info'           },
  { id: 'bienes',  label: 'Bienes',       icon: 'inventory_2'    },
  { id: 'imagenes', label: 'Evidencias',  icon: 'photo_library'  },
  { id: 'historial', label: 'Historial', icon: 'manage_history'  },
];

function TabInfo({ data }) {
  const campos = [
    { label: 'N° Orden',         value: data.numero_orden,        icon: 'tag' },
    { label: 'Sede',             value: data.sede_id,             icon: 'location_on' },
    { label: 'Fecha registro',   value: fmtT(data.fecha_registro), icon: 'calendar_today' },
    { label: 'Fecha inicio',     value: fmtT(data.fecha_inicio),   icon: 'play_circle' },
    { label: 'Fecha término',    value: fmtT(data.fecha_termino),  icon: 'stop_circle' },
    { label: 'Trabajos realizados', value: data.trabajos_realizados, icon: 'construction' },
    { label: 'Diagnóstico final', value: data.diagnostico_final,  icon: 'medical_information' },
  ];
  return (
    <div className="space-y-2">
      {campos.map(c => c.value && (
        <div key={c.label} className="flex items-start gap-3 py-2.5"
          style={{ borderBottom: '1px solid var(--color-border-light)' }}>
          <Icon name={c.icon} className="text-[15px] mt-0.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} />
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{c.label}</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{c.value}</p>
          </div>
        </div>
      ))}
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
    <div className="space-y-2">
      {detalles.map(d => (
        <div key={d.id} className="p-3 rounded-xl flex items-start gap-3"
          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
          <Icon name="devices" className="text-[18px] mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{d.tipo_bien_nombre}</p>
            <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{d.codigo_patrimonial}</p>
            {d.observacion_detalle && (
              <p className="text-[11px] mt-1 italic" style={{ color: 'var(--color-text-body)' }}>{d.observacion_detalle}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            {d.estado_funcionamiento_antes_nombre && (
              <span className="text-[9px] block font-bold" style={{ color: 'var(--color-text-muted)' }}>
                Antes: {d.estado_funcionamiento_antes_nombre}
              </span>
            )}
            {d.estado_funcionamiento_despues_nombre && (
              <span className="text-[9px] block font-bold mt-0.5" style={{ color: '#16a34a' }}>
                Después: {d.estado_funcionamiento_despues_nombre}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TabImagenes({ imagenes = [] }) {
  if (!imagenes.length) return (
    <div className="text-center py-10">
      <Icon name="photo_library" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
      <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Sin imágenes de evidencia</p>
    </div>
  );
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {imagenes.map(img => (
        <div key={img.id} className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--color-border)' }}>
          <img src={img.imagen} alt={img.descripcion || 'Evidencia'}
            className="w-full h-32 object-cover"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
          {img.descripcion && (
            <p className="text-[10px] px-2 py-1.5 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              {img.descripcion}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function TabHistorial({ aprobaciones = [] }) {
  if (!aprobaciones.length) return (
    <div className="text-center py-10">
      <Icon name="manage_history" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
      <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Sin historial de acciones</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {aprobaciones.map((a, i) => {
        const cfg = ACCION_CFG[a.accion] ?? { icon: 'info', color: 'var(--color-text-muted)' };
        return (
          <div key={a.id} className="flex gap-3">
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
                <span className="text-[10px] font-black uppercase" style={{ color: cfg.color }}>{a.accion}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                  {ROL_LABEL[a.rol_aprobador] ?? a.rol_aprobador}
                </span>
              </div>
              <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                {fmtT(a.fecha)}
              </p>
              {a.observacion && (
                <p className="text-[11px] mt-1 italic" style={{ color: 'var(--color-text-body)' }}>{a.observacion}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ModalDetalleMantenimiento({
  open, onClose, item,
  onAprobar, onDevolver, onEnviar, onConformar, onCancelar, onSubirFirmado,
}) {
  const [tab,    setTab]    = useState('info');
  const [data,   setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const { obtener, descargarPDF, subirFirmado } = useMantenimientos();
  const { subirImagen } = useMantenimientos();
  const role  = useAuthStore(s => s.role);
  const toast = useToast();
  const fileRef = useRef();

  useEffect(() => {
    if (!open || !item?.id) return;
    setTab('info'); setData(null);
    setLoading(true);
    obtener(item.id)
      .then(d => setData(d))
      .catch(() => setData(item))
      .finally(() => setLoading(false));
  }, [open, item?.id]);

  if (!item) return null;
  const d = data ?? item;
  const badge = BADGE_MAP[d.estado] ?? { label: d.estado, color: 'var(--color-text-muted)', bg: 'var(--color-border-light)' };

  const handleSubirImagen = async e => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    try {
      await subirImagen(item.id, archivo, '');
      toast.success('Imagen subida exitosamente.');
      obtener(item.id).then(setData);
    } catch { toast.error('Error al subir la imagen.'); }
  };

  const handleDescargar = async () => {
    try { await descargarPDF(item.id); } catch { toast.error('No se pudo descargar el PDF.'); }
  };

  const handleSubirFirmado = async e => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    try {
      await subirFirmado(item.id, archivo);
      toast.success('Acta firmada subida exitosamente.');
      onSubirFirmado?.();
    } catch { toast.error('Error al subir el acta firmada.'); }
  };

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader icon="engineering"
        title={`Mantenimiento ${d.numero_orden || '#' + item.id}`}
        subtitle={`Orden de servicio técnico patrimonial`}
        onClose={onClose} />

      <ModalBody padding={false}>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : (
          <div className="flex">
            <div className="flex-1 min-w-0">
              <div className="flex gap-6 px-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                {TABS.map(({ id, label, icon }) => (
                  <button key={id} onClick={() => setTab(id)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-3 pt-4 transition-all border-b-2"
                    style={{ borderBottomColor: tab === id ? 'var(--color-primary)' : 'transparent', color: tab === id ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    <Icon name={icon} className="text-[16px]" />{label}
                  </button>
                ))}
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: '58vh' }}>
                {tab === 'info'     && <TabInfo     data={d} />}
                {tab === 'bienes'   && <TabBienes   detalles={d.detalles ?? []} />}
                {tab === 'imagenes' && <TabImagenes imagenes={d.imagenes ?? []} />}
                {tab === 'historial' && <TabHistorial aprobaciones={d.aprobaciones ?? []} />}
              </div>
            </div>

            <aside className="w-52 shrink-0 p-4 space-y-4" style={{ borderLeft: '1px solid var(--color-border)' }}>
              <div className="card p-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>Estado</p>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1.5 rounded-xl"
                  style={{ background: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>
              </div>

              <div className="card p-3 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Resumen</p>
                {[
                  { label: 'Bienes',     value: d.detalles?.length ?? item.total_bienes ?? 0, icon: 'inventory_2' },
                  { label: 'Imágenes',   value: d.imagenes?.length ?? 0,                       icon: 'photo_camera' },
                  { label: 'Acciones',   value: d.aprobaciones?.length ?? 0,                   icon: 'manage_history' },
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

              <div className="space-y-2">
                {d.pdf_path && (
                  <button onClick={handleDescargar}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                    style={{ background: 'rgb(37 99 235 / 0.08)', color: '#1d4ed8', border: '1px solid rgb(37 99 235 / 0.2)' }}>
                    <Icon name="download" className="text-[16px]" />Descargar PDF
                  </button>
                )}

                {d.estado === 'ATENDIDO' && !d.pdf_firmado_path && (
                  <>
                    <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleSubirFirmado} />
                    <button onClick={() => fileRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                      style={{ background: 'rgb(127 29 29 / 0.08)', color: 'var(--color-primary)', border: '1px solid rgb(127 29 29 / 0.2)' }}>
                      <Icon name="upload_file" className="text-[16px]" />Subir acta firmada
                    </button>
                  </>
                )}

                {d.pdf_firmado_path && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: 'rgb(22 163 74 / 0.08)', border: '1px solid rgb(22 163 74 / 0.2)' }}>
                    <Icon name="task_alt" className="text-[16px]" style={{ color: '#16a34a' }} />
                    <span className="text-[10px] font-black" style={{ color: '#16a34a' }}>Acta firmada subida</span>
                  </div>
                )}

                {d.estado === 'EN_PROCESO' && (
                  <>
                    <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                      id={`img-upload-${item.id}`} onChange={handleSubirImagen} />
                    <label htmlFor={`img-upload-${item.id}`}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                      style={{ background: 'rgb(124 58 237 / 0.08)', color: '#7c3aed', border: '1px solid rgb(124 58 237 / 0.2)' }}>
                      <Icon name="add_photo_alternate" className="text-[16px]" />Agregar evidencia
                    </label>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </ModalBody>

      <ModalFooter align="space">
        <button onClick={onClose} className="btn-secondary">Cerrar</button>
        <div className="flex items-center gap-2 flex-wrap">
          {d.estado === 'EN_PROCESO' && (
            <button onClick={() => onEnviar(d)} className="btn-primary flex items-center gap-2">
              <Icon name="send" className="text-[16px]" />Enviar a aprobación
            </button>
          )}
          {d.estado === 'DEVUELTO' && (
            <button onClick={() => onEnviar(d)} className="btn-primary flex items-center gap-2">
              <Icon name="send" className="text-[16px]" />Reenviar
            </button>
          )}
          {d.estado === 'PENDIENTE_APROBACION' && ['SYSADMIN','coordSistema','adminSede'].includes(role) && (
            <>
              <button onClick={() => onDevolver(d)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer"
                style={{ background: 'rgb(180 83 9 / 0.1)', color: '#b45309', border: '1px solid rgb(180 83 9 / 0.25)' }}>
                <Icon name="reply" className="text-[16px]" />Devolver
              </button>
              <button onClick={() => onAprobar(d)} className="btn-primary flex items-center gap-2">
                <Icon name="check_circle" className="text-[16px]" />Aprobar
              </button>
            </>
          )}
          {d.estado === 'EN_ESPERA_CONFORMIDAD' && (
            <button onClick={() => onConformar(d)} className="btn-primary flex items-center gap-2">
              <Icon name="front_hand" className="text-[16px]" />Confirmar conformidad
            </button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}