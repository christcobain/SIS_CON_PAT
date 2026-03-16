import { useState, useEffect } from 'react';
import Modal           from '../../../../components/modal/Modal';
import ModalHeader     from '../../../../components/modal/ModalHeader';
import ModalBody       from '../../../../components/modal/ModalBody';
import ModalFooter     from '../../../../components/modal/ModalFooter';
import EmptyState      from '../../../../components/feedback/EmptyState';
import ErrorState      from '../../../../components/feedback/ErrorState';
import { useUsuarios } from '../../../../hooks/useUsuarios';
import { useAuth }     from '../../../../hooks/useAuth';
import { useBienes }   from '../../../../hooks/useBienes';
import { useToast }    from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

// ── Config ────────────────────────────────────────────────────────────────────
const ROL_CFG = {
  SYSADMIN:      { label: 'SysAdmin',        bg: 'bg-primary/10',  color: 'var(--color-primary)', icon: 'shield_person'  },
  coordSistema:  { label: 'Coord. Sistema',  bg: 'bg-blue-100',    color: '#1d4ed8',              icon: 'hub'            },
  adminSede:     { label: 'Admin Sede',      bg: 'bg-purple-100',  color: '#7c3aed',              icon: 'corporate_fare' },
  asistSistema:  { label: 'Asist. Sistema',  bg: 'bg-amber-100',   color: '#b45309',              icon: 'person_edit'    },
  segurSede:     { label: 'Segur. Sede',     bg: 'bg-orange-100',  color: '#c2410c',              icon: 'security'       },
  userCorte:  { label: 'Usuario Final',   bg: 'bg-slate-100',   color: '#475569',              icon: 'person'         },
};
const MS_LABEL = { 'ms-bienes': 'Bienes', 'ms-usuarios': 'Usuarios', 'ms-reportes': 'Reportes' };
const TABS = [
  { id: 'general', label: 'Información',     icon: 'person'      },
  { id: 'acceso',  label: 'Seguridad / Rol', icon: 'shield'      },
  { id: 'bienes',  label: 'Bienes',          icon: 'inventory_2' },
];
const ESTADO_BIEN_CLS = (e) => ({
  'BUENO': 'badge-activo', 'REGULAR': 'badge-pendiente',
  'MALO': 'badge-cancelado', 'DADO DE BAJA': 'badge-cancelado',
}[e?.toUpperCase()] ?? 'badge-inactivo');

// ── Primitivos UI ─────────────────────────────────────────────────────────────
function Dato({ icon, label, value, mono = false, span2 = false }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={`flex items-start gap-2.5 py-2.5 ${span2 ? 'col-span-2' : ''}`}
         style={{ borderBottom: '1px solid var(--color-border-light)' }}>
      <Icon name={icon} className="text-[14px] mt-0.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} />
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
        <p className={`text-sm font-semibold mt-0.5 break-words ${mono ? 'font-mono' : ''}`}
           style={{ color: 'var(--color-text-primary)' }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <svg className="animate-spin h-5 w-5" style={{ color: 'var(--color-primary)' }}
           fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

function formatFecha(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Tab: Información General ──────────────────────────────────────────────────
function TabGeneral({ item }) {
  const sedes    = item.sedes ?? [];
  const depLabel = item.dependencia
    ? `${item.dependencia.nombre}${item.dependencia.codigo ? ` (${item.dependencia.codigo})` : ''}`
    : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-6">
        <Dato icon="badge"           label="DNI"             value={item.dni}            mono />
        <Dato icon="work_outline"    label="Cargo"           value={item.cargo}               />
        <Dato icon="account_tree"    label="Dependencia"     value={depLabel}                 />
        <Dato icon="widgets"         label="Módulo"          value={item.modulo?.nombre}      />
        <Dato icon="dns"             label="Módulo RRHH"     value={item.modulo_rrhh}         />
        <Dato icon="calendar_today"  label="Alta en sistema" value={formatFecha(item.date_joined)} />
        {item.fecha_baja && (
          <Dato icon="event_busy"    label="Fecha de baja"   value={formatFecha(item.fecha_baja)} />
        )}
        <Dato icon="business"        label="Empresa"
              value={item.empresa ? `${item.empresa.nombre_corto} — ${item.empresa.nombre}` : null}
              span2 />
        {item.created_by && (
          <Dato icon="manage_accounts" label="Creado por"
                value={`${item.created_by.first_name} ${item.created_by.last_name}`.trim()}
                span2 />
        )}
      </div>

      {sedes.length > 0 && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-2"
             style={{ color: 'var(--color-text-muted)' }}>
            Sedes asignadas ({sedes.length})
          </p>
          <div className="space-y-2">
            {sedes.map((s) => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl"
                   style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border-light)' }}>
                <Icon name="location_on" className="text-[14px] mt-0.5 shrink-0"
                      style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p className="text-xs font-black" style={{ color: 'var(--color-text-primary)' }}>{s.nombre}</p>
                  {(s.direccion || s.distrito?.nombre) && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {[s.direccion, s.distrito?.nombre].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Seguridad / Rol ──────────────────────────────────────────────────────
function TabAcceso({ item }) {
  const toast = useToast();
  const { configurarSesionMultiple, cambiarPasswordUsuario } = useAuth();
  const rolKey   = item.role?.name ?? '';
  const rolCfg   = ROL_CFG[rolKey] ?? { label: rolKey || 'Sin rol', bg: 'bg-slate-100', color: '#64748b', icon: 'manage_accounts' };
  const permisos = item.role?.permissions ?? [];
  const permsByMs = permisos.reduce((acc, p) => {
    const ms = p.microservice_name?.split(':')?.[0] ?? 'otros';
    if (!acc[ms]) acc[ms] = [];
    acc[ms].push(p);
    return acc;
  }, {});
  const [multiSesion,    setMultiSesion]    = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadingClave, setLoadingClave] = useState(false);
  const [claveReset,   setClaveReset]   = useState(false); 
  const handleMultiSesion = async (optionId) => {
    setLoadingSession(true);
    try {
      await configurarSesionMultiple(item.dni, optionId);
      setMultiSesion(optionId === 1);
      toast.success(`Múltiple sesión ${optionId === 1 ? 'habilitada' : 'deshabilitada'}`);
    } catch (e) {
      toast.error(e?.response?.data?.error ?? 'Error al cambiar configuración de sesión');
    } finally {
      setLoadingSession(false);
    }
  };
  const handleResetClave = async () => {
    setLoadingClave(true);
    try {
      await cambiarPasswordUsuario(item.dni, item.dni); 
      setClaveReset(true);
      toast.success(`Contraseña reseteada. Nueva clave: DNI (${item.dni})`);
    } catch (e) {
      toast.error(e?.response?.data?.error ?? 'Error al resetear la contraseña');
    } finally {
      setLoadingClave(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Bloque 1: Info de seguridad en filas compactas ────────────────── */}
      <div className="rounded-xl overflow-hidden"
           style={{ border: '1px solid var(--color-border)' }}>
        {/* Fila: Estado de cuenta */}
        <div className="flex items-center justify-between px-4 py-2.5"
             style={{ borderBottom: '1px solid var(--color-border-light)', background: 'var(--color-surface)' }}>
          <span className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}>Estado</span>
          <div className="flex items-center gap-1">
            <Icon name={item.is_active ? 'check_circle' : 'cancel'}
                  className={`text-[13px] ${item.is_active ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold"
                  style={{ color: item.is_active ? '#15803d' : 'var(--color-text-muted)' }}>
              {item.is_active ? 'Cuenta activa' : 'Cuenta inactiva'}
            </span>
          </div>
        </div>

        {/* Fila: Acceso al sistema */}
        <div className="flex items-center justify-between px-4 py-2.5"
             style={{ borderBottom: '1px solid var(--color-border-light)', background: 'var(--color-surface)' }}>
          <span className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}>Acceso</span>
          <div className="flex items-center gap-1">
            <Icon name={item.es_usuario_sistema ? 'manage_accounts' : 'person_off'}
                  className={`text-[13px] ${item.es_usuario_sistema ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold"
                  style={{ color: item.es_usuario_sistema ? '#15803d' : 'var(--color-text-muted)' }}>
              {item.es_usuario_sistema ? 'Con acceso al sistema' : 'Sin acceso al sistema'}
            </span>
          </div>
        </div>

        {/* Fila: Rol de sistema */}
        <div className="flex items-center justify-between px-4 py-2.5"
             style={{ background: 'var(--color-surface)' }}>
          <span className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}>Rol de sistema</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${rolCfg.bg}`}
                style={{ color: rolCfg.color }}>
            {rolKey || '—'}
          </span>
        </div>
      </div>

      {/* ── Bloque 2: Permisos agrupados ──────────────────────────────────── */}
      {permisos.length > 0 && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-2"
             style={{ color: 'var(--color-text-muted)' }}>
            Permisos del rol ({permisos.length})
          </p>
          <div className="space-y-1.5">
            {Object.entries(permsByMs).map(([ms, perms]) => (
              <div key={ms} className="rounded-xl overflow-hidden"
                   style={{ border: '1px solid var(--color-border-light)' }}>
                <div className="flex items-center justify-between px-3 py-1.5"
                     style={{ background: 'var(--color-surface-alt)' }}>
                  <span className="text-[9px] font-black uppercase tracking-widest"
                        style={{ color: 'var(--color-text-muted)' }}>{MS_LABEL[ms] ?? ms}</span>
                  <span className="text-[9px] font-black" style={{ color: 'var(--color-primary)' }}>
                    {perms.length}
                  </span>
                </div>
                <div className="px-3 py-2 flex flex-wrap gap-1">
                  {perms.map((p) => (
                    <span key={p.id}
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--color-border-light)', color: 'var(--color-text-body)' }}>
                      {p.codename}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bloque 3: Acciones administrativas compactas ──────────────────── */}
      {item.es_usuario_sistema && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-2"
             style={{ color: 'var(--color-text-muted)' }}>
            Acciones administrativas
          </p>
          <div className="rounded-2xl overflow-hidden"
               style={{ border: '1px solid var(--color-border)' }}>
            {/* Múltiple sesión — fila compacta con toggle */}
            <div className="flex items-center justify-between px-4 py-3"
                 style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon name="devices" className="text-[16px] shrink-0"
                      style={{ color: 'var(--color-primary)' }} />
                <div className="min-w-0">
                  <p className="text-xs font-black" style={{ color: 'var(--color-text-primary)' }}>
                    Múltiple sesión
                  </p>
                  <p className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>
                    Acceso desde varias PCs simultáneamente
                  </p>
                </div>
              </div>
              {/* Toggle visual tipo switch */}
              <div className="flex items-center gap-1 shrink-0 ml-3">
                {[
                  { optId: 1, label: 'Sí',  active: multiSesion === true,  bg: '#15803d', border: '#bbf7d0', textOk: '#15803d' },
                  { optId: 2, label: 'No',  active: multiSesion === false, bg: '#dc2626', border: '#fecaca', textOk: '#dc2626' },
                ].map(({ optId, label, active,  border, textOk }) => (
                  <button
                    key={optId}
                    onClick={() => handleMultiSesion(optId)}
                    disabled={loadingSession || active}
                    className="px-3 py-1 rounded-full text-[10px] font-black transition-all"
                    style={{
                      background: active ? (optId === 1 ? '#f0fdf4' : '#fef2f2') : 'var(--color-surface-alt)',
                      color:      active ? textOk : 'var(--color-text-muted)',
                      border:     `1px solid ${active ? border : 'var(--color-border-light)'}`,
                      opacity:    loadingSession ? 0.5 : 1,
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Resetear contraseña — fila compacta con botón único */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon name="key" className="text-[16px] shrink-0"
                      style={{ color: 'var(--color-primary)' }} />
                <div className="min-w-0">
                  <p className="text-xs font-black" style={{ color: 'var(--color-text-primary)' }}>
                    Resetear contraseña
                  </p>
                  <p className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>
                    La nueva clave será el DNI: <span className="font-mono font-bold">{item.dni}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleResetClave}
                disabled={loadingClave || claveReset}
                className="shrink-0 ml-3 px-3 py-1 rounded-full text-[10px] font-black transition-all"
                style={{
                  background: claveReset ? '#f0fdf4' : 'var(--color-surface-alt)',
                  color:      claveReset ? '#15803d' : 'var(--color-text-body)',
                  border:     `1px solid ${claveReset ? '#bbf7d0' : 'var(--color-border-light)'}`,
                  opacity:    loadingClave ? 0.5 : 1,
                }}>
                {loadingClave
                  ? '…'
                  : claveReset
                    ? <span className="flex items-center gap-1"><Icon name="check" className="text-[12px]" />Hecho</span>
                    : 'Resetear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Bienes ───────────────────────────────────────────────────────────────
function TabBienes({ usuarioId, item }) {
  const { listarPorUsuario } = useBienes();
  const [bienes,      setBienes]      = useState([]);
  const [loadBienes,  setLoadBienes]  = useState(false);
  const [errorBienes, setErrorBienes] = useState(null);

  useEffect(() => {
    if (!usuarioId) return;
    let cancelled = false;
    setLoadBienes(true);
    setErrorBienes(null);
    listarPorUsuario(usuarioId)
      .then((d)  => { if (!cancelled) setBienes(Array.isArray(d) ? d : d?.results ?? []); })
      .catch((e) => { if (!cancelled) setErrorBienes(e?.response?.data?.detail ?? 'Error al cargar bienes'); })
      .finally(() => { if (!cancelled) setLoadBienes(false); });
    return () => { cancelled = true; };
  }, [usuarioId]);

  if (loadBienes) return <Spinner />;
  if (errorBienes) return <ErrorState message={errorBienes} onRetry={() => setErrorBienes(null)} />;
  if (bienes.length === 0) return (
    <EmptyState
      icon="inventory_2"
      title="Sin bienes asignados"
      description="Este usuario no tiene bienes patrimoniales asignados actualmente."
    />
  );

  const sedePrincipal  = item?.sedes?.[0]?.nombre ?? null;
  const moduloPrincipal = item?.modulo?.nombre     ?? null;

  return (
    <div className="space-y-3">

      {/* Encabezado de ubicación — sede y módulo del usuario */}
      {(sedePrincipal || moduloPrincipal) && (
        <div className="flex items-center gap-2 px-1">
          <Icon name="location_on" className="text-[14px] shrink-0"
                style={{ color: 'var(--color-primary)' }} />
          <div className="flex items-center gap-1.5 flex-wrap">
            {sedePrincipal && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(127,29,29,0.08)', color: 'var(--color-primary)' }}>
                {sedePrincipal}
              </span>
            )}
            {moduloPrincipal && (
              <>
                <Icon name="chevron_right" className="text-[12px]" style={{ color: 'var(--color-text-faint)' }} />
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--color-border-light)', color: 'var(--color-text-body)' }}>
                  {moduloPrincipal}
                </span>
              </>
            )}
            {/* Si hay datos de piso, muestra el rango */}
          {bienes.some((b) => b.piso) && (
            <>
            <Icon name="chevron_right" className="text-[12px]" style={{ color: 'var(--color-text-faint)' }} />
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--color-border-light)', color: 'var(--color-text-body)' }}>
              Piso{bienes.filter((b) => b.piso).map((b) => ` ${b.piso}`).filter((v, i, a) => a.indexOf(v) === i).join(',')}
            </span>
            </>
          )}
          </div>
        </div>
      )}
      {/* Tabla de bienes */}
      <div className="table-wrapper">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {['Categoría / Tipo', 'Marca / Modelo', 'Cód. Patrim. / Serie', 'Estado', 'Funcionam.'].map((h) => (
                  <th key={h} className="px-3 py-2.5 whitespace-nowrap text-[9px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bienes.map((b) => (
                <tr key={b.id}>
                  {/* Categoría / Tipo */}
                  <td className="px-3 py-2.5">
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {b.tipo_bien_nombre || '—'}
                    </p>
                    <p className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
                      {b.categoria_bien_nombre || ''}
                    </p>
                  </td>
                  {/* Marca / Modelo */}
                  <td className="px-3 py-2.5">
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text-body)' }}>
                      {b.marca_nombre || '—'}
                    </p>
                    {b.modelo && (
                      <p className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>{b.modelo}</p>
                    )}
                  </td>
                  {/* Serie / Cód. Patrimonial */}
                  <td className="px-3 py-2.5">
                    <p className="text-[10px] font-black font-mono" style={{ color: 'var(--color-text-primary)' }}>
                      {b.codigo_patrimonial || '—'}
                    </p>
                    {b.numero_serie && (
                      <p className="text-[9px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                        S/N: {b.numero_serie}
                      </p>
                    )}
                  </td>
                  {/* Estado del bien */}
                  <td className="px-3 py-2.5">
                    <span className={`badge text-[9px] ${ESTADO_BIEN_CLS(b.estado_bien_nombre)}`}>
                      {b.estado_bien_nombre || '—'}
                    </span>
                  </td>
                  {/* Estado de funcionamiento */}
                  <td className="px-3 py-2.5">
                    <span className="badge badge-inactivo text-[9px]">
                      {b.estado_funcionamiento_nombre || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Footer con piso (si hay variación) */}
        <div className="table-footer">
          <p className="table-count">
            <strong style={{ color: 'var(--color-text-primary)' }}>{bienes.length}</strong>
            {' '}bien{bienes.length !== 1 ? 'es' : ''} asignado{bienes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar: solo card RESUMEN ────────────────────────────────────────────────
function SidebarResumen({ item }) {
  const { listarPorUsuario } = useBienes();
  const [totalBienes, setTotalBienes] = useState('…');
  useEffect(() => {
    if (!item?.id) return;
    listarPorUsuario(item.id)
      .then((d) => setTotalBienes(Array.isArray(d) ? d.length : d?.results?.length ?? 0))
      .catch(() => setTotalBienes(0));
  }, [item?.id]);
  const rolKey = item.role?.name ?? '';
  const rolCfg = ROL_CFG[rolKey] ?? { label: '—', icon: 'manage_accounts', color: '#64748b' };
  const perms  = item.role?.permissions ?? [];
  const sedes  = item.sedes ?? [];
  return (
    <section className="card p-4 space-y-3">
      <h3 className="text-[9px] font-black uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}>
        Resumen
      </h3>
      {[
        { icon: 'inventory_2',    label: 'Bienes asignados', value: totalBienes  },
        { icon: 'location_on',    label: 'Sedes',            value: sedes.length },
        { icon: 'key',            label: 'Permisos',         value: perms.length },
        { icon: 'manage_accounts',label: 'Rol',              value: rolCfg.label },
        { icon: 'work_outline',   label: 'Cargo',            value: item.cargo ?? '—' },
      ].map(({ icon, label, value, mono }) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Icon name={icon} className="text-[13px] shrink-0" style={{ color: 'var(--color-text-faint)' }} />
            <span className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
          </div>
          <span className={`text-xs font-black shrink-0 ${mono ? 'font-mono' : ''}`}
                style={{ color: 'var(--color-text-primary)' }}>
            {value}
          </span>
        </div>
      ))}
    </section>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ModalDetalleUsuario({ open, onClose, item, onEditar }) {
  const { obtener } = useUsuarios();

  const [tab,      setTab]      = useState('general');
  const [usuario,  setUsuario]  = useState(null);
  const [loadUser, setLoadUser] = useState(false);

  useEffect(() => {
    if (!open || !item?.id) return;
    setTab('general');
    setUsuario(null);
    let cancelled = false;
    setLoadUser(true);
    obtener(item.id)
      .then((d)  => { if (!cancelled) setUsuario(d); })
      .catch(()  => { if (!cancelled) setUsuario(item); })
      .finally(() => { if (!cancelled) setLoadUser(false); });
    return () => { cancelled = true; };
  }, [open, item?.id]);

  if (!item) return null;

  const data           = usuario ?? item;
  const nombreCompleto = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim();

  return (
    // size="xl" para que la tabla de bienes no quede apretada
    <Modal open={open} onClose={onClose} size="xl" closeOnOverlay>

      <ModalHeader
        title="Detalle de Usuario"
        icon="person_search"
        onClose={onClose}
      />

      {/* Nombre completo — único, sin duplicar el DNI */}
      {nombreCompleto && (
        <div className="px-6 py-2.5 shrink-0"
             style={{ borderBottom: '1px solid var(--color-border-light)' }}>
          <p className="text-[15px] font-black leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            {nombreCompleto}
          </p>
        </div>
      )}

      <ModalBody padding={false}>
        <div className="flex flex-col" style={{ minHeight: 460 }}>

          {/* Tabs pill */}
          <div className="px-5 pt-3 pb-0 shrink-0">
            <div className="flex gap-1 p-1 rounded-xl w-fit"
                 style={{ background: 'var(--color-border-light)' }}>
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all"
                    style={{
                      background: active ? 'var(--color-surface)' : 'transparent',
                      color:      active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      boxShadow:  active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}>
                    <Icon name={t.icon} className="text-[15px]" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {loadUser ? (
            <Spinner />
          ) : (
            <div className="grid grid-cols-12 gap-0 flex-1" style={{ minHeight: 0 }}>
              {/* Área principal — 9 columnas */}
              <div className="col-span-9 overflow-y-auto px-5 py-4"
                   style={{ borderRight: '1px solid var(--color-border-light)' }}>
                {tab === 'general' && <TabGeneral item={data} />}
                {tab === 'acceso'  && <TabAcceso  item={data} />}
                {tab === 'bienes'  && <TabBienes  usuarioId={data.id} item={data} />}
              </div>
              {/* Sidebar — 3 columnas, solo RESUMEN */}
              <div className="col-span-3 overflow-y-auto p-4"
                   style={{ background: 'var(--color-surface-alt)' }}>
                <SidebarResumen item={data} />
              </div>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter align="between">
        <span className="text-[9px] font-bold" style={{ color: 'var(--color-text-faint)' }}>
          ID: {data.id} · DNI: {data.dni}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="btn-secondary">Cerrar</button>
          {onEditar && (
            <button onClick={() => { onClose(); onEditar(data); }} className="btn-primary">
              <Icon name="edit" className="text-[16px]" /> Editar
            </button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}