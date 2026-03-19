import { useState, useEffect } from 'react';
import Modal           from '../../../../components/modal/Modal';
import ModalHeader     from '../../../../components/modal/ModalHeader';
import ModalBody       from '../../../../components/modal/ModalBody';
import ModalFooter     from '../../../../components/modal/ModalFooter';
import ConfirmDialog   from '../../../../components/feedback/ConfirmDialog';
import { useUsuarios } from '../../../../hooks/useUsuarios';
import { useLocaciones } from '../../../../hooks/useLocaciones';
import { useRoles }    from '../../../../hooks/useRoles';
import { useToast }    from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

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

function StyledInput({ value, onChange, placeholder, disabled, mono, onKeyDown, type = 'text', maxLength }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      className={`w-full text-sm rounded-xl px-3 py-2.5 transition-all ${mono ? 'font-mono tracking-wider' : ''}`}
      style={{
        background: disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'text',
      }}
      onFocus={e => { if (!disabled) e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    />
  );
}

function StyledSelect({ value, onChange, disabled, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full text-sm rounded-xl px-3 py-2.5 transition-all cursor-pointer"
      style={{
        background: disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onFocus={e => { if (!disabled) e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    >
      {children}
    </select>
  );
}

function PasoIndicador({ pasoActual, total }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="size-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all"
            style={{
              background: i + 1 <= pasoActual ? 'var(--color-primary)' : 'var(--color-border)',
              color: i + 1 <= pasoActual ? '#fff' : 'var(--color-text-muted)',
            }}
          >
            {i + 1 < pasoActual ? <Icon name="check" className="text-[12px]" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className="h-0.5 w-8 rounded-full transition-all" style={{ background: i + 1 < pasoActual ? 'var(--color-primary)' : 'var(--color-border)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

function SedesMultiSelect({ sedes, selected, onChange, disabled }) {
  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id];
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {sedes.map(s => {
        const sel = selected.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(s.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer"
            style={{
              background: sel ? 'rgb(127 29 29 / 0.08)' : 'var(--color-surface-alt)',
              border: `1px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`,
              color: sel ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}
          >
            <Icon name={sel ? 'check_circle' : 'radio_button_unchecked'} className="text-[14px]" />
            {s.nombre}
          </button>
        );
      })}
      {sedes.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No hay sedes disponibles.</p>
      )}
    </div>
  );
}

const FORM_INICIAL = { dni: '', role: '', sedes: [], dependencia: '', modulo: '', es_usuario_sistema: true };

export default function ModalUsuario({ open, onClose, item = null, onGuardado }) {
  const toast = useToast();
  const modoEditar = Boolean(item);

  const { crear, actualizar, buscarEmpleado, listarDependencias } = useUsuarios();
  const { sedes, modulos, loading: loadingLoc } = useLocaciones();
  const { roles, loading: loadingRoles } = useRoles();

  const [dependencias, setDependencias] = useState([]);
  const [loadingDeps, setLoadingDeps] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingDeps(true);
    listarDependencias()
      .then(d => { if (!cancelled) setDependencias(Array.isArray(d) ? d : d?.results ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingDeps(false); });
    return () => { cancelled = true; };
  }, [open]);

  const loadingCat = loadingLoc || loadingRoles || loadingDeps;

  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState(FORM_INICIAL);
  const [errors, setErrors] = useState({});
  const [dni, setDni] = useState('');
  const [empleado, setEmpleado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [errorDni, setErrorDni] = useState('');
  const [confirmGuardar, setConfirmGuardar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPaso(1);
    setErrors({});
    setErrorDni('');
    if (modoEditar && item) {
      setDni(item.dni ?? '');
      setEmpleado({ first_name: item.first_name, last_name: item.last_name, cargo: item.cargo, modulo: item.modulo_rrhh });
      setForm({
        dni: item.dni ?? '',
        role: item.role?.id ?? '',
        sedes: (item.sedes ?? []).map(s => s.id),
        dependencia: item.dependencia?.id ?? '',
        modulo: item.modulo?.id ?? '',
        es_usuario_sistema: item.es_usuario_sistema ?? true,
      });
      setPaso(2);
    } else {
      setDni('');
      setEmpleado(null);
      setForm(FORM_INICIAL);
    }
  }, [open, item, modoEditar]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleBuscarDni = async () => {
    const dnilimpio = dni.trim();
    if (!dnilimpio || dnilimpio.length < 8) { 
      setErrorDni('El DNI debe tener al menos 8 dígitos.'); 
      return; 
    }
    setErrorDni('');
    setBuscando(true);
    try {
      const data = await buscarEmpleado(dnilimpio);
      if (data?.success === false) {
      setErrorDni(data?.error?.detail || 'No se encontró el empleado.');
      return;
    }
      setEmpleado(data);
      setForm(f => ({ ...f, dni: dnilimpio }));
      setPaso(2);
    } catch (e) {
      const msg = e?.response?.data?.error?.detail || 
                  e?.response?.data?.detail || 
                  'El DNI no existe en la base de datos de RRHH.';      
      setErrorDni( msg);
    } finally {
      setBuscando(false);
    }
  };

  const validarPaso2 = () => {
    const errs = {};
    if (!form.role) errs.role = 'Debes asignar un rol.';
    if (!form.sedes.length) errs.sedes = 'Asigna al menos una sede.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSiguiente = () => {
    if (!validarPaso2()) return;
    setConfirmGuardar(true);
  };

  const handleGuardar = async () => {
    setConfirmGuardar(false);
    setGuardando(true);
    try {
      const payload = {
        dni: form.dni,
        role: form.role,
        sedes: form.sedes,
        dependencia: form.dependencia || null,
        modulo: form.modulo || null,
        es_usuario_sistema: form.es_usuario_sistema,
      };
      const res = modoEditar ? await actualizar(item.id, payload) : await crear(payload);
      toast.success(res?.message ?? (modoEditar ? 'Usuario actualizado.' : 'Usuario creado exitosamente.'));
      onGuardado();
    } catch (e) {
      const errores = e?.response?.data;
      toast.error(errores?.dni?.[0] || errores?.role?.[0] || errores?.detail || errores?.error || 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const sedesActivas = (sedes ?? []).filter(s => s.is_active);
  const modulosActivos = (modulos ?? []).filter(m => m.is_active);
  const rolesActivos = (roles ?? []).filter(r => r.is_active !== false);
  const depsActivas = dependencias.filter(d => d.is_active !== false);

  const empleadoNombre = empleado ? `${empleado.first_name ?? ''} ${empleado.last_name ?? ''}`.trim() : '';

  return (
    <>
      <Modal open={open} onClose={onClose} size="md">
        <ModalHeader
          icon={modoEditar ? 'manage_accounts' : 'person_add'}
          title={modoEditar ? `Editar: ${empleadoNombre}` : 'Nuevo Usuario del Sistema'}
          subtitle={modoEditar ? `DNI ${item?.dni} — modificando accesos y configuración` : 'Registro en 2 pasos: identificación y permisos'}
          onClose={onClose}
        />

        <ModalBody>
          {!modoEditar && <PasoIndicador pasoActual={paso} total={2} />}

          {paso === 1 && !modoEditar && (
            <div className="space-y-4">
              <div
                className="flex items-start gap-3 p-3.5 rounded-xl text-xs"
                style={{ background: 'rgb(127 29 29 / 0.05)', border: '1px solid rgb(127 29 29 / 0.15)', color: 'var(--color-text-body)' }}
              >
                <Icon name="info" className="text-[16px] shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                <span>El empleado debe estar registrado en la base de datos de RRHH. Ingresa el DNI para buscarlo automáticamente.</span>
              </div>

              <div>
                <FieldLabel required>DNI del empleado</FieldLabel>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <StyledInput
                      value={dni}
                      onChange={e => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      onKeyDown={e => e.key === 'Enter' && handleBuscarDni()}
                      placeholder="Ej: 72345678"
                      mono
                      maxLength={8}
                    />
                    {errorDni && <FieldError msg={errorDni} />}
                  </div>
                  <button
                    onClick={handleBuscarDni}
                    disabled={buscando || !dni.trim()}
                    className="btn-primary px-4 flex items-center gap-2 shrink-0"
                  >
                    {buscando
                      ? <span className="btn-loading-spin" />
                      : <Icon name="search" className="text-[18px]" />}
                    Buscar
                  </button>
                </div>
              </div>

              {empleado && (
                <div
                  className="flex items-center gap-4 p-4 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ background: 'rgb(127 29 29 / 0.05)', border: '1px solid rgb(127 29 29 / 0.2)' }}
                >
                  <div
                    className="size-12 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                  >
                    {(empleado.first_name?.[0] ?? '') + (empleado.last_name?.[0] ?? '')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm" style={{ color: 'var(--color-text-primary)' }}>{empleadoNombre}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{empleado.cargo ?? 'Sin cargo registrado'}</p>
                    {empleado.modulo && <p className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--color-text-faint)' }}>{empleado.modulo}</p>}
                  </div>
                  <Icon name="check_circle" className="text-[22px] shrink-0" style={{ color: '#16a34a' }} />
                </div>
              )}
            </div>
          )}

          {(paso === 2 || modoEditar) && (
            <div className="space-y-4">
              {empleado && !modoEditar && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl mb-2"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
                >
                  <div className="size-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                    {(empleado.first_name?.[0] ?? '') + (empleado.last_name?.[0] ?? '')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>{empleadoNombre}</p>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>DNI: {form.dni}</p>
                  </div>
                  {!modoEditar && (
                    <button onClick={() => { setPaso(1); setEmpleado(null); }} className="ml-auto btn-ghost px-2 py-1 text-[11px]">
                      <Icon name="edit" className="text-[14px]" /> Cambiar
                    </button>
                  )}
                </div>
              )}

              <div>
                <FieldLabel required>Rol de acceso</FieldLabel>
                <StyledSelect value={form.role} onChange={e => { set('role', e.target.value); setErrors(v => ({ ...v, role: '' })); }} disabled={loadingRoles}>
                  <option value="">Seleccionar rol…</option>
                  {rolesActivos.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </StyledSelect>
                <FieldError msg={errors.role} />
              </div>

              <div>
                <FieldLabel required>Sedes asignadas</FieldLabel>
                <SedesMultiSelect
                  sedes={sedesActivas}
                  selected={form.sedes}
                  onChange={val => { set('sedes', val); setErrors(v => ({ ...v, sedes: '' })); }}
                  disabled={loadingLoc}
                />
                <FieldError msg={errors.sedes} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Dependencia / Área</FieldLabel>
                  <StyledSelect value={form.dependencia} onChange={e => set('dependencia', e.target.value)} disabled={loadingDeps}>
                    <option value="">Sin dependencia</option>
                    {depsActivas.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </StyledSelect>
                </div>
                <div>
                  <FieldLabel>Módulo funcional</FieldLabel>
                  <StyledSelect value={form.modulo} onChange={e => set('modulo', e.target.value)} disabled={loadingLoc}>
                    <option value="">Sin módulo</option>
                    {modulosActivos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </StyledSelect>
                </div>
              </div>

              <div
                className="flex items-center justify-between p-3.5 rounded-xl"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-body)' }}>Usuario del sistema</p>
                  <p className="form-hint mt-0">Puede iniciar sesión en SISCONPAT</p>
                </div>
                <button type="button" onClick={() => set('es_usuario_sistema', !form.es_usuario_sistema)} className={form.es_usuario_sistema ? 'toggle-on' : 'toggle-off'}>
                  <span className={form.es_usuario_sistema ? 'toggle-thumb-on' : 'toggle-thumb-off'} />
                </button>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter align="right">
          <button onClick={onClose} disabled={guardando} className="btn-secondary">Cancelar</button>
          {paso === 1 && !modoEditar && (
            <button
              onClick={() => { if (!empleado) { setErrorDni('Busca un empleado primero.'); return; } setPaso(2); }}
              disabled={!empleado}
              className="btn-primary flex items-center gap-2"
            >
              Continuar <Icon name="arrow_forward" className="text-[16px]" />
            </button>
          )}
          {(paso === 2 || modoEditar) && (
            <button onClick={handleSiguiente} disabled={guardando || loadingCat} className="btn-primary flex items-center gap-2">
              {guardando ? <span className="btn-loading-spin" /> : <Icon name="save" className="text-[16px]" />}
              {modoEditar ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          )}
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={confirmGuardar}
        title={modoEditar ? 'Confirmar actualización' : 'Confirmar creación'}
        message={modoEditar
          ? `¿Guardar los cambios de "${empleadoNombre}"?`
          : `¿Crear el usuario "${empleadoNombre}" con el rol seleccionado?`}
        confirmLabel={modoEditar ? 'Sí, actualizar' : 'Sí, crear'}
        variant="primary"
        loading={guardando}
        onConfirm={handleGuardar}
        onClose={() => setConfirmGuardar(false)}
      />
    </>
  );
}