import { useState, useEffect } from 'react';
import { useAuth }   from '../../hooks/useAuth';
import { useToast }  from '../../hooks/useToast';
import Modal         from '../../components/modal/Modal';
import ModalBody     from '../../components/modal/ModalBody';
import ModalFooter   from '../../components/modal/ModalFooter';
import icono_pj      from '../../assets/images/icono_pj.jpg';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

// ── Campo contraseña ──────────────────────────────────────────────────────────
function CampoPassword({ label, icon, placeholder, value, onChange, show, onToggle, disabled, feedback }) {
  const borderColor =
    feedback === 'ok'    ? '#22c55e' :
    feedback === 'error' ? '#ef4444' :
    'var(--color-border)';

  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="relative">
        <Icon name={icon}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] pointer-events-none"
          style={{ color: 'var(--color-text-faint)' }} />
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="form-input pl-10 pr-11 transition-all"
          style={{ borderColor, boxShadow: feedback ? `0 0 0 3px ${borderColor}22` : undefined }}
        />
        <button type="button" tabIndex={-1} onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}>
          <Icon name={show ? 'visibility_off' : 'visibility'} className="text-[19px]" />
        </button>
      </div>
      {feedback === 'error' && (
        <p className="form-error flex items-center gap-1 mt-1">
          <Icon name="cancel" className="text-[13px]" /> Las contraseñas no coinciden
        </p>
      )}
      {feedback === 'ok' && (
        <p className="text-[11px] text-green-600 font-medium mt-1 flex items-center gap-1">
          <Icon name="check_circle" className="text-[13px]" /> Las contraseñas coinciden
        </p>
      )}
    </div>
  );
}


export default function ChangePassword({ open, onClose, onSuccess, mode = 'voluntary', username: usernameProp = '' }) {
  const toast = useToast();
  const { user, cambiarPassword, logout, loading } = useAuth();

  const expired  = mode === 'expired';
  const warning  = mode === 'warning';
  const canClose = !expired && !warning; 
  const usernameBase = user?.username || usernameProp || '';
  const [usernameInput, setUsernameInput] = useState(usernameBase);
  const [actual,     setActual]     = useState('');
  const [nueva,      setNueva]      = useState('');
  const [confirmar,  setConfirmar]  = useState('');
  const [showActual, setShowActual] = useState(false);
  const [showNueva,  setShowNueva]  = useState(false);
  const [exito,      setExito]      = useState(false);
  const [errores,    setErrores]    = useState([]);

  // Resetear formulario al abrir
  useEffect(() => {
    if (!open) return;
    setActual('');
    setNueva('');
    setConfirmar('');
    setErrores([]);
    setExito(false);
    setShowActual(false);
    setShowNueva(false);
    setUsernameInput(user?.username || usernameProp || '');
  }, [open]);

  const displayName = user
    ? `${user.nombres ?? ''} ${user.apellidos ?? ''}`.trim()
    : usernameInput;

  const confirmaFeedback = confirmar ? (nueva === confirmar ? 'ok' : 'error') : null;

  // const validar = () => {
  //   if (!usernameInput.trim())    { toast.error('Ingrese su usuario (DNI).');      return false; }
  //   if (!actual)                  { toast.error('Ingrese su contraseña actual.');  return false; }
  //   if (!nueva)                   { toast.error('Ingrese la nueva contraseña.');   return false; }
  //   if (nueva !== confirmar)      { toast.error('Las contraseñas no coinciden.');  return false; }
  //   return true;
  // };

  const handleSubmit = async () => {
    // if (!validar()) return;
    setErrores([]);
    try {
      await cambiarPassword(actual, nueva, usernameInput.trim());
      setExito(true);
      setTimeout(() => onSuccess?.(), 1800);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al cambiar la contraseña.');
      const raw  = e?.response?.data?.error ?? e?.response?.data?.detail;
      const lista = Array.isArray(raw) ? raw : raw ? [raw] : ['Error al cambiar la contraseña.'];
      setErrores(lista);
    }
  };

 
  const meta = expired
    ? { icon: 'lock_clock', text: 'Contraseña Expirada',          color: '#ef4444', bg: '#fef2f2' }
    : warning
    ? { icon: 'warning',    text: 'Contraseña próxima a expirar', color: '#f59e0b', bg: '#fffbeb' }
    : { icon: 'lock_reset', text: 'Cambiar Contraseña',           color: '#7F1D1D', bg: '#fff1f2' };

  return (
    <Modal open={open} onClose={canClose ? onClose : undefined} size="sm" closeOnOverlay={canClose}>

      {/* ── Header ── */}
      <div className="rounded-t-2xl overflow-hidden shrink-0">
        <div className="h-1" style={{ background: 'var(--color-primary)' }} />
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <img src={icono_pj} alt="Logo PJ" className="h-8 w-auto" />
            <div>
              <h3 className="text-sm font-black leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                {meta.text}
              </h3>
              {displayName && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {displayName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1.5"
              style={{ background: meta.bg, color: meta.color }}
            >
              <Icon name={meta.icon} className="text-[13px]" />
              {expired ? 'Expirada' : warning ? 'Advertencia' : 'Seguridad'}
            </span>
            {canClose && (
              <button onClick={onClose}
                className="size-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-border-light)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <ModalBody>
        {exito ? (
          <div className="text-center py-8">
            <div className="size-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: '#dcfce7' }}>
              <Icon name="check_circle" className="text-[32px] text-emerald-600" />
            </div>
            <p className="text-base font-black" style={{ color: 'var(--color-text-primary)' }}>
              ¡Contraseña actualizada!
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {expired ? 'Redirigiendo al login…' : 'Cerrando…'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Aviso contextual */}
            {(expired || warning) && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-xl text-xs font-medium"
                style={{ background: meta.bg, border: `1px solid ${meta.color}30`, color: meta.color }}
              >
                <Icon name={meta.icon} className="text-[16px] shrink-0 mt-0.5" />
                {expired
                  ? 'Su contraseña ha expirado. Debe establecer una nueva para continuar.'
                  : 'Su contraseña vencerá pronto. Le recomendamos actualizarla ahora.'}
              </div>
            )}

            {/* Usuario */}
            <div>
              <label className="form-label">Usuario (DNI)</label>
              <div className="relative">
                <Icon name="person"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] pointer-events-none"
                  style={{ color: 'var(--color-text-faint)' }} />
                <input
                  readOnly={!!user?.username || expired}
                  value={user?.username || expired ? usernameBase : usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Ingrese su número de DNI"
                  className={`form-input pl-10 ${(user?.username || expired) ? 'cursor-not-allowed opacity-60' : ''}`}
                />
              </div>
            </div>

            <div className="h-px" style={{ background: 'var(--color-border-light)' }} />

            {/* Contraseñas */}
            <CampoPassword label="Contraseña actual *" icon="key"
              placeholder="Ingrese su contraseña actual"
              value={actual} onChange={setActual}
              show={showActual} onToggle={() => setShowActual((v) => !v)}
              disabled={loading} />

            <CampoPassword label="Nueva contraseña *" icon="lock"
              placeholder="Nueva contraseña"
              value={nueva} onChange={(v) => { setNueva(v); setErrores([]); }}
              show={showNueva} onToggle={() => setShowNueva((v) => !v)}
              disabled={loading} />

            <CampoPassword label="Confirmar nueva contraseña *" icon="verified_user"
              placeholder="Repita la nueva contraseña"
              value={confirmar} onChange={(v) => { setConfirmar(v); setErrores([]); }}
              show={showNueva} onToggle={() => setShowNueva((v) => !v)}
              disabled={loading} feedback={confirmaFeedback} />

            {/* Errores del backend */}
            {errores.length > 0 && (
              <div className="p-3 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 text-red-500">
                  <Icon name="error" className="text-[13px]" />
                  La contraseña no cumple las políticas
                </p>
                <ul className="space-y-1">
                  {errores.map((msg, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-medium text-red-600">
                      <Icon name="cancel" className="text-[12px] shrink-0" />
                      {msg}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </ModalBody>

      {/* ── Footer ── */}
      {!exito && (
        <ModalFooter align="between">
          <div>
            {user && !expired && (
              <button type="button" onClick={logout}
                className="text-xs font-semibold transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              >
                Cerrar sesión
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canClose && (
              <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
                Cancelar
              </button>
            )}
            <button type="button" onClick={handleSubmit}
              disabled={loading || confirmaFeedback === 'error'}
              className="btn-primary">
              {loading
                ? <><span className="btn-loading-spin" /> Actualizando…</>
                : <><Icon name="update" className="text-[16px]" /> Actualizar</>
              }
            </button>
          </div>
        </ModalFooter>
      )}
    </Modal>
  );
}