import { useState, useEffect, useMemo } from 'react';
import { useToast }     from '../../../hooks/useToast';
import { useAuthStore } from '../../../store/authStore';
import ConfirmDialog    from '../../../components/feedback/ConfirmDialog';
import authService      from '../../../services/auth.service';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const TABS = [
  { id: 'sesiones',     label: 'Sesiones activas',   icon: 'wifi'          },
  { id: 'historial',    label: 'Historial sesiones',  icon: 'manage_history'},
  { id: 'intentos',     label: 'Intentos de acceso',  icon: 'login'         },
  { id: 'credenciales', label: 'Credenciales',        icon: 'key'           },
  { id: 'politicas',    label: 'Políticas de clave',  icon: 'policy'        },
];

const fmtT = (iso) => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
const fmt  = (iso) => !iso ? '—' : new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'medium' });

function FInput({ value, onChange, placeholder, icon }) {
  return (
    <div className="relative">
      <Icon name={icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none"
        style={{ color: value ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm rounded-xl pl-10 pr-4 py-2.5 transition-all"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
        onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
        onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
      />
    </div>
  );
}

function FSelect({ value, onChange, children }) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="text-sm rounded-xl px-3 py-2.5 cursor-pointer transition-all"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)', outline: 'none' }}
      onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    >
      {children}
    </select>
  );
}

function BadgeSesion({ status }) {
  const MAP = {
    active:  { label: 'Activa',   bg: 'rgb(22 163 74 / 0.1)',      color: '#16a34a',                     dot: 'bg-green-500' },
    logout:  { label: 'Cerrada',  bg: 'var(--color-border-light)',  color: 'var(--color-text-muted)',     dot: 'bg-slate-400' },
    expired: { label: 'Expirada', bg: 'rgb(180 83 9 / 0.1)',       color: '#b45309',                     dot: 'bg-amber-500' },
  };
  const cfg = MAP[status] ?? MAP.logout;
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
    </span>
  );
}

const TIPO_LABEL = {
  success: 'Exitoso', invalid_password: 'Clave inválida', user_not_found: 'No encontrado',
  user_inactive: 'Inactivo', password_expired: 'Clave expirada', locked: 'Bloqueado',
  force_password_change: 'Cambio requerido', multiple_sessions: 'Sesión múltiple', other: 'Otro',
};

function BadgeIntento({ success, tipo }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg"
      style={{ background: success ? 'rgb(22 163 74 / 0.1)' : 'rgb(220 38 38 / 0.1)', color: success ? '#16a34a' : '#dc2626' }}>
      <Icon name={success ? 'check_circle' : 'cancel'} className="text-[12px]" />
      {TIPO_LABEL[tipo] ?? tipo}
    </span>
  );
}

function EmptyState({ icon, mensaje }) {
  return (
    <div className="text-center py-14 card rounded-xl">
      <Icon name={icon} className="text-[48px]" style={{ color: 'var(--color-text-faint)' }} />
      <p className="text-sm font-semibold mt-3" style={{ color: 'var(--color-text-muted)' }}>{mensaje}</p>
    </div>
  );
}

function Skeletons({ n = 4 }) {
  return <div className="space-y-2">{Array.from({ length: n }, (_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>;
}

function TabSesionesActivas() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [dni,     setDni]     = useState('');

  const cargar = () => {
    setLoading(true);
    authService.getSessions(dni || null)
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1"><FInput value={dni} onChange={setDni} placeholder="Filtrar por DNI..." icon="badge" /></div>
        <button onClick={cargar} disabled={loading} className="btn-primary flex items-center gap-2 px-4">
          {loading ? <span className="btn-loading-spin" /> : <Icon name="search" className="text-[16px]" />}
          Buscar
        </button>
      </div>
      {loading ? <Skeletons /> : items.length === 0 ? (
        <EmptyState icon="wifi_off" mensaje="Sin sesiones activas" />
      ) : (
        <div className="table-wrapper rounded-xl overflow-hidden">
          <table className="table w-full">
            <thead><tr>
              <th>Usuario / DNI</th><th>IP</th><th>Dispositivo</th><th>Inicio</th><th>Estado</th>
            </tr></thead>
            <tbody>
              {items.map(s => (
                <tr key={s.id} className="hover:bg-surface-alt/60">
                  <td>
                    <p className="font-bold text-xs">{s.username}</p>
                    <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{s.dni}</p>
                  </td>
                  <td className="font-mono text-xs">{s.ip_address}</td>
                  <td className="text-xs max-w-[200px] truncate" title={s.device_info}>{s.device_info || '—'}</td>
                  <td className="text-xs">{fmtT(s.login_at)}</td>
                  <td><BadgeSesion status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabHistorialSesiones() {
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [dni,          setDni]          = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (dni)          params.dni    = dni;
    if (statusFiltro) params.status = statusFiltro;
    authService.getSessionsHistorial(params)
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[180px]"><FInput value={dni} onChange={setDni} placeholder="Filtrar por DNI..." icon="badge" /></div>
        <FSelect value={statusFiltro} onChange={setStatusFiltro}>
          <option value="">Todos los estados</option>
          <option value="active">Activa</option>
          <option value="logout">Cerrada</option>
          <option value="expired">Expirada</option>
        </FSelect>
        <button onClick={cargar} disabled={loading} className="btn-primary flex items-center gap-2 px-4">
          {loading ? <span className="btn-loading-spin" /> : <Icon name="search" className="text-[16px]" />}
          Buscar
        </button>
      </div>
      {loading ? <Skeletons n={5} /> : items.length === 0 ? (
        <EmptyState icon="history_off" mensaje="Sin registros" />
      ) : (
        <div className="table-wrapper rounded-xl overflow-hidden">
          <table className="table w-full">
            <thead><tr>
              <th>Usuario</th><th>IP</th><th>Inicio</th><th>Cierre</th><th>Estado</th>
            </tr></thead>
            <tbody>
              {items.map(s => (
                <tr key={s.id} className="hover:bg-surface-alt/60">
                  <td>
                    <p className="font-bold text-xs">{s.nombre_completo || s.username}</p>
                    <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{s.dni}</p>
                  </td>
                  <td className="font-mono text-xs">{s.ip_address}</td>
                  <td className="text-xs">{fmtT(s.login_at)}</td>
                  <td className="text-xs">{s.logout_at ? fmtT(s.logout_at) : '—'}</td>
                  <td><BadgeSesion status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabIntentos() {
  const [items,       setItems]      = useState([]);
  const [loading,     setLoading]    = useState(false);
  const [dni,         setDni]        = useState('');
  const [tipoFiltro,  setTipoFiltro] = useState('');
  const [exitoFiltro, setExitoFiltro] = useState('');

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (dni)               params.dni          = dni;
    if (tipoFiltro)        params.attempt_type = tipoFiltro;
    if (exitoFiltro !== '') params.success      = exitoFiltro;
    authService.getLoginAttempts(params)
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const totales = useMemo(() => ({
    total:    items.length,
    exitosos: items.filter(i => i.success).length,
    fallidos: items.filter(i => !i.success).length,
  }), [items]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total registros', value: totales.total,    icon: 'list',         color: 'var(--color-primary)' },
          { label: 'Exitosos',        value: totales.exitosos, icon: 'check_circle',  color: '#16a34a'             },
          { label: 'Fallidos',        value: totales.fallidos, icon: 'cancel',        color: '#dc2626'             },
        ].map(s => (
          <div key={s.label} className="card p-3 flex items-center gap-3">
            <Icon name={s.icon} className="text-[22px]" style={{ color: s.color }} />
            <div>
              <p className="text-xl font-black" style={{ color: 'var(--color-text-primary)' }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[160px]"><FInput value={dni} onChange={setDni} placeholder="Filtrar por DNI..." icon="badge" /></div>
        <FSelect value={exitoFiltro} onChange={setExitoFiltro}>
          <option value="">Todos</option>
          <option value="true">Exitosos</option>
          <option value="false">Fallidos</option>
        </FSelect>
        <FSelect value={tipoFiltro} onChange={setTipoFiltro}>
          <option value="">Todos los tipos</option>
          <option value="success">Exitoso</option>
          <option value="invalid_password">Clave inválida</option>
          <option value="user_not_found">No encontrado</option>
          <option value="locked">Bloqueado</option>
          <option value="password_expired">Clave expirada</option>
          <option value="force_password_change">Cambio requerido</option>
          <option value="multiple_sessions">Sesión múltiple</option>
        </FSelect>
        <button onClick={cargar} disabled={loading} className="btn-primary flex items-center gap-2 px-4">
          {loading ? <span className="btn-loading-spin" /> : <Icon name="search" className="text-[16px]" />}
          Buscar
        </button>
      </div>
      {loading ? <Skeletons n={5} /> : items.length === 0 ? (
        <EmptyState icon="manage_accounts" mensaje="Sin registros de intentos" />
      ) : (
        <div className="table-wrapper rounded-xl overflow-hidden">
          <table className="table w-full">
            <thead><tr>
              <th>DNI</th><th>IP</th><th>Resultado</th><th>Fecha</th><th>Mensaje</th>
            </tr></thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id} className="hover:bg-surface-alt/60">
                  <td className="font-mono text-xs font-bold">{a.username}</td>
                  <td className="font-mono text-xs">{a.ip_address}</td>
                  <td><BadgeIntento success={a.success} tipo={a.attempt_type} /></td>
                  <td className="text-xs">{fmtT(a.attempted_at)}</td>
                  <td className="text-xs max-w-[180px] truncate" title={a.error_message} style={{ color: 'var(--color-text-muted)' }}>
                    {a.error_message || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabCredenciales() {
  const toast = useToast();
  const [items,           setItems]          = useState([]);
  const [loading,         setLoading]        = useState(false);
  const [dni,             setDni]            = useState('');
  const [bloqueadoFiltro, setBloqueadoFiltro] = useState('');
  const [confirmUnlock,   setConfirmUnlock]  = useState(false);
  const [itemUnlock,      setItemUnlock]     = useState(null);
  const [unlocking,       setUnlocking]      = useState(false);

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (dni)                params.dni       = dni;
    if (bloqueadoFiltro !== '') params.is_locked = bloqueadoFiltro;
    authService.getCredentials(params)
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const confirmarUnlock = async () => {
    setConfirmUnlock(false);
    setUnlocking(true);
    try {
      await authService.unlockCredential(itemUnlock.user.username ?? itemUnlock.user.dni);
      toast.success(`Cuenta de ${itemUnlock.user.nombre_completo || itemUnlock.user.dni} desbloqueada.`);
      cargar();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al desbloquear.');
    } finally { setUnlocking(false); setItemUnlock(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[180px]"><FInput value={dni} onChange={setDni} placeholder="Filtrar por DNI..." icon="badge" /></div>
        <FSelect value={bloqueadoFiltro} onChange={setBloqueadoFiltro}>
          <option value="">Todos</option>
          <option value="true">Bloqueados</option>
          <option value="false">Sin bloqueo</option>
        </FSelect>
        <button onClick={cargar} disabled={loading} className="btn-primary flex items-center gap-2 px-4">
          {loading ? <span className="btn-loading-spin" /> : <Icon name="search" className="text-[16px]" />}
          Buscar
        </button>
      </div>
      {loading ? <Skeletons /> : items.length === 0 ? (
        <EmptyState icon="key_off" mensaje="Sin credenciales registradas" />
      ) : (
        <div className="table-wrapper rounded-xl overflow-hidden">
          <table className="table w-full">
            <thead><tr>
              <th>Usuario</th><th>Estado credencial</th><th>Multi-sesión</th><th>Último cambio clave</th><th>Intentos fallidos</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id} className="hover:bg-surface-alt/60">
                  <td>
                    <p className="font-bold text-xs">{c.user.nombre_completo || c.user.username}</p>
                    <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{c.user.dni}</p>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: c.is_active ? 'rgb(22 163 74 / 0.1)' : 'var(--color-border-light)', color: c.is_active ? '#16a34a' : 'var(--color-text-muted)' }}>
                        <span className={`size-1.5 rounded-full ${c.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                        {c.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                      {c.is_locked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgb(220 38 38 / 0.1)', color: '#dc2626' }}>
                          <Icon name="lock" className="text-[11px]" />Bloqueada
                        </span>
                      )}
                      {c.force_password_change && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgb(180 83 9 / 0.1)', color: '#b45309' }}>
                          <Icon name="password" className="text-[11px]" />Cambio req.
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="text-[11px] font-bold px-2 py-1 rounded-lg"
                      style={{ background: c.allow_multiple_sessions ? 'rgb(37 99 235 / 0.1)' : 'var(--color-border-light)', color: c.allow_multiple_sessions ? '#1d4ed8' : 'var(--color-text-muted)' }}>
                      {c.allow_multiple_sessions ? 'Habilitado' : 'No'}
                    </span>
                  </td>
                  <td className="text-xs">{c.last_password_change ? fmt(c.last_password_change) : '—'}</td>
                  <td>
                    <span className="text-xs font-black px-2 py-1 rounded-lg"
                      style={{ background: c.failed_attempts > 0 ? 'rgb(220 38 38 / 0.1)' : 'var(--color-border-light)', color: c.failed_attempts > 0 ? '#dc2626' : 'var(--color-text-muted)' }}>
                      {c.failed_attempts}
                    </span>
                  </td>
                  <td>
                    {c.is_locked && (
                      <button onClick={() => { setItemUnlock(c); setConfirmUnlock(true); }}
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        style={{ background: 'rgb(22 163 74 / 0.1)', color: '#16a34a', border: '1px solid rgb(22 163 74 / 0.25)' }}>
                        <Icon name="lock_open" className="text-[14px]" />Desbloquear
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog open={confirmUnlock}
        title="Confirmar desbloqueo"
        message={`¿Desbloquear la cuenta de "${itemUnlock?.user?.nombre_completo || itemUnlock?.user?.dni}"? Los intentos fallidos se reiniciarán a 0.`}
        confirmLabel="Sí, desbloquear" variant="primary" loading={unlocking}
        onConfirm={confirmarUnlock}
        onClose={() => { setConfirmUnlock(false); setItemUnlock(null); }} />
    </div>
  );
}

function TabPoliticas() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    authService.listarPoliticas()
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const bool = (v) => v
    ? <Icon name="check_circle" className="text-[18px]" style={{ color: '#16a34a' }} />
    : <Icon name="cancel" className="text-[18px]" style={{ color: 'var(--color-text-faint)' }} />;

  if (loading) return <div className="space-y-3">{[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>;
  if (!items.length) return <EmptyState icon="policy" mensaje="Sin políticas registradas" />;

  return (
    <div className="space-y-4">
      {items.map(p => (
        <div key={p.id} className="card p-5" style={{ border: p.is_active ? '1px solid rgb(127 29 29 / 0.3)' : undefined }}>
          <div className="flex items-center gap-3 mb-4">
            <p className="font-black text-base" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
            {p.is_active && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest"
                style={{ background: 'rgb(127 29 29 / 0.1)', color: 'var(--color-primary)', border: '1px solid rgb(127 29 29 / 0.25)' }}>
                Activa
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Longitud mínima', value: `${p.min_length} caracteres`, icon: 'straighten' },
              { label: 'Expiración',      value: `${p.expiration_days} días`,   icon: 'schedule'  },
              { label: 'Alerta previa',   value: `${p.warning_days} días`,      icon: 'warning'   },
              { label: 'Historial',       value: `${p.history_count} registros`, icon: 'history'  },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 p-3 rounded-xl"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                <Icon name={s.icon} className="text-[18px] shrink-0" style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Requisitos</p>
            {[
              { label: 'Mayúscula', value: p.require_upper   },
              { label: 'Minúscula', value: p.require_lower   },
              { label: 'Dígito',    value: p.require_digit   },
              { label: 'Especial',  value: p.require_special },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-1.5">
                {bool(r.value)}
                <span className="text-xs" style={{ color: 'var(--color-text-body)' }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SeguridadPage() {
  const [activeTab, setActiveTab] = useState('sesiones');

  return (
    <div className="gap-1 p-4 max-w-[1600px] animate-in fade-in duration-500 h-auto pb-20">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Icon name="security" className="text-[24px]" />
          </div>
          <div>
            <h1 className="page-title">Seguridad del Sistema</h1>
            <p className="page-subtitle">Monitoreo de sesiones, intentos de acceso, credenciales y políticas de contraseña.</p>
          </div>
        </div>
        <div className="flex gap-6 border-t border-border pt-3 overflow-x-auto">
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all whitespace-nowrap shrink-0 ${
                activeTab === id ? 'text-primary border-b-2 border-primary' : 'text-faint hover:text-main'
              }`}>
              <Icon name={icon} className="text-[16px]" />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        <div className="card p-6">
          {activeTab === 'sesiones'     && <TabSesionesActivas />}
          {activeTab === 'historial'    && <TabHistorialSesiones />}
          {activeTab === 'intentos'     && <TabIntentos />}
          {activeTab === 'credenciales' && <TabCredenciales />}
          {activeTab === 'politicas'    && <TabPoliticas />}
        </div>
      </div>
    </div>
  );
}