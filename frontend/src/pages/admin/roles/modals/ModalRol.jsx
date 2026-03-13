import { useState, useEffect } from 'react';
import Modal        from '../../../../components/modal/Modal';
import ModalHeader  from '../../../../components/modal/ModalHeader';
import ModalBody    from '../../../../components/modal/ModalBody';
import ModalFooter  from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useToast } from '../../../../hooks/useToast';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function ModalRol({ open, onClose, onGuardado, crear, actualizar, actualizando, rolEditar }) {
  const toast    = useToast();
  const esEditar = !!rolEditar;

  const [form,        setForm]        = useState({ name: '', description: '', is_active: true });
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirmOpen(false);
    setForm(
      esEditar
        ? { name: rolEditar.name, description: rolEditar.description ?? '', is_active: rolEditar.is_active }
        : { name: '', description: '', is_active: true }
    );
  }, [open, rolEditar, esEditar]);

  const handleSubmit = async () => {
    try {
      const res = esEditar
        ? await actualizar(rolEditar.id, { name: form.name, description: form.description, is_active: form.is_active })
        : await crear({ ...form, permission_ids: [] });

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

  const handleSolicitarConfirm = () => {
    if (!form.name.trim()) {
      toast.error('El nombre del rol es obligatorio.');
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="sm">
        <ModalHeader
          icon={esEditar ? 'edit' : 'admin_panel_settings'}
          title={esEditar ? `Editar: ${rolEditar?.name}` : 'Nuevo Rol'}
          subtitle={
            esEditar
              ? 'Modifica los datos del rol'
              : 'Crea el perfil de acceso — los permisos se asignan desde el panel principal'
          }
          onClose={onClose}
        />

        <ModalBody>
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Nombre del Rol <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value.toUpperCase().replace(/\s/g, '_') }))
                }
                placeholder="Ej: OPERADOR_LOGISTICO"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl font-mono
                           focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none
                           transition-colors placeholder:text-slate-300"
              />
              <p className="text-[10px] text-slate-400 mt-1">Solo mayúsculas y guiones bajos. Ej: COORD_SEDE</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe las responsabilidades de este rol..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl
                           focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none
                           transition-colors resize-none placeholder:text-slate-300"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-700">Rol activo</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Disponible para asignación inmediata</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200
                            ${form.is_active ? 'bg-primary' : 'bg-slate-200'}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm
                              transition-all duration-200
                              ${form.is_active ? 'left-[22px]' : 'left-0.5'}`}
                />
              </button>
            </div>

            {!esEditar && (
              <div className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Icon name="info" className="text-blue-400 text-[18px] shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-600 leading-relaxed">
                  Luego de crear el rol, selecciónalo en el panel y usa la pestaña{' '}
                  <strong>"Editar Permisos"</strong> para asignar accesos granulares por microservicio.
                </p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-500
                       border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSolicitarConfirm}
            disabled={actualizando}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-primary text-white
                       rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 shadow-sm"
          >
            {actualizando && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {esEditar ? 'Guardar cambios' : 'Crear Rol'}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={esEditar ? 'Confirmar edición de rol' : 'Confirmar creación de rol'}
        message={
          esEditar
            ? `¿Guardar los cambios en el rol "${form.name}"?`
            : `¿Crear el nuevo rol "${form.name}"? Podrás asignarle permisos desde el panel principal.`
        }
        confirmLabel={esEditar ? 'Sí, guardar' : 'Sí, crear'}
        variant="primary"
        loading={actualizando}
        onConfirm={() => { setConfirmOpen(false); handleSubmit(); }}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}