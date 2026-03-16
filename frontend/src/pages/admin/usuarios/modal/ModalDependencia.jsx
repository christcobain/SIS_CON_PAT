import { useState, useEffect } from 'react';
import Modal           from '../../../../components/modal/Modal';
import ModalHeader     from '../../../../components/modal/ModalHeader';
import ModalBody       from '../../../../components/modal/ModalBody';
import ModalFooter     from '../../../../components/modal/ModalFooter';
import ConfirmDialog   from '../../../../components/feedback/ConfirmDialog';
import { useUsuarios } from '../../../../hooks/useUsuarios';
import { useToast }    from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

function Label({ children, required }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-widest mb-1"
       style={{ color: 'var(--color-text-muted)' }}>
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </p>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-[10px] text-red-500 mt-1 font-semibold">{msg}</p>;
}

function StyledInput({ value, onChange, placeholder, disabled, mono, maxLength }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      className={`w-full text-sm rounded-xl px-3 py-2.5 transition-all ${mono ? 'font-mono' : ''}`}
      style={{
        background: disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)',
        border:     '1px solid var(--color-border)',
        color:      disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
        outline:    'none',
      }}
      onFocus={(e)  => { if (!disabled) e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={(e)   => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    />
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
// Body crear/editar: { "nombre": "string", "codigo": "string" }
const FORM_INICIAL = { nombre: '', codigo: '' };

export default function ModalDependencia({ open, onClose, item = null, onGuardado }) {
  const toast      = useToast();
  const modoEditar = Boolean(item);

  // Usa useUsuarios para crear/actualizar dependencias
  const { crearDependencia, actualizarDependencia } = useUsuarios();

  const [form,           setForm]           = useState(FORM_INICIAL);
  const [errors,         setErrors]         = useState({});
  const [confirmGuardar, setConfirmGuardar] = useState(false);
  const [guardando,      setGuardando]      = useState(false);

  // Pre-llena al abrir
  useEffect(() => {
    if (!open) return;
    setForm(modoEditar && item
      ? { nombre: item.nombre ?? '', codigo: item.codigo ?? '' }
      : FORM_INICIAL
    );
    setErrors({});
  }, [open, item?.id]);

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    return e;
  };

  const handleSolicitarGuardar = () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    setConfirmGuardar(true);
  };

  const handleGuardarConfirmado = async () => {
    setGuardando(true);
    // Payload: { nombre, codigo } — codigo puede ser vacío
    const payload = {
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim() || undefined,
    };
    try {
      if (modoEditar) {
        await actualizarDependencia(item.id, payload);
        toast.success(`Dependencia "${payload.nombre}" actualizada.`);
      } else {
        await crearDependencia(payload);
        toast.success(`Dependencia "${payload.nombre}" creada.`);
      }
      onGuardado?.();
      onClose();
    } catch (e) {
      const msg = e?.response?.data?.error
        ?? Object.values(e?.response?.data ?? {})?.[0]?.[0]
        ?? 'Error al guardar la dependencia.';
      toast.error(msg);
    } finally {
      setGuardando(false);
      setConfirmGuardar(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="sm" closeOnOverlay={!guardando && !confirmGuardar}>
        <ModalHeader
          title={modoEditar ? 'Editar Dependencia' : 'Nueva Dependencia'}
          subtitle={modoEditar ? item?.nombre : 'Registrar nueva dependencia institucional'}
          icon="account_tree"
          onClose={onClose}
        />

        <ModalBody>
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <Label required>Nombre</Label>
              <StyledInput
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Coordinación de Sistemas"
                maxLength={200}
              />
              <FieldError msg={errors.nombre} />
            </div>

            {/* Código */}
            <div>
              <Label>Código</Label>
              <StyledInput
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                placeholder="Ej: COORD-SIS"
                mono
                maxLength={20}
              />
              <p className="text-[9px] mt-1" style={{ color: 'var(--color-text-faint)' }}>
                Identificador corto opcional para la dependencia.
              </p>
              <FieldError msg={errors.codigo} />
            </div>
          </div>
        </ModalBody>

        <ModalFooter align="right">
          <button onClick={onClose} disabled={guardando} className="btn-secondary">
            Cancelar
          </button>
          <button
            onClick={handleSolicitarGuardar}
            disabled={guardando}
            className="btn-primary flex items-center gap-2"
            style={{ opacity: guardando ? 0.6 : 1 }}>
            <Icon name="save" className="text-[16px]" />
            {modoEditar ? 'Actualizar' : 'Crear dependencia'}
          </button>
        </ModalFooter>
      </Modal>

      {/* ConfirmDialog — mismo patrón que UsuariosPage */}
      <ConfirmDialog
        open={confirmGuardar}
        title={modoEditar ? 'Confirmar actualización' : 'Confirmar creación'}
        message={
          modoEditar
            ? `¿Guardar los cambios de la dependencia "${form.nombre}"?`
            : `¿Crear la dependencia "${form.nombre}"${form.codigo ? ` (${form.codigo})` : ''}?`
        }
        confirmLabel={modoEditar ? 'Sí, actualizar' : 'Sí, crear'}
        variant="primary"
        loading={guardando}
        onConfirm={handleGuardarConfirmado}
        onClose={() => setConfirmGuardar(false)}
      />
    </>
  );
}