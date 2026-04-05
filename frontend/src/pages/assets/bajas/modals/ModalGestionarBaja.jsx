import { useState } from 'react';
import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';

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

const CAMPOS_NARRATIVOS = [
  { key: 'antecedentes',    label: '1. Antecedentes',    rows: 6 },
  { key: 'analisis',        label: '2. Análisis',        rows: 6 },
  { key: 'conclusiones',    label: '3. Conclusiones',    rows: 4 },
  { key: 'recomendaciones', label: '4. Recomendaciones', rows: 4 },
];

const CFG = {
  aprobar: {
    title: 'Aprobar Baja Definitiva',
    icon:  'fact_check',
    infoColor: '#16a34a',
    infoBg: 'rgb(22 163 74 / 0.06)',
    infoBorder: 'rgb(22 163 74 / 0.2)',
    infoTitle: 'Confirmación de Baja Definitiva',
  },
  devolver: {
    title: 'Devolver Informe para Corrección',
    icon:  'assignment_return',
    infoColor: '#b45309',
    infoBg: 'rgb(180 83 9 / 0.06)',
    infoBorder: 'rgb(180 83 9 / 0.2)',
    infoTitle: 'Motivo de Devolución',
  },
  reenviar: {
    title: 'Corregir y Reenviar a Aprobación',
    icon:  'send',
    infoColor: '#1d4ed8',
    infoBg: 'rgb(37 99 235 / 0.06)',
    infoBorder: 'rgb(37 99 235 / 0.2)',
    infoTitle: 'Corrección del Informe',
  },
};

export default function ModalGestionarBaja({
  open, onClose, item, modo, acciones, onAccionExitosa,
}) {
  const [motivo,  setMotivo]  = useState('');
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

  const cfg = CFG[modo] || CFG.aprobar;

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      let res;
      if (esAprobar)  res = await acciones.aprobar(item.id);
      if (esDevolver) res = await acciones.devolver(item.id, motivo);
      if (esReenviar) res = await acciones.reenviar(item.id, formReenvio);
      onAccionExitosa(res);
    } finally {
      setLoading(false);
    }
  };

  const deshabilitado = loading ||
    (esDevolver && motivo.trim().length < 5);

  return (
    <Modal open={open} onClose={onClose} size={esReenviar ? 'xl' : 'md'}>
      <ModalHeader title={cfg.title} icon={cfg.icon} onClose={onClose} />

      <ModalBody>
        <div className="space-y-4">

          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: cfg.infoBg, border: `1px solid ${cfg.infoBorder}` }}>
            <Icon name="info" className="text-[14px] shrink-0 mt-0.5" style={{ color: cfg.infoColor }} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: cfg.infoColor }}>
                {cfg.infoTitle}
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-body)' }}>
                {esAprobar  && `Al aprobar, los bienes del informe ${item?.numero_informe} quedarán desactivados permanentemente del inventario activo.`}
                {esDevolver && 'Indique las correcciones necesarias para que el elaborador pueda subsanar el informe.'}
                {esReenviar && `Corrija las secciones necesarias del informe ${item?.numero_informe}. El sistema regenerará el documento PDF automáticamente y lo enviará nuevamente a aprobación.`}
              </p>
            </div>
          </div>

          {esDevolver && (
            <div>
              <FLabel required hint="mín. 5 caracteres">Detalle del motivo</FLabel>
              <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)}
                placeholder="Indique qué debe corregirse en el informe..."
                rows={4} className="w-full text-sm rounded-xl p-3 transition-all resize-none"
                style={S.input} onFocus={onF} onBlur={offF} />
              {motivo.trim().length > 0 && motivo.trim().length < 5 && (
                <p className="text-[10px] text-red-500 mt-1 font-semibold">Mínimo 5 caracteres.</p>
              )}
            </div>
          )}

          {esReenviar && (
            <div className="space-y-4">
              {CAMPOS_NARRATIVOS.map(({ key, label, rows }) => (
                <div key={key}>
                  <FLabel>{label}</FLabel>
                  <textarea
                    value={formReenvio[key]}
                    onChange={(e) => setFormReenvio({ ...formReenvio, [key]: e.target.value })}
                    placeholder={`Ingrese ${label.toLowerCase()}...`}
                    rows={rows}
                    className="w-full text-sm rounded-xl p-3 transition-all resize-y"
                    style={S.input} onFocus={onF} onBlur={offF}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter align="right">
        <button onClick={onClose} className="btn-secondary">Cerrar</button>
        <button onClick={handleConfirmar} disabled={deshabilitado}
          className={`flex items-center gap-2 ${esAprobar || esReenviar ? 'btn-primary' : ''}`}
          style={(!esAprobar && !esReenviar) ? {
            background: 'rgb(180 83 9 / 0.1)', color: '#b45309',
            border: '1px solid rgb(180 83 9 / 0.25)',
            padding: '0.5rem 1rem', borderRadius: '0.75rem',
            fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer',
            opacity: deshabilitado ? 0.5 : 1,
          } : undefined}>
          {loading
            ? <span className="btn-loading-spin" />
            : <Icon name={cfg.icon} className="text-[16px]" />
          }
          {esAprobar  && 'Aprobar Baja'}
          {esDevolver && 'Confirmar Devolución'}
          {esReenviar && 'Reenviar a Aprobación'}
        </button>
      </ModalFooter>
    </Modal>
  );
}