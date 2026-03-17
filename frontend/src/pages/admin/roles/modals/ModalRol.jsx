import { useState, useEffect } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useToast }  from '../../../../hooks/useToast';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const INPUT_STYLE = {
  background: 'var(--color-surface)',
  border:     '1px solid var(--color-border)',
  color:      'var(--color-text-primary)',
  outline:    'none',
};

export default function ModalRol({ open, onClose, onGuardado, crear, actualizar, actualizando, rolEditar }) {
  const toast    = useToast();
  const esEditar = !!rolEditar;

  const [form,        setForm]        = useState({ name: '', description: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirmOpen(false);
    setForm(esEditar
      ? { name: rolEditar.name ?? '', description: rolEditar.description ?? '' }
      : { name: '', description: '' }
    );
  }, [open, rolEditar?.id, esEditar]);

  const handleSubmit = async () => {
    try {
      const payload = { name: form.name, description: form.description };
      if (!esEditar) payload.permission_ids = [];
      const res = esEditar
        ? await actualizar(rolEditar.id, payload)
        : await crear(payload);
      toast.success(res?.message ?? (esEditar ? 'Rol actualizado.' : 'Rol creado. Asigna permisos desde el panel.'));
      onGuardado();
    } catch (e) {
      toast.error(
        e?.response?.data?.name?.[0] ||
        e?.response?.data?.detail    ||
        e?.response?.data?.error     ||
        'Error al guardar el rol.'
      );
    }
  };

  const handleSolicitar = () => {
    if (!form.name.trim()) { toast.error('El nombre del rol es obligatorio.'); return; }
    setConfirmOpen(true);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="sm">
        <ModalHeader
          icon={esEditar ? 'edit' : 'admin_panel_settings'}
          title={esEditar ? `Editar: ${rolEditar?.name}` : 'Nuevo rol'}
          subtitle={esEditar
            ? 'Modifica los datos del rol'
            : 'Los permisos se asignan desde el panel principal'}
          onClose={onClose}
        />

        <ModalBody>
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1.5"
                style={{ color: 'var(--color-text-muted)' }}>
                Nombre del rol <span className="text-red-500">*</span>
              </p>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value.toUpperCase().replace(/\s/g, '_') }))}
                placeholder="Ej: OPERADOR_LOGISTICO"
                className="w-full px-3 py-2.5 text-sm rounded-xl font-mono transition-all"
                style={INPUT_STYLE}
                onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
              />
              <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Solo mayúsculas y guiones bajos. Ej: COORD_SEDE
              </p>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1.5"
                style={{ color: 'var(--color-text-muted)' }}>
                Descripción
              </p>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe las responsabilidades de este rol..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-xl transition-all resize-none"
                style={INPUT_STYLE}
                onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
              />
            </div>

            {!esEditar && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                <Icon name="info" className="text-[18px] shrink-0 mt-0.5"
                  style={{ color: 'var(--color-primary)' }} />
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-body)' }}>
                  Luego de crear el rol, selecciónalo en el panel y usa la pestaña{' '}
                  <strong style={{ color: 'var(--color-primary)' }}>"Configurar permisos"</strong>{' '}
                  para asignar accesos granulares por microservicio.
                </p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter align="right">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSolicitar} disabled={actualizando}
            className="btn-primary flex items-center gap-2">
            {actualizando && <span className="btn-loading-spin" />}
            {esEditar ? 'Guardar cambios' : 'Crear rol'}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={esEditar ? 'Confirmar edición' : 'Confirmar creación'}
        message={esEditar
          ? `¿Guardar los cambios en el rol "${form.name}"?`
          : `¿Crear el nuevo rol "${form.name}"?`}
        confirmLabel={esEditar ? 'Sí, guardar' : 'Sí, crear'}
        variant="primary"
        loading={actualizando}
        onConfirm={() => { setConfirmOpen(false); handleSubmit(); }}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}