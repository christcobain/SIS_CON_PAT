import { useState, useEffect, useRef } from 'react';
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

// ── Primitivos de formulario ──────────────────────────────────────────────────
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

function StyledInput({ value, onChange, placeholder, disabled, mono, onKeyDown }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full text-sm rounded-xl px-3 py-2.5 transition-all ${mono ? 'font-mono' : ''}`}
      style={{
        background: disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)',
        border:     '1px solid var(--color-border)',
        color:      disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
        outline:    'none',
        cursor:     disabled ? 'not-allowed' : 'text',
      }}
      onFocus={(e)  => { if (!disabled) e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={(e)   => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    />
  );
}

function StyledSelect({ value, onChange, options, placeholder, disabled }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full text-sm rounded-xl px-3 py-2.5 transition-all"
      style={{
        background: disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)',
        border:     '1px solid var(--color-border)',
        color:      value ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        outline:    'none',
        cursor:     disabled ? 'not-allowed' : 'pointer',
      }}
      onFocus={(e)  => { if (!disabled) e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={(e)   => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── Multi-select sedes con dropdown + chips ───────────────────────────────────
function SedesMultiSelect({ sedes = [], selectedIds = [], onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id) => {
    onChange(selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id]);
  };

  const sedesSel = sedes.filter((s) => selectedIds.includes(s.id));

  return (
    <div ref={ref} className="relative">
      {sedesSel.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {sedesSel.map((s) => (
            <span key={s.id}
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(127,29,29,0.1)', color: 'var(--color-primary)' }}>
              {s.nombre}
              {!disabled && (
                <button type="button" onClick={() => toggle(s.id)} className="opacity-60 hover:opacity-100">
                  <Icon name="close" className="text-[12px]" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="w-full flex items-center justify-between text-sm rounded-xl px-3 py-2.5 text-left"
        style={{
          background: disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)',
          border:     `1px solid ${open ? 'var(--color-primary)' : 'var(--color-border)'}`,
          color:      selectedIds.length ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          cursor:     disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span>
          {selectedIds.length > 0
            ? `${selectedIds.length} sede${selectedIds.length !== 1 ? 's' : ''} seleccionada${selectedIds.length !== 1 ? 's' : ''}`
            : 'Seleccionar sedes...'}
        </span>
        <Icon name={open ? 'expand_less' : 'expand_more'} className="text-[18px] shrink-0"
              style={{ color: 'var(--color-text-muted)' }} />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-xl shadow-lg"
             style={{
               background: 'var(--color-surface)',
               border:     '1px solid var(--color-border)',
               maxHeight:  '180px',
               overflowY:  'auto',
             }}>
          {sedes.length === 0
            ? <p className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>Sin sedes disponibles</p>
            : sedes.map((s) => {
                const checked = selectedIds.includes(s.id);
                return (
                  <button key={s.id} type="button" onClick={() => toggle(s.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ background: checked ? 'rgba(127,29,29,0.05)' : 'transparent' }}
                    onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = 'var(--color-surface-alt)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = checked ? 'rgba(127,29,29,0.05)' : 'transparent'; }}>
                    <div className="size-4 rounded flex items-center justify-center shrink-0"
                         style={{
                           background: checked ? 'var(--color-primary)' : 'var(--color-surface)',
                           border:     `1px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                         }}>
                      {checked && <Icon name="check" className="text-[11px] text-white" />}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {s.nombre}
                    </span>
                  </button>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

// ── Paso 1: buscar empleado por DNI ──────────────────────────────────────────
function PasoBuscarDni({ dni, setDni, empleado, buscando, errorDni, onBuscar }) {
  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl flex items-start gap-3"
           style={{ background: 'rgba(127,29,29,0.05)', border: '1px solid rgba(127,29,29,0.15)' }}>
        <Icon name="info" className="text-[18px] shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
        <p className="text-xs" style={{ color: 'var(--color-text-body)' }}>
          Ingresa el DNI del empleado. El sistema buscará su información en RRHH
          para pre-completar nombre, cargo y módulo.
        </p>
      </div>
      <div>
        <Label required>DNI del empleado</Label>
        <div className="flex gap-2">
          <StyledInput
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
            onKeyDown={(e) => e.key === 'Enter' && onBuscar()}
            placeholder="Ej: 07707070"
            mono
          />
          <button type="button" onClick={onBuscar}
            disabled={buscando || dni.length < 8}
            className="btn-primary px-4 shrink-0 flex items-center gap-1"
            style={{ opacity: (buscando || dni.length < 8) ? 0.5 : 1 }}>
            {buscando
              ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              : <Icon name="search" className="text-[18px]" />
            }
          </button>
        </div>
        <FieldError msg={errorDni} />
      </div>
      {empleado && (
        <div className="p-4 rounded-xl flex items-center gap-3"
             style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="size-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100">
            <Icon name="check_circle" className="text-[20px] text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-emerald-800 truncate">
              {empleado.first_name} {empleado.last_name}
            </p>
            <p className="text-[10px] mt-0.5 text-emerald-600">
              {[empleado.cargo, empleado.modulo_rrhh].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            Encontrado
          </span>
        </div>
      )}
    </div>
  );
}

// ── Paso 2: formulario de acceso ──────────────────────────────────────────────
function PasoFormulario({ modoEditar, form, setForm, errors, sedes, modulos, dependencias, roles, loadingCat }) {
  return (
    <div className="space-y-4">
      {/* Cabecera del empleado */}
      {form._empleadoNombre && (
        <div className="p-3 rounded-xl flex items-center gap-3"
             style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border-light)' }}>
          <div className="size-8 rounded-lg flex items-center justify-center shrink-0"
               style={{ background: 'var(--color-border-light)' }}>
            <Icon name="person" className="text-[16px]" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <p className="text-xs font-black" style={{ color: 'var(--color-text-primary)' }}>
              {form._empleadoNombre}
            </p>
            <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
              DNI: {form.dni}
            </p>
          </div>
        </div>
      )}

      {/* Rol */}
      <div>
        <Label required>Rol del sistema</Label>
        <StyledSelect
          value={form.role ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, role: Number(e.target.value) || '' }))}
          placeholder="Seleccionar rol..."
          disabled={loadingCat}
          options={roles.map((r) => ({ value: r.id, label: r.name }))}
        />
        <FieldError msg={errors.role} />
      </div>

      {/* Sedes */}
      <div>
        <Label required>Sedes asignadas</Label>
        <SedesMultiSelect
          sedes={sedes}
          selectedIds={form.sedes ?? []}
          onChange={(ids) => setForm((f) => ({ ...f, sedes: ids }))}
          disabled={loadingCat}
        />
        <FieldError msg={errors.sedes} />
      </div>

      {/* Dependencia */}
      <div>
        <Label>Dependencia</Label>
        <StyledSelect
          value={form.dependencia ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, dependencia: Number(e.target.value) || '' }))}
          placeholder="Seleccionar dependencia..."
          disabled={loadingCat}
          options={dependencias
            .filter((d) => d.is_active)
            .map((d) => ({ value: d.id, label: d.codigo ? `${d.nombre} (${d.codigo})` : d.nombre }))}
        />
        <FieldError msg={errors.dependencia} />
      </div>

      {/* Módulo */}
      <div>
        <Label>Módulo</Label>
        <StyledSelect
          value={form.modulo ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, modulo: Number(e.target.value) || '' }))}
          placeholder="Seleccionar módulo..."
          disabled={loadingCat}
          options={modulos
            .filter((m) => m.is_active !== false)
            .map((m) => ({ value: m.id, label: m.nombre }))}
        />
        <FieldError msg={errors.modulo} />
      </div>

      {/* Acceso al sistema */}
      <div>
        <Label>Acceso al sistema</Label>
        <div className="flex gap-2">
          {[
            { v: true,  label: 'Sí — puede iniciar sesión', icon: 'manage_accounts', ok: true  },
            { v: false, label: 'No — solo registro RRHH',   icon: 'person_off',      ok: false },
          ].map(({ v, label, icon, ok }) => {
            const sel = form.es_usuario_sistema === v;
            return (
              <button key={String(v)} type="button"
                onClick={() => setForm((f) => ({ ...f, es_usuario_sistema: v }))}
                className="flex-1 flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-all text-left"
                style={{
                  background: sel ? (ok ? '#f0fdf4' : '#fef2f2') : 'var(--color-surface-alt)',
                  border:     `1px solid ${sel ? (ok ? '#bbf7d0' : '#fecaca') : 'var(--color-border-light)'}`,
                  color:      sel ? (ok ? '#15803d' : '#dc2626') : 'var(--color-text-muted)',
                }}>
                <Icon name={icon} className="text-[16px] shrink-0" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
const FORM_INICIAL = {
  dni: '', role: '', sedes: [], dependencia: '', modulo: '',
  es_usuario_sistema: true, _empleadoNombre: '',
};

export default function ModalUsuario({ open, onClose, item = null, onGuardado }) {
  const toast      = useToast();
  const modoEditar = Boolean(item);

  // ── Hooks — ÚNICA fuente de datos ────────────────────────────────────────
  const { crear, actualizar, buscarEmpleado, listarDependencias } = useUsuarios();
  const { sedes, modulos, loading: loadingLoc } = useLocaciones();
  const { roles, loading: loadingRoles }        = useRoles();

  // Dependencias — via useUsuarios.listarDependencias (no en useLocaciones)
  const [dependencias, setDependencias] = useState([]);
  const [loadingDeps,  setLoadingDeps]  = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingDeps(true);
    listarDependencias()
      .then((d) => { if (!cancelled) setDependencias(Array.isArray(d) ? d : d?.results ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingDeps(false); });
    return () => { cancelled = true; };
  }, [open]);

  const loadingCat = loadingLoc || loadingRoles || loadingDeps;

  // ── Formulario ────────────────────────────────────────────────────────────
  const [paso,      setPaso]      = useState(1);
  const [form,      setForm]      = useState(FORM_INICIAL);
  const [errors,    setErrors]    = useState({})
  const [dni,      setDni]      = useState('');
  const [empleado, setEmpleado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [errorDni, setErrorDni] = useState('');

  const [confirmGuardar, setConfirmGuardar] = useState(false);
  const [guardando,      setGuardando]      = useState(false);

  // Pre-llena en modo editar al abrir
  useEffect(() => {
    if (!open) return;
    if (modoEditar && item) {
      setForm({
        dni:                item.dni ?? '',
        role:               item.role?.id ?? '',
        sedes:              (item.sedes ?? []).map((s) => s.id),
        dependencia:        item.dependencia?.id ?? '',
        modulo:             item.modulo?.id ?? '',
        es_usuario_sistema: item.es_usuario_sistema ?? true,
        _empleadoNombre:    `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim(),
      });
      setPaso(2);
    } else {
      setForm(FORM_INICIAL);
      setDni('');
      setEmpleado(null);
      setErrorDni('');
      setPaso(1);
    }
    setErrors({});
  }, [open, item?.id]);

  const handleBuscarDni = async () => {
    if (dni.length < 8) return;
    setBuscando(true);
    setErrorDni('');
    setEmpleado(null);
    try {
      const emp = await buscarEmpleado(dni);
      setEmpleado(emp);
      setForm((f) => ({
        ...f,
        dni,
        _empleadoNombre: `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim(),
      }));
    } catch (e) {
      console.log('e=',e)
      setErrorDni(
        e?.response?.status === 404
          ? 'DNI no encontrado en la base de datos de RRHH.'
          : e?.response?.data?.error ?? 'Error al buscar el empleado.'
      );
    } finally {
      setBuscando(false);
    }
  };

  // Validación
  const validar = () => {
    const e = {};
    if (!form.role)          e.role  = 'Selecciona un rol.';
    if (!form.sedes?.length) e.sedes = 'Asigna al menos una sede.';
    return e;
  };

  const handleGuardarConfirmado = async () => {
    setGuardando(true);
    try {
      if (modoEditar) {
        await actualizar(item.id, {
          role:               form.role       || undefined,
          sedes:              form.sedes,
          dependencia:        form.dependencia || undefined,
          modulo:             form.modulo      || undefined,
          es_usuario_sistema: form.es_usuario_sistema,
        });
        toast.success('Usuario actualizado correctamente');
      } else {
        await crear({
          dni:                form.dni,
          role:               form.role       || undefined,
          sedes:              form.sedes,
          dependencia:        form.dependencia || undefined,
          modulo:             form.modulo      || undefined,
          es_usuario_sistema: form.es_usuario_sistema,
        });
        toast.success('Usuario creado correctamente');
      }
      onGuardado?.();
      onClose();
    } catch (e) {
      const msg = e?.response?.data.error
        ?? Object.values(e?.response?.data ?? {})?.[0]?.[0]
        ?? 'Error al guardar el usuario.';
      toast.error(msg);
    } finally {
      setGuardando(false);
      setConfirmGuardar(false);
    }
  };

  const handleSolicitarGuardar = () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    setConfirmGuardar(true);
  };

  const nombreItem = modoEditar
    ? `${item?.first_name ?? ''} ${item?.last_name ?? ''}`.trim()
    : form._empleadoNombre;

  return (
    <>
      <Modal open={open} onClose={onClose} size="lg" closeOnOverlay={!guardando && !confirmGuardar}>
        <ModalHeader
          title={modoEditar ? 'Editar Usuario' : 'Nuevo Usuario'}
          subtitle={
            modoEditar
              ? nombreItem
              : paso === 1 ? 'Paso 1 de 2 — Verificar DNI' : 'Paso 2 de 2 — Configurar acceso'
          }
          icon={modoEditar ? 'manage_accounts' : 'person_add'}
          onClose={onClose}
        />

        <ModalBody>
          {/* Indicador de pasos — solo crear */}
          {!modoEditar && (
            <div className="flex items-center gap-3 mb-5">
              {[{ n: 1, label: 'Verificar DNI' }, { n: 2, label: 'Configurar acceso' }]
                .map(({ n, label }, idx, arr) => (
                <div key={n} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="size-5 rounded-full flex items-center justify-center text-[10px] font-black"
                         style={{
                           background: n <= paso ? 'var(--color-primary)' : 'var(--color-border-light)',
                           color:      n <= paso ? '#fff' : 'var(--color-text-muted)',
                         }}>
                      {n < paso ? <Icon name="check" className="text-[11px]" /> : n}
                    </div>
                    <span className="text-[10px] font-bold whitespace-nowrap"
                          style={{ color: n === paso ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                      {label}
                    </span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="h-px w-6"
                         style={{ background: paso > n ? 'var(--color-primary)' : 'var(--color-border)' }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {!modoEditar && paso === 1 ? (
            <PasoBuscarDni
              dni={dni} setDni={setDni}
              empleado={empleado} buscando={buscando}
              errorDni={errorDni} onBuscar={handleBuscarDni}
            />
          ) : (
            <PasoFormulario
              modoEditar={modoEditar}
              form={form} setForm={setForm} errors={errors}
              sedes={sedes} modulos={modulos}
              dependencias={dependencias} roles={roles}
              loadingCat={loadingCat}
            />
          )}
        </ModalBody>

        <ModalFooter align="between">
          <div>
            {!modoEditar && paso === 2 && (
              <button onClick={() => setPaso(1)} className="btn-ghost flex items-center gap-1 text-xs">
                <Icon name="arrow_back" className="text-[15px]" /> Volver
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={guardando} className="btn-secondary">
              Cancelar
            </button>
            {!modoEditar && paso === 1 ? (
              <button
                onClick={() => setPaso(2)}
                disabled={!empleado}
                className="btn-primary"
                style={{ opacity: !empleado ? 0.5 : 1 }}>
                Siguiente <Icon name="arrow_forward" className="text-[16px]" />
              </button>
            ) : (
              <button
                onClick={handleSolicitarGuardar}
                disabled={guardando}
                className="btn-primary flex items-center gap-2"
                style={{ opacity: guardando ? 0.6 : 1 }}>
                <Icon name="save" className="text-[16px]" />
                {modoEditar ? 'Actualizar' : 'Crear usuario'}
              </button>
            )}
          </div>
        </ModalFooter>
      </Modal>

      {/* ConfirmDialog antes de guardar — mismo patrón que UsuariosPage */}
      <ConfirmDialog
        open={confirmGuardar}
        title={modoEditar ? 'Confirmar actualización' : 'Confirmar creación'}
        message={
          modoEditar
            ? `¿Guardar los cambios del usuario "${nombreItem}"?`
            : `¿Crear el usuario "${form._empleadoNombre}" (DNI: ${form.dni})?`
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