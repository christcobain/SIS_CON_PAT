import { useState, useEffect } from 'react';
import Modal          from '../../../../components/modal/Modal';
import ModalHeader    from '../../../../components/modal/ModalHeader';
import ModalBody      from '../../../../components/modal/ModalBody';
import ModalFooter    from '../../../../components/modal/ModalFooter';
import ConfirmDialog  from '../../../../components/feedback/ConfirmDialog';
import Can            from '../../../../components/auth/Can'; 
import { useToast }   from '../../../../hooks/useToast';
import { useAuth }    from '../../../../hooks/useAuth';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const S = {
  input: {
    base: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      color: 'var(--color-text-primary)',
      outline: 'none',
    },
  },
};

const FORM_VACIO = {
  name: '',
  min_length: 8,
  require_upper: true,
  require_lower: true,
  require_digit: true,
  require_special: false,
  expiration_days: 90,
  warning_days: 10,
  history_count: 5,
};

function FLabel({ children, required }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-widest mb-1.5"
      style={{ color: 'var(--color-text-muted)' }}>
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </p>
  );
}

function FText({ value, onChange, placeholder }) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm rounded-xl px-3 py-2.5 transition-all"
      style={S.input.base}
      onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    />
  );
}

function FNum({ value, onChange, min = 1 }) {
  return (
    <input type="number" value={value} min={min} onChange={e => onChange(Number(e.target.value))}
      className="w-full text-sm rounded-xl px-3 py-2.5 transition-all text-center font-black"
      style={S.input.base}
      onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    />
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl transition-all"
      style={{
        background: value ? 'rgb(127 29 29 / 0.06)' : 'var(--color-surface-alt)',
        border: `1px solid ${value ? 'rgb(127 29 29 / 0.2)' : 'var(--color-border)'}`,
      }}>
      <div className="flex items-center gap-2 min-w-0">
        <Icon name={value ? 'check_circle' : 'radio_button_unchecked'} className="text-[16px] shrink-0"
          style={{ color: value ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
        <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-body)' }}>{label}</span>
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={value ? 'toggle-on' : 'toggle-off'} style={{ flexShrink: 0 }}>
        <span className={value ? 'toggle-thumb-on' : 'toggle-thumb-off'} />
      </button>
    </div>
  );
}

function ModalPolitica({ open, onClose, item, onGuardado }) {
  const toast    = useToast();
  const { crearPolitica, actualizarPolitica } = useAuth();
  const esEditar = !!item;
  const [form, setForm]         = useState({ ...FORM_VACIO });
  const [guardando, setGuardando] = useState(false);
  const [confirm, setConfirm]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirm(false);
    setForm(item ? {
      name:            item.name            ?? '',
      min_length:      item.min_length       ?? 8,
      require_upper:   item.require_upper    ?? true,
      require_lower:   item.require_lower    ?? true,
      require_digit:   item.require_digit    ?? true,
      require_special: item.require_special  ?? false,
      expiration_days: item.expiration_days  ?? 90,
      warning_days:    item.warning_days     ?? 10,
      history_count:   item.history_count    ?? 5,
    } : { ...FORM_VACIO });
  }, [open, item?.id]);// eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    setConfirm(false);
    setGuardando(true);
    try {
      if (esEditar) {
        await actualizarPolitica(item.id, form);
      } else {
        await crearPolitica(form);
      }
      toast.success(esEditar ? 'Política actualizada.' : 'Política creada.');
      onGuardado();
    } catch (e) {
      toast.error(e?.response?.data?.detail || e?.response?.data?.error || 'Error al guardar la política.');
    } finally { setGuardando(false); }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="lg">
        <ModalHeader
          icon="policy"
          title={esEditar ? `Editar política` : 'Nueva política de contraseña'}
          subtitle={esEditar ? `Modificando: ${item?.name}` : 'Configura las reglas de seguridad para contraseñas'}
          onClose={onClose}
        />
        <ModalBody>
          <div className="space-y-5">
            <div>
              <FLabel required>Nombre de la política</FLabel>
              <FText value={form.name} onChange={v => set('name', v)} placeholder="Ej: Política Estándar CSJLN" />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2"
                style={{ color: 'var(--color-text-muted)' }}>
                <Icon name="tune" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />
                Parámetros numéricos
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-3 rounded-xl"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                  <Icon name="straighten" className="text-[20px] mb-1.5" style={{ color: 'var(--color-primary)' }} />
                  <FLabel required>Longitud mín.</FLabel>
                  <FNum value={form.min_length} onChange={v => set('min_length', v)} min={4} />
                  <p className="text-[9px] mt-1" style={{ color: 'var(--color-text-faint)' }}>caracteres</p>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                  <Icon name="schedule" className="text-[20px] mb-1.5" style={{ color: '#b45309' }} />
                  <FLabel required>Expiración</FLabel>
                  <FNum value={form.expiration_days} onChange={v => set('expiration_days', v)} />
                  <p className="text-[9px] mt-1" style={{ color: 'var(--color-text-faint)' }}>días</p>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                  <Icon name="warning" className="text-[20px] mb-1.5" style={{ color: '#d97706' }} />
                  <FLabel>Alerta previa</FLabel>
                  <FNum value={form.warning_days} onChange={v => set('warning_days', v)} />
                  <p className="text-[9px] mt-1" style={{ color: 'var(--color-text-faint)' }}>días antes</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex flex-col items-center p-3 rounded-xl max-w-[180px]"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                  <Icon name="history" className="text-[20px] mb-1.5" style={{ color: '#1d4ed8' }} />
                  <FLabel>Historial contraseñas</FLabel>
                  <FNum value={form.history_count} onChange={v => set('history_count', v)} />
                  <p className="text-[9px] mt-1" style={{ color: 'var(--color-text-faint)' }}>registros previos</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2"
                style={{ color: 'var(--color-text-muted)' }}>
                <Icon name="security" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />
                Requisitos de complejidad
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <Toggle value={form.require_upper}   onChange={v => set('require_upper', v)}   label="Mayúscula requerida"  />
                <Toggle value={form.require_lower}   onChange={v => set('require_lower', v)}   label="Minúscula requerida"  />
                <Toggle value={form.require_digit}   onChange={v => set('require_digit', v)}   label="Dígito requerido"     />
                <Toggle value={form.require_special} onChange={v => set('require_special', v)} label="Carácter especial"    />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter align="right">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={() => setConfirm(true)} disabled={guardando || !form.name.trim()}
            className="btn-primary flex items-center gap-2">
            {guardando ? <span className="btn-loading-spin" /> : <Icon name="save" className="text-[16px]" />}
            {esEditar ? 'Guardar cambios' : 'Crear política'}
          </button>
        </ModalFooter>
      </Modal>
      <ConfirmDialog open={confirm}
        title={esEditar ? 'Confirmar edición' : 'Confirmar creación'}
        message={`¿${esEditar ? 'Guardar cambios en' : 'Crear'} la política "${form.name}"?`}
        confirmLabel={esEditar ? 'Sí, guardar' : 'Sí, crear'} variant="primary" loading={guardando}
        onConfirm={handleGuardar} onClose={() => setConfirm(false)} />
    </>
  );
}

export default function PoliticasTabla({ items = [], loading, onReload }) {
  const toast = useToast();
  const { activarPolitica, desactivarPolitica } = useAuth();
  const [modalForm,     setModalForm]     = useState(false);
  const [itemEditar,    setItemEditar]    = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [itemToggle,    setItemToggle]    = useState(null);
  const [toggling,      setToggling]      = useState(false);

  const handleToggle = async () => {
    setConfirmToggle(false);
    setToggling(true);
    try {
      if (itemToggle.is_active) {
        await desactivarPolitica(itemToggle.id);
        toast.success('Política desactivada.');
      } else {
        await activarPolitica(itemToggle.id);
        toast.success('Política activada.');
      }
      onReload();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al cambiar estado.');
    } finally { setToggling(false); setItemToggle(null); }
  };

  const bool = v => v
    ? <Icon name="check_circle" className="text-[15px]" style={{ color: '#16a34a' }} />
    : <Icon name="cancel"       className="text-[15px]" style={{ color: 'var(--color-text-faint)' }} />;

  if (loading) return (
    <div className="space-y-3">{[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {/* Registro de nueva política protegido */}
        <Can perform="ms-usuarios:authentication:add_passwordpolicy">
          <button onClick={() => { setItemEditar(null); setModalForm(true); }}
            className="btn-primary flex items-center gap-2 px-4">
            <Icon name="add" className="text-[18px]" />Nueva política
          </button>
        </Can>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-14 card rounded-xl">
          <Icon name="policy" className="text-[48px]" style={{ color: 'var(--color-text-faint)' }} />
          <p className="text-sm font-semibold mt-3" style={{ color: 'var(--color-text-muted)' }}>Sin políticas registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(p => (
            <div key={p.id} className="card p-5 flex flex-col gap-4"
              style={{ border: p.is_active ? '1px solid rgb(127 29 29 / 0.3)' : undefined }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-sm" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: p.is_active ? 'rgb(22 163 74 / 0.1)' : 'var(--color-border-light)', color: p.is_active ? '#16a34a' : 'var(--color-text-muted)' }}>
                      <span className={`size-1.5 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                      {p.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>ID #{p.id}</p>
                </div>
                
                {/* Botones de acción protegidos con change_passwordpolicy */}
                <Can perform="ms-usuarios:authentication:add_passwordpolicy">
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setItemEditar(p); setModalForm(true); }}
                      className="size-8 flex items-center justify-center rounded-lg transition-all cursor-pointer"
                      style={{ color: '#b45309' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgb(180 83 9 / 0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <Icon name="edit" className="text-[18px]" />
                    </button>
                    <button onClick={() => { setItemToggle(p); setConfirmToggle(true); }}
                      className="size-8 flex items-center justify-center rounded-lg transition-all cursor-pointer"
                      style={{ color: p.is_active ? '#dc2626' : '#16a34a' }}
                      onMouseEnter={e => { e.currentTarget.style.background = p.is_active ? 'rgb(220 38 38 / 0.1)' : 'rgb(22 163 74 / 0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <Icon name={p.is_active ? 'toggle_off' : 'toggle_on'} className="text-[18px]" />
                    </button>
                  </div>
                </Can>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Longitud mín.', value: `${p.min_length} chars`, icon: 'straighten' },
                  { label: 'Expiración',     value: `${p.expiration_days} días`, icon: 'schedule' },
                  { label: 'Alerta',         value: `${p.warning_days} días`, icon: 'warning'   },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                    <Icon name={s.icon} className="text-[15px] shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest truncate" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                      <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                <p className="text-[9px] font-black uppercase tracking-widest shrink-0" style={{ color: 'var(--color-text-muted)' }}>Req.</p>
                {[
                  { label: 'Mayúsc.',  v: p.require_upper   },
                  { label: 'Minúsc.',  v: p.require_lower   },
                  { label: 'Dígito',   v: p.require_digit   },
                  { label: 'Especial', v: p.require_special },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-1">
                    {bool(r.v)}
                    <span className="text-[10px]" style={{ color: 'var(--color-text-body)' }}>{r.label}</span>
                  </div>
                ))}
                <span className="ml-auto text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Historial: {p.history_count} reg.
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <ModalPolitica open={modalForm}
        onClose={() => { setModalForm(false); setItemEditar(null); }}
        item={itemEditar}
        onGuardado={() => { setModalForm(false); setItemEditar(null); onReload(); }} />

      <ConfirmDialog open={confirmToggle}
        title={itemToggle?.is_active ? 'Desactivar política' : 'Activar política'}
        message={`¿${itemToggle?.is_active ? 'Desactivar' : 'Activar'} la política "${itemToggle?.name}"?`}
        confirmLabel={itemToggle?.is_active ? 'Sí, desactivar' : 'Sí, activar'}
        variant={itemToggle?.is_active ? 'danger' : 'primary'} loading={toggling}
        onConfirm={handleToggle} onClose={() => { setConfirmToggle(false); setItemToggle(null); }} />
    </div>
  );
}