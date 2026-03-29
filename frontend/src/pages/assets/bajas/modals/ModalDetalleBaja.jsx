import { useState, useEffect, useRef } from 'react';
import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import Can         from '../../../../components/auth/Can';
import { useBajas } from '../../../../hooks/useBajas';
import { useToast } from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const fmtT = (iso) =>
  !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

const BADGE_BAJA = {
  PENDIENTE_APROBACION: { label: 'Pendiente aprobación',  color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'    },
  ATENDIDO:             { label: 'Baja Definitiva',        color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)'   },
  DEVUELTO:             { label: 'Devuelto p/ Corrección', color: '#e11d48', bg: 'rgb(225 29 72 / 0.1)'   },
  CANCELADO:            { label: 'Cancelado',              color: '#64748b', bg: 'rgb(100 116 139 / 0.1)'  },
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
  { id: 'detalle',   label: 'Informe y Bienes',     icon: 'description'  },
  { id: 'tecnico',   label: 'Diagnósticos Técnicos', icon: 'build_circle' },
  { id: 'historial', label: 'Historial',              icon: 'history'      },
];

function SeccionNarrativa({ label, valor }) {
  if (!valor) return null;
  return (
    <div>
      <p className="text-[10px] font-black text-faint uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs text-body leading-relaxed whitespace-pre-wrap">{valor}</p>
    </div>
  );
}

function SkeletonBaja() {
  return (
    <div className="space-y-4 p-2">
      <div className="skeleton h-24 rounded-2xl" />
      <div className="skeleton h-10 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    </div>
  );
}

function PanelDocumento({ b }) {
  const esAtendido      = b.estado_baja === 'ATENDIDO';
  const yaAprobado      = !!b.aprobado_por_coordsistema_id;
  const tienePdfFirmado = !!b.pdf_firmado_path;

  if (!esAtendido || !yaAprobado) return null;

  return (
    <div className="p-3 rounded-xl border border-border/60 bg-surface-alt/30 text-[11px] space-y-1.5">
      <p className="font-black text-faint uppercase tracking-widest text-[10px] mb-2">Estado del documento</p>
      <div className="flex items-center gap-2 text-body">
        <Icon name="description" className="text-[15px] text-blue-500" />
        <span>Doc. generado: <span className="font-bold">{fmtT(b.fecha_doc)}</span></span>
        <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-bold uppercase">Sin firma</span>
      </div>
      {tienePdfFirmado ? (
        <div className="flex items-center gap-2 text-body">
          <Icon name="verified" className="text-[15px] text-emerald-600" />
          <span>Doc. firmado: <span className="font-bold">{fmtT(b.fecha_pdf_firmado)}</span></span>
          <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold uppercase">Firmado</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-muted italic">
          <Icon name="pending" className="text-[15px] text-amber-500" />
          <span>Pendiente de firma física por el asistente de informática</span>
        </div>
      )}
    </div>
  );
}

export default function ModalDetalleBaja({
  open, onClose, item, onGestionar, onCancelar,
  puedeAccionesRegistrador, puedeAccionesAprobador, onUser, onDescargarPDF, pdfFirmado,
}) {
  const { obtener } = useBajas();
  const toast       = useToast();
  const [tabActiva, setTabActiva] = useState('detalle');
  const [baja,    setBaja]    = useState(null);
  const [loading, setLoading] = useState(false);
  const fileFirmRef = useRef();

  useEffect(() => {
    if (!open || !item?.id) return;
    setTabActiva('detalle');
    setBaja(null);
    setLoading(true);
    obtener(item.id)
      .then((data) => setBaja(data))
      .catch(() => { toast.error('No se pudo cargar el detalle de la baja.'); setBaja(item); })
      .finally(() => setLoading(false));
  }, [open, item?.id]);

  if (!item) return null;

  const b = baja ?? item;
  const badge = BADGE_BAJA[b.estado_baja] || BADGE_BAJA.PENDIENTE_APROBACION;
  const esAtendido      = b.estado_baja === 'ATENDIDO';
  const yaAprobado      = !!b.aprobado_por_coordsistema_id;
  const tienePdfBase    = !!b.pdf_path;
  const tienePdfFirmado = !!(b.pdf_firmado_path && b.fecha_pdf_firmado);
  const esElaborador    = onUser === b.usuario_elabora_id;
  const esDestinatario  = onUser === b.usuario_destino_id;
  const puedeDescargarSinFirma = esAtendido && yaAprobado && tienePdfBase && !tienePdfFirmado && esElaborador;
  const puedeSubirFirmado      = esAtendido && yaAprobado && tienePdfBase && !tienePdfFirmado && esElaborador;
  const puedeDescargarFirmado  = esAtendido && tienePdfFirmado;

  const hayDiagnosticos = b.detalles?.some(
    (d) => d.diagnostico_inicial || d.trabajo_realizado || d.diagnostico_final || d.observacion_tecnica
  );

  const handleDescargarSinFirma = async () => {
    try { 
      await onDescargarPDF(item.id, false);
    } catch(e) {       
      toast.error(e?.response?.data?.error || e?.error || 'No se pudo descargar el PDF.'); 
    }
  };

  const handleDescargarFirmado = async () => {
    try { 
      await onDescargarPDF(b.id, true, `FIRMADO_${b.numero_informe}.pdf`); 
    } catch(e) { 
      toast.error(e?.response?.data?.error || e?.error || 'No se pudo descargar el PDF firmado.'); 
    }
  };

  const handleSubirFirmado = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const formData = new FormData();
    formData.append('archivo', archivo);
    try {
      const result = await pdfFirmado(item.id, formData);
      toast.success(result?.message || 'Acta firmada subida exitosamente.');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al subir el acta firmada.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader title="Detalle de Informe de Baja Técnica" icon="visibility" onClose={onClose} />

      <ModalBody>
        {loading ? (
          <SkeletonBaja />
        ) : (
          <div className="space-y-5">

            {/* ── Cabecera ── */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-surface-alt/50 border border-border">
              <div className="min-w-0">
                <p className="text-xl font-black text-primary">{b.numero_informe}</p>
                <div className="mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5 text-[11px]">
                  <p className="text-muted">
                    <span className="font-black text-body">A: </span>
                    {b.nombre_destino || '—'}{b.cargo_destino ? ` · ${b.cargo_destino}` : ''}
                  </p>
                  <p className="text-muted">
                    <span className="font-black text-body">De: </span>
                    {b.nombre_elabora || '—'}{b.cargo_elabora ? ` · ${b.cargo_elabora}` : ''}
                  </p>
                  <p className="text-muted">
                    <span className="font-black text-body">Sede: </span>
                    {b.sede_elabora_nombre || '—'}
                    {b.modulo_elabora_nombre ? ` / ${b.modulo_elabora_nombre}` : ''}
                  </p>
                  <p className="text-muted">
                    <span className="font-black text-body">Bienes: </span>
                    {b.total_bienes ?? b.detalles?.length ?? 0} bien(es)
                  </p>
                  {b.estado_baja === 'DEVUELTO' && b.motivo_devolucion && (
                    <p className="text-amber-700 col-span-2">
                      <span className="font-black">Motivo devolución: </span>{b.motivo_devolucion}
                    </p>
                  )}
                  {b.estado_baja === 'ATENDIDO' && b.nombre_coordsistema && (
                    <p className="text-emerald-700 col-span-2">
                      <span className="font-black">Aprobado por: </span>
                      {b.nombre_coordsistema}{b.cargo_coordsistema ? ` · ${b.cargo_coordsistema}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span
                  className="inline-flex items-center text-[11px] font-black uppercase px-3 py-1.5 rounded-full"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {badge.label}
                </span>
                <p className="text-[10px] text-faint font-mono">Registrado: {fmtT(b.fecha_registro)}</p>
              </div>
            </div>

            {/* ── Panel estado documento ── */}
            <PanelDocumento b={b} />

            {/* ── Tabs ── */}
            <div className="flex gap-1 p-1 rounded-xl bg-surface-alt/50 border border-border">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTabActiva(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                    tabActiva === t.id
                      ? 'bg-surface shadow-sm text-primary border border-border/60'
                      : 'text-muted hover:text-body'
                  }`}
                >
                  <Icon name={t.icon} className="text-[14px]" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Tab: Informe y Bienes ── */}
            {tabActiva === 'detalle' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <SeccionNarrativa label="Antecedentes"    valor={b.antecedentes}    />
                  <SeccionNarrativa label="Análisis"        valor={b.analisis}        />
                  <SeccionNarrativa label="Conclusiones"    valor={b.conclusiones}    />
                  <SeccionNarrativa label="Recomendaciones" valor={b.recomendaciones} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-faint uppercase tracking-widest mb-2">
                    Bienes incluidos en la baja
                  </p>
                  {b.detalles?.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-border/60">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-surface-alt/50 border-b border-border">
                            {['#', 'Tipo / Marca', 'Código Patrimonial', 'N° Serie', 'Estado Func.', 'Mant.', 'Motivo Baja'].map((h) => (
                              <th key={h} className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-faint text-left">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {b.detalles.map((det, idx) => (
                            <tr key={det.id} className="hover:bg-surface-alt/20 transition-colors">
                              <td className="px-3 py-2.5 text-faint font-mono">{idx + 1}</td>
                              <td className="px-3 py-2.5">
                                <p className="font-bold text-body">{det.tipo_bien_nombre}</p>
                                <p className="text-[10px] text-muted">{det.marca_nombre} {det.modelo}</p>
                              </td>
                              <td className="px-3 py-2.5 font-mono text-primary font-bold">{det.codigo_patrimonial}</td>
                              <td className="px-3 py-2.5 font-mono text-muted">{det.numero_serie}</td>
                              <td className="px-3 py-2.5">
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">
                                  {det.estado_funcionamiento}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-muted italic text-[11px]">
                                {det.mantenimiento_numero ? `MNT ${det.mantenimiento_numero}` : '—'}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-alt border border-border text-body">
                                  {det.motivo_baja_nombre}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-faint text-xs border border-dashed border-border rounded-xl">
                      Los detalles de bienes no están disponibles en esta vista.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab: Diagnósticos Técnicos ── */}
            {tabActiva === 'tecnico' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {hayDiagnosticos ? b.detalles?.map((det, idx) => (
                  <div key={det.id} className="p-4 rounded-xl border border-border/60 bg-surface-alt/20">
                    <p className="text-xs font-black text-body mb-3">
                      {idx + 1}. {det.tipo_bien_nombre} {det.marca_nombre} —{' '}
                      <span className="font-mono text-primary">{det.codigo_patrimonial}</span>
                      {det.mantenimiento_numero && (
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          MNT {det.mantenimiento_numero}
                        </span>
                      )}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {[
                        { label: 'Diagnóstico Inicial', valor: det.diagnostico_inicial  },
                        { label: 'Trabajo Realizado',    valor: det.trabajo_realizado    },
                        { label: 'Diagnóstico Final',    valor: det.diagnostico_final    },
                        { label: 'Observación Técnica',  valor: det.observacion_tecnica  },
                      ].map(({ label, valor }) => valor ? (
                        <div key={label}>
                          <p className="text-[9px] font-black text-faint uppercase tracking-widest mb-0.5">{label}</p>
                          <p className="text-body leading-relaxed">{valor}</p>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 text-faint text-xs border border-dashed border-border rounded-xl">
                    No hay diagnósticos técnicos registrados.
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Historial ── */}
            {tabActiva === 'historial' && (
              <div className="space-y-4 animate-in fade-in duration-300 p-1">
                {!b.aprobaciones?.length ? (
                  <div className="text-center py-10 text-faint text-xs">No hay registros de tramitación.</div>
                ) : (
                  b.aprobaciones.map((aprob, idx) => {
                    const meta     = ICONO_ACCION[aprob.accion] || ICONO_ACCION.REGISTRADO;
                    const esUltimo = idx === b.aprobaciones.length - 1;
                    return (
                      <div key={aprob.id} className="flex gap-3 relative pb-2">
                        {!esUltimo && (
                          <div className="absolute left-[13px] top-[26px] bottom-0 w-0.5 bg-border rounded-full" />
                        )}
                        <div
                          className="size-7 rounded-full flex items-center justify-center shrink-0 z-10"
                          style={{ background: 'var(--color-surface)', border: `2px solid ${meta.color}` }}
                        >
                          <Icon name={meta.icon} className="text-[15px]" style={{ color: meta.color }} />
                        </div>
                        <div className="flex-1 min-w-0 p-3 rounded-xl border border-border/60 bg-surface">
                          <div className="flex justify-between items-baseline gap-2 mb-1">
                            <p className="text-xs font-black uppercase tracking-wider" style={{ color: meta.color }}>
                              {aprob.accion}
                            </p>
                            <p className="text-[10px] font-mono text-faint shrink-0">{fmtT(aprob.fecha)}</p>
                          </div>
                          <p className="text-[11px] text-body">
                            Usuario #{aprob.usuario_id}
                            <span className="text-muted ml-1">({aprob.rol_aprobador})</span>
                          </p>
                          {aprob.observacion && (
                            <p className="text-[11px] text-muted italic mt-1 p-2 rounded bg-surface-alt/50 border border-dashed border-border/60">
                              {aprob.observacion}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        )}
      </ModalBody>

      <ModalFooter align="right">
        <button onClick={onClose} className="btn-secondary">Cerrar</button>

        {puedeDescargarSinFirma && !loading && (
          <button
            onClick={handleDescargarSinFirma}
            className="btn-secondary flex items-center gap-1.5 text-red-600"
            title="Descargar PDF para firmar físicamente"
          >
            <Icon name="picture_as_pdf" className="text-[16px]" />
            Descargar PDF
          </button>
        )}

     
        {puedeSubirFirmado && !loading && (
          <>
            <input
              ref={fileFirmRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleSubirFirmado}
            />
            <button
              type="button"
              onClick={() => fileFirmRef.current?.click()}
              className="btn-primary flex items-center gap-1.5"
              title="Subir el documento impreso y firmado"
            >
              <Icon name="upload_file" className="text-[16px]" />
              Subir PDF Firmado
            </button>
          </>
        )}

        {puedeDescargarFirmado && !loading && (
          <button
            onClick={handleDescargarFirmado}
            className="btn-secondary flex items-center gap-1.5 text-emerald-600"
            title="Descargar documento firmado"
          >
            <Icon name="verified" className="text-[16px]" />
            Descargar PDF Firmado
          </button>
        )}

        {b.estado_baja === 'DEVUELTO' && puedeAccionesRegistrador && !loading && (
          <button
            onClick={() => onGestionar(b, 'reenviar')}
            className="btn-secondary flex items-center gap-1.5 text-blue-600"
          >
            <Icon name="send" className="text-[16px]" /> Corregir y Reenviar
          </button>
        )}

       
        {b.estado_baja === 'PENDIENTE_APROBACION' && puedeAccionesAprobador && esDestinatario && !loading && (
          <>
            <button onClick={() => onGestionar(b, 'devolver')} className="btn-danger flex items-center gap-1.5">
              <Icon name="assignment_return" className="text-[16px]" /> Devolver
            </button>
            <button onClick={() => onGestionar(b, 'aprobar')} className="btn-primary flex items-center gap-1.5">
              <Icon name="check_circle" className="text-[16px]" /> Aprobar Baja
            </button>
          </>
        )}

        
        <Can perform="ms-bienes:bajas:delete_baja">
          {!['ATENDIDO', 'CANCELADO'].includes(b.estado_baja) && !loading && (
            <button onClick={() => onCancelar(b)} className="btn-danger flex items-center gap-1.5">
              <Icon name="cancel" className="text-[16px]" /> Cancelar Informe
            </button>
          )}
        </Can>
      </ModalFooter>
    </Modal>
  );
}