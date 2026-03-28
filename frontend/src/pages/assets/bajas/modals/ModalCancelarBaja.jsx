import { useState, useEffect } from 'react';
import Modal from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useCatalogos } from '../../../../hooks/useCatalogos';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function ModalCancelarBaja({ open, onClose, item, onCancelar }) {
  const { obtenerMotivosCancelacion } = useCatalogos();
  
  const [motivos, setMotivos] = useState([]);
  const [loadingMotivos, setLoadingMotivos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirm, setConfirm] = useState(false);

  // Estado del formulario según el body solicitado
  const [form, setForm] = useState({
    motivo_cancelacion_id: '',
    detalle_cancelacion: ''
  });

  useEffect(() => {
    if (open) {
      setLoadingMotivos(true);
      obtenerMotivosCancelacion()
        .then(res => setMotivos(res || []))
        .finally(() => setLoadingMotivos(false));
    }
  }, [open]);

  const handleConfirmar = async () => {
    setGuardando(true);
    try {
      // Enviamos el objeto con la estructura exacta requerida
      await onCancelar(item.id, {
        motivo_cancelacion_id: parseInt(form.motivo_cancelacion_id),
        detalle_cancelacion: form.detalle_cancelacion
      });
      onClose();
    } finally {
      setGuardando(false);
      setConfirm(false);
    }
  };

  const isInvalid = !form.motivo_cancelacion_id || form.detalle_cancelacion.length < 5;

  return (
    <Modal open={open} onClose={onClose} maxWidth="500px">
      <ModalHeader 
        title="Cancelar Informe de Baja" 
        icon="cancel" 
        onClose={onClose} 
      />

      <ModalBody>
        <div className="space-y-4">
          {/* Alerta de advertencia */}
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3">
            <Icon name="warning" className="text-red-600" />
            <div>
              <p className="text-xs font-bold text-red-800">Acción Irreversible</p>
              <p className="text-[11px] text-red-700 leading-relaxed">
                Está a punto de cancelar el informe <strong>{item?.numero_informe}</strong>. 
                Los bienes asociados volverán a estar disponibles para nuevas solicitudes.
              </p>
            </div>
          </div>

          {/* Selector de Motivo */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-faint">
              Motivo de cancelación
            </label>
            <select
              value={form.motivo_cancelacion_id}
              onChange={e => setForm({ ...form, motivo_cancelacion_id: e.target.value })}
              className="w-full text-sm rounded-xl px-3 py-2.5 transition-all"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', outline: 'none' }}
            >
              <option value="">Seleccione un motivo...</option>
              {loadingMotivos ? (
                <option disabled>Cargando motivos...</option>
              ) : (
                motivos.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))
              )}
            </select>
          </div>

          {/* Detalle de Cancelación */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-faint">
              Detalle explicativo (Min. 5 caracteres)
            </label>
            <textarea
              value={form.detalle_cancelacion}
              onChange={e => setForm({ ...form, detalle_cancelacion: e.target.value })}
              placeholder="Explique brevemente por qué se cancela este informe..."
              className="w-full text-sm rounded-xl p-3 min-h-[100px] transition-all"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', outline: 'none' }}
            />
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} className="btn-secondary">Volver</button>
        <button 
          onClick={() => setConfirm(true)} 
          disabled={isInvalid || guardando}
          className="btn-danger flex items-center gap-2"
        >
          {guardando ? <span className="btn-loading-spin" /> : <Icon name="backspace" className="text-[18px]" />}
          Confirmar Cancelación
        </button>
      </ModalFooter>

      <ConfirmDialog
        open={confirm}
        title="¿Confirmar anulación?"
        message={`¿Está seguro de anular definitivamente el informe ${item?.numero_informe}? Esta acción quedará registrada en el historial.`}
        confirmLabel="Sí, anular informe"
        variant="danger"
        loading={guardando}
        onConfirm={handleConfirmar}
        onCancel={() => setConfirm(false)}
      />
    </Modal>
  );
}