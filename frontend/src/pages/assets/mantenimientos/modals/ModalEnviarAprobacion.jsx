import { useState } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useToast }  from '../../../../hooks/useToast';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const TA_STYLE = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)', outline: 'none',
};

export default function ModalEnviarAprobacion({ open, onClose, item, onEnviar }) {
  const toast = useToast();
  const [trabajos,    setTrabajos]    = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [confirm,     setConfirm]     = useState(false);
  const [enviando,    setEnviando]    = useState(false);

  const handleEnviar = async () => {
    setConfirm(false);
    setEnviando(true);
    try {
      await onEnviar(item.id, { trabajos_realizados: trabajos.trim(), diagnostico_final: diagnostico.trim() });
      toast.success('Mantenimiento enviado a aprobación.');
      setTrabajos(''); setDiagnostico('');
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al enviar a aprobación.');
    } finally { setEnviando(false); }
  };

  const handleSolicitar = () => {
    if (!trabajos.trim()) { toast.error('Ingresa los trabajos realizados.'); return; }
    if (!diagnostico.trim()) { toast.error('Ingresa el diagnóstico final.'); return; }
    setConfirm(true);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="md">
        <ModalHeader icon="send"
          title="Enviar a aprobación"
          subtitle={`Orden: ${item?.numero_orden ?? ''}`}
          onClose={onClose} />
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'rgb(37 99 235 / 0.06)', border: '1px solid rgb(37 99 235 / 0.2)' }}>
              <Icon name="info" className="text-[18px] shrink-0 mt-0.5" style={{ color: '#1d4ed8' }} />
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-body)' }}>
                Al enviar, la orden pasará a <strong>PENDIENTE DE APROBACIÓN</strong>. ADMINSEDE revisará y aprobará o devolverá con observaciones.
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Trabajos realizados <span className="text-red-500">*</span>
              </p>
              <textarea value={trabajos} onChange={e => setTrabajos(e.target.value)} rows={4}
                placeholder="Describe los trabajos técnicos realizados en cada bien..."
                className="w-full text-sm rounded-xl px-3 py-2.5 transition-all resize-none"
                style={TA_STYLE}
                onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
              />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Diagnóstico final <span className="text-red-500">*</span>
              </p>
              <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} rows={3}
                placeholder="Estado final de los bienes y diagnóstico técnico..."
                className="w-full text-sm rounded-xl px-3 py-2.5 transition-all resize-none"
                style={TA_STYLE}
                onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter align="right">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSolicitar} disabled={enviando} className="btn-primary flex items-center gap-2">
            {enviando ? <span className="btn-loading-spin" /> : <Icon name="send" className="text-[16px]" />}
            Enviar a aprobación
          </button>
        </ModalFooter>
      </Modal>
      <ConfirmDialog open={confirm}
        title="Confirmar envío"
        message={`¿Enviar la orden ${item?.numero_orden} a aprobación? ADMINSEDE recibirá la notificación.`}
        confirmLabel="Sí, enviar" variant="primary" loading={enviando}
        onConfirm={handleEnviar} onClose={() => setConfirm(false)} />
    </>
  );
}