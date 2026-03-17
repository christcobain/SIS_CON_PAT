import { useMemo } from 'react';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
const fmt  = iso => !iso ? '—' : new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'medium' });

function Skeletons({ n = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="skeleton h-14 rounded-xl" />
      ))}
    </div>
  );
}

function TablaWrapper({ columnas, children }) {
  return (
    <div className="table-wrapper rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>{columnas.map(c => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function BadgeSesion({ status }) {
  const MAP = {
    active:  { label: 'Activa',   bg: 'rgb(22 163 74 / 0.1)',      color: '#16a34a',                   dot: 'bg-green-500' },
    logout:  { label: 'Cerrada',  bg: 'var(--color-border-light)',  color: 'var(--color-text-muted)',   dot: 'bg-slate-400' },
    expired: { label: 'Expirada', bg: 'rgb(180 83 9 / 0.1)',       color: '#b45309',                   dot: 'bg-amber-500' },
  };
  const cfg = MAP[status] ?? MAP.logout;
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const TIPO_LABEL = {
  success:               'Exitoso',
  invalid_password:      'Clave inválida',
  user_not_found:        'No encontrado',
  user_inactive:         'Inactivo',
  password_expired:      'Clave expirada',
  locked:                'Bloqueado',
  force_password_change: 'Cambio requerido',
  multiple_sessions:     'Sesión múltiple',
  other:                 'Otro',
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

function TablaSesiones({ items }) {
  const cols = ['Usuario / DNI', 'IP', 'Dispositivo', 'Inicio', 'Cierre', 'Estado'];
  return (
    <TablaWrapper columnas={cols}>
      {items.map(s => (
        <tr key={s.id} className="hover:bg-surface-alt/60">
          <td>
            <p className="font-bold text-xs">{s.nombre_completo || s.username || s.dni}</p>
            <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{s.dni}</p>
          </td>
          <td className="font-mono text-xs">{s.ip_address}</td>
          <td className="text-xs max-w-[180px] truncate" title={s.device_info}>{s.device_info || '—'}</td>
          <td className="text-xs">{fmtT(s.login_at)}</td>
          <td className="text-xs">{s.logout_at ? fmtT(s.logout_at) : '—'}</td>
          <td><BadgeSesion status={s.status} /></td>
        </tr>
      ))}
    </TablaWrapper>
  );
}

function TablaIntentos({ items }) {
  const totales = useMemo(() => ({
    total:    items.length,
    exitosos: items.filter(i => i.success).length,
    fallidos: items.filter(i => !i.success).length,
  }), [items]);

  const cols = ['DNI', 'IP', 'Resultado', 'Fecha', 'Mensaje'];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total registros', value: totales.total,    icon: 'list',          color: 'var(--color-primary)' },
          { label: 'Exitosos',        value: totales.exitosos, icon: 'check_circle',   color: '#16a34a' },
          { label: 'Fallidos',        value: totales.fallidos, icon: 'cancel',         color: '#dc2626' },
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
      <TablaWrapper columnas={cols}>
        {items.map(a => (
          <tr key={a.id} className="hover:bg-surface-alt/60">
            <td className="font-mono text-xs font-bold">{a.dni}</td>
            <td className="font-mono text-xs">{a.ip_address}</td>
            <td><BadgeIntento success={a.success} tipo={a.attempt_type} /></td>
            <td className="text-xs">{fmtT(a.attempted_at)}</td>
            <td className="text-xs max-w-[180px] truncate" title={a.error_message}
              style={{ color: 'var(--color-text-muted)' }}>
              {a.error_message || '—'}
            </td>
          </tr>
        ))}
      </TablaWrapper>
    </div>
  );
}

function TablaCredenciales({ items, onUnlock, onReset }) {
  const cols = ['Usuario', 'Estado', 'Multi-sesión', 'Último cambio', 'Intentos', 'Acciones'];
  return (
    <TablaWrapper columnas={cols}>
      {items.map(c => (
        <tr key={c.id} className="hover:bg-surface-alt/60">
          <td>
            <p className="font-bold text-xs">{c.user?.nombre_completo || c.user?.username}</p>
            <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{c.user?.dni}</p>
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
            <div className="flex items-center gap-1.5 flex-wrap">
              {c.is_locked && (
                <button onClick={() => onUnlock(c)}
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-xl cursor-pointer transition-all"
                  style={{ background: 'rgb(22 163 74 / 0.1)', color: '#16a34a', border: '1px solid rgb(22 163 74 / 0.25)' }}>
                  <Icon name="lock_open" className="text-[13px]" />Desbloquear
                </button>
              )}
              <button onClick={() => onReset(c)}
                className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-xl cursor-pointer transition-all"
                style={{ background: 'rgb(127 29 29 / 0.08)', color: 'var(--color-primary)', border: '1px solid rgb(127 29 29 / 0.2)' }}>
                <Icon name="lock_reset" className="text-[13px]" />Resetear
              </button>
            </div>
          </td>
        </tr>
      ))}
    </TablaWrapper>
  );
}

export default function SeguridadTabla({ activeTab, items = [], loading, onUnlock, onReset }) {
  if (loading) return <Skeletons n={5} />;

  if (!items.length) {
    return (
      <div className="text-center py-14">
        <Icon name="search_off" className="text-[48px]" style={{ color: 'var(--color-text-faint)' }} />
        <p className="text-sm font-semibold mt-3" style={{ color: 'var(--color-text-muted)' }}>Sin registros para mostrar</p>
      </div>
    );
  }

  if (activeTab === 'sesiones' || activeTab === 'historial') return <TablaSesiones items={items} />;
  if (activeTab === 'intentos')     return <TablaIntentos    items={items} />;
  if (activeTab === 'credenciales') return <TablaCredenciales items={items} onUnlock={onUnlock} onReset={onReset} />;
  return null;
}