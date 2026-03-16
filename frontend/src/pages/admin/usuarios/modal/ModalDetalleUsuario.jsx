import { useState, useEffect } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useUsuarios }  from '../../../../hooks/useUsuarios';
import { useAuth }      from '../../../../hooks/useAuth';
import { useBienes }    from '../../../../hooks/useBienes';
import { useToast }     from '../../../../hooks/useToast';
import { useAuthStore } from '../../../../store/authStore';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const ROL_CFG = {
  SYSADMIN:     { label: 'SysAdmin',       icon: 'shield_person',  bg: 'rgb(127 29 29 / 0.1)',  color: 'var(--color-primary)' },
  coordSistema: { label: 'Coord. Sistema', icon: 'hub',            bg: 'rgb(37 99 235 / 0.1)',  color: '#1d4ed8' },
  adminSede:    { label: 'Admin Sede',     icon: 'corporate_fare', bg: 'rgb(124 58 237 / 0.1)', color: '#7c3aed' },
  asistSistema: { label: 'Asist. Sistema', icon: 'person_edit',   bg: 'rgb(180 83 9 / 0.1)',   color: '#b45309' },
  segurSede:    { label: 'Segur. Sede',    icon: 'security',       bg: 'rgb(194 65 12 / 0.1)',  color: '#c2410c' },
  userCorte:    { label: 'Usuario Final',  icon: 'person',         bg: 'rgb(71 85 105 / 0.1)',  color: '#475569' },
};
const MS_LABEL = { 'ms-bienes': 'Bienes', 'ms-usuarios': 'Usuarios', 'ms-reportes': 'Reportes' };
const TABS = [
  { id: 'general',   label: 'Información',    icon: 'person'      },
  { id: 'acceso',    label: 'Rol / Permisos', icon: 'shield'      },
  { id: 'seguridad', label: 'Seguridad',      icon: 'lock'        },
  { id: 'bienes',    label: 'Bienes',         icon: 'inventory_2' },
];
const fmt  = (iso) => !iso ? '—' : new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'medium' });
const fmtT = (iso) => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

function DatoRow({ icon, label, value, mono = false }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
      <Icon name={icon} className="text-[16px] mt-0.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} />
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className={`text-sm font-semibold mt-0.5 ${mono ? 'font-mono' : ''}`} style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

function TabGeneral({ data }) {
  const sedes = data.sedes ?? [];
  return (
    <div className="space-y-0.5">
      <DatoRow icon="badge"           label="DNI"              value={data.dni}                 mono />
      <DatoRow icon="person"          label="Nombres"          value={data.first_name}              />
      <DatoRow icon="family_restroom" label="Apellidos"        value={data.last_name}               />
      <DatoRow icon="work_outline"    label="Cargo"            value={data.cargo}                   />
      <DatoRow icon="account_tree"    label="Dependencia"      value={data.dependencia?.nombre}     />
      <DatoRow icon="widgets"         label="Módulo funcional" value={data.modulo?.nombre}          />
      <DatoRow icon="calendar_today"  label="Fecha de ingreso" value={fmt(data.date_joined)}        />
      {data.fecha_baja && <DatoRow icon="event_busy" label="Fecha de baja" value={fmt(data.fecha_baja)} />}
      {sedes.length > 0 && (
        <div className="pt-3">
          <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>Sedes asignadas</p>
          <div className="flex flex-wrap gap-2">
            {sedes.map(s => (
              <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold"
                style={{ background: 'rgb(127 29 29 / 0.06)', border: '1px solid rgb(127 29 29 / 0.2)', color: 'var(--color-primary)' }}>
                <Icon name="location_on" className="text-[13px]" />{s.nombre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabAcceso({ data }) {
  const rolKey = data.role?.name ?? '';
  const rolCfg = ROL_CFG[rolKey] ?? { label: rolKey || '—', icon: 'manage_accounts', bg: 'var(--color-border-light)', color: 'var(--color-text-muted)' };
  const permisos = data.role?.permissions ?? [];
  const porMs = permisos.reduce((acc, p) => {
    const ms = p.microservice_name ?? 'general';
    if (!acc[ms]) acc[ms] = [];
    acc[ms].push(p.codename);
    return acc;
  }, {});
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
        <div className="size-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: rolCfg.bg }}>
          <Icon name={rolCfg.icon} className="text-[24px]" style={{ color: rolCfg.color }} />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Rol asignado</p>
          <p className="font-black text-sm" style={{ color: 'var(--color-text-primary)' }}>{rolCfg.label}</p>
          <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{rolKey}</p>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold"
            style={{ background: data.is_active ? 'rgb(22 163 74 / 0.08)' : 'var(--color-border-light)', color: data.is_active ? '#16a34a' : 'var(--color-text-muted)', border: `1px solid ${data.is_active ? 'rgb(22 163 74 / 0.25)' : 'var(--color-border)'}` }}>
            <span className={`size-1.5 rounded-full ${data.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
            {data.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
      {Object.keys(porMs).length > 0 ? (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Permisos — {permisos.length} total</p>
          <div className="space-y-4">
            {Object.entries(porMs).map(([ms, codes]) => (
              <div key={ms}>
                <p className="text-[10px] font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-text-body)' }}>
                  <Icon name="database" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />
                  {MS_LABEL[ms] ?? ms}
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md font-black" style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>{codes.length}</span>
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {codes.map(c => (
                    <span key={c} className="text-[10px] font-mono px-2 py-1 rounded-lg truncate"
                      style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}
                      title={c}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <Icon name="key_off" className="text-[36px]" style={{ color: 'var(--color-text-faint)' }} />
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Sin permisos registrados.</p>
        </div>
      )}
    </div>
  );
}

function TabSeguridad({ data }) {
  const toast = useToast();
  const { resetearPasswordPorDni, obtenerSesiones, configurarSesionMultiple, consultarHistorialContrasenas } = useAuth();
  const currentRole = useAuthStore(s => s.role);
  const currentPerms = useAuthStore(s => s.permissionsFlat ?? []);
  const canReset = currentRole === 'SYSADMIN' || currentPerms.includes('ms-usuarios:authentication:add_credential');

  const [confirmReset,   setConfirmReset]   = useState(false);
  const [resetLoading,   setResetLoading]   = useState(false);
  const [multiLoading,   setMultiLoading]   = useState(false);
  const [sesiones,       setSesiones]       = useState([]);
  const [loadingSes,     setLoadingSes]     = useState(false);
  const [historial,      setHistorial]      = useState([]);
  const [loadingHist,    setLoadingHist]    = useState(false);

  useEffect(() => {
    if (!data?.dni) return;
    setLoadingSes(true);
    obtenerSesiones(data.dni)
      .then(d => setSesiones(Array.isArray(d) ? d : []))
      .catch(() => setSesiones([]))
      .finally(() => setLoadingSes(false));
    if (data?.id) {
      setLoadingHist(true);
      consultarHistorialContrasenas(data.id, 5)
        .then(d => setHistorial(Array.isArray(d) ? d : []))
        .catch(() => setHistorial([]))
        .finally(() => setLoadingHist(false));
    }
  }, [data?.dni, data?.id]);

  const confirmarReset = async () => {
    setConfirmReset(false);
    setResetLoading(true);
    try {
      await resetearPasswordPorDni(data.username ?? data.dni);
      toast.success(`Contraseña restablecida. La nueva clave es el DNI del usuario.`);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al restablecer la contraseña.');
    } finally { setResetLoading(false); }
  };

  const toggleMulti = async (activar) => {
    setMultiLoading(true);
    try {
      await configurarSesionMultiple(data.username ?? data.dni, activar ? 1 : 2);
      toast.success(`Múltiples sesiones ${activar ? 'habilitadas' : 'deshabilitadas'}.`);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al configurar sesiones.');
    } finally { setMultiLoading(false); }
  };

  const SES_CFG = {
    active:    { label: 'Activa',   color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)',  dot: 'bg-green-500' },
    expired:   { label: 'Expirada', color: '#b45309', bg: 'rgb(180 83 9 / 0.1)',   dot: 'bg-amber-500' },
    logout:    { label: 'Cerrada',  color: 'var(--color-text-muted)', bg: 'var(--color-border-light)', dot: 'bg-slate-400' },
  };

  return (
    <div className="space-y-5">
      {canReset && (
        <section>
          <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Icon name="lock_reset" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />
            Restablecer contraseña
          </p>
          <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-body)' }}>
                Restablecer al valor por defecto
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                La nueva contraseña será el DNI del usuario: <span className="font-mono font-black" style={{ color: 'var(--color-primary)' }}>{data.dni}</span>.
                El sistema obligará al usuario a cambiarla en su próximo ingreso.
              </p>
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              disabled={resetLoading}
              className="btn-primary flex items-center gap-2 shrink-0 whitespace-nowrap"
            >
              {resetLoading ? <span className="btn-loading-spin" /> : <Icon name="lock_reset" className="text-[16px]" />}
              Resetear clave
            </button>
          </div>
          <ConfirmDialog
            open={confirmReset}
            title="Confirmar restablecimiento"
            message={`¿Resetear la contraseña de "${data.first_name} ${data.last_name}"? La nueva clave será su DNI (${data.dni}) y deberá cambiarla al ingresar.`}
            confirmLabel="Sí, resetear" variant="danger" loading={resetLoading}
            onConfirm={confirmarReset} onClose={() => setConfirmReset(false)} />
        </section>
      )}

      <section style={{ borderTop: canReset ? '1px solid var(--color-border-light)' : 'none', paddingTop: canReset ? '1.25rem' : 0 }}>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
          <Icon name="devices" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />
          Múltiples sesiones
        </p>
        <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-body)' }}>Permitir acceso desde varias PCs</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>El usuario puede iniciar sesión en más de un dispositivo simultáneamente.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {multiLoading && <span className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />}
            {canReset ? (
              <>
                <button onClick={() => toggleMulti(false)} disabled={multiLoading}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                  Deshabilitar
                </button>
                <button onClick={() => toggleMulti(true)} disabled={multiLoading}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  style={{ background: 'rgb(127 29 29 / 0.1)', color: 'var(--color-primary)', border: '1px solid rgb(127 29 29 / 0.25)' }}>
                  Habilitar
                </button>
              </>
            ) : (
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Sin permisos para configurar esto.</span>
            )}
          </div>
        </div>
      </section>

      <section style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1.25rem' }}>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
          <Icon name="manage_history" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />
          Sesiones activas {sesiones.length > 0 && <span className="tab-count-inactive">{sesiones.length}</span>}
        </p>
        {loadingSes ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : sesiones.length === 0 ? (
          <div className="text-center py-5 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
            <Icon name="wifi_off" className="text-[30px]" style={{ color: 'var(--color-text-faint)' }} />
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>Sin sesiones activas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sesiones.map(s => {
              const cfg = SES_CFG[s.status] ?? SES_CFG.logout;
              return (
                <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                  <Icon name="computer" className="text-[18px] mt-0.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{s.device_info || 'Dispositivo desconocido'}</p>
                    <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{s.ip_address}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>Inicio: {fmtT(s.login_at)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <span className={`size-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {(loadingHist || historial.length > 0) && (
        <section style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1.25rem' }}>
          <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Icon name="history" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />
            Últimos cambios de contraseña
          </p>
          {loadingHist ? (
            <div className="space-y-1">{[1,2,3].map(i => <div key={i} className="skeleton h-8 rounded-lg" />)}</div>
          ) : (
            <div className="space-y-1.5">
              {historial.map((h, i) => (
                <div key={h.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border-light)' }}>
                  <span className="size-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                    style={{ background: i === 0 ? 'rgb(127 29 29 / 0.1)' : 'var(--color-border-light)', color: i === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    {i + 1}
                  </span>
                  <p className="text-xs flex-1" style={{ color: 'var(--color-text-body)' }}>{fmtT(h.created_at)}</p>
                  {i === 0 && <span className="text-[9px] font-black" style={{ color: 'var(--color-primary)' }}>Más reciente</span>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function TabBienes({ usuarioId }) {
  const { listarPorUsuario } = useBienes();
  const [bienes, setBienes]   = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!usuarioId) return;
    setLoading(true);
    listarPorUsuario(usuarioId)
      .then(d => setBienes(Array.isArray(d) ? d : d?.results ?? []))
      .catch(() => setBienes([]))
      .finally(() => setLoading(false));
  }, [usuarioId]);
  if (loading) return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>;
  if (!bienes.length) return (
    <div className="text-center py-10">
      <Icon name="inventory_2" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
      <p className="text-sm mt-2 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Sin bienes asignados</p>
    </div>
  );
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
        {bienes.length} bien{bienes.length !== 1 ? 'es' : ''} asignado{bienes.length !== 1 ? 's' : ''}
      </p>
      <div className="space-y-2">
        {bienes.map(b => (
          <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
            <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgb(127 29 29 / 0.08)' }}>
              <Icon name="devices" className="text-[18px]" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{b.tipo_bien_nombre ?? 'Bien'}{b.marca_nombre ? ` — ${b.marca_nombre}` : ''}</p>
              <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{b.codigo_patrimonial ?? `#${b.id}`}</p>
            </div>
            <span className="text-[10px] font-black px-2 py-1 rounded-lg shrink-0"
              style={{ background: b.is_active ? 'rgb(22 163 74 / 0.08)' : 'var(--color-border-light)', color: b.is_active ? '#16a34a' : 'var(--color-text-muted)' }}>
              {b.estado_bien_nombre ?? (b.is_active ? 'Activo' : 'Inactivo')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumenLateral({ data, totalBienes }) {
  const rolKey = data.role?.name ?? '';
  const rolCfg = ROL_CFG[rolKey] ?? { label: '—', icon: 'manage_accounts', bg: 'var(--color-border-light)', color: 'var(--color-text-muted)' };
  return (
    <aside className="w-52 shrink-0 space-y-3">
      <div className="flex flex-col items-center gap-2 p-4 rounded-xl text-center" style={{ background: rolCfg.bg, border: `1px solid ${rolCfg.color}30` }}>
        <div className="size-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
          <Icon name={rolCfg.icon} className="text-[28px]" style={{ color: rolCfg.color }} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: rolCfg.color }}>{rolCfg.label}</p>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: data.is_active ? 'rgb(22 163 74 / 0.12)' : 'var(--color-border-light)', color: data.is_active ? '#16a34a' : 'var(--color-text-muted)' }}>
          <span className={`size-1.5 rounded-full ${data.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
          {data.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      <div className="card p-3 space-y-2">
        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>Resumen</p>
        {[
          { icon: 'inventory_2', label: 'Bienes',   value: totalBienes },
          { icon: 'location_on', label: 'Sedes',    value: (data.sedes ?? []).length },
          { icon: 'key',         label: 'Permisos', value: (data.role?.permissions ?? []).length },
        ].map(s => (
          <div key={s.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon name={s.icon} className="text-[13px] shrink-0" style={{ color: 'var(--color-text-faint)' }} />
              <span className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
            </div>
            <span className="text-xs font-black shrink-0" style={{ color: 'var(--color-text-primary)' }}>{s.value}</span>
          </div>
        ))}
      </div>
      {data.cargo && (
        <div className="card p-3">
          <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>Cargo</p>
          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-body)' }}>{data.cargo}</p>
        </div>
      )}
    </aside>
  );
}

export default function ModalDetalleUsuario({ open, onClose, item, onEditar }) {
  const { obtener } = useUsuarios();
  const { listarPorUsuario } = useBienes();
  const [tab,         setTab]        = useState('general');
  const [usuario,     setUsuario]    = useState(null);
  const [loading,     setLoading]    = useState(false);
  const [totalBienes, setTotalBienes] = useState('…');

  useEffect(() => {
    if (!open || !item?.id) return;
    setTab('general'); setUsuario(null); setTotalBienes('…');
    let cancelled = false;
    setLoading(true);
    obtener(item.id)
      .then(d  => { if (!cancelled) setUsuario(d); })
      .catch(() => { if (!cancelled) setUsuario(item); })
      .finally(() => { if (!cancelled) setLoading(false); });
    listarPorUsuario(item.id)
      .then(d => { if (!cancelled) setTotalBienes(Array.isArray(d) ? d.length : d?.results?.length ?? 0); })
      .catch(() => { if (!cancelled) setTotalBienes(0); });
    return () => { cancelled = true; };
  }, [open, item?.id]);

  if (!item) return null;
  const data = usuario ?? item;
  const nombreCompleto = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() || 'Sin nombre';

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader icon="manage_accounts" title={nombreCompleto}
        subtitle={`DNI ${data.dni ?? '—'} · ${data.cargo ?? 'Sin cargo'}`} onClose={onClose} />
      <ModalBody padding={false}>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : (
          <div className="flex">
            <div className="flex-1 min-w-0">
              <div className="flex gap-6 px-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                {TABS.map(({ id, label, icon }) => (
                  <button key={id} onClick={() => setTab(id)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-3 pt-4 transition-all border-b-2"
                    style={{ borderBottomColor: tab === id ? 'var(--color-primary)' : 'transparent', color: tab === id ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    <Icon name={icon} className="text-[16px]" />
                    {label}
                    {id === 'bienes' && totalBienes !== '…' && Number(totalBienes) > 0 && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${tab === id ? 'tab-count-active' : 'tab-count-inactive'}`}>{totalBienes}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {tab === 'general'   && <TabGeneral   data={data} />}
                {tab === 'acceso'    && <TabAcceso    data={data} />}
                {tab === 'seguridad' && <TabSeguridad data={data} />}
                {tab === 'bienes'    && <TabBienes    usuarioId={data.id} />}
              </div>
            </div>
            <div className="p-4 shrink-0" style={{ borderLeft: '1px solid var(--color-border)' }}>
              <ResumenLateral data={data} totalBienes={totalBienes} />
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter align="right">
        <button onClick={onClose} className="btn-secondary">Cerrar</button>
        <button onClick={() => { onClose(); onEditar(item); }} className="btn-primary flex items-center gap-2">
          <Icon name="edit" className="text-[16px]" /> Editar usuario
        </button>
      </ModalFooter>
    </Modal>
  );
}