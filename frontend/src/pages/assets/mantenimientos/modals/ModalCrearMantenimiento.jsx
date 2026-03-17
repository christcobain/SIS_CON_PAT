import { useState, useEffect } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useMantenimientos } from '../../../../hooks/useMantenimientos';
import { useBienes }         from '../../../../hooks/useBienes';
import { useAuthStore }      from '../../../../store/authStore';
import { useToast }          from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const INPUT_BASE = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  outline: 'none',
};

function FLabel({ children, required }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-widest mb-1.5"
      style={{ color: 'var(--color-text-muted)' }}>
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </p>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1"><Icon name="error" className="text-[12px]" />{msg}</p>;
}

export default function ModalCrearMantenimiento({ open, onClose, onGuardado }) {
  const toast = useToast();
  const { crear } = useMantenimientos();
  const { listarPorUsuario } = useBienes();
  const user = useAuthStore(s => s.user);

  const [bienes,          setBienes]         = useState([]);
  const [loadingBienes,   setLoadingBienes]  = useState(false);
  const [seleccionados,   setSeleccionados]  = useState([]);
  const [observacion,     setObservacion]    = useState('');
  const [errors,          setErrors]         = useState({});
  const [confirm,         setConfirm]        = useState(false);
  const [guardando,       setGuardando]      = useState(false);

  useEffect(() => {
    if (!open || !user?.id) return;
    setSeleccionados([]); setObservacion(''); setErrors({});
    setLoadingBienes(true);
    listarPorUsuario(user.id)
      .then(d => setBienes(Array.isArray(d) ? d : d?.results ?? []))
      .catch(() => setBienes([]))
      .finally(() => setLoadingBienes(false));
  }, [open, user?.id]);

  const toggleBien = id => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const validar = () => {
    const e = {};
    if (!seleccionados.length) e.bienes = 'Selecciona al menos un bien.';
    return e;
  };

  const handleGuardar = async () => {
    setConfirm(false);
    setGuardando(true);
    try {
      await crear({ bien_ids: seleccionados, observacion: observacion.trim() || undefined });
      toast.success('Orden de mantenimiento creada exitosamente.');
      onGuardado();
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.response?.data?.detail || 'Error al crear el mantenimiento.');
    } finally { setGuardando(false); }
  };

  const handleSolicitar = () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    setConfirm(true);
  };

  const getIconByTipo = (nombre = '') => {
    const n = nombre.toUpperCase();
    if (n.includes('CPU') || n.includes('COMPU')) return 'computer';
    if (n.includes('MONITOR'))   return 'desktop_windows';
    if (n.includes('IMPRESORA')) return 'print';
    return 'devices';
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="lg">
        <ModalHeader icon="build_circle" title="Nueva orden de mantenimiento"
          subtitle="Selecciona los bienes que requieren mantenimiento" onClose={onClose} />
        <ModalBody>
          <div className="space-y-4">
            <div>
              <FLabel required>Bienes disponibles ({bienes.length})</FLabel>
              {loadingBienes ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
              ) : bienes.length === 0 ? (
                <div className="text-center py-8 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                  <Icon name="inventory_2" className="text-[36px]" style={{ color: 'var(--color-text-faint)' }} />
                  <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Sin bienes asignados a tu usuario</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {bienes.map(b => {
                    const sel = seleccionados.includes(b.id);
                    return (
                      <label key={b.id} className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer"
                        style={{
                          background: sel ? 'rgb(127 29 29 / 0.06)' : 'var(--color-surface-alt)',
                          border: `1px solid ${sel ? 'rgb(127 29 29 / 0.3)' : 'var(--color-border)'}`,
                        }}>
                        <div className="relative size-5 shrink-0">
                          <input type="checkbox" checked={sel} onChange={() => toggleBien(b.id)}
                            className="appearance-none size-5 rounded transition-all"
                            style={{ border: `2px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`, background: sel ? 'var(--color-primary)' : 'transparent' }} />
                          {sel && <Icon name="check" className="absolute inset-0 text-[13px] text-white pointer-events-none flex items-center justify-center" />}
                        </div>
                        <div className="size-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: sel ? 'rgb(127 29 29 / 0.1)' : 'var(--color-border-light)' }}>
                          <Icon name={getIconByTipo(b.tipo_bien_nombre)} className="text-[16px]"
                            style={{ color: sel ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {b.tipo_bien_nombre} — {b.marca_nombre}
                          </p>
                          <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                            {b.codigo_patrimonial || 'Sin código'} · {b.modelo}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold shrink-0"
                          style={{ color: sel ? 'var(--color-primary)' : 'var(--color-text-faint)' }}>
                          {sel ? 'Seleccionado' : ''}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <FieldError msg={errors.bienes} />
              {seleccionados.length > 0 && (
                <p className="text-[11px] font-bold mt-2" style={{ color: 'var(--color-primary)' }}>
                  {seleccionados.length} bien(es) seleccionado(s)
                </p>
              )}
            </div>

            <div>
              <FLabel>Observación inicial</FLabel>
              <textarea value={observacion} onChange={e => setObservacion(e.target.value)} rows={3}
                placeholder="Describe brevemente el problema o motivo del mantenimiento..."
                className="w-full text-sm rounded-xl px-3 py-2.5 transition-all resize-none"
                style={INPUT_BASE}
                onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter align="right">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSolicitar} disabled={guardando} className="btn-primary flex items-center gap-2">
            {guardando ? <span className="btn-loading-spin" /> : <Icon name="build_circle" className="text-[16px]" />}
            Crear orden
          </button>
        </ModalFooter>
      </Modal>
      <ConfirmDialog open={confirm}
        title="Confirmar creación"
        message={`¿Crear orden de mantenimiento con ${seleccionados.length} bien(es)?`}
        confirmLabel="Sí, crear" variant="primary" loading={guardando}
        onConfirm={handleGuardar} onClose={() => setConfirm(false)} />
    </>
  );
}