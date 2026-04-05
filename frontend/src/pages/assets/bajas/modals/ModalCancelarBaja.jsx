import { useState, useEffect } from 'react';
import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useCatalogos } from '../../../../hooks/useCatalogos';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const S = {
  input: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    outline: 'none',
    color: 'var(--color-text-primary)',
  },
};
const onF  = (e) => { e.currentTarget.style.border = '1px solid var(--color-primary)'; };
const offF = (e) => { e.currentTarget.style.border = '1px solid var(--color-border)'; };

function FLabel({ children, required, hint }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
        {children}{required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      {hint && <span className="text-[9px] italic normal-case tracking-normal" style={{ color: 'var(--color-text-faint)' }}>{hint}</span>}
    </div>
  );
}

export default function ModalCancelarBaja({ open, onClose, item, acciones, onAccionExitosa }) {
  const { fetchCatalogos, motivosCancelacion } = useCatalogos();
  const [guardando, setGuardando] = useState(false);
  const [confirm,   setConfirm]   = useState(false);
  const [form, setForm] = useState({ motivo_cancelacion_id: '', detalle_cancelacion: '' });

  useEffect(() => {
    if (!open) return;
    setForm({ motivo_cancelacion_id: '', detalle_cancelacion: '' });
    fetchCatalogos(['motivosCancelacion']);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirmar = async () => {
    setGuardando(true);
    try {
      const res = await acciones.cancelar(item.id, {
        motivo_cancelacion_id: parseInt(form.motivo_cancelacion_id),
        detalle_cancelacion:   form.detalle_cancelacion,
      });
      onAccionExitosa(res);
    } finally {
      setGuardando(false);
      setConfirm(false);
    }
  };

  const isInvalid = !form.motivo_cancelacion_id || form.detalle_cancelacion.trim().length < 5;

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader title="Cancelar Informe de Baja" icon="cancel" onClose={onClose} />

      <ModalBody>
        <div className="space-y-4">

          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgb(220 38 38 / 0.06)', border: '1px solid rgb(220 38 38 / 0.2)' }}>
            <Icon name="warning" className="text-[14px] shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#dc2626' }}>
                Acción Irreversible
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-body)' }}>
                Está a punto de cancelar el informe{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>{item?.numero_informe}</strong>.
                Los bienes asociados volverán a estar disponibles para nuevas solicitudes.
              </p>
            </div>
          </div>

          <div>
            <FLabel required>Motivo de cancelación</FLabel>
            <select value={form.motivo_cancelacion_id}
              onChange={(e) => setForm({ ...form, motivo_cancelacion_id: e.target.value })}
              className="w-full text-sm rounded-xl px-3 py-2.5 cursor-pointer transition-all"
              style={S.input} onFocus={onF} onBlur={offF}>
              <option value="">Seleccione un motivo...</option>
              {(motivosCancelacion || []).map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <FLabel required hint="mín. 5 caracteres">Detalle explicativo</FLabel>
            <textarea value={form.detalle_cancelacion}
              onChange={(e) => setForm({ ...form, detalle_cancelacion: e.target.value })}
              placeholder="Explique brevemente por qué se cancela este informe..."
              rows={4} className="w-full text-sm rounded-xl p-3 transition-all resize-none"
              style={S.input} onFocus={onF} onBlur={offF} />
            {form.detalle_cancelacion.trim().length > 0 && form.detalle_cancelacion.trim().length < 5 && (
              <p className="text-[10px] text-red-500 mt-1 font-semibold">Mínimo 5 caracteres.</p>
            )}
          </div>
        </div>
      </ModalBody>

      <ModalFooter align="right">
        <button onClick={onClose} className="btn-secondary">Volver</button>
        <button onClick={() => setConfirm(true)} disabled={isInvalid || guardando}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all disabled:opacity-50"
          style={{ background: 'rgb(220 38 38 / 0.1)', color: '#dc2626', border: '1px solid rgb(220 38 38 / 0.25)' }}>
          {guardando
            ? <span className="btn-loading-spin" style={{ borderColor: '#fca5a5', borderTopColor: '#dc2626' }} />
            : <Icon name="cancel" className="text-[16px]" />
          }
          Confirmar Cancelación
        </button>
      </ModalFooter>

      <ConfirmDialog
        open={confirm}
        title="¿Confirmar cancelación?"
        message={`¿Está seguro de cancelar el informe ${item?.numero_informe}? Esta acción quedará registrada en el historial y no puede deshacerse.`}
        confirmLabel="Sí, cancelar informe"
        variant="danger"
        loading={guardando}
        onConfirm={handleConfirmar}
        onClose={() => setConfirm(false)}
      />
    </Modal>
  );
}