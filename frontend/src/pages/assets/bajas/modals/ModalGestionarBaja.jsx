import { useState } from 'react';
import Modal from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const inputStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  outline: 'none',
};
const onFocus = (e) => { e.currentTarget.style.border = '1px solid var(--color-primary)'; };
const onBlur  = (e) => { e.currentTarget.style.border = '1px solid var(--color-border)'; };

const CAMPOS_NARRATIVOS = [
  { key: 'antecedentes',    label: '1. Antecedentes' },
  { key: 'analisis',        label: '2. Análisis' },
  { key: 'conclusiones',    label: '3. Conclusiones' },
  { key: 'recomendaciones', label: '4. Recomendaciones' },
];

export default function ModalGestionarBaja({
  open, onClose, item, modo,
  onAprobar, onDevolver, onReenviar,
}) {
  const [motivo, setMotivo]   = useState('');
  const [loading, setLoading] = useState(false);

  const [formReenvio, setFormReenvio] = useState({
    antecedentes:    item?.antecedentes    || '',
    analisis:        item?.analisis        || '',
    conclusiones:    item?.conclusiones    || '',
    recomendaciones: item?.recomendaciones || '',
  });

  const esAprobar  = modo === 'aprobar';
  const esDevolver = modo === 'devolver';
  const esReenviar = modo === 'reenviar';

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      if (esAprobar)  await onAprobar(item.id);
      if (esDevolver) await onDevolver(item.id, motivo);
      if (esReenviar) await onReenviar(item.id, formReenvio);
    } finally {
      setLoading(false);
    }
  };

  const deshabilitado = loading ||
    (esDevolver && motivo.trim().length < 5) ||
    (esReenviar && false);

  const config = {
    aprobar:  { title: 'Aprobar Baja Definitiva',         icon: 'fact_check',         headerColor: 'bg-green-50 border-green-200',  textColor: 'text-green-800' },
    devolver: { title: 'Devolver Informe para Corrección', icon: 'assignment_return',  headerColor: 'bg-amber-50 border-amber-200',  textColor: 'text-amber-800' },
    reenviar: { title: 'Corregir y Reenviar a Aprobación', icon: 'send',               headerColor: 'bg-blue-50 border-blue-200',    textColor: 'text-blue-800'  },
  }[modo] || {};

  return (
    <Modal open={open} onClose={onClose} maxWidth={esReenviar ? '720px' : '500px'}>
      <ModalHeader title={config.title} icon={config.icon} onClose={onClose} />

      <ModalBody>
        <div className="space-y-4">

          <div className={`p-4 rounded-xl border ${config.headerColor}`}>
            <p className={`text-xs font-bold mb-1 ${config.textColor}`}>
              {esAprobar  && 'Confirmación de Baja Definitiva'}
              {esDevolver && 'Motivo de Devolución'}
              {esReenviar && 'Corrección del Informe'}
            </p>
            <p className="text-[11px] text-muted leading-relaxed">
              {esAprobar  && `Al aprobar, los bienes del informe ${item?.numero_informe} quedarán desactivados permanentemente del inventario activo.`}
              {esDevolver && 'Indique las correcciones necesarias para que el elaborador pueda subsanar el informe.'}
              {esReenviar && `Corrija las secciones necesarias del informe ${item?.numero_informe}. El sistema regenerará el documento PDF automáticamente y lo enviará nuevamente a aprobación.`}
            </p>
          </div>

          {esDevolver && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-faint">
                Detalle del motivo <span className="text-red-500">*</span>
                <span className="ml-1 text-[9px] font-medium normal-case tracking-normal">(mín. 5 caracteres)</span>
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Indique qué debe corregirse en el informe..."
                rows={4}
                className="w-full text-sm rounded-xl p-3 transition-all resize-none"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
            </div>
          )}

          {esReenviar && (
            <div className="space-y-4">
              {CAMPOS_NARRATIVOS.map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-faint">{label}</label>
                  <textarea
                    value={formReenvio[key]}
                    onChange={(e) => setFormReenvio({ ...formReenvio, [key]: e.target.value })}
                    placeholder={`Ingrese ${label.toLowerCase()}...`}
                    rows={key === 'antecedentes' || key === 'analisis' ? 6 : 4}
                    className="w-full text-sm rounded-xl p-3 transition-all resize-y"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
              ))}
            </div>
          )}

        </div>
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} className="btn-secondary">Cerrar</button>
        <button
          onClick={handleConfirmar}
          disabled={deshabilitado}
          className={`flex items-center gap-2 ${esAprobar ? 'btn-primary' : esReenviar ? 'btn-primary' : 'btn-danger'}`}
        >
          {loading
            ? <span className="btn-loading-spin" />
            : <Icon name={config.icon} className="text-[18px]" />
          }
          {esAprobar  && 'Aprobar Baja'}
          {esDevolver && 'Confirmar Devolución'}
          {esReenviar && 'Reenviar a Aprobación'}
        </button>
      </ModalFooter>
    </Modal>
  );
}