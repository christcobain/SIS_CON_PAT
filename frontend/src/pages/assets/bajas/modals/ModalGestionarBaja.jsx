import { useState } from 'react';
import Modal from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function ModalGestionarBaja({ open, onClose, item, modo, onAprobar, onDevolver }) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const esAprobar = modo === 'aprobar';

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      if (esAprobar) {
        await onAprobar(item.id);
      } else {
        await onDevolver(item.id, motivo);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="500px">
      <ModalHeader
        title={esAprobar ? 'Aprobar Baja Definitiva' : 'Devolver Informe'}
        icon={esAprobar ? 'fact_check' : 'assignment_return'}
        onClose={onClose}
      />

      <ModalBody>
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl border ${
              esAprobar ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
            }`}
          >
            <p className="text-xs font-bold text-body mb-1">
              {esAprobar ? 'Confirmación de Salida Definitiva' : 'Motivo de Devolución'}
            </p>
            <p className="text-[11px] text-muted leading-relaxed">
              {esAprobar
                ? `Al aprobar, los bienes del informe ${item?.numero_informe} quedarán desactivados permanentemente del inventario activo.`
                : 'Indique las correcciones necesarias para que el registrador pueda subsanar el informe.'}
            </p>
          </div>

          {!esAprobar && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-faint">
                Detalle del motivo (mín. 5 caracteres) *
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Indique qué debe corregirse en el informe..."
                className="w-full text-sm rounded-xl p-3 min-h-[100px] transition-all"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
                onBlur={(e) => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
              />
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} className="btn-secondary">Cerrar</button>
        <button
          onClick={handleConfirmar}
          disabled={loading || (!esAprobar && motivo.length < 5)}
          className={`flex items-center gap-2 ${esAprobar ? 'btn-primary' : 'btn-danger'}`}
        >
          {loading
            ? <span className="btn-loading-spin" />
            : <Icon name={esAprobar ? 'check_circle' : 'assignment_return'} className="text-[18px]" />
          }
          {esAprobar ? 'Aprobar Ahora' : 'Confirmar Devolución'}
        </button>
      </ModalFooter>
    </Modal>
  );
}