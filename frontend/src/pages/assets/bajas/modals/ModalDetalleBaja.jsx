import { useState, useEffect, useRef } from 'react';
import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import Can         from '../../../../components/auth/Can';
import { useToast } from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const fmtT = (iso) =>
  !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

const BADGE_BAJA = {
  PENDIENTE_APROBACION: { label: 'Pendiente aprobación',  color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   },
  ATENDIDO:             { label: 'Baja Definitiva',        color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)'  },
  DEVUELTO:             { label: 'Devuelto p/ Corrección', color: '#e11d48', bg: 'rgb(225 29 72 / 0.1)'  },
  CANCELADO:            { label: 'Cancelado',              color: '#64748b', bg: 'rgb(100 116 139 / 0.1)' },
};

const ICONO_ACCION = {
  REGISTRADO: { icon: 'add_circle',        color: '#64748b' },
  ENVIADO:    { icon: 'send',              color: '#1d4ed8' },
  APROBADO:   { icon: 'verified',          color: '#16a34a' },
  ATENDIDO:   { icon: 'check_circle',      color: '#16a34a' },
  DEVUELTO:   { icon: 'assignment_return', color: '#b45309' },
  CANCELADO:  { icon: 'cancel',            color: '#e11d48' },
};

const TABS = [
  { id: 'detalle',   label: 'Informe y Bienes',      icon: 'description'  },
  { id: 'tecnico',   label: 'Diagnósticos Técnicos',  icon: 'build_circle' },
  { id: 'historial', label: 'Historial',               icon: 'manage_history' },
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
      <div className="min-w-0 flex-1 pb-4">
        <p className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: hecho ? 'var(--color-text-primary)' : 'var(--color-text-faint)' }}>{label}</p>
        {hecho && nombre && <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-body)' }}>{nombre}</p>}
        {hecho && fecha  && <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{fmtT(fecha)}</p>}
        {!hecho && <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>Pendiente</p>}
      </div>
    </div>
  );
}

function SeccionNarrativa({ label, valor }) {
  if (!valor) return null;
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-body)' }}>{valor}</p>
    </div>
  );
}

export default function ModalDetalleBaja({open, onClose, item, acciones, onGestionar, 
  onUser,
}) {
  const toast       = useToast();
  const [tab,     setTab]     = useState('detalle');
  const [busy,      setBusy]      = useState(false);
  const [baja,    setBaja]    = useState(null);
  const [loading, setLoading] = useState(false);
  const fileFirmRef = useRef();

  useEffect(() => {
    if (!open || !item?.id) return;
    setTab('detalle');
    setBaja(null);
    setLoading(true);
    // acciones.obtenerBaja(item.id)
    //   .then((data) => setBaja(data))
    //   .catch(() => { toast.error('No se pudo cargar el detalle de la baja.'); setBaja(item); })
    //   .finally(() => setLoading(false));
  }, [open, item?.id]); 

  if (!item) return null;

  const b     = baja ?? item;
  const badge = BADGE_BAJA[b.estado_baja] || BADGE_BAJA.PENDIENTE_APROBACION;

  const estado      = b.estado_baja ;
  const esAprobado      = b.aprobado_por_coordsistema_id !== null;
  const tienePdfBase    = !!b.pdf_path;
  const tienePdfFirmado = !!b.pdf_firmado_path && !!b.fecha_pdf_firmado;
  const esElaborador    = onUser === b.usuario_elabora_id&&'ms-bienes:bajas:add_baja' ;
  const eAprobador  = onUser === b.usuario_destino_id &&'ms-bienes:bajas:add_bajaaprobacion';

  const puedeAprobar       = estado=='PENDIENTE_APROBACION' && !esAprobado && eAprobador;
  const puedeDescargar = tienePdfBase  && esElaborador && (estado === 'APROBADO' || estado === 'ATENDIDO');
  const puedeSubirFirmado      = estado=='APROBADO' && esAprobado && tienePdfBase && !tienePdfFirmado && esElaborador;


  const ejecutar = async (fn, ...args) => {
    if (!fn) return;
    setBusy(true);
    try {
      const res = await fn(...args);
      toast.success(res?.message||res?.response?.message||res?.response?.data?.message||'Accion realizada con exito');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al procesar la acción.');
    } finally {
      setBusy(false);
    }
  };

  const hayDiagnosticos = b.detalles?.some(
    (d) => d.diagnostico_inicial || d.trabajo_realizado || d.diagnostico_final || d.observacion_tecnica
  );

  const handleDescargar = () => ejecutar(acciones.descargarPDFBaja, item.id);
 

  const handleSubirFirmado = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const formData = new FormData();
    formData.append('archivo', archivo);
    try {
      const result = await acciones.pdfFirmadoBaja(item.id, formData);
      toast.success(result?.message || 'Acta firmada subida exitosamente.');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al subir el acta firmada.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader
        title={`Informe de Baja — ${b.numero_informe}`}
        subtitle={`${b.sede_elabora_nombre ?? ''} · ${b.total_bienes ?? b.detalles?.length ?? 0} bien(es)`}
        icon="delete_sweep"
        onClose={onClose}
      />

      <ModalBody padding={false}>
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-10 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <div className="skeleton h-32 rounded-xl" />
              <div className="skeleton h-32 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="flex" style={{ minHeight: '55vh' }}>
            <div className="flex-1 min-w-0 flex flex-col">

              {/* ── Tabs ── */}
              <div className="flex gap-6 px-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                {TABS.map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-3 pt-4 transition-all border-b-2"
                    style={{
                      borderBottomColor: tab === t.id ? 'var(--color-primary)' : 'transparent',
                      color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}>
                    <Icon name={t.icon} className="text-[16px]" />
                    {t.label}
                    {t.id === 'detalle' && (b.detalles?.length > 0) && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
                        style={{ background: 'rgb(127 29 29 / 0.1)', color: 'var(--color-primary)' }}>
                        {b.detalles.length}
                      </span>
                    )}
                    {t.id === 'historial' && (b.aprobaciones?.length > 0) && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
                        style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                        {b.aprobaciones.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Contenido tab ── */}
              <div className="flex-1 overflow-y-auto p-6 min-w-0">

                {tab === 'detalle' && (
                  <div className="space-y-6 animate-in fade-in duration-300">

                    {/* Cabecera del informe */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InfoRow label="A (Destinatario)" value={`${b.nombre_destino || '—'}${b.cargo_destino ? ` · ${b.cargo_destino}` : ''}`} icon="person_check" />
                      <InfoRow label="De (Elaborador)"  value={`${b.nombre_elabora || '—'}${b.cargo_elabora ? ` · ${b.cargo_elabora}` : ''}`} icon="person" />
                      <InfoRow label="Sede / Módulo"    value={`${b.sede_elabora_nombre || '—'}${b.modulo_elabora_nombre ? ` / ${b.modulo_elabora_nombre}` : ''}`} icon="domain" />
                      <InfoRow label="Fecha registro"   value={fmtT(b.fecha_registro)} icon="calendar_today" />
                    </div>

                    {b.estado_baja === 'DEVUELTO' && b.motivo_devolucion && (
                      <div className="p-3 rounded-xl"
                        style={{ background: 'rgb(180 83 9 / 0.06)', border: '1px solid rgb(180 83 9 / 0.2)' }}>
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#b45309' }}>
                          Motivo de devolución
                        </p>
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-body)' }}>{b.motivo_devolucion}</p>
                      </div>
                    )}

                    {b.estado_baja === 'ATENDIDO' && b.nombre_coordsistema && (
                      <div className="p-3 rounded-xl"
                        style={{ background: 'rgb(22 163 74 / 0.06)', border: '1px solid rgb(22 163 74 / 0.2)' }}>
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#16a34a' }}>
                          Aprobado por
                        </p>
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-body)' }}>
                          {b.nombre_coordsistema}{b.cargo_coordsistema ? ` · ${b.cargo_coordsistema}` : ''}
                        </p>
                      </div>
                    )}

                    {/* Secciones narrativas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SeccionNarrativa label="Antecedentes"    valor={b.antecedentes}    />
                      <SeccionNarrativa label="Análisis"        valor={b.analisis}        />
                      <SeccionNarrativa label="Conclusiones"    valor={b.conclusiones}    />
                      <SeccionNarrativa label="Recomendaciones" valor={b.recomendaciones} />
                    </div>

                    {/* Bienes */}
                    {b.detalles?.length > 0 && (
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest mb-3"
                          style={{ color: 'var(--color-text-muted)' }}>Bienes incluidos en la baja</p>
                        <div className="space-y-3">
                          {b.detalles.map((det, idx) => (
                            <div key={det.id} className="rounded-2xl overflow-hidden"
                              style={{ border: '1px solid var(--color-border)' }}>
                              <div className="flex items-center gap-3 px-4 py-3"
                                style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
                                <span className="size-6 flex items-center justify-center rounded-full text-white text-[10px] font-black shrink-0"
                                  style={{ background: 'var(--color-primary)' }}>{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black uppercase" style={{ color: 'var(--color-text-primary)' }}>
                                    {det.tipo_bien_nombre}
                                  </p>
                                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                    <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                                      Cód: <strong style={{ color: 'var(--color-primary)' }}>{det.codigo_patrimonial || 'S/C'}</strong>
                                    </span>
                                    <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                                      {det.marca_nombre} — {det.modelo}
                                    </span>
                                    <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                                      S/N: {det.numero_serie}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-md"
                                    style={{ color: '#dc2626', background: 'rgb(220 38 38 / 0.1)' }}>
                                    {det.estado_funcionamiento}
                                  </span>
                                  {det.motivo_baja_nombre && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                                      style={{ background: 'var(--color-border-light)', color: 'var(--color-text-body)', border: '1px solid var(--color-border)' }}>
                                      {det.motivo_baja_nombre}
                                    </span>
                                  )}
                                  {det.mantenimiento_numero && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                                      style={{ background: 'rgb(37 99 235 / 0.08)', color: '#1d4ed8', border: '1px solid rgb(37 99 235 / 0.2)' }}>
                                      MNT {det.mantenimiento_numero}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'tecnico' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {hayDiagnosticos ? b.detalles?.map((det, idx) => (
                      <div key={det.id} className="rounded-xl overflow-hidden"
                        style={{ border: '1px solid var(--color-border)' }}>
                        <div className="flex items-center gap-3 px-4 py-3"
                          style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
                          <span className="size-6 flex items-center justify-center rounded-full text-white text-[10px] font-black shrink-0"
                            style={{ background: 'var(--color-primary)' }}>{idx + 1}</span>
                          <p className="text-xs font-black" style={{ color: 'var(--color-text-primary)' }}>
                            {det.tipo_bien_nombre} {det.marca_nombre} —
                            <span className="font-mono ml-1" style={{ color: 'var(--color-primary)' }}>{det.codigo_patrimonial}</span>
                          </p>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { label: 'Diagnóstico Inicial', valor: det.diagnostico_inicial  },
                            { label: 'Trabajo Realizado',   valor: det.trabajo_realizado    },
                            { label: 'Diagnóstico Final',   valor: det.diagnostico_final    },
                            { label: 'Observación Técnica', valor: det.observacion_tecnica  },
                          ].map(({ label, valor }) => valor ? (
                            <div key={label}>
                              <p className="text-[9px] font-black uppercase tracking-widest mb-0.5"
                                style={{ color: 'var(--color-text-faint)' }}>{label}</p>
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-body)' }}>{valor}</p>
                            </div>
                          ) : null)}
                        </div>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed"
                        style={{ borderColor: 'var(--color-border)' }}>
                        <Icon name="build_circle" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
                        <p className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                          No hay diagnósticos técnicos registrados.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'historial' && (
                  <div className="space-y-0 animate-in fade-in duration-300">
                    {!b.aprobaciones?.length ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Icon name="manage_history" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
                        <p className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>No hay registros de tramitación.</p>
                      </div>
                    ) : (
                      <div className="relative pl-3.5" style={{ borderLeft: '2px solid var(--color-border)' }}>
                        {b.aprobaciones.map((aprob) => {
                          const meta    = ICONO_ACCION[aprob.accion] || ICONO_ACCION.REGISTRADO;
                          // const esUlitmo = idx === b.aprobaciones.length - 1;
                          return (
                            <div key={aprob.id} className="flex items-start gap-3 pb-4">
                              <div className="size-7 rounded-full flex items-center justify-center shrink-0 -ml-3.5"
                                style={{ background: 'var(--color-surface)', border: `2px solid ${meta.color}` }}>
                                <Icon name={meta.icon} className="text-[14px]" style={{ color: meta.color }} />
                              </div>
                              <div className="flex-1 min-w-0 p-3 rounded-xl"
                                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                                <div className="flex justify-between items-baseline gap-2 mb-1">
                                  <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: meta.color }}>
                                    {aprob.accion}
                                  </p>
                                  <p className="text-[9px] font-mono shrink-0" style={{ color: 'var(--color-text-faint)' }}>
                                    {fmtT(aprob.fecha)}
                                  </p>
                                </div>
                                <p className="text-[11px]" style={{ color: 'var(--color-text-body)' }}>
                                  Usuario #{aprob.usuario_id}
                                  <span className="ml-1" style={{ color: 'var(--color-text-muted)' }}>({aprob.rol_aprobador})</span>
                                </p>
                                {aprob.observacion && (
                                  <p className="text-[11px] italic mt-1.5 p-2 rounded-lg"
                                    style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-alt)', border: '1px dashed var(--color-border)' }}>
                                    {aprob.observacion}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Panel lateral ── */}
            <aside className="w-52 shrink-0 p-4 space-y-3 overflow-y-auto border-l"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}>

              <div className="card p-3 text-center space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Estado</p>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl"
                  style={{ background: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>
                <p className="font-black text-xs font-mono" style={{ color: 'var(--color-primary)' }}>{b.numero_informe}</p>
              </div>

              <div className="card p-3 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Resumen</p>
                {[
                  { label: 'Bienes',    value: b.total_bienes ?? b.detalles?.length ?? 0, icon: 'inventory_2'    },
                  { label: 'Registro',  value: fmtT(b.fecha_registro),                    icon: 'calendar_today' },
                  { label: 'Aprobado',  value: b.nombre_coordsistema ?? '—',               icon: 'verified'       },
                  { label: 'Acciones',  value: b.aprobaciones?.length ?? 0,                icon: 'manage_history' },
                ].map((s) => (
                  <div key={s.label} className="flex items-start gap-1.5">
                    <Icon name={s.icon} className="text-[13px] mt-0.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} />
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                      <p className="text-[11px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
                    {/* Documentación */}
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Documentación</p>

                {estado=='ATENDIDO' && esAprobado && b.fecha_doc && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: 'rgb(37 99 235 / 0.08)', border: '1px solid rgb(37 99 235 / 0.2)' }}>
                    <Icon name="description" className="text-[14px]" style={{ color: '#1d4ed8' }} />
                    <div className="min-w-0">
                      <p className="text-[9px] font-black" style={{ color: '#1d4ed8' }}>Doc. generado</p>
                      <p className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>{fmtT(b.fecha_doc)}</p>
                    </div>
                  </div>
                )}

                {puedeDescargar && !loading && (
                  <button onClick={handleDescargar} disabled={busy}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                    style={{ background: 'rgb(37 99 235 / 0.08)', color: '#1d4ed8', border: '1px solid rgb(37 99 235 / 0.2)' }}>
                    <Icon name="picture_as_pdf" className="text-[15px]" />Descargar PDF
                  </button>
                )}

                {puedeSubirFirmado && !loading && (
                  <>
                    <input ref={fileFirmRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                      onChange={handleSubirFirmado} />
                    <button type="button" onClick={() => fileFirmRef.current?.click()} disabled={busy}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                      style={{ background: 'rgb(127 29 29 / 0.08)', color: 'var(--color-primary)', border: '1px solid rgb(127 29 29 / 0.2)' }}>
                      <Icon name="upload_file" className="text-[15px]" />Subir acta firmada
                    </button>
                  </>
                )}

                {tienePdfFirmado && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: 'rgb(22 163 74 / 0.08)', border: '1px solid rgb(22 163 74 / 0.2)' }}>
                    <Icon name="task_alt" className="text-[14px]" style={{ color: '#16a34a' }} />
                    <p className="text-[10px] font-black" style={{ color: '#16a34a' }}>Acta firmada y archivada</p>
                  </div>
                )}
                {b.fecha_pdf && (
                <p className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
                  PDF: {fmtT(b.fecha_pdf)}
                </p>
              )}
              </div>
            </aside>
          </div>
        )}
      </ModalBody>

      <ModalFooter align="space" className="bg-slate-50 dark:bg-slate-900/80">
        <button onClick={onClose}
          className="px-6 py-2 text-[11px] font-black uppercase tracking-widest transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-body)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}>
          Cerrar Ficha
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          {b.estado_baja === 'DEVUELTO' && puedeDescargar && !loading && (
            <button onClick={() => onGestionar(b, 'reenviar')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all"
              style={{ background: 'rgb(37 99 235 / 0.08)', color: '#1d4ed8', border: '1px solid rgb(37 99 235 / 0.2)' }}>
              <Icon name="send" className="text-[16px]" /> Reenviar
            </button>
          )}

          {puedeAprobar&& !loading && (
            <>
              <button onClick={() => onGestionar(b, 'devolver')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
                style={{ background: 'rgb(180 83 9 / 0.1)', color: '#b45309', border: '1px solid rgb(180 83 9 / 0.25)' }}>
                <Icon name="assignment_return" className="text-[16px]" /> Devolver
              </button>
              <button onClick={() => onGestionar(b, 'aprobar')} className="btn-primary flex items-center gap-2">
                <Icon name="check_circle" className="text-[16px]" /> Aprobar Baja
              </button>
            </>
          )}


        </div>
      </ModalFooter>
    </Modal>
  );
}