import { useState, useRef } from 'react';
import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import { useAuthStore } from '../../../../store/authStore';
import { useToast }     from '../../../../hooks/useToast';
import { usePermission } from '../../../../hooks/usePermission';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

const BADGE = {
  PENDIENTE_APROBACION:  { label: 'Pendiente aprobación',  color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   },
  EN_ESPERA_CONFORMIDAD: { label: 'Espera conformidad',    color: '#7c3aed', bg: 'rgb(124 58 237 / 0.1)' },
  EN_RETORNO:            { label: 'En retorno',            color: '#c2410c', bg: 'rgb(194 65 12 / 0.1)'  },
  EN_ESPERA_FIRMA:       { label: 'En espera de firma',    color: '#c2410c', bg: 'rgb(194 65 12 / 0.1)'  },
  ATENDIDO:              { label: 'Atendido',              color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)'  },
  DEVUELTO:              { label: 'Devuelto',              color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   },
  CANCELADO:             { label: 'Cancelado',             color: '#64748b', bg: 'var(--color-border-light)' },
};

const TABS = [
  { id: 'ruta',        label: 'Ruta y logística',   icon: 'alt_route'     },
  { id: 'bienes',      label: 'Bienes',              icon: 'inventory_2'   },
  { id: 'aprobaciones',label: 'Flujo aprobaciones',  icon: 'verified_user' },
];
function ActionBtn({ icon, label, onClick, disabled, color, bgColor, borderColor }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: bgColor, color, border: `1px solid ${borderColor}` }}
    >
      {disabled
        ? <span className="btn-loading-spin" style={{ borderColor: `${color}40`, borderTopColor: color }} />
        : <Icon name={icon} className="text-[14px]" />
      }
      {label}
    </button>
  );
}

function Campo({ label, value, icon }) {
  if (!value && value !== 0) return null;
  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
      <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {icon && <Icon name={icon} className="text-[13px]" style={{ color: 'var(--color-text-faint)' }} />}
        {label}
      </p>
      <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
    </div>
  );
}

function FlujoPaso({ label, nombre, fecha, hecho }) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: hecho ? 'rgb(22 163 74 / 0.12)' : 'var(--color-border-light)' }}>
        <Icon name={hecho ? 'check_circle' : 'radio_button_unchecked'} className="text-[16px]"
          style={{ color: hecho ? '#16a34a' : 'var(--color-text-faint)' }} />
      </div>
      <div className="min-w-0 flex-1 pb-4">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: hecho ? 'var(--color-text-primary)' : 'var(--color-text-faint)' }}>{label}</p>
        {hecho && nombre && <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-body)' }}>{nombre}</p>}
        {hecho && fecha && <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{fmtT(fecha)}</p>}
        {!hecho && <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>Pendiente</p>}
      </div>
    </div>
  );
}

function TabRuta({ t }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
          <Icon name="upload" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />Origen
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Sede"         value={t.sede_origen_nombre}       icon="domain"       />
          <Campo label="Módulo"       value={t.modulo_origen_nombre}     icon="grid_view"    />
          <Campo label="Ubicación"    value={t.ubicacion_origen_nombre}  icon="place"        />
          <Campo label="Piso"         value={t.piso_origen ? `Piso ${t.piso_origen}` : null} icon="stairs" />
          <Campo label="Responsable"  value={t.usuario_origen_nombre}    icon="person"       />
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1rem' }}>
        <p className="text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
          <Icon name="download" className="text-[14px]" style={{ color: '#16a34a' }} />Destino
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Campo label="Sede"         value={t.sede_destino_nombre}      icon="domain"       />
          <Campo label="Módulo"       value={t.modulo_destino_nombre}    icon="grid_view"    />
          <Campo label="Ubicación"    value={t.ubicacion_destino_nombre} icon="place"        />
          <Campo label="Piso"         value={t.piso_destino ? `Piso ${t.piso_destino}` : null} icon="stairs" />
          <Campo label="Destinatario" value={t.usuario_destino_nombre}   icon="person_check" />
        </div>
      </div>
      {(t.motivo_transferencia_nombre || t.descripcion) && (
        <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1rem' }}>
          <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>Motivo</p>
          {t.motivo_transferencia_nombre && (
            <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-primary)' }}>{t.motivo_transferencia_nombre}</p>
          )}
          {t.descripcion && (
            <p className="text-sm italic p-3 rounded-xl" style={{ color: 'var(--color-text-body)', background: 'var(--color-surface-alt)', border: '1px dashed var(--color-border)' }}>
              {t.descripcion}
            </p>
          )}
        </div>
      )}
      {(t.motivo_devolucion || t.cancelacion_nombre) && (
        <div className="p-3 rounded-xl" style={{ background: 'rgb(220 38 38 / 0.06)', border: '1px solid rgb(220 38 38 / 0.2)' }}>
          <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#dc2626' }}>
            {t.estado_transferencia === 'CANCELADO' ? 'Motivo de cancelación' : 'Motivo de devolución'}
          </p>
          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-body)' }}>
            {t.cancelacion_nombre || t.motivo_devolucion}
          </p>
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
        <thead><tr>
          <th>Cód. Patrimonial</th><th>Tipo / Categoría</th><th>Marca</th><th>Modelo</th><th>N° Serie</th>
        </tr></thead>
        <tbody>
          {bienes.map(b => (
            <tr key={b.id ?? b.bien_id} className="hover:bg-surface-alt/60">
              <td className="font-mono text-xs font-black" style={{ color: 'var(--color-primary)' }}>{b.codigo_patrimonial}</td>
              <td>
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{b.tipo_bien_nombre}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{b.categoria_bien_nombre ?? '—'}</p>
              </td>
              <td className="text-xs" style={{ color: 'var(--color-text-body)' }}>{b.marca_nombre ?? '—'}</td>
              <td className="text-xs" style={{ color: 'var(--color-text-body)' }}>{b.modelo ?? '—'}</td>
              <td className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>{b.numero_serie ?? 'S/N'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabAprobaciones({ t }) {
  const esTraslado = t.tipo === 'TRASLADO_SEDE';
  const pasos = esTraslado ? [
    { label: 'Registrado por:',             nombre: t.usuario_origen_nombre,                 fecha: t.fecha_registro,                   hecho: true },
    { label: 'Aprobado por:', nombre: t.aprobado_por_adminsede_nombre,         fecha: t.fecha_aprobacion_adminsede,       hecho: !!t.aprobado_por_adminsede_id },
    { label: 'V°B° Salida (Segur.)',    nombre: t.aprobado_segur_salida_nombre,          fecha: t.fecha_aprobacion_segur_salida,    hecho: !!t.aprobado_segur_salida_id },
    { label: 'V°B° Entrada (Segur.)',   nombre: t.aprobado_segur_entrada_nombre,         fecha: t.fecha_aprobacion_segur_entrada,   hecho: !!t.aprobado_segur_entrada_id },
    { label: 'Confirmado por',  nombre: t.confirmado_por_usuario_destino_nombre, fecha: t.fecha_confirmacion_destino,       hecho: !!t.confirmado_por_usuario_destino_id },
  ] : [
    { label: 'Registrado por:',              nombre: t.usuario_origen_nombre,               fecha: t.fecha_registro,                   hecho: true },
    { label: 'Aprobado por', nombre: t.aprobado_por_adminsede_nombre,       fecha: t.fecha_aprobacion_adminsede,       hecho: !!t.aprobado_por_adminsede_id },
  ];

  const historial = t.aprobaciones ?? [];

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Flujo de aprobaciones</p>
        <div className="relative pl-3.5" style={{ borderLeft: '2px solid var(--color-border)' }}>
          {pasos.map((p, i) => <FlujoPaso key={i} {...p} />)}
        </div>
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Historial de acciones</p>
        {historial.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Sin historial registrado.</p>
        ) : (
          <div className="space-y-2">
            {historial.map((h, i) => (
              <div key={h.id ?? i} className="p-3 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span 
                    className="text-[10px] font-black uppercase" 
                    style={{ 
                      color: h.accion === 'RECHAZADO' 
                        ? '#dc2626' 
                        : h.accion === 'DEVUELTO' 
                          ? '#b45309' 
                          : ['APROBADO', 'COMPLETADO', 'ACEPTADO', 'ENTREGADO'].includes(h.accion) 
                            ? '#16a34a' 
                            : 'var(--color-text-muted)' 
                    }}
                  >
                    {h.accion}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                    {h.rol_aprobador}
                  </span>
                </div>
                {h.detalle && <p className="text-[11px] mt-1 italic" style={{ color: 'var(--color-text-body)' }}>{h.detalle}</p>}
                <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-faint)' }}>{fmtT(h.fecha)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniModalMotivo({ open, onClose, onConfirm, loading, titulo, placeholder }) {
  const [motivo, setMotivo] = useState('');
  if (!open) return null;
  const handleConfirm = () => {
    if (motivo.trim().length < 5) return;
    onConfirm(motivo.trim());
    setMotivo('');
  };
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) { onClose(); setMotivo(''); } }}
    >
      <div className="rounded-2xl p-5 w-[400px] space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl flex items-center justify-center" style={{ background: 'rgb(220 38 38 / 0.1)' }}>
              <Icon name="reply" className="text-[16px]" style={{ color: '#dc2626' }} />
            </div>
            <p className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>{titulo}</p>
          </div>
          <button onClick={() => { onClose(); setMotivo(''); }} style={{ color: 'var(--color-text-faint)' }}>
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full text-sm rounded-xl px-3 py-2.5 resize-none"
          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
          onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
          onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
        />
        {motivo.trim().length > 0 && motivo.trim().length < 5 && (
          <p className="text-[10px] text-red-500 font-semibold -mt-2">Mínimo 5 caracteres.</p>
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={() => { onClose(); setMotivo(''); }} className="btn-secondary text-xs">Cancelar</button>
          <button
            onClick={handleConfirm}
            disabled={loading || motivo.trim().length < 5}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: 'rgb(220 38 38 / 0.1)', color: '#dc2626', border: '1px solid rgb(220 38 38 / 0.25)' }}
          >
            {loading && <span className="btn-loading-spin" style={{ borderColor: '#fca5a5', borderTopColor: '#dc2626' }} />}
            <Icon name="reply" className="text-[14px]" />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ModalDetalleTransferencia({
  open, onClose, item, actualizando, acciones, onAccionExitosa
}) {
  const [tab, setTab] = useState('ruta');
  const user = useAuthStore(s => s.user);
  const { can,canAny } = usePermission();
  const toast = useToast();
  const fileRef = useRef();
    const [modalDv, setModalDv] = useState(null);
  if (!item) return null;
  const t          = item;
  const estado     = t.estado_transferencia;
  const esTraslado = t.tipo === 'TRASLADO_SEDE';
  const esAsignacion = t.tipo === 'ASIGNACION_INTERNA';
  const badge      = BADGE[estado] ?? { label: estado, color: 'var(--color-text-muted)', bg: 'var(--color-border-light)' };
  const bienes     = t.bienes ?? [];  
  const puedeAprobarAdmin = can('ms-bienes:transferencias:change_transferencia') && estado === 'PENDIENTE_APROBACION' && !t.aprobado_por_adminsede_id;
  const puedeAprobarSalida = can('ms-bienes:transferencias:add_transferenciaaprobacion') && esTraslado && ['PENDIENTE_APROBACION'].includes(estado)&& !t.aprobado_segur_salida_id && t.aprobado_por_adminsede_id;
  const puedeAprobarEntrada = can('ms-bienes:transferencias:add_transferenciaaprobacion') && esTraslado && ['PENDIENTE_APROBACION'].includes(estado)&& t.aprobado_segur_salida_id && !t.aprobado_segur_entrada_id;
  
  const puedeRetornoSalida = can('ms-bienes:transferencias:add_transferenciaaprobacion') && esTraslado && ['EN_RETORNO'].includes(estado)&& !t.aprobado_retorno_salida_id;
  const puedeRetornoEntrada = can('ms-bienes:transferencias:add_transferenciaaprobacion') && esTraslado && ['EN_RETORNO'].includes(estado)&& t.aprobado_retorno_salida_id;
  const esUsuarioFinal  = canAny('ms-bienes:transferencias:add_transferenciadetalle', 'ms-bienes:transferencias:view_transferencia');
  const mostrarDescargaPDF =(esUsuarioFinal ) && estado === 'EN_ESPERA_FIRMA' ||estado=='ATENDIDO' && (t.pdf_path || t.tiene_pdf_firmado) ;
  const mostrarSubirActa = (esUsuarioFinal ) && estado === 'EN_ESPERA_FIRMA'  && !t.tiene_pdf_firmado; 

  const ejecutar = async (fn, ...args) => {
    try {
      const res = await fn(...args);
      if (res?.success === false) { 
        toast.error(res.error); 
        return; 
      }
      toast.success(res?.message||res?.response?.data?.message||'Operación ejecutada correctamente.');
      onAccionExitosa?.();
      onClose();      
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error en la operación.');
    }
  };

  const handleSubirFirmado = async e => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    try {
      const result = await acciones.subirFirmado?.(t.id, archivo, user?.id);
      toast.success(result?.message || 'Acta firmada subida correctamente.');
      onAccionExitosa?.();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al subir el acta.');
    }
  };

  const handleDescargarPDF = async () => {
    try {
      await acciones.descargarPDFTransf?.(t.id);
    } catch {
      toast.error('Error al descargar el PDF.');
    }
  }; 
  const MODAL_CFG = {
    devolver: { titulo: 'Devolver al registrador', placeholder: 'Describe el motivo de la devolución...' },
    rechazar_salida: { titulo: 'Rechazar salida física', placeholder: 'Describe el motivo del rechazo de salida...' },
    rechazar_entrada: { titulo: 'Rechazar entrada — retorno', placeholder: 'Describe el motivo del rechazo de entrada...' },
  };

  return (
    <>  
    {modalDv && MODAL_CFG[modalDv] && (
                    <MiniModalMotivo
                      open={!!modalDv}
                      onClose={() => setModalDv(null)}
                      loading={actualizando}
                      titulo={MODAL_CFG[modalDv].titulo}
                      placeholder={MODAL_CFG[modalDv].placeholder}
                      onConfirm={(m) => {
                        const fn = modalDv === 'devolver' ? acciones.devolver : modalDv === 'rechazar_salida' ? acciones.rechazarSalidaSeguridad : acciones.rechazarEntradaSeguridad;
                        setModalDv(null);
                        ejecutar(fn, t.id, { motivo_devolucion: m });
                      }}
                    />
                  )}
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader
        icon={esTraslado ? 'local_shipping' : 'person_add'}
        title={`${esTraslado ? 'Traslado' : 'Asignación'} ${t.numero_orden}`}
        subtitle={`${t.sede_origen_nombre ?? ''} → ${t.sede_destino_nombre ?? ''} · ${bienes.length} bien(es)`}
        onClose={onClose}
      />

      <ModalBody padding={false}>
        <div className="flex" style={{ minHeight: '55vh' }}>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex gap-6 px-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              {TABS.map(tb => (
                <button key={tb.id} onClick={() => setTab(tb.id)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-3 pt-4 transition-all border-b-2"
                  style={{ borderBottomColor: tab === tb.id ? 'var(--color-primary)' : 'transparent', color: tab === tb.id ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                  <Icon name={tb.icon} className="text-[16px]" />{tb.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {tab === 'ruta'         && <TabRuta         t={t} />}
              {tab === 'bienes'       && <TabBienes       bienes={bienes} />}
              {tab === 'aprobaciones' && <TabAprobaciones t={t} />}
            </div>
          </div>

          {/* ── Panel lateral derecho ── */}
          <aside className="w-56 shrink-0 p-4 space-y-3 overflow-y-auto" style={{ borderLeft: '1px solid var(--color-border)' }}>
            <div className="card p-3 text-center space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Estado</p>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl"
                style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
              <p className="text-[9px] font-black font-mono" style={{ color: 'var(--color-primary)' }}>{t.numero_orden}</p>
            </div>

            <div className="card p-3 space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Resumen</p>
              {[
                { label: 'Tipo',     value: esTraslado ? 'Traslado' : 'Asignación', icon: 'sync_alt'       },
                { label: 'Bienes',   value: bienes.length,                           icon: 'inventory_2'    },
                { label: 'Registro', value: t.fecha_registro ? fmtT(t.fecha_registro) : '—', icon: 'calendar_today' },
                { label: 'Aprobado', value: t.aprobado_por_adminsede_nombre ?? '—',  icon: 'verified'       },
              ].map(s => (
                <div key={s.label} className="flex items-start gap-1.5">
                  <Icon name={s.icon} className="text-[13px] mt-0.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                    <p className="text-[11px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Documentación ── */}
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Documentación</p>

              {/* Descargar PDF — visible cuando estado es EN_ESPERA_FIRMA */}
              {mostrarDescargaPDF && (
                <button
                  onClick={handleDescargarPDF}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                  style={{ background: 'rgb(37 99 235 / 0.08)', color: '#1d4ed8', border: '1px solid rgb(37 99 235 / 0.2)' }}>
                  <Icon name="picture_as_pdf" className="text-[16px]" />Descargar PDF
                </button>
              )}

              {/* Subir acta firmada — visible cuando estado es EN_ESPERA_FIRMA y es traslado y no tiene firma */}
              {mostrarSubirActa && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleSubirFirmado}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                    style={{ background: 'rgb(127 29 29 / 0.08)', color: 'var(--color-primary)', border: '1px solid rgb(127 29 29 / 0.2)' }}>
                    <Icon name="upload_file" className="text-[16px]" />Subir acta firmada
                  </button>
                </>
              )}

              {/* Confirmación de acta firmada subida */}
              {(t.tiene_pdf_firmado || estado === 'ATENDIDO') && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl"
                  style={{ background: 'rgb(22 163 74 / 0.08)', border: '1px solid rgb(22 163 74 / 0.2)' }}>
                  <Icon name="task_alt" className="text-[15px]" style={{ color: '#16a34a' }} />
                  <p className="text-[10px] font-black" style={{ color: '#16a34a' }}>Acta firmada y subida</p>
                </div>
              )}
            </div>

            {t.fecha_pdf && (
              <p className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>PDF generado: {fmtT(t.fecha_pdf)}</p>
            )}
          </aside>
        </div>
      </ModalBody>

      <ModalFooter align="space">        
        <button onClick={onClose} className="btn-secondary">Cerrar</button>
        <div className="flex items-center gap-2 flex-wrap">
            { puedeAprobarAdmin  && (
            <>
            <ActionBtn 
            icon="reply" label="Devolver" 
            color="#dc2626" bgColor="rgb(220 38 38 / 0.06)" borderColor="rgb(220 38 38 / 0.25)" 
            disabled={actualizando} onClick={() =>setModalDv('devolver')} />
            <ActionBtn 
            icon="check_circle" label={esTraslado ? 'Aprobar Traslado' : 'Aprobar Asignación'} 
            color="#16a34a" bgColor="rgb(22 163 74 / 0.08)" borderColor="rgb(22 163 74 / 0.3)" 
            disabled={actualizando} onClick={() => ejecutar(acciones.aprobarAdminsede, t.id)} />
            </>
          )}

            {puedeAprobarSalida && (     
              <>            
              <ActionBtn 
              icon="block" label="Rechazar Salida" color="#dc2626" bgColor="rgb(220 38 38 / 0.06)" 
              borderColor="rgb(220 38 38 / 0.25)" disabled={actualizando} onClick={() =>  setModalDv('rechazar_salida')} />
              <ActionBtn 
              icon="output" label="V°B° Salida Sede" color="#7c3aed" bgColor="rgb(124 58 237 / 0.08)" 
              borderColor="rgb(124 58 237 / 0.3)" disabled={actualizando} 
              onClick={() => ejecutar(acciones.aprobarSalidaSeguridad, t.id)} />
            </>
              )}
              {puedeAprobarEntrada && (
              <>            
              <ActionBtn 
              icon="block" label="Rechazar Salida" color="#dc2626" bgColor="rgb(220 38 38 / 0.06)" 
              borderColor="rgb(220 38 38 / 0.25)" disabled={actualizando} onClick={() => setModalDv('rechazar_entrada')} />
              <ActionBtn 
              icon="output" label="V°B° Salida Sede" color="#7c3aed" bgColor="rgb(124 58 237 / 0.08)" 
              borderColor="rgb(124 58 237 / 0.3)" disabled={actualizando} onClick={() => ejecutar(acciones.aprobarEntradaSeguridad, t.id)} />
            </>      
          )}
          {puedeRetornoSalida &&   
            <ActionBtn 
                icon="undo" label="Confirmar Retorno Salida" 
                color="#b45309" bgColor="rgb(180 83 9 / 0.08)" borderColor="rgb(180 83 9 / 0.3)" disabled={actualizando} 
                onClick={() => ejecutar(acciones.retornoSalida, t.id)} />       
                }
              {puedeRetornoEntrada && t.aprobado_retorno_salida_id &&
                <ActionBtn 
                  icon="home" label="Confirmar Retorno Entrada" 
                  color="#16a34a" bgColor="rgb(22 163 74 / 0.08)" borderColor="rgb(22 163 74 / 0.3)" disabled={actualizando} 
                  onClick={() => ejecutar(acciones.retornoEntrada,  t.id)} />         
                  }
                  
        </div>
      </ModalFooter>
    </Modal>
    </>
  );
}