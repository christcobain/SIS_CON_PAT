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

const TABS_CONFIG = [
  { id: 'general', label: 'General', icon: 'info' },
  { id: 'acceso', label: 'Rol / Permisos', icon: 'shield', permission: 'ms-usuarios:roles:view_role' },
  { id: 'seguridad', label: 'Seguridad', icon: 'lock', permission: 'ms-usuarios:authentication:view_loginsession' },
  { id: 'bienes', label: 'Activos fijos', icon: 'inventory_2', permission: 'ms-bienes:bienes:view_bien' },
];

const fmt = (iso) => !iso ? null : new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtT = (iso) => !iso ? null : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

function Fila({ label, value, icon, mono = false }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border-light bg-surface-alt/30 transition-colors hover:bg-surface-alt/60">
      <div className="size-8 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-border-light shadow-sm">
        <Icon name={icon ?? 'label'} className="text-[16px]" style={{ color: 'var(--color-text-faint)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.15em] leading-none mb-1.5 text-faint">{label}</p>
        <p className={`text-[11px] font-bold truncate ${mono ? 'font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded' : ''}`} style={{ color: 'var(--color-text-primary)' }}>{String(value)}</p>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, color = 'var(--color-text-muted)' }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-2">
      <Icon name={icon} className="text-[16px]" style={{ color }} />
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color }}>{title}</h4>
      <div className="flex-1 h-[1px] bg-border-light" />
    </div>
  );
}

function TabGeneral({ data }) {
  const sedes = data.sedes ?? [];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <SectionTitle icon="fingerprint" title="Datos Personales" />
          <Fila label="Nombres" value={data.first_name} icon="person" />
          <Fila label="Apellidos" value={data.last_name} icon="family_restroom" />
          <Fila label="DNI / Usuario" value={data.dni} icon="badge" mono />
          <Fila label="Cargo" value={data.cargo} icon="work" />
        </div>
        <div className="space-y-3">
          <SectionTitle icon="account_tree" title="Estructura Organizativa" />
          <Fila label="Dependencia" value={data.dependencia?.nombre} icon="lan" />
          <Fila label="Módulo funcional" value={data.modulo?.nombre} icon="widgets" />
          <Fila label="Fecha de ingreso" value={fmt(data.date_joined)} icon="calendar_today" />
          {data.fecha_baja && <Fila label="Fecha de baja" value={fmt(data.fecha_baja)} icon="event_busy" />}
        </div>
      </div>

      {sedes.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface-alt/50 border border-border-light">
          <SectionTitle icon="location_on" title="Sedes con acceso" />
          <div className="flex flex-wrap gap-2">
            {sedes.map(s => (
              <span key={s.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight bg-white dark:bg-slate-800 border border-border-light shadow-sm text-main">
                <div className="size-1.5 rounded-full bg-primary" /> {s.nombre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabAcceso({ data }) {
  const permisos = data.role?.permissions ?? [];
  const porMs = permisos.reduce((acc, p) => {
    const ms = p.microservice_name ?? 'general';
    if (!acc[ms]) acc[ms] = [];
    acc[ms].push(p.codename);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(porMs).map(([ms, codes]) => (
        <div key={ms} className="p-4 rounded-2xl border border-border-light bg-surface shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-light">
            <p className="text-[10px] font-black uppercase tracking-widest text-main">{MS_LABEL[ms] ?? ms}</p>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-primary/10 text-primary">{codes.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {codes.map(c => (
              <div key={c} className="text-[10px] font-mono py-1 px-2 rounded hover:bg-surface-alt truncate text-body border border-transparent hover:border-border-light">
                {c}
              </div>
            ))}
          </div>
        </div>
      ))}
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
      .finally(() => setLoadingSes(false));
  }, [data?.dni]);

  const confirmarReset = async () => {
    setConfirmReset(false);
    setResetLoading(true);
    try {
      await resetearPasswordPorDni(data.username ?? data.dni);
      toast.success(`Contraseña restablecida correctamente.`);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al restablecer clave.');
    } finally { setResetLoading(false); }
  };

  const toggleMulti = async (activar) => {
    setMultiLoading(true);
    try {
      await configurarSesionMultiple(data.username ?? data.dni, activar ? 1 : 2);
      toast.success(`Multisesión ${activar ? 'Activada' : 'Desactivada'}.`);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al configurar.');
    } finally { setMultiLoading(false); }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <Can perform="ms-usuarios:authentication:add_credential">
          <div className="p-5 rounded-2xl border border-border-light bg-slate-50/50 dark:bg-slate-800/20">
            <SectionTitle icon="lock_reset" title="Credenciales" color="var(--color-primary)" />
            <p className="text-[11px] text-muted mb-4 leading-relaxed">Reiniciar contraseña de acceso al DNI del usuario.</p>
            <button onClick={() => setConfirmReset(true)} disabled={resetLoading} className="w-full btn-primary py-2.5 text-[11px] font-black uppercase tracking-widest">
              {resetLoading ? <span className="btn-loading-spin" /> : 'Restablecer Clave'}
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-border-light bg-slate-50/50 dark:bg-slate-800/20">
            <SectionTitle icon="devices" title="Concurrencia" color="#b45309" />
            <p className="text-[11px] text-muted mb-4 leading-relaxed">Permitir múltiples sesiones simultáneas para esta cuenta.</p>
            <div className="flex gap-2">
              <button onClick={() => toggleMulti(true)} disabled={multiLoading} className="flex-1 bg-white dark:bg-slate-800 border border-border-light text-[10px] font-black uppercase py-2.5 rounded-xl hover:bg-slate-50">Habilitar</button>
              <button onClick={() => toggleMulti(false)} disabled={multiLoading} className="flex-1 bg-white dark:bg-slate-800 border border-border-light text-[10px] font-black uppercase py-2.5 rounded-xl hover:bg-slate-50">Deshabilitar</button>
            </div>
          </div>
        </Can>
      </div>

      <div>
        <SectionTitle icon="history" title="Historial de Sesiones Recientes" />
        <div className="space-y-2">
          {loadingSes ? <div className="skeleton h-20 w-full rounded-2xl" /> : sesiones.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl border border-border-light bg-surface-alt/30">
              <div className="size-10 rounded-lg bg-surface flex items-center justify-center border border-border-light">
                <Icon name="laptop_mac" className="text-faint text-[20px]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-main truncate">{s.device_info || 'Dispositivo Desconocido'}</p>
                <p className="text-[10px] font-bold text-faint uppercase">{fmtT(s.login_at)}</p>
              </div>
              <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${s.status === 'active' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                {s.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
      <ConfirmDialog open={confirmReset} title="Restablecer Clave" message="¿Estás seguro de que deseas restablecer la contraseña al DNI del usuario?" onConfirm={confirmarReset} onClose={() => setConfirmReset(false)} />
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

  if (loading) return <div className="grid grid-cols-2 gap-4"><div className="skeleton h-20 rounded-2xl" /><div className="skeleton h-20 rounded-2xl" /></div>;

  return (
    <div className="grid grid-cols-2 gap-3">
      {bienes.length > 0 ? bienes.map(b => (
        <div key={b.id} className="group flex items-center gap-4 p-4 rounded-2xl border border-border-light bg-surface hover:border-primary/30 transition-all shadow-sm">
          <div className="size-11 rounded-xl bg-surface-alt flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
            <Icon name="inventory_2" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black text-main truncate uppercase tracking-tight">{b.tipo_bien_nombre}</p>
            <p className="text-[10px] font-mono font-bold text-primary">{b.codigo_patrimonial}</p>
          </div>
        </div>
      )) : (
        <div className="col-span-2 py-12 flex flex-col items-center justify-center opacity-40">
           <Icon name="inventory" className="text-[48px] mb-2" />
           <p className="text-xs font-bold italic">Sin activos vinculados.</p>
        </div>
      )}
    </div>
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

  useEffect(() => { if (open) refetch(); }, [open, refetch]);

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
    <Modal open={open} onClose={onClose} size="xl" closeOnOverlay>
      <ModalHeader
        icon="account_circle"
        title={`${data.first_name} ${data.last_name}`}
        subtitle={`${rolDinamico.label} · DNI ${data.dni}`}
        onClose={onClose}
      />

      <ModalBody padding={false}>
        {loading ? (
          <div className="p-8 space-y-4">
            <div className="skeleton h-20 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="skeleton h-48 rounded-2xl" /><div className="skeleton h-48 rounded-2xl" />
            </div>
          </div>
        ) : (
          <div className="flex h-[65vh] overflow-hidden">
            <nav className="w-56 shrink-0 bg-slate-50 dark:bg-slate-900/50 border-r border-border-light flex flex-col p-4 gap-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-faint mb-4 px-2">Expediente Usuario</p>
              {TABS_CONFIG.map(({ id, label, icon, permission }) => {
                const btn = (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group ${
                      tab === id 
                        ? 'bg-white dark:bg-slate-800 shadow-sm text-primary font-black border border-border-light' 
                        : 'text-muted hover:bg-white/50 hover:text-body'
                    }`}
                  >
                    <Icon name={icon} className={`text-[20px] transition-colors ${tab === id ? 'text-primary' : 'text-faint group-hover:text-primary/60'}`} />
                    <span className="text-[10px] uppercase tracking-widest">{label}</span>
                  </button>
                );
                return permission ? <Can key={id} perform={permission}>{btn}</Can> : btn;
              })}

              <div className="mt-auto pt-4 border-t border-border-light/50">
                 <p className="text-[8px] font-black uppercase text-faint mb-2 px-2">Estado Cuenta</p>
                 <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-light bg-white dark:bg-slate-800 shadow-sm">
                    <span className={`size-2 rounded-full ${data.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span className="text-[9px] font-black uppercase tracking-tighter text-main">{data.is_active ? 'Usuario Activo' : 'Inactivo'}</span>
                 </div>
              </div>
            </nav>

            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white dark:bg-transparent">
              <div className="animate-in fade-in slide-in-from-right-4 duration-400">
                {tab === 'general' && <TabGeneral data={data} />}
                {tab === 'acceso' && <TabAcceso data={data} />}
                {tab === 'seguridad' && <TabSeguridad data={data} />}
                {tab === 'bienes' && <TabBienes usuarioId={data.id} />}
              </div>
            </main>

            <aside className="w-64 shrink-0 bg-slate-50/30 dark:bg-slate-900/20 border-l border-border-light p-5 space-y-6 overflow-y-auto">
               <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-faint mb-4">Resumen Perfil</p>
                  <div className="space-y-4">
                    {[
                      { label: 'Rol Asignado', value: rolDinamico.label, icon: 'verified_user' },
                      { label: 'Último Acceso', value: data.last_login ? fmtT(data.last_login) : 'Nunca', icon: 'login' },
                      { label: 'Activos fijos', value: `${totalBienes} asignados`, icon: 'inventory_2' },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon name={s.icon} className="text-[14px] text-faint" />
                          <p className="text-[8px] font-black uppercase tracking-widest text-faint">{s.label}</p>
                        </div>
                        <p className="text-[10px] font-bold text-main border-l-2 border-primary/20 pl-3 ml-1.5">{s.value ?? '—'}</p>
                      </div>
                    ))}
                  </div> 
               </div>

               <div className="pt-6 border-t border-border-light">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary mb-3">Identidad</p>
                  <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                    <p className="text-[7px] uppercase font-black text-primary/60 mb-0.5">DNI Titular</p>
                    <p className="text-[12px] font-mono font-bold text-primary">{data.dni}</p>
                  </div>
               </div>
            </aside>
          </div>
        )}
      </ModalBody>

      <ModalFooter align="right" className="bg-slate-50 dark:bg-slate-900/80">
        <button onClick={onClose} className="px-6 py-2 text-[11px] font-black uppercase tracking-widest text-muted hover:text-body transition-colors">
            Cerrar Consulta
        </button>
        <Can perform="ms-usuarios:users:change_user">
          <button onClick={() => { onClose(); onEditar(item); }}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-primary/20 transition-transform active:scale-95">
            <Icon name="edit_square" className="text-[18px]" />
            <span className="font-black uppercase tracking-widest text-[11px]">Editar Usuario</span>
          </button>
        </Can>
      </ModalFooter>
    </Modal>
  );
}