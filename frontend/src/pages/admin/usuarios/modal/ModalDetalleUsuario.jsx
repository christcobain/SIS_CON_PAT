import { useState, useEffect, useMemo } from 'react';
import Modal from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import Can from '../../../../components/auth/Can';
import { useUsuarios } from '../../../../hooks/useUsuarios';
import { useAuth } from '../../../../hooks/useAuth';
import { useBienes } from '../../../../hooks/useBienes';
import { useRoles } from '../../../../hooks/useRoles';
import { useToast } from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const MS_LABEL = { 'ms-bienes': 'Bienes', 'ms-usuarios': 'Usuarios', 'ms-reportes': 'Reportes' };

// CORRECCIÓN: Ajuste de permisos según permissions_flat real
const TABS_CONFIG = [
  { id: 'general', label: 'Información', icon: 'person' },
  { id: 'acceso', label: 'Rol / Permisos', icon: 'shield', permission: 'ms-usuarios:roles:view_role' },
  { id: 'seguridad', label: 'Seguridad', icon: 'lock', permission: 'ms-usuarios:authentication:view_loginsession' },
  { id: 'bienes', label: 'Bienes', icon: 'inventory_2', permission: 'ms-bienes:bienes:view_bien' },
];

const fmt = (iso) => !iso ? '—' : new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'medium' });
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
      <DatoRow icon="badge" label="DNI" value={data.dni} mono />
      <DatoRow icon="person" label="Nombres" value={data.first_name} />
      <DatoRow icon="family_restroom" label="Apellidos" value={data.last_name} />
      <DatoRow icon="work_outline" label="Cargo" value={data.cargo} />
      <DatoRow icon="account_tree" label="Dependencia" value={data.dependencia?.nombre} />
      <DatoRow icon="widgets" label="Módulo funcional" value={data.modulo?.nombre} />
      <DatoRow icon="calendar_today" label="Fecha de ingreso" value={fmt(data.date_joined)} />
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

function TabAcceso({ data, rolDinamico }) {
  const rolKey = data.role?.name ?? '';
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
        <div className="size-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: rolDinamico.bg }}>
          <Icon name={rolDinamico.icon} className="text-[24px]" style={{ color: rolDinamico.color }} />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Rol asignado</p>
          <p className="font-black text-sm" style={{ color: 'var(--color-text-primary)' }}>{rolDinamico.label}</p>
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
  const { resetearPasswordPorDni, obtenerSesiones, configurarSesionMultiple } = useAuth();
  
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [multiLoading, setMultiLoading] = useState(false);
  const [sesiones, setSesiones] = useState([]);
  const [loadingSes, setLoadingSes] = useState(false);

  useEffect(() => {
    if (!data?.dni) return;
    setLoadingSes(true);
    obtenerSesiones(data.dni)
      .then(d => setSesiones(Array.isArray(d) ? d : []))
      .catch(() => setSesiones([]))
      .finally(() => setLoadingSes(false));
  }, [data?.dni]);

  const confirmarReset = async () => {
    setConfirmReset(false);
    setResetLoading(true);
    try {
      await resetearPasswordPorDni(data.username ?? data.dni);
      toast.success(`Contraseña restablecida correctamente.`);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al restablecer la contraseña.');
    } finally { setResetLoading(false); }
  };

  const toggleMulti = async (activar) => {
    setMultiLoading(true);
    try {
      await configurarSesionMultiple(data.username ?? data.dni, activar ? 1 : 2);
      toast.success(`Configuración actualizada.`);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al configurar sesiones.');
    } finally { setMultiLoading(false); }
  };

  const SES_CFG = {
    active: { label: 'Activa', color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)', dot: 'bg-green-500' },
    expired: { label: 'Expirada', color: '#b45309', bg: 'rgb(180 83 9 / 0.1)', dot: 'bg-amber-500' },
    logout: { label: 'Cerrada', color: 'var(--color-text-muted)', bg: 'var(--color-border-light)', dot: 'bg-slate-400' },
  };

  return (
    <div className="space-y-5">
      <Can perform="ms-usuarios:authentication:add_credential">
        <section>
          <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Icon name="lock_reset" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />
            Restablecer contraseña
          </p>
          <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-body)' }}>Restablecer al valor por defecto</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>La nueva contraseña será el DNI del usuario.</p>
            </div>
            <button onClick={() => setConfirmReset(true)} disabled={resetLoading} className="btn-primary flex items-center gap-2 shrink-0">
              {resetLoading ? <span className="btn-loading-spin" /> : <Icon name="lock_reset" className="text-[16px]" />}
              Resetear clave
            </button>
          </div>
        </section>
      </Can>

      <Can perform="ms-usuarios:authentication:add_credential">
        <section style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1.25rem' }}>
          <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Icon name="devices" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />
            Múltiples sesiones
          </p>
          <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-body)' }}>Permitir acceso desde varias PCs</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toggleMulti(false)} disabled={multiLoading} className="btn-secondary text-[10px]">Deshabilitar</button>
              <button onClick={() => toggleMulti(true)} disabled={multiLoading} className="btn-primary text-[10px]">Habilitar</button>
            </div>
          </div>
        </section>
      </Can>

      <Can perform="ms-usuarios:authentication:view_loginsession">
        <section style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1.25rem' }}>
          <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Icon name="manage_history" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />
            Sesiones activas
          </p>
          <div className="space-y-2">
            {loadingSes ? (
               <div className="skeleton h-12 w-full" />
            ) : sesiones.length > 0 ? (
              sesiones.map(s => {
                const cfg = SES_CFG[s.status] ?? SES_CFG.logout;
                return (
                  <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                    <Icon name="computer" className="text-[18px] mt-0.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{s.device_info || 'Dispositivo'}</p>
                      <p className="text-[10px]">{fmtT(s.login_at)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-4 text-xs text-muted">No hay sesiones recientes.</p>
            )}
          </div>
        </section>
      </Can>

      <ConfirmDialog open={confirmReset} title="Confirmar" message="¿Resetear contraseña?" onConfirm={confirmarReset} onClose={() => setConfirmReset(false)} />
    </div>
  );
}

function TabBienes({ usuarioId }) {
  const { listarPorUsuario } = useBienes();
  const [bienes, setBienes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!usuarioId) return;
    setLoading(true);
    listarPorUsuario(usuarioId).then(d => setBienes(Array.isArray(d) ? d : d?.results ?? [])).finally(() => setLoading(false));
  }, [usuarioId]);

  if (loading) return <div className="skeleton h-20 w-full" />;

  return (
    <div className="space-y-2">
      {bienes.length > 0 ? bienes.map(b => (
        <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
          <Icon name="devices" className="text-[18px]" style={{ color: 'var(--color-primary)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{b.tipo_bien_nombre}</p>
            <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{b.codigo_patrimonial}</p>
          </div>
        </div>
      )) : (
        <p className="text-center py-10 text-xs text-faint">No tiene bienes asignados.</p>
      )}
    </div>
  );
}

function ResumenLateral({ data, rolDinamico, totalBienes }) {
  return (
    <aside className="w-52 shrink-0 space-y-3">
      <div className="flex flex-col items-center gap-2 p-4 rounded-xl text-center border" style={{ background: rolDinamico.bg, border: `1px solid ${rolDinamico.color}30` }}>
        <Icon name={rolDinamico.icon} className="text-[28px]" style={{ color: rolDinamico.color }} />
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: rolDinamico.color }}>{rolDinamico.label}</p>
      </div>
      <div className="card p-3 space-y-2">
        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>Resumen</p>
        <div className="flex items-center justify-between text-xs">
          <span>Bienes</span>
          <span className="font-black">{totalBienes}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span>Permisos</span>
          <span className="font-black">{(data.role?.permissions ?? []).length}</span>
        </div>
      </div>
    </aside>
  );
}

export default function ModalDetalleUsuario({ open, onClose, item, onEditar }) {
  const { obtener } = useUsuarios();
  const { listarPorUsuario } = useBienes();
  const { roles, refetch } = useRoles();
  const [tab, setTab] = useState('general');
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalBienes, setTotalBienes] = useState('…');

  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  useEffect(() => {
    if (!open || !item?.id) return;
    setTab('general');
    setLoading(true);
    obtener(item.id).then(setUsuario).finally(() => setLoading(false));
    listarPorUsuario(item.id).then(d => setTotalBienes(Array.isArray(d) ? d.length : d?.results?.length ?? 0));
  }, [open, item?.id]);

  const rolDinamico = useMemo(() => {
    const rolName = usuario?.role?.name || item?.role?.name;
    const rolEncontrado = roles.find(r => r.name === rolName);
    
    if (rolEncontrado) {
      return {
        label: rolEncontrado.nombre_mostrable || rolEncontrado.name,
        icon: rolEncontrado.icono || 'account_circle',
        color: rolEncontrado.color_hex || 'var(--color-primary)',
        bg: `${rolEncontrado.color_hex || '#7f1d1d'}15`
      };
    }
    return { label: rolName || 'Sin Rol', icon: 'person', color: '#64748b', bg: '#f1f5f9' };
  }, [roles, usuario, item]);

  if (!item) return null;
  const data = usuario ?? item;

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader 
        icon="manage_accounts" 
        title={`${data.first_name ?? ''} ${data.last_name ?? ''}`} 
        subtitle={`DNI ${data.dni}`} 
        onClose={onClose} 
      />
      <ModalBody padding={false}>
        <div className="flex">
          <div className="flex-1 min-w-0">
            <div className="flex gap-6 px-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              {TABS_CONFIG.map(({ id, label, icon, permission }) => {
                const trigger = (
                  <button key={id} onClick={() => setTab(id)} className="flex items-center gap-2 text-[10px] font-black uppercase pb-3 pt-4 border-b-2 transition-all"
                    style={{ borderBottomColor: tab === id ? 'var(--color-primary)' : 'transparent', color: tab === id ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    <Icon name={icon} className="text-[16px]" /> {label}
                  </button>
                );
                // CORRECCIÓN: Usar perform en lugar de permission para el componente Can
                return permission ? <Can key={id} perform={permission}>{trigger}</Can> : trigger;
              })}
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {loading ? <div className="skeleton h-40 w-full" /> : (
                <>
                  {tab === 'general' && <TabGeneral data={data} />}
                  {tab === 'acceso' && <TabAcceso data={data} rolDinamico={rolDinamico} />}
                  {tab === 'seguridad' && <TabSeguridad data={data} />}
                  {tab === 'bienes' && <TabBienes usuarioId={data.id} />}
                </>
              )}
            </div>
          </div>
          <div className="p-4 shrink-0 border-l" style={{ borderLeft: '1px solid var(--color-border)' }}>
            <ResumenLateral data={data} rolDinamico={rolDinamico} totalBienes={totalBienes} />
          </div>
        </div>
      </ModalBody>
      <ModalFooter align="right">
        <button onClick={onClose} className="btn-secondary">Cerrar</button>
        {/* CORRECCIÓN: El usuario actual NO tiene change_user, por lo que este botón ahora sí desaparecerá */}
        <Can perform="ms-usuarios:users:change_user">
          <button onClick={() => { onClose(); onEditar(item); }} className="btn-primary flex items-center gap-2">
            <Icon name="edit" /> Editar usuario
          </button>
        </Can>
      </ModalFooter>
    </Modal>
  );
}