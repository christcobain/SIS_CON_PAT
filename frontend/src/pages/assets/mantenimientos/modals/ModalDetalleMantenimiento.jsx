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

const BADGE = {
  EN_PROCESO:            { label: 'En proceso',         color: '#1d4ed8', bg: 'rgb(37 99 235 / 0.1)'  },
  PENDIENTE_APROBACION:  { label: 'Pend. aprobación',   color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   },
  APROBADO: { label: 'Aprobado', color: '#7c3aed', bg: 'rgb(124 58 237 / 0.1)' },
  ATENDIDO:              { label: 'Atendido',           color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)'  },
  DEVUELTO:              { label: 'Devuelto',           color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   },
  CANCELADO:             { label: 'Cancelado',          color: '#64748b', bg: 'var(--color-border-light)' },
};

const ROL_LABEL = {
  asistSistema: 'Asist. Sistemas',
  adminSede:    'Admin Sede',
};
const ACCION_CFG = {
  ENVIADO:   { icon: 'check_circle',  color: '#16a34a' },
  REGISTRADO:   { icon: 'check_circle',  color: '#16a34a' },
  APROBADO:   { icon: 'check_circle',  color: '#16a34a' },
  DEVUELTO:   { icon: 'reply',         color: '#b45309' },
  CANCELADO:  { icon: 'cancel',        color: '#dc2626' },
  ATENDIDO: { icon: 'front_hand',    color: '#7c3aed' },
};

const TABS = [
  { id: 'info',      label: 'Información',  icon: 'info'          },
  { id: 'bienes',    label: 'Bienes',       icon: 'inventory_2'   },
  { id: 'imagenes',  label: 'Evidencias',   icon: 'photo_library' },
  { id: 'historial', label: 'Historial',    icon: 'manage_history'},
];

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
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: hecho ? 'var(--color-text-primary)' : 'var(--color-text-faint)' }}>{label}</p>
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
        <InfoRow label="Sede"              value={m.sede_nombre}                    icon="domain"        />
        <InfoRow label="Módulo"            value={m.modulo_nombre}                  icon="grid_view"     />
        <InfoRow label="Propietario"       value={m.usuario_propietario_nombre}     icon="person"        />
        <InfoRow label="Fecha registro"    value={fmtT(m.fecha_registro)}           icon="calendar_today"/>
        <InfoRow label="Fecha inicio"      value={fmtT(m.fecha_inicio_mant)}        icon="play_circle"   />
        <InfoRow label="Fecha término"     value={fmtT(m.fecha_termino_mant)}       icon="stop_circle"   />
        {m.motivo_cancelacion && (
          <InfoRow label="Motivo cancelación" value={m.detalle_cancelacion} icon="block" />
        )}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Flujo de aprobaciones</p>
        <div className="relative pl-3.5" style={{ borderLeft: '2px solid var(--color-border)' }}>
          <FlujoPaso label="Registrado"           nombre={null}                               fecha={m.fecha_registro}                hecho={true} />
          <FlujoPaso label="Aprobado Admin Sede"  nombre={m.aprobado_por_adminsede_nombre}    fecha={m.fecha_aprobacion_adminsede}    hecho={!!m.aprobado_por_adminsede_id} />
          <FlujoPaso label="Confirmado propietario" nombre={m.usuario_propietario_nombre} fecha={m.fecha_pdf_firmado} hecho={m.estado_mantenimiento=='ATENDIDO'} />
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
              <div className=' grid '>
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{d.tipo_bien_nombre}</p>
                <span className="text-[10px] font-mono bg-surface-alt px-1.5 py-0.5 rounded border border-border self-start">Marca: {d.marca_nombre}</span>
                <span className="text-[10px] font-mono bg-surface-alt px-1.5 py-0.5 rounded border border-border self-start">Modelo: {d.modelo}</span>
                <span className="text-[10px] font-mono bg-surface-alt px-1.5 py-0.5 rounded border border-border self-start">Cód. Pat. {d.codigo_patrimonial || 'S/C'}</span>
              </div>
            </div>

            <div className="text-right shrink-0 space-y-1">
              {d.estado_funcionamiento_inicial && (
                <span className="inline-block text-[9px] font-bold bg-surface-alt px-2 py-0.5 rounded-md"
                  style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                  Estado Func. Inicial: {d.estado_funcionamiento_inicial_nombre}
                </span>
              )}
              {d.estado_funcionamiento_final && (                
                <span className="text-[9px] font-black px-2 py-1 rounded bg-surface-alt border border-border uppercase"
                style={{ background: 'rgb(22 163 74 / 0.1)', color: '#16a34a' }}
                >
                Estado Func. Final: {d.estado_funcionamiento_final_nombre || 'Sin estado'}
              </span>
              )}
            </div>

          </div>

          
          {/* Informe en una sola columna: Uno debajo de otro */}
            <td className="p-3">
              <div className="flex flex-col gap-2 max-w-md">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted uppercase tracking-tighter">● Diagnóstico Inicial</p>
                  <p className="text-[11px] leading-snug pl-3 border-l-2 border-border italic text-muted">
                    {d.diagnostico_inicial || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">● Trabajo Realizado</p>
                  <p className="text-[11px] font-bold leading-snug pl-3 border-l-2 border-blue-200">
                    {d.trabajo_realizado || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-green-600 uppercase tracking-tighter">● Diagnóstico Final</p>
                  <p className="text-[11px] font-bold leading-snug pl-3 border-l-2 border-green-200">
                    {d.diagnostico_final || '—'}
                  </p>
                </div>
                {d.observacion_detalle && (
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">● Observaciones</p>
                    <p className="text-[11px] leading-snug pl-3 border-l-2 border-amber-200">
                      {d.observacion_detalle}
                    </p>
                  </div>
                )}
              </div>
            </td>


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
        <div key={img.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
          <img src={img.imagen} alt={img.descripcion || 'Evidencia'}
            className="w-full h-36 object-cover"
            onError={e => { e.currentTarget.src = ''; e.currentTarget.style.display = 'none'; }} />
          {img.descripcion && (
            <p className="text-[10px] px-2 py-1.5 font-semibold" style={{ color: 'var(--color-text-muted)' }}>{img.descripcion}</p>
          )}
          <p className="text-[9px] px-2 pb-1.5" style={{ color: 'var(--color-text-faint)' }}>{fmtT(img.fecha_subida)}</p>
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
          <div key={a.id ?? i} className="flex gap-3">
            <div className="flex flex-col items-center shrink-0">
              <div className="size-8 rounded-full flex items-center justify-center" style={{ background: `${cfg.color}18` }}>
                <Icon name={cfg.icon} className="text-[15px]" style={{ color: cfg.color }} />
              </div>
              {i < aprobaciones.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'var(--color-border)' }} />}
            </div>
            <div className="pb-4 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase" style={{ color: cfg.color }}>{a.accion}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                  {ROL_LABEL[a.rol_aprobador] ?? a.rol_aprobador}
                </span>
              </div>
              <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{fmtT(a.fecha)}</p>
              {a.observacion && <p className="text-[11px] mt-1 italic" style={{ color: 'var(--color-text-body)' }}>{a.observacion}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ModalDetalleMantenimiento({
  open, onClose, item,
  onAprobar, onDevolver, onEnviar, onConformar, onCancelar
}) {
  const [tab,     setTab]     = useState('info');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const { obtener, descargarPDF, subirFirmadoMant, subirImagen } = useMantenimientos();
  const role  = useAuthStore(s => s.role);
  const user  = useAuthStore(u=> u.user.id);
  const toast = useToast();
  const fileImgRef  = useRef();
  const fileFirmRef = useRef();

  useEffect(() => {
    if (!open || !item?.id) return;
    setTab('info'); 
    setData(null);
    setLoading(true);
    obtener(item.id)
      .then(d => setData(d))
      .catch(() => setData(item))
      .finally(() => setLoading(false));
  }, [open, item?.id]);

  if (!item) return null;
  const m       = data ?? item;  
  const estado  = m.estado_mantenimiento ?? m.estado;
  const badge   = BADGE[estado] ?? { label: estado, color: 'var(--color-text-muted)', bg: 'var(--color-border-light)' };
  const detalles = m.detalles ?? m.detalles_mantenimiento ?? [];
  const imagenes  = m.imagenes ?? [];
  const aprobaciones = m.aprobaciones ?? [];
  const totalBienes = m.total_bienes ?? detalles.length;  

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
      const result=await subirFirmadoMant(item.id, archivo);
      toast.success(result?.message ||'Acta firmada subida exitosamente.');
      onClose();
    } catch { 
      toast.error('Error al subir el acta firmada.'); }
  };

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader icon="engineering"
        title={`Mantenimiento ${m.numero_orden || '#' + item.id}`}
        subtitle={`${m.sede_nombre ?? ''} · ${totalBienes} bien(es) · Propietario: ${m.usuario_propietario_nombre ?? '—'}`}
        onClose={onClose} />

      <ModalBody padding={false}>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : (
          <div className="flex" style={{ minHeight: '55vh' }}>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex gap-6 px-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                {TABS.map(({ id, label, icon }) => (
                  <button key={id} onClick={() => setTab(id)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-3 pt-4 transition-all border-b-2"
                    style={{ borderBottomColor: tab === id ? 'var(--color-primary)' : 'transparent', color: tab === id ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    <Icon name={icon} className="text-[16px]" />{label}
                    {id === 'bienes'    && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>{totalBienes}</span>}
                    {id === 'imagenes'  && imagenes.length > 0 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{ background: 'rgb(124 58 237 / 0.1)', color: '#7c3aed' }}>{imagenes.length}</span>}
                    {id === 'historial' && aprobaciones.length > 0 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>{aprobaciones.length}</span>}
                  </button>                  
                ))}
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {tab === 'info'      && <TabInfo       m={m} />}
                {tab === 'bienes'    && <TabBienes     detalles={detalles} />}
                {tab === 'imagenes'  && <TabImagenes   imagenes={imagenes} />}
                {tab === 'historial' && <TabHistorial  aprobaciones={aprobaciones} />}
              </div>
            </div>

            <aside className="w-52 shrink-0 p-4 space-y-3 overflow-y-auto" style={{ borderLeft: '1px solid var(--color-border)' }}>
              <div className="card p-3 text-center space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Estado</p>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl"
                  style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                <p className="font-black text-xs font-mono" style={{ color: 'var(--color-primary)' }}>{m.numero_orden}</p>
              </div>

              <div className="card p-3 space-y-2">
                {[
                  { label: 'Bienes',    value: totalBienes,          icon: 'inventory_2'   },
                  { label: 'Imágenes',  value: imagenes.length,      icon: 'photo_camera'  },
                  { label: 'Acciones',  value: aprobaciones.length,  icon: 'manage_history'},
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
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Documentación</p>
                {estado === 'APROBADO'&& m.pdf_path && m.usuario_realiza_id==user && (
                  <button onClick={handleDescargar}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase cursor-pointer"
                    style={{ background: 'rgb(37 99 235 / 0.08)', color: '#1d4ed8', border: '1px solid rgb(37 99 235 / 0.2)' }}>
                    <Icon name="download" className="text-[15px]" />Descargar PDF
                  </button>
                )}
                {estado === 'APROBADO' && !m.pdf_firmado_path && m.usuario_realiza_id==user &&(
                  <>
                    <input ref={fileFirmRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleSubirFirmado} />
                    <button onClick={() => fileFirmRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase cursor-pointer"
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


                {(estado === 'EN_PROCESO' || estado === 'DEVUELTO') && (
                  <>
                    <input ref={fileImgRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleSubirImagen} />
                    <button onClick={() => fileImgRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase cursor-pointer"
                      style={{ background: 'rgb(124 58 237 / 0.08)', color: '#7c3aed', border: '1px solid rgb(124 58 237 / 0.2)' }}>
                      <Icon name="add_photo_alternate" className="text-[15px]" />Agregar evidencia
                    </button>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </ModalBody>

      <ModalFooter align="right" className="bg-slate-50 dark:bg-slate-900/80">
        <button onClick={onClose} className="px-6 py-2 text-[11px] font-black uppercase tracking-widest text-muted hover:text-body transition-colors">
            Cerrar Ficha
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {(estado === 'EN_PROCESO' || estado === 'DEVUELTO') && (
            <button onClick={() => onEnviar(m)} className="btn-primary flex items-center gap-2">
              <Icon name="send" className="text-[16px]" />
              {estado === 'DEVUELTO' ? 'Reenviar a aprobación' : 'Enviar a aprobación'}
            </button>
          )}
          {estado === 'PENDIENTE_APROBACION' && ['SYSADMIN','coordSistema','adminSede'].includes(role) && (
            <>
              <button onClick={() => onDevolver(m)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
                style={{ background: 'rgb(180 83 9 / 0.1)', color: '#b45309', border: '1px solid rgb(180 83 9 / 0.25)' }}>
                <Icon name="reply" className="text-[16px]" />Devolver
              </button>
              <button onClick={() => onAprobar(m)} className="btn-primary flex items-center gap-2">
                <Icon name="check_circle" className="text-[16px]" />Aprobar
              </button>
            </>
          )}
          {estado === 'EN_ESPERA_CONFORMIDAD' && (
            <button onClick={() => onConformar(m)} className="btn-primary flex items-center gap-2">
              <Icon name="front_hand" className="text-[16px]" />Confirmar conformidad
            </button>
          )}
          {estado !== 'ATENDIDO' && estado !== 'CANCELADO' && ['SYSADMIN','coordSistema','asistSistema'].includes(role) && (
            <button onClick={() => onCancelar(m)}
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