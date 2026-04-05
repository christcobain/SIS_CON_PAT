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
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  outline: 'none',
};

const META = {
  aprobar: {
    icon: 'check_circle', title: 'Aprobar mantenimiento',
    btnLabel: 'Aprobar', iconColor: '#16a34a',
    info: 'Al aprobar, el propietario del bien recibirá la solicitud de conformidad.',
    infoBg: 'rgb(22 163 74 / 0.06)', infoBorder: 'rgb(22 163 74 / 0.2)', infoColor: '#16a34a',
  },
  devolver: {
    icon: 'reply', title: 'Devolver mantenimiento',
    btnLabel: 'Devolver', iconColor: '#b45309',
    info: 'Indica el motivo del rechazo. El asistente podrá corregir y reenviar.',
    infoBg: 'rgb(180 83 9 / 0.06)', infoBorder: 'rgb(180 83 9 / 0.2)', infoColor: '#b45309',
  },
  conformidad: {
    icon: 'front_hand', title: 'Confirmar conformidad',
    btnLabel: 'Confirmar conformidad', iconColor: '#7c3aed',
    info: 'Al confirmar, el estado de los bienes será actualizado y la orden quedará ATENDIDA.',
    infoBg: 'rgb(124 58 237 / 0.06)', infoBorder: 'rgb(124 58 237 / 0.2)', infoColor: '#7c3aed',
  },
};

export default function ModalAprobacionMantenimiento({
  open, onClose, item, modo = 'aprobar', actualizando, acciones, onGuardado,
}) {
  const toast = useToast();
  const [observacion, setObservacion] = useState('');
  const [confirm,     setConfirm]     = useState(false);
  const [procesando,  setProcesando]  = useState(false);

  if (!item) return null;

  const esDevolver = modo === 'devolver';
  const cfg        = META[modo] ?? META.aprobar;

  const handleSolicitar = () => {
    if (esDevolver && !observacion.trim()) {
      toast.error('Ingresa el motivo de devolución.');
      return;
    }
    setConfirm(true);
  };

  const handleAccion = async () => {
    setConfirm(false);
    setProcesando(true);    
    try {
      const obsTrim = observacion.trim();
      if (modo === 'aprobar') {
        const result = await acciones.aprobarMant(item.id, obsTrim);
         toast.success(result?.message || 'Mant. Aprobado correctamente.');
      } else if (modo === 'devolver') {
        const result = await acciones.devolverMant(item.id, obsTrim);
        toast.success(result?.message || 'Mant. Devuelto para corrección.');
      }
        setObservacion('');
        onGuardado();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al procesar la acción.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="sm">
        <ModalHeader
          icon={cfg.icon}
          title={cfg.title}
          subtitle={`Orden: ${item.numero_orden}`}
          onClose={onClose}
        />
        <ModalBody>
          <div className="space-y-4">
            {/* Info contextual */}
            <div className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: cfg.infoBg, border: `1px solid ${cfg.infoBorder}` }}>
              <Icon name="info" className="text-[18px] shrink-0 mt-0.5" style={{ color: cfg.infoColor }} />
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-body)' }}>{cfg.info}</p>
            </div>

            {/* Observación */}
            {(modo === 'aprobar' || modo === 'devolver') && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Observación{esDevolver ? ' (obligatoria)' : ' (opcional)'}
                  {esDevolver && <span className="text-red-500 ml-0.5">*</span>}
                </p>
                <textarea
                  value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                  rows={4}
                  placeholder={esDevolver ? 'Describe el motivo del rechazo...' : 'Observaciones adicionales (opcional)...'}
                  className="w-full text-sm rounded-xl px-3 py-2.5 transition-all resize-none"
                  style={TA_STYLE}
                  onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
                  onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
                />
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter align="right">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button
            onClick={handleSolicitar}
            disabled={procesando || actualizando}
            className={
              esDevolver
                ? 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50'
                : 'btn-primary flex items-center gap-2'
            }
            style={esDevolver ? { background: 'rgb(220 38 38 / 0.1)', color: '#dc2626', border: '1px solid rgb(220 38 38 / 0.25)' } : {}}
          >
            {procesando ? <span className="btn-loading-spin" /> : <Icon name={cfg.icon} className="text-[16px]" />}
            {cfg.btnLabel}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={confirm}
        title={`Confirmar: ${cfg.btnLabel}`}
        message={`¿${cfg.btnLabel} la orden de mantenimiento "${item.numero_orden}"?`}
        confirmLabel={`Sí, ${cfg.btnLabel.toLowerCase()}`}
        variant={esDevolver ? 'danger' : 'primary'}
        loading={procesando}
        onConfirm={handleAccion}
        onClose={() => setConfirm(false)}
      />
    </>
  );
}