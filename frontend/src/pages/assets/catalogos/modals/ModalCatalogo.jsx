import { useState, useEffect } from 'react';
import Modal          from '../../../../components/modal/Modal';
import ModalHeader    from '../../../../components/modal/ModalHeader';
import ModalBody      from '../../../../components/modal/ModalBody';
import ModalFooter    from '../../../../components/modal/ModalFooter';
import ConfirmDialog  from '../../../../components/feedback/ConfirmDialog';
import { useCatalogos } from '../../../../hooks/useCatalogos';
import { useToast }   from '../../../../hooks/useToast';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
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

function StyledInput({ value, onChange, placeholder, disabled, autoFocus }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      className="w-full text-sm rounded-xl px-3 py-2.5 transition-all"
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

function StyledTextarea({ value, onChange, placeholder, disabled }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={3}
      className="w-full text-sm rounded-xl px-3 py-2.5 transition-all resize-none"
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
// Body crear/actualizar: { nombre: string, descripcion: string }
// catalogoKey → key en catalogosService (ej. 'marcas', 'tiposBien')
// catalogoMeta → objeto de CATALOGOS_META para mostrar ícono y label
const FORM_INICIAL = { nombre: '', descripcion: '' };

export default function ModalCatalogo({ open, onClose, item = null, catalogoKey, catalogoMeta, onGuardado }) {
  const toast      = useToast();
  const modoEditar = Boolean(item);

  const { crearItem, actualizarItem } = useCatalogos();

  const [form,           setForm]           = useState(FORM_INICIAL);
  const [errors,         setErrors]         = useState({});
  const [confirmGuardar, setConfirmGuardar] = useState(false);
  const [guardando,      setGuardando]      = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(modoEditar && item
      ? { nombre: item.nombre ?? '', descripcion: item.descripcion ?? '' }
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
    if (!catalogoKey) return;
    setGuardando(true);
    const payload = {
      nombre:      form.nombre.trim(),
      descripcion: form.descripcion.trim(),
    };
    try {
      if (modoEditar) {
        await actualizarItem(catalogoKey, item.id, payload);
        toast.success(`"${payload.nombre}" actualizado correctamente.`);
      } else {
        await crearItem(catalogoKey, payload);
        toast.success(`"${payload.nombre}" creado correctamente.`);
      }
      onGuardado?.();
      onClose();
    } catch (e) {
      const msg = e?.response?.data?.error
        ?? Object.values(e?.response?.data ?? {})?.[0]?.[0]
        ?? 'Error al guardar.';
      toast.error(msg);
    } finally {
      setGuardando(false);
      setConfirmGuardar(false);
    }
  };

  const catalogoLabel = catalogoMeta?.label ?? 'Catálogo';

  return (
    <>
      <Modal open={open} onClose={onClose} size="sm" closeOnOverlay={!guardando && !confirmGuardar}>
        <ModalHeader
          title={modoEditar ? `Editar ${catalogoLabel}` : `Nuevo registro — ${catalogoLabel}`}
          subtitle={modoEditar ? item?.nombre : `Registrar en ${catalogoLabel}`}
          icon={catalogoMeta?.icon ?? 'category'}
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
                placeholder={`Ej: ${catalogoMeta?.label ?? 'Nombre del registro'}`}
                autoFocus
              />
              <FieldError msg={errors.nombre} />
            </div>

            {/* Descripción */}
            <div>
              <Label>Descripción</Label>
              <StyledTextarea
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Descripción opcional..."
              />
            </div>

            {/* Info del catálogo */}
            {catalogoMeta?.descripcion && (
              <div className="flex items-start gap-2 p-3 rounded-xl"
                   style={{ background: 'rgba(127,29,29,0.04)', border: '1px solid rgba(127,29,29,0.12)' }}>
                <Icon name="info" className="text-[15px] shrink-0 mt-0.5 text-primary" />
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {catalogoMeta.descripcion}
                </p>
              </div>
            )}
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
            {modoEditar ? 'Actualizar' : 'Crear registro'}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={confirmGuardar}
        title={modoEditar ? 'Confirmar actualización' : 'Confirmar creación'}
        message={
          modoEditar
            ? `¿Guardar los cambios de "${form.nombre}" en ${catalogoLabel}?`
            : `¿Crear el registro "${form.nombre}" en ${catalogoLabel}?`
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