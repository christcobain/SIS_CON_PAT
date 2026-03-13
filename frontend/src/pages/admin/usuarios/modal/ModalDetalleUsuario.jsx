import { useState, useEffect } from 'react';
import Modal        from '../../../../components/modal/Modal';
import ModalHeader  from '../../../../components/modal/ModalHeader';
import ModalBody    from '../../../../components/modal/ModalBody';
import ModalFooter  from '../../../../components/modal/ModalFooter';
import bienesService from '../../../../services/bienes.service';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

// ─── Config de roles ──────────────────────────────────────────────────────────
const ROL_CFG = {
  SYSADMIN:     { label: 'SysAdmin',        bg: 'bg-primary/10',  color: 'var(--color-primary)', icon: 'shield_person'  },
  COORDSISTEMA: { label: 'Coord. Sistema',  bg: 'bg-blue-100',    color: '#1d4ed8',              icon: 'hub'            },
  ADMINSEDE:    { label: 'Admin Sede',      bg: 'bg-purple-100',  color: '#7c3aed',              icon: 'corporate_fare' },
  ASISTSISTEMA: { label: 'Asist. Sistema',  bg: 'bg-amber-100',   color: '#b45309',              icon: 'person_edit'    },
  SEGURSEDE:    { label: 'Segur. Sede',     bg: 'bg-orange-100',  color: '#c2410c',              icon: 'security'       },
  USUARIOFINAL: { label: 'Usuario Final',   bg: 'bg-slate-100',   color: '#475569',              icon: 'person'         },
};

const TABS = [
  { id: 'general', label: 'Información',     icon: 'person'      },
  { id: 'acceso',  label: 'Seguridad / Rol', icon: 'shield'      },
  { id: 'bienes',  label: 'Bienes',          icon: 'inventory_2' },
];

// ─── Helpers UI ───────────────────────────────────────────────────────────────
function Avatar({ first, last, size = 'lg' }) {
  const ini = `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
  const sz  = size === 'lg' ? 'size-14 text-2xl rounded-2xl' : 'size-9 text-sm rounded-xl';
  return (
    <div className={`${sz} flex items-center justify-center font-black text-white shrink-0 shadow-md`}
         style={{ background: 'var(--color-primary)' }}>
      {ini}
    </div>
  );
}

function Dato({ icon, label, value, mono = false, span2 = false }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={`flex items-start gap-2.5 py-2.5 ${span2 ? 'col-span-2' : ''}`}
         style={{ borderBottom: '1px solid var(--color-border-light)' }}>
      <Icon name={icon} className="text-[15px] mt-0.5 shrink-0"
            style={{ color: 'var(--color-text-faint)' }} />
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest"
           style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className={`text-sm font-semibold mt-0.5 truncate ${mono ? 'font-mono' : ''}`}
           style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

function BarraPermiso({ label, percent }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold">
        <span style={{ color: 'var(--color-text-body)' }}>{label}</span>
        <span style={{ color: 'var(--color-primary)' }}>{percent}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--color-border-light)' }}>
        <div className="h-full rounded-full transition-all"
             style={{ width: `${percent}%`, background: 'var(--color-primary)' }} />
      </div>
    </div>
  );
}

function ChipEstado({ ok, labelOk, labelNo, iconOk, iconNo }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl"
         style={{
           background: ok ? '#f0fdf4' : 'var(--color-surface-alt)',
           border: `1px solid ${ok ? '#bbf7d0' : 'var(--color-border-light)'}`,
         }}>
      <Icon name={ok ? iconOk : iconNo}
            className={`text-[20px] ${ok ? 'text-emerald-500' : 'text-slate-400'}`} />
      <p className="text-xs font-black"
         style={{ color: ok ? '#15803d' : 'var(--color-text-muted)' }}>
        {ok ? labelOk : labelNo}
      </p>
    </div>
  );
}

// ─── Tab: Información General ─────────────────────────────────────────────────
function TabGeneral({ item }) {
  const sedes = item.sedes ?? [];
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-6">
        <Dato icon="badge"         label="DNI / Usuario"  value={item.dni}          mono />
        <Dato icon="work_outline"  label="Cargo"          value={item.cargo}             />
        <Dato icon="account_tree"  label="Dependencia"    value={item.dependencia}       />
        <Dato icon="widgets"       label="Módulo"         value={item.modulo?.nombre}    />
        <Dato icon="dns"           label="Módulo RRHH"    value={item.modulo_rrhh}       />
        <Dato icon="business"      label="Empresa"
              value={item.empresa ? `${item.empresa.nombre_corto} — ${item.empresa.nombre}` : null}
              span2 />
      </div>

      {sedes.length > 0 && (
        <div className="mt-4">
          <p className="text-[9px] font-black uppercase tracking-widest mb-3"
             style={{ color: 'var(--color-text-muted)' }}>
            Sedes asignadas ({sedes.length})
          </p>
          <div className="space-y-2">
            {sedes.map((s) => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl"
                   style={{ background: 'var(--color-surface-alt)',
                            border: '1px solid var(--color-border-light)' }}>
                <Icon name="location_on" className="text-[15px] mt-0.5 shrink-0"
                      style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p className="text-xs font-black" style={{ color: 'var(--color-text-primary)' }}>
                    {s.nombre}
                  </p>
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

// ─── Tab: Seguridad / Rol ─────────────────────────────────────────────────────
function TabAcceso({ item }) {
  const rolKey  = item.role?.name ?? '';
  const rolCfg  = ROL_CFG[rolKey] ?? { label: rolKey || 'Sin rol', bg: 'bg-slate-100', color: '#64748b', icon: 'manage_accounts' };
  const permisos = item.role?.permissions ?? [];

  return (
    <div className="space-y-5">
      {/* Tarjeta de rol */}
      <div className="flex items-center gap-4 p-4 rounded-2xl"
           style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
        <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${rolCfg.bg}`}>
          <Icon name={rolCfg.icon} className="text-[24px]" style={{ color: rolCfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest"
             style={{ color: 'var(--color-text-muted)' }}>Rol del sistema</p>
          <p className="text-base font-black mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
            {rolCfg.label}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {permisos.length} permiso{permisos.length !== 1 ? 's' : ''} asignados · ID {item.role?.id ?? '—'}
          </p>
        </div>
        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${rolCfg.bg}`}
              style={{ color: rolCfg.color }}>
          {rolKey || '—'}
        </span>
      </div>

      {/* Estado de cuenta */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-2"
           style={{ color: 'var(--color-text-muted)' }}>Estado de cuenta</p>
        <div className="grid grid-cols-2 gap-2">
          <ChipEstado ok={item.is_active}
            labelOk="Cuenta activa"      labelNo="Cuenta inactiva"
            iconOk="check_circle"        iconNo="cancel" />
          <ChipEstado ok={item.es_usuario_sistema}
            labelOk="Acceso al sistema"  labelNo="Sin acceso al sistema"
            iconOk="manage_accounts"     iconNo="person_off" />
        </div>
      </div>

      {/* Permisos codename */}
      {permisos.length > 0 && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-2"
             style={{ color: 'var(--color-text-muted)' }}>Permisos del rol</p>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {permisos.map((p) => (
              <span key={p.id}
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{ background: 'var(--color-border-light)',
                             color: 'var(--color-text-body)' }}>
                {p.codename}
              </span>
            ))}
          </div>
        </div>
      )}

      {!rolKey && (
        <div className="text-center py-8">
          <Icon name="no_encryption" className="text-[40px] block mb-2"
                style={{ color: 'var(--color-border)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            Sin rol asignado
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Bienes ─────────────────────────────────────────────────────────────
function TabBienes({ bienes, loading }) {
  const estadoCls = (e) => ({
    BUENO:          'badge-activo',
    REGULAR:        'badge-pendiente',
    MALO:           'badge-cancelado',
    'DADO DE BAJA': 'badge-cancelado',
  }[e?.toUpperCase()] ?? 'badge-inactivo');

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <svg className="animate-spin h-6 w-6" style={{ color: 'var(--color-primary)' }}
           fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  if (bienes.length === 0) return (
    <div className="text-center py-16">
      <Icon name="inventory_2" className="text-[44px] block mb-3"
            style={{ color: 'var(--color-border)' }} />
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
        Sin bienes asignados
      </p>
    </div>
  );

  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest mb-3"
         style={{ color: 'var(--color-text-muted)' }}>
        {bienes.length} bien{bienes.length !== 1 ? 'es' : ''} asignado{bienes.length !== 1 ? 's' : ''}
      </p>
      <div className="table-wrapper overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full text-left">
            <thead>
              <tr>
                {['Cód. Patrimonial', 'Tipo / Marca', 'Estado bien', 'Funcionamiento', 'Registrado'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                      style={{ color: 'var(--color-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bienes.map((b) => (
                <tr key={b.id} className="table-row">
                  <td className="px-4 py-3">
                    <p className="text-xs font-black font-mono"
                       style={{ color: 'var(--color-text-primary)' }}>
                      {b.codigo_patrimonial || '—'}
                    </p>
                    {b.numero_serie && (
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        S/N: {b.numero_serie}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {b.tipo_bien_nombre || '—'}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      {[b.marca_nombre, b.modelo].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
                      {b.categoria_bien_nombre}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${estadoCls(b.estado_bien_nombre)}`}>
                      {b.estado_bien_nombre || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge badge-inactivo text-[9px]">
                      {b.estado_funcionamiento_nombre || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    {b.fecha_registro
                      ? new Date(b.fecha_registro).toLocaleDateString('es-PE',
                          { day: '2-digit', month: 'short', year: '2-digit' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar KPIs ─────────────────────────────────────────────────────────────
function SidebarKpis({ item, bienes }) {
  const rolKey  = item.role?.name ?? '';
  const rolCfg  = ROL_CFG[rolKey] ?? { label: '—', icon: 'manage_accounts', color: '#64748b' };
  const perms   = item.role?.permissions ?? [];
  const sedes   = item.sedes ?? [];

  // Barras de nivel de acceso: proporción de permisos por microservicio
  const MS_MAX = { 'ms-bienes': 40, 'ms-usuarios': 30, 'ms-reportes': 20 };
  const MS_LABEL = { 'ms-bienes': 'Bienes', 'ms-usuarios': 'Usuarios', 'ms-reportes': 'Reportes' };
  const barras = Object.entries(MS_MAX).map(([ms, max]) => {
    const count = perms.filter((p) => p.codename?.includes(ms)).length;
    return { label: MS_LABEL[ms], percent: Math.min(100, Math.round((count / max) * 100)) };
  });

  return (
    <div className="space-y-4">

      {/* Identidad compacta */}
      <div className="card p-4 flex items-center gap-3">
        <Avatar first={item.first_name} last={item.last_name} size="sm" />
        <div className="min-w-0">
          <p className="text-xs font-black truncate" style={{ color: 'var(--color-text-primary)' }}>
            {item.first_name} {item.last_name}
          </p>
          <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
            {item.dni}
          </p>
        </div>
      </div>

      {/* Nivel de acceso */}
      <section className="card p-5">
        <h3 className="text-[9px] font-black uppercase tracking-widest mb-4"
            style={{ color: 'var(--color-text-muted)' }}>
          Nivel de acceso
        </h3>
        <div className="space-y-3">
          {barras.map((b) => <BarraPermiso key={b.label} label={b.label} percent={b.percent} />)}
        </div>
      </section>

      {/* Resumen numérico */}
      <section className="card p-5 space-y-3">
        <h3 className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}>Resumen</h3>
        {[
          { icon: 'inventory_2',    label: 'Bienes asignados', value: bienes.length   },
          { icon: 'location_on',    label: 'Sedes',            value: sedes.length    },
          { icon: 'key',            label: 'Permisos',         value: perms.length    },
          { icon: 'manage_accounts',label: 'Rol',              value: rolCfg.label    },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name={icon} className="text-[14px]" style={{ color: 'var(--color-text-faint)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
            </div>
            <span className="text-xs font-black" style={{ color: 'var(--color-text-primary)' }}>
              {value}
            </span>
          </div>
        ))}
      </section>

      {/* Banner soporte */}
      <div className="p-5 rounded-2xl text-white relative overflow-hidden shadow-lg"
           style={{ background: 'var(--color-primary)' }}>
        <div className="relative z-10">
          <Icon name="support_agent" className="text-[36px] mb-1 opacity-80" />
          <h4 className="font-black text-sm">¿Necesitas ayuda?</h4>
          <p className="text-[10px] mt-1 mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Contacta soporte técnico para regularizar bienes o accesos.
          </p>
          <button className="w-full py-2 rounded-xl text-xs font-black transition-colors"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
            Abrir Ticket
          </button>
        </div>
        <div className="absolute -right-6 -bottom-6 size-28 bg-white/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ModalDetalleUsuario({ open, onClose, item, onEditar }) {
  const [tab,        setTab]        = useState('general');
  const [bienes,     setBienes]     = useState([]);
  const [loadBienes, setLoadBienes] = useState(false);

  // Reset al abrir / cambiar usuario
  useEffect(() => {
    if (open && item?.id) { setTab('general'); setBienes([]); }
  }, [open, item?.id]);

  // Carga lazy de bienes solo al entrar al tab
  useEffect(() => {
    if (!open || !item?.id || tab !== 'bienes') return;
    let cancelled = false;
    setLoadBienes(true);
    bienesService.listarPorUsuario(item.id)
      .then((d)  => { if (!cancelled) setBienes(Array.isArray(d) ? d : d?.results ?? []); })
      .catch(()  => { if (!cancelled) setBienes([]); })
      .finally(() => { if (!cancelled) setLoadBienes(false); });
    return () => { cancelled = true; };
  }, [tab, open, item?.id]);

  if (!item) return null;

  const nombreCompleto = `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim();

  return (
    <Modal open={open} onClose={onClose} size="xl" closeOnOverlay>

      <ModalHeader
        title="Detalle de Usuario"
        subtitle={nombreCompleto || item.dni}
        icon="person_search"
        onClose={onClose}
      />

      <ModalBody padding={false}>
        <div className="flex flex-col" style={{ minHeight: 480 }}>

          {/* ── Tabs estilo pill ────────────────────────────────────────── */}
          <div className="px-6 pt-4 pb-0 shrink-0">
            <div className="flex gap-1 p-1 rounded-xl w-fit"
                 style={{ background: 'var(--color-border-light)' }}>
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all"
                    style={{
                      background: active ? 'var(--color-surface)' : 'transparent',
                      color:      active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      boxShadow:  active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}>
                    <Icon name={t.icon} className="text-[16px]" />
                    {t.label}
                    {t.id === 'bienes' && bienes.length > 0 && (
                      <span className="tab-count-active ml-0.5">{bienes.length}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Grid contenido + sidebar ────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1"
               style={{ minHeight: 0 }}>

            {/* Contenido principal */}
            <div className="lg:col-span-8 overflow-y-auto px-6 py-5"
                 style={{ borderRight: '1px solid var(--color-border-light)' }}>
              {tab === 'general' && <TabGeneral item={item} />}
              {tab === 'acceso'  && <TabAcceso  item={item} />}
              {tab === 'bienes'  && <TabBienes  bienes={bienes} loading={loadBienes} />}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 overflow-y-auto p-5"
                 style={{ background: 'var(--color-surface-alt)' }}>
              <SidebarKpis item={item} bienes={bienes} />
            </div>
          </div>

        </div>
      </ModalBody>

      <ModalFooter align="between">
        <span className="text-[9px] font-bold" style={{ color: 'var(--color-text-faint)' }}>
          ID: {item.id} · DNI: {item.dni}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="btn-secondary">Cerrar</button>
          {onEditar && (
            <button onClick={() => { onClose(); onEditar(item); }} className="btn-primary">
              <Icon name="edit" className="text-[16px]" /> Editar
            </button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}