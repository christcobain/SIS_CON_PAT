import { useState } from 'react';
import Modal from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import Can from '../../../../components/auth/Can';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

// Formateadores de referencia
const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
const fmtD = iso => !iso ? '—' : new Date(iso).toLocaleDateString('es-PE');

// Badges de estado (mismos colores de la tabla principal)
const BADGE_BAJA = {
  PENDIENTE_APROBACION: { label: 'Pend. aprobación', color: '#b45309', bg: 'rgb(180 83 9 / 0.1)' },
  ATENDIDO: { label: 'Atendido (Baja Definitiva)', color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)' },
  DEVUELTO: { label: 'Devuelto p/Corrección', color: '#e11d48', bg: 'rgb(225 29 72 / 0.1)' },
  CANCELADO: { label: 'Cancelado', color: '#64748b', bg: 'rgb(100 116 139 / 0.1)' },
};

// Iconos para el Timeline de aprobaciones
const ICONO_ACCION = {
  REGISTRADO: { icon: 'add_circle', color: '#64748b' },
  ENVIADO: { icon: 'send', color: '#1d4ed8' },
  APROBADO: { icon: 'check_circle', color: '#16a34a' },
  DEVUELTO: { icon: 'assignment_return', color: '#b45309' },
  CANCELADO: { icon: 'cancel', color: '#e11d48' },
};

export default function ModalDetalleBaja({ open, onClose, item, onGestionar, onCancelar, puedeAccionesAprobador }) {
  const [tabActiva, setTabActiva] = useState('detalle'); // 'detalle' o 'historial'

  if (!item) return null;
  const badge = BADGE_BAJA[item.estado_baja] || BADGE_BAJA.PENDIENTE_APROBACION;

  const TABS = [
    { id: 'detalle', label: 'Detalle e Ítems', icon: 'description' },
    { id: 'historial', label: 'Historial de Tramitación', icon: 'history' },
  ];

  return (
    <Modal open={open} onClose={onClose} maxWidth="900px">
      <ModalHeader
        title={`Detalle de Informe de Baja Técnica`}
        icon="visibility"
        onClose={onClose}
      />

      <ModalBody>
        <div className="space-y-5">
          {/* ── CABECERA DEL INFORME ── */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-surface-alt/50 border border-border">
            <div>
              <p className="text-xl font-black text-primary">{item.numero_informe}</p>
              <p className="text-xs text-muted font-medium mt-0.5">
                Elaborado por: <strong>{item.nombre_elabora}</strong> ({item.cargo_elabora})
              </p>
              <p className="text-[11px] text-faint mt-1">
                Sede: {item.sede_elabora_nombre} / {item.modulo_elabora_nombre || 'Sin módulo'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="inline-flex items-center text-[11px] font-black uppercase px-3 py-1.5 rounded-full"
                style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
              <p className="text-[11px] text-faint font-mono">Registrado: {fmtT(item.fecha_registro)}</p>
            </div>
          </div>

          {/* ── TABS DE NAVEGACIÓN ── */}
          <div className="flex items-center gap-1 border-b border-border tabs-header">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                  tabActiva === tab.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted hover:text-body hover:bg-surface-alt/50'
                }`}
              >
                <Icon name={tab.icon} className="text-[16px]" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── CONTENIDO DE TABS ── */}
          <div className="tab-content min-h-[300px]">
            
            {/* TAB 1: DETALLE E ÍTEMS */}
            {tabActiva === 'detalle' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Secciones Narrativas (Adapta diseño Clean) */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-surface-alt/30 p-4 rounded-xl border border-border/60">
                  {[
                    { label: 'Antecedentes', valor: item.antecedentes },
                    { label: 'Análisis', valor: item.analisis },
                    { label: 'Conclusiones', valor: item.conclusiones },
                    { label: 'Recomendaciones', valor: item.recomendaciones },
                  ].map(sec => (
                    <div key={sec.label}>
                      <p className="text-[10px] font-black text-faint uppercase tracking-widest mb-1">{sec.label}</p>
                      <p className="text-body italic leading-relaxed">{sec.valor || '— No especificado —'}</p>
                    </div>
                  ))}
                </div>

                {/* Lista de Bienes Incluidos */}
                <section>
                  <label className="text-[10px] font-black uppercase tracking-widest text-faint mb-2 block">
                    Bienes Incluidos en la Solicitud ({item.total_bienes})
                  </label>
                  <div className="table-wrapper border rounded-xl overflow-hidden">
                    <table className="table-clean w-full text-xs">
                      <thead className="bg-surface-alt">
                        <tr>
                          <th className="px-3 py-2 text-left text-faint font-bold uppercase text-[9px]">Ítem</th>
                          <th className="px-3 py-2 text-left text-faint font-bold uppercase text-[9px]">Bien / Cód. Patrimonial</th>
                          <th className="px-3 py-2 text-left text-faint font-bold uppercase text-[9px]">Sustento Técnico (MNT)</th>
                          <th className="px-3 py-2 text-left text-faint font-bold uppercase text-[9px]">Motivo Baja</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {item.detalles?.map((det, idx) => (
                          <tr key={det.id} className="hover:bg-surface-alt/30">
                            <td className="px-3 py-2.5 font-bold text-muted">{idx + 1}</td>
                            <td className="px-3 py-2.5">
                              <p className="font-bold text-body">{det.tipo_bien_nombre} - {det.marca_nombre}</p>
                              <p className="text-[11px] text-faint font-mono">Patrimonial: {det.codigo_patrimonial}</p>
                            </td>
                            <td className="px-3 py-2.5 text-muted italic">
                              {det.mantenimiento_numero 
                                ? `Vinculado a MNT ${det.mantenimiento_numero}`
                                : 'Sustentación manual (sin MNT)'}
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
                </section>
              </div>
            )}

            {/* TAB 2: HISTORIAL DE TRAMITACIÓN (Timeline) */}
            {tabActiva === 'historial' && (
              <div className="space-y-4 animate-in fade-in duration-300 p-2">
                {item.aprobaciones?.length === 0 ? (
                  <div className="text-center py-10 text-faint">No hay registros de tramitación.</div>
                ) : item.aprobaciones.map((aprob, idx) => {
                  const metaAccion = ICONO_ACCION[aprob.accion] || ICONO_ACCION.REGISTRADO;
                  const esUltimo = idx === item.aprobaciones.length - 1;
                  return (
                    <div key={aprob.id} className="flex gap-3 relative pb-2">
                      {/* Línea del timeline */}
                      {!esUltimo && (
                        <div className="absolute left-[13px] top-[26px] bottom-0 w-0.5 bg-border rounded-full" />
                      )}
                      
                      {/* Icono de acción */}
                      <div className="size-7 rounded-full flex items-center justify-center shrink-0 z-10"
                        style={{ background: 'var(--color-surface)', border: `2px solid ${metaAccion.color}` }}>
                        <Icon name={metaAccion.icon} className="text-[16px]" style={{ color: metaAccion.color }} />
                      </div>
                      
                      {/* Detalle del evento */}
                      <div className="flex-1 min-w-0 card bg-surface p-3 border-border shadow-none">
                        <div className="flex justify-between items-baseline gap-2 mb-1.5">
                          <p className="text-xs font-black uppercase tracking-wider" style={{ color: metaAccion.color }}>
                            {aprob.accion}
                          </p>
                          <p className="text-[10px] font-mono text-faint shrink-0">{fmtT(aprob.fecha)}</p>
                        </div>
                        <p className="text-xs font-semibold text-body mb-1">
                          Realizado por Usuario ID: {aprob.usuario_id} <span className="text-muted font-normal">({aprob.rol_aprobador})</span>
                        </p>
                        {aprob.observacion && (
                          <div className="text-[11px] text-muted italic bg-surface-alt/50 p-2 rounded border border-dashed border-border/60">
                            "{aprob.observacion}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ModalBody>

      <ModalFooter align="right">
        <button onClick={onClose} className="btn-secondary">Cerrar</button>

        {/* Descargar PDF si está disponible (Ref. Mantenimientos) */}
        {item.pdf_path && (
          <button onClick={() => window.open(item.pdf_path)} className="btn-secondary text-red-600 flex items-center gap-1.5">
            <Icon name="picture_as_pdf" className="text-[16px]" /> Descargar Informe
          </button>
        )}

        {/* Acciones de Gestión (Aprobador) */}
        {item.estado_baja === 'PENDIENTE_APROBACION' && puedeAccionesAprobador && (
          <div className="flex items-center gap-2">
            <button onClick={() => onGestionar(item, 'devolver')} className="btn-danger flex items-center gap-1.5">
              <Icon name="assignment_return" className="text-[16px]" /> Devolver
            </button>
            <button onClick={() => onGestionar(item, 'aprobar')} className="btn-primary flex items-center gap-1.5">
              <Icon name="check_circle" className="text-[16px]" /> Aprobar Baja
            </button>
          </div>
        )}

        {/* Acción de Cancelar (Ref. Mantenimientos / delete_baja permission) */}
        <Can perform="ms-bienes:bajas:delete_baja">
          {!['ATENDIDO', 'CANCELADO'].includes(item.estado_baja) && (
            <button onClick={() => onCancelar(item)} className="btn-danger flex items-center gap-1.5">
              <Icon name="cancel" className="text-[16px]" /> Cancelar Informe
            </button>
          )}
        </Can>
      </ModalFooter>
    </Modal>
  );
}