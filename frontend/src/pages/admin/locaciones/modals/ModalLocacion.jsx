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
const TAB_META = {
  sedes:       { label: 'Sede',      icon: 'location_city' },
  modulos:     { label: 'Módulo',    icon: 'widgets'       },
  ubicaciones: { label: 'Ubicación', icon: 'room'          },
};

const EMPTY = {
  sedes:       { nombre: '', direccion: '', empresa_id: '', distrito: '', is_active: true },
  modulos:     { nombre: '', is_active: true },
  ubicaciones: { nombre: '', descripcion: '', is_active: true },
};

export default function ModalLocacion({
  open, onClose, activeTab, item,
  empresas = [],
  crearSede, actualizarSede,
  crearModulo, actualizarModulo,
  crearUbicacion, actualizarUbicacion,
  actualizando, onGuardado,
}) {
  const toast    = useToast();
  const esEditar = !!item;
  const meta     = TAB_META[activeTab] ?? TAB_META.sedes;

  const [form,        setForm]        = useState(EMPTY[activeTab] ?? EMPTY.sedes);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirmOpen(false);
    if (esEditar) {
      if (activeTab === 'sedes') {
        setForm({
          nombre:     item.nombre     ?? '',
          direccion:  item.direccion  ?? '',
          empresa_id: item.empresa_id ?? '',
          distrito:   item.distrito   ?? '',
          is_active:  item.is_active  ?? true,
        });
      } else if (activeTab === 'modulos') {
        setForm({ nombre: item.nombre ?? '', is_active: item.is_active ?? true });
      } else {
        setForm({ nombre: item.nombre ?? '', descripcion: item.descripcion ?? '', is_active: item.is_active ?? true });
      }
    } else {
      setForm(EMPTY[activeTab] ?? EMPTY.sedes);
    }
  }, [open, item, esEditar, activeTab]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleValidar = () => {
    if (!form.nombre.trim())                         { toast.error('El nombre es obligatorio.');  return; }
    if (activeTab === 'sedes' && !form.empresa_id)   { toast.error('Selecciona una empresa.');    return; }
    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    try {
      let payload = { nombre: form.nombre, is_active: form.is_active };
      if (activeTab === 'sedes') {
        payload = { ...payload, empresa_id: Number(form.empresa_id), direccion: form.direccion || undefined };
        if (form.distrito) payload.distrito = Number(form.distrito);
      } else if (activeTab === 'ubicaciones') {
        payload = { ...payload, descripcion: form.descripcion || undefined };
      }
      let res;
      if      (activeTab === 'sedes')   res = esEditar ? await actualizarSede(item.id, payload)      : await crearSede(payload);
      else if (activeTab === 'modulos') res = esEditar ? await actualizarModulo(item.id, payload)    : await crearModulo(payload);
      else                              res = esEditar ? await actualizarUbicacion(item.id, payload) : await crearUbicacion(payload);

      toast.success(res?.message ?? (esEditar ? `${meta.label} actualizada.` : `${meta.label} registrada.`));
      onGuardado();
    } catch (e) {
      toast.error(
        e?.response?.data?.nombre?.[0] ||
        e?.response?.data?.detail      ||
        e?.response?.data?.error       ||
        'Error al guardar.'
      );
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="md">
        <ModalHeader
          icon={meta.icon}
          title={esEditar ? `Editar ${meta.label}` : `Nueva ${meta.label}`}
          subtitle={esEditar
            ? `Modificando "${item?.nombre}"`
            : `Registrar nueva ${meta.label.toLowerCase()} en el sistema`}
          onClose={onClose}
        />

        <ModalBody>
          <div className="space-y-4">

            {/* ── Nombre — todos los tabs ── */}
            <div>
              <label className="form-label">Nombre <span className="text-red-500">*</span></label>
              <input
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                placeholder={`Nombre de la ${meta.label.toLowerCase()}…`}
                className="form-input"
                autoFocus
              />
            </div>

            {/* ── Campos exclusivos: SEDES ── */}
            {activeTab === 'sedes' && (
              <>
                <div>
                  <label className="form-label">Empresa <span className="text-red-500">*</span></label>
                  <select value={form.empresa_id} onChange={(e) => set('empresa_id', e.target.value)} className="form-select">
                    <option value="">Seleccionar empresa…</option>
                    {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Dirección</label>
                  <input
                    value={form.direccion}
                    onChange={(e) => set('direccion', e.target.value)}
                    placeholder="Av. / Jr. / Calle, número, distrito…"
                    className="form-input"
                  />
                </div>
                {/* Nota informativa sobre ubicación geográfica */}
                <div
                  className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)' }}
                >
                  <Icon name="info" className="text-[16px] shrink-0 mt-0.5 text-primary/60" />
                  <p>El distrito, provincia y departamento se configuran desde el panel de administración del sistema.</p>
                </div>
              </>
            )}

            {/* ── Campos exclusivos: UBICACIONES ── */}
            {activeTab === 'ubicaciones' && (
              <div>
                <label className="form-label">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => set('descripcion', e.target.value)}
                  placeholder="Descripción del espacio físico o referencia adicional…"
                  rows={3}
                  className="form-textarea"
                />
              </div>
            )}

            {/* ── Toggle activo — todos los tabs ── */}
            <div
              className="flex items-center justify-between p-3.5 rounded-xl"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border-light)' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-body)' }}>
                  Registro activo
                </p>
                <p className="form-hint mt-0">Visible y disponible en el sistema</p>
              </div>
              <button
                type="button"
                onClick={() => set('is_active', !form.is_active)}
                className={form.is_active ? 'toggle-on' : 'toggle-off'}
              >
                <span className={form.is_active ? 'toggle-thumb-on' : 'toggle-thumb-off'} />
              </button>
            </div>

          </div>
        </ModalBody>

        <ModalFooter>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleValidar} disabled={actualizando} className="btn-primary">
            {actualizando && <span className="btn-loading-spin" />}
            {esEditar ? 'Guardar cambios' : `Crear ${meta.label}`}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={esEditar ? 'Confirmar edición' : 'Confirmar registro'}
        message={esEditar
          ? `¿Guardar los cambios en "${form.nombre}"?`
          : `¿Registrar la nueva ${meta.label.toLowerCase()} "${form.nombre}"?`}
        confirmLabel={esEditar ? 'Sí, guardar' : 'Sí, registrar'}
        variant="primary"
        loading={actualizando}
        onConfirm={() => { setConfirmOpen(false); handleSubmit(); }}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}