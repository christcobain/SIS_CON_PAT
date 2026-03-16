import { useState, useEffect, useMemo } from 'react';
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
  sedes:       { label: 'Sede',      icon: 'location_city', color: 'var(--color-primary)' },
  modulos:     { label: 'Módulo',    icon: 'widgets',       color: '#7c3aed'              },
  ubicaciones: { label: 'Ubicación', icon: 'room',          color: '#059669'              },
};

const EMPTY = {
  sedes:       { nombre: '', direccion: '', empresa_id: '', distrito_id: '' },
  modulos:     { nombre: '' },
  ubicaciones: { nombre: '', descripcion: '' },
};

function FieldLabel({ children, required }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </p>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1"><Icon name="error" className="text-[12px]" />{msg}</p>;
}

function FInput({ value, onChange, placeholder, disabled, autoFocus }) {
  return (
    <input type="text" value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} autoFocus={autoFocus}
      className="w-full text-sm rounded-xl px-3 py-2.5 transition-all"
      style={{ background: disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)', border: '1px solid var(--color-border)', color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)', outline: 'none', cursor: disabled ? 'not-allowed' : 'text' }}
      onFocus={e => { if (!disabled) e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    />
  );
}

function FSelect({ value, onChange, disabled, children }) {
  return (
    <select value={value} onChange={onChange} disabled={disabled}
      className="w-full text-sm rounded-xl px-3 py-2.5 transition-all cursor-pointer"
      style={{ background: disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)', border: '1px solid var(--color-border)', color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)', outline: 'none', cursor: disabled ? 'not-allowed' : 'pointer' }}
      onFocus={e => { if (!disabled) e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    >
      {children}
    </select>
  );
}

function SelectorDistrito({ departamentos, valorId, onChange }) {
  const [modo, setModo]             = useState('cascada');
  const [busqueda, setBusqueda]     = useState('');
  const [deptoId, setDeptoId]       = useState('');
  const [provId, setProvId]         = useState('');

  const todos = useMemo(() => {
    const list = [];
    (departamentos ?? []).forEach(dep =>
      (dep.provincias ?? []).forEach(prov =>
        (prov.distritos ?? []).forEach(dist =>
          list.push({ id: dist.id, nombre: dist.nombre, prov: prov.nombre, dep: dep.nombre, provId: prov.id, depId: dep.id })
        )
      )
    );
    return list;
  }, [departamentos]);

  const seleccionado = todos.find(d => String(d.id) === String(valorId));

  useEffect(() => {
    if (valorId && seleccionado) {
      setDeptoId(String(seleccionado.depId));
      setProvId(String(seleccionado.provId));
    }
  }, []);

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return todos.filter(d => d.nombre.toLowerCase().includes(q) || d.prov.toLowerCase().includes(q)).slice(0, 8);
  }, [busqueda, todos]);

  const provincias = useMemo(() => {
    if (!deptoId) return [];
    return (departamentos ?? []).find(d => String(d.id) === String(deptoId))?.provincias ?? [];
  }, [deptoId, departamentos]);

  const distritos = useMemo(() => {
    if (!provId) return [];
    return provincias.find(p => String(p.id) === String(provId))?.distritos ?? [];
  }, [provId, provincias]);

  const seleccionar = (d) => { onChange(d.id); setBusqueda(''); setDeptoId(String(d.depId)); setProvId(String(d.provId)); setModo('cascada'); };
  const limpiar = () => { onChange(''); setDeptoId(''); setProvId(''); setBusqueda(''); };

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
        {[{ id: 'cascada', icon: 'account_tree', label: 'Cascada' }, { id: 'buscar', icon: 'search', label: 'Búsqueda rápida' }].map(m => (
          <button key={m.id} type="button" onClick={() => setModo(m.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            style={{ background: modo === m.id ? 'var(--color-surface)' : 'transparent', color: modo === m.id ? 'var(--color-primary)' : 'var(--color-text-muted)', boxShadow: modo === m.id ? '0 1px 3px rgb(0 0 0 / 0.08)' : 'none' }}>
            <Icon name={m.icon} className="text-[14px]" />{m.label}
          </button>
        ))}
      </div>

      {modo === 'buscar' ? (
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none"
            style={{ color: busqueda ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Escribe el nombre del distrito…" autoFocus
            className="w-full text-sm rounded-xl pl-10 pr-10 py-2.5 transition-all"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
            onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
            onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }} />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
              <Icon name="close" className="text-[16px]" />
            </button>
          )}
          {resultados.length > 0 && (
            <div className="mt-1 rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', boxShadow: '0 4px 16px rgb(0 0 0 / 0.1)' }}>
              {resultados.map(d => (
                <button key={d.id} type="button" onClick={() => seleccionar(d)}
                  className="w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ borderBottom: '1px solid var(--color-border-light)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-alt)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <Icon name="location_on" className="text-[16px] mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{d.nombre}</p>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{d.prov} — {d.dep}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {busqueda.length >= 2 && resultados.length === 0 && (
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-text-muted)' }}>Sin resultados para "{busqueda}"</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <FieldLabel>Departamento</FieldLabel>
            <FSelect value={deptoId} onChange={e => { setDeptoId(e.target.value); setProvId(''); onChange(''); }}>
              <option value="">Seleccionar…</option>
              {(departamentos ?? []).map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </FSelect>
          </div>
          <div>
            <FieldLabel>Provincia</FieldLabel>
            <FSelect value={provId} onChange={e => { setProvId(e.target.value); onChange(''); }} disabled={!deptoId}>
              <option value="">Seleccionar…</option>
              {provincias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </FSelect>
          </div>
          <div>
            <FieldLabel required>Distrito</FieldLabel>
            <FSelect value={valorId} onChange={e => onChange(e.target.value)} disabled={!provId}>
              <option value="">Seleccionar…</option>
              {distritos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </FSelect>
          </div>
        </div>
      )}

      {seleccionado && (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgb(127 29 29 / 0.06)', border: '1px solid rgb(127 29 29 / 0.2)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="check_circle" className="text-[18px] shrink-0" style={{ color: 'var(--color-primary)' }} />
            <div className="min-w-0">
              <p className="text-sm font-black truncate" style={{ color: 'var(--color-primary)' }}>{seleccionado.nombre}</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>{seleccionado.prov} · {seleccionado.dep}</p>
            </div>
          </div>
          <button type="button" onClick={limpiar} className="btn-ghost px-2 py-1 shrink-0">
            <Icon name="close" className="text-[14px]" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ModalLocacion({
  open, onClose, activeTab, item,
  empresas = [], departamentos = [],
  crearSede, actualizarSede,
  crearModulo, actualizarModulo,
  crearUbicacion, actualizarUbicacion,
  actualizando, onGuardado,
}) {
  const toast    = useToast();
  const esEditar = !!item;
  const meta     = TAB_META[activeTab] ?? TAB_META.sedes;

  const [form,        setForm]        = useState(EMPTY[activeTab] ?? EMPTY.sedes);
  const [errors,      setErrors]      = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirmOpen(false); setErrors({});
    if (esEditar) {
      if (activeTab === 'sedes')
        setForm({ nombre: item.nombre ?? '', direccion: item.direccion ?? '', empresa_id: item.empresa_id ?? '', distrito_id: item.distrito ?? '' });
      else if (activeTab === 'modulos')
        setForm({ nombre: item.nombre ?? '' });
      else
        setForm({ nombre: item.nombre ?? '', descripcion: item.descripcion ?? '' });
    } else {
      setForm(EMPTY[activeTab] ?? EMPTY.sedes);
    }
  }, [open, item, esEditar, activeTab]);

  const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: '' })); };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    if (activeTab === 'sedes') {
      if (!form.empresa_id)  e.empresa_id  = 'Selecciona una empresa.';
      if (!form.distrito_id) e.distrito_id = 'Selecciona un distrito.';
    }
    return e;
  };

  const handleValidar = () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); toast.error('Completa los campos obligatorios.'); return; }
    setConfirmOpen(true);
  };

  const handleGuardar = async () => {
    setConfirmOpen(false);
    try {
      let payload;
      if (activeTab === 'sedes')       payload = { nombre: form.nombre, direccion: form.direccion, empresa_id: form.empresa_id, distrito: form.distrito_id };
      else if (activeTab === 'modulos') payload = { nombre: form.nombre };
      else                              payload = { nombre: form.nombre, descripcion: form.descripcion };

      if (esEditar) {
        if (activeTab === 'sedes')        await actualizarSede(item.id, payload);
        else if (activeTab === 'modulos') await actualizarModulo(item.id, payload);
        else                              await actualizarUbicacion(item.id, payload);
      } else {
        if (activeTab === 'sedes')        await crearSede(payload);
        else if (activeTab === 'modulos') await crearModulo(payload);
        else                              await crearUbicacion(payload);
      }
      toast.success(esEditar ? `${meta.label} actualizada.` : `${meta.label} registrada.`);
      onGuardado();
    } catch (e) {
      toast.error(e?.response?.data?.nombre?.[0] || e?.response?.data?.detail || e?.response?.data?.error || 'Error al guardar.');
    }
  };

  const isSede = activeTab === 'sedes';

  return (
    <>
      <Modal open={open} onClose={onClose} size={isSede ? 'xl' : 'sm'}>
        <ModalHeader icon={meta.icon}
          title={esEditar ? `Editar ${meta.label}` : `Nueva ${meta.label}`}
          subtitle={esEditar ? `Modificando "${item?.nombre}"` : `Registrar nueva ${meta.label.toLowerCase()} en el sistema`}
          onClose={onClose} />

        <ModalBody>
          {isSede ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <FieldLabel required>Nombre de la sede</FieldLabel>
                <FInput value={form.nombre} onChange={e => set('nombre', e.target.value)}
                  placeholder="Ej: Sede Central — Independencia" autoFocus />
                <FieldError msg={errors.nombre} />
              </div>

              <div>
                <FieldLabel required>Empresa / Institución</FieldLabel>
                <FSelect value={form.empresa_id} onChange={e => set('empresa_id', e.target.value)}>
                  <option value="">Seleccionar empresa…</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </FSelect>
                <FieldError msg={errors.empresa_id} />
              </div>

              <div>
                <FieldLabel>Dirección</FieldLabel>
                <FInput value={form.direccion} onChange={e => set('direccion', e.target.value)}
                  placeholder="Av. / Jr. / Calle, número…" />
              </div>

              <div className="col-span-2">
                <FieldLabel required>Ubicación geográfica</FieldLabel>
                <SelectorDistrito departamentos={departamentos} valorId={form.distrito_id} onChange={val => set('distrito_id', val)} />
                <FieldError msg={errors.distrito_id} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <FieldLabel required>Nombre {activeTab === 'modulos' ? 'del módulo' : 'de la ubicación'}</FieldLabel>
                <FInput value={form.nombre} onChange={e => set('nombre', e.target.value)}
                  placeholder={activeTab === 'modulos' ? 'Ej: Módulo de Sistemas' : 'Ej: Sala de archivos 2do piso'} autoFocus />
                <FieldError msg={errors.nombre} />
              </div>
              {activeTab === 'ubicaciones' && (
                <div>
                  <FieldLabel>Descripción</FieldLabel>
                  <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                    placeholder="Descripción del espacio físico o referencia adicional…"
                    rows={3} className="form-textarea" />
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter align="right">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleValidar} disabled={actualizando} className="btn-primary flex items-center gap-2">
            {actualizando ? <span className="btn-loading-spin" /> : <Icon name="save" className="text-[16px]" />}
            {esEditar ? 'Guardar cambios' : `Crear ${meta.label}`}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog open={confirmOpen}
        title={esEditar ? 'Confirmar edición' : 'Confirmar registro'}
        message={esEditar ? `¿Guardar los cambios en "${form.nombre}"?` : `¿Registrar la nueva ${meta.label.toLowerCase()} "${form.nombre}"?`}
        confirmLabel={esEditar ? 'Sí, actualizar' : 'Sí, registrar'}
        variant="primary" loading={actualizando}
        onConfirm={handleGuardar} onClose={() => setConfirmOpen(false)} />
    </>
  );
}