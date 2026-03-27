import { useState, useEffect } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useCatalogos } from '../../../../hooks/useCatalogos';
import { useToast }     from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const INPUT_STYLE = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  outline: 'none',
};

const FORM_INICIAL = { motivo_cancelacion_id: '', detalle_cancelacion: '' };

export default function ModalCancelarMantenimiento({
  open,
  onClose,
  item,
  onCancelar,
  actualizando = false,
}) {
  const toast = useToast();

  // Carga motivos de cancelación desde el catálogo
  const { fetchCatalogos, motivosCancelacion = [] } = useCatalogos();

  const [form,    setForm]    = useState(FORM_INICIAL);
  const [errors,  setErrors]  = useState({});
  const [confirm, setConfirm] = useState(false);

  // Carga los motivos al abrir y resetea el formulario
  useEffect(() => {
    if (!open) return;
    setForm(FORM_INICIAL);
    setErrors({});
    setConfirm(false);
    fetchCatalogos(['motivosCancelacion']);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const motivoSeleccionado = motivosCancelacion.find(
    m => String(m.id) === String(form.motivo_cancelacion_id)
  );

  // ── Validación ────────────────────────────────────────────────────────────
  const validar = () => {
    const e = {};
    if (!form.motivo_cancelacion_id) e.motivo_cancelacion_id = 'Selecciona un motivo.';
    if (!form.detalle_cancelacion.trim()) e.detalle_cancelacion = 'Describe brevemente el motivo.';
    return e;
  };

  const handleSolicitar = () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    setConfirm(true);
  };

  // ── Ejecutar cancelación ──────────────────────────────────────────────────
  // cancelar() en el hook llama a ejecutarYRefrescar → fetchMantenimientos automático.
  // La Page recibe el callback onCancelar y tras completarlo llama handleAccionExitosa
  // que además ejecuta refetchMant() una vez más para sincronizar stats.
  const handleConfirmar = async () => {
    setConfirm(false);
    try {
      await onCancelar(item.id, {
        motivo_cancelacion_id: parseInt(form.motivo_cancelacion_id, 10),
        detalle_cancelacion:   form.detalle_cancelacion.trim(),
      });
      // El toast de éxito lo emite handleAccionExitosa en MantenimientosPage
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al cancelar el mantenimiento.');
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="sm" closeOnOverlay={!confirm}>
        <ModalHeader
          icon="cancel"
          title={`Cancelar mantenimiento`}
          subtitle={`Orden: ${item.numero_orden}`}
          onClose={onClose}
        />

        <ModalBody>
          <div className="space-y-5">

            {/* Aviso de impacto */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl"
              style={{ background: 'rgb(220 38 38 / 0.06)', border: '1px solid rgb(220 38 38 / 0.2)' }}>
              <Icon name="warning" className="text-[18px] shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
              <div>
                <p className="text-[11px] font-black" style={{ color: '#dc2626' }}>
                  Esta acción no se puede deshacer
                </p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-body)' }}>
                  Los bienes asociados volverán a su estado anterior y quedarán disponibles
                  para nuevas operaciones.
                </p>
              </div>
            </div>

            {/* Selector de motivo */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-2"
                style={{ color: 'var(--color-text-muted)' }}>
                Motivo de cancelación <span className="text-red-500">*</span>
              </p>

              {motivosCancelacion.length === 0 ? (
                <div className="skeleton h-10 rounded-xl" />
              ) : (
                <div className="space-y-2">
                  {motivosCancelacion
                    .filter(m => m.is_active !== false)
                    .map(m => {
                      const sel = String(m.id) === String(form.motivo_cancelacion_id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => set('motivo_cancelacion_id', m.id)}
                          className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all"
                          style={{
                            background: sel ? 'rgb(220 38 38 / 0.06)' : 'var(--color-surface-alt)',
                            border: `1px solid ${sel ? 'rgb(220 38 38 / 0.35)' : 'var(--color-border)'}`,
                          }}
                        >
                          <div
                            className="size-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all"
                            style={{
                              borderColor: sel ? '#dc2626' : 'var(--color-border)',
                              background: sel ? '#dc2626' : 'transparent',
                            }}
                          >
                            {sel && <Icon name="check" className="text-[10px] text-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-tight"
                              style={{ color: sel ? '#dc2626' : 'var(--color-text-primary)' }}>
                              {m.nombre}
                            </p>
                            {m.descripcion && (
                              <p className="text-[10px] mt-0.5 leading-relaxed"
                                style={{ color: 'var(--color-text-muted)' }}>
                                {m.descripcion}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}

              {errors.motivo_cancelacion_id && (
                <p className="text-[10px] text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                  <Icon name="error" className="text-[12px]" />{errors.motivo_cancelacion_id}
                </p>
              )}
            </div>

            {/* Detalle / descripción libre */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-2"
                style={{ color: 'var(--color-text-muted)' }}>
                Detalle adicional <span className="text-red-500">*</span>
              </p>
              <textarea
                value={form.detalle_cancelacion}
                onChange={e => set('detalle_cancelacion', e.target.value)}
                rows={3}
                placeholder="Describe el contexto de la cancelación para el historial..."
                className="w-full text-sm rounded-xl px-3 py-2.5 resize-none transition-all"
                style={INPUT_STYLE}
                onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
              />
              {errors.detalle_cancelacion && (
                <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                  <Icon name="error" className="text-[12px]" />{errors.detalle_cancelacion}
                </p>
              )}
            </div>

            {/* Resumen de lo seleccionado */}
            {motivoSeleccionado && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                <Icon name="info" className="text-[14px] shrink-0" style={{ color: 'var(--color-text-faint)' }} />
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Motivo: <strong style={{ color: 'var(--color-text-primary)' }}>{motivoSeleccionado.nombre}</strong>
                </p>
              </div>
            )}

          </div>
        </ModalBody>

        <ModalFooter align="right">
          <button onClick={onClose} disabled={actualizando} className="btn-secondary">
            Cancelar
          </button>
          <button
            onClick={handleSolicitar}
            disabled={actualizando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: 'rgb(220 38 38 / 0.1)', color: '#dc2626', border: '1px solid rgb(220 38 38 / 0.3)' }}
          >
            {actualizando
              ? <span className="btn-loading-spin" style={{ borderColor: '#fca5a5', borderTopColor: '#dc2626' }} />
              : <Icon name="cancel" className="text-[16px]" />
            }
            Cancelar orden
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={confirm}
        title="Confirmar cancelación"
        message={`¿Cancelar definitivamente la orden "${item.numero_orden}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, cancelar orden"
        variant="danger"
        loading={actualizando}
        onConfirm={handleConfirmar}
        onClose={() => setConfirm(false)}
      />
    </>
  );
}