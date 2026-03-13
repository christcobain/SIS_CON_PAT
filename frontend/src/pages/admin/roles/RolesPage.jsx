import { useState, useEffect, useCallback } from 'react';
import { useRoles }    from '../../../hooks/useRoles';
import { useToast }    from '../../../hooks/useToast';
import ConfirmDialog   from '../../../components/feedback/ConfirmDialog';
import ErrorState      from '../../../components/feedback/ErrorState';
import ModalRol        from './modals/ModalRol';
import RolesStats      from './components/RolesStats';
import RoleCard        from './components/RoleCard';
import PermissionTree  from './components/PermissionTree';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ROLE_CFG = {
  SYSADMIN:     { icon: 'shield_person',  iconBg: 'bg-primary/10',  iconColor: 'text-primary'    },
  COORDSISTEMA: { icon: 'hub',            iconBg: 'bg-blue-100',    iconColor: 'text-blue-600'   },
  ADMINSEDE:    { icon: 'corporate_fare', iconBg: 'bg-purple-100',  iconColor: 'text-purple-600' },
  ASISTSISTEMA: { icon: 'person_edit',    iconBg: 'bg-amber-100',   iconColor: 'text-amber-600'  },
  SEGURSEDE:    { icon: 'security',       iconBg: 'bg-orange-100',  iconColor: 'text-orange-600' },
  USUARIOFINAL: { icon: 'person',         iconBg: 'bg-slate-100',   iconColor: 'text-slate-500'  },
};
const DEFAULT_CFG = { icon: 'manage_accounts', iconBg: 'bg-slate-100', iconColor: 'text-slate-500' };

const MS_LABEL = {
  'ms-bienes':   'Gestión de Bienes',
  'ms-usuarios': 'Gestión de Usuarios',
  'ms-reportes': 'Analítica y Reportes',
};

// ── Panel de detalle ──────────────────────────────────────────────────────────
function RolDetallePanel({ rol, onEditar, onToggleActivo, actualizando }) {
  const grouped   = rol.permissions_grouped ?? {};
  const totalPerm = rol.permissions_list?.length ?? 0;
  const cfg       = ROLE_CFG[rol.name] ?? DEFAULT_CFG;

  return (
    <div className="flex flex-col h-full">

      {/* Header del detalle */}
      <div
        className="p-5 shrink-0 flex items-start justify-between gap-4"
        style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
            <Icon name={cfg.icon} className={`text-[24px] ${cfg.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black" style={{ color: 'var(--color-text-primary)' }}>
                {rol.name}
              </h2>
              <span className={rol.is_active ? 'badge-activo' : 'badge-inactivo'}>
                <span className={`size-1.5 rounded-full ${rol.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                {rol.is_active ? 'Activo' : 'Inactivo'}
              </span>
              {rol.name === 'SYSADMIN' && (
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase"
                  style={{ background: 'rgba(127,29,29,0.1)', color: 'var(--color-primary)' }}
                >
                  System Level
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {rol.description || 'Sin descripción'}
            </p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-faint)' }}>
              {totalPerm} permiso{totalPerm !== 1 ? 's' : ''} asignado{totalPerm !== 1 ? 's' : ''}
              {rol.created_at && ` · Creado ${new Date(rol.created_at).toLocaleDateString('es-PE')}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onEditar} className="btn-secondary text-xs gap-1.5">
            <Icon name="edit" className="text-[15px]" />
            Editar
          </button>
          {rol.name !== 'SYSADMIN' && (
            <button
              onClick={onToggleActivo}
              disabled={actualizando}
              className={`btn text-xs gap-1.5 px-3 py-2 rounded-xl border transition-colors disabled:opacity-50
                ${rol.is_active
                  ? 'border-red-200 text-red-500 hover:bg-red-50'
                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
            >
              <Icon name={rol.is_active ? 'toggle_off' : 'toggle_on'} className="text-[15px]" />
              {rol.is_active ? 'Desactivar' : 'Activar'}
            </button>
          )}
        </div>
      </div>

      {/* Permisos agrupados */}
      <div className="flex-1 overflow-y-auto p-5">
        {Object.keys(grouped).length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-14"
            style={{ color: 'var(--color-text-faint)' }}
          >
            <Icon name="lock_open" className="text-5xl mb-3" />
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Sin permisos asignados
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
              Usa "Editar Permisos" para configurar el acceso
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([ms, apps]) => (
              <div key={ms}>
                <div
                  className="flex items-center gap-2.5 pb-2.5 mb-3"
                  style={{ borderBottom: '1px solid var(--color-border-light)' }}
                >
                  <Icon
                    name={ms === 'ms-bienes' ? 'inventory_2' : ms === 'ms-usuarios' ? 'group' : 'assessment'}
                    className="text-[19px] text-primary"
                  />
                  <span
                    className="text-[11px] font-black uppercase tracking-wider"
                    style={{ color: 'var(--color-text-body)' }}
                  >
                    {ms.replace('ms-', '')}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    — {MS_LABEL[ms] ?? ms}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(apps).flatMap(([appLabel, codenames]) =>
                    codenames.map((codename) => (
                      <div
                        key={`${appLabel}-${codename}`}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{
                          background: 'var(--color-surface-alt)',
                          border: '1px solid var(--color-border-light)',
                        }}
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold truncate" style={{ color: 'var(--color-text-body)' }}>
                            {codename}
                          </p>
                          <p className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                            {appLabel}
                          </p>
                        </div>
                        <div
                          className="relative w-9 h-5 rounded-full shrink-0 ml-3"
                          style={{ background: 'var(--color-primary)' }}
                        >
                          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const toast = useToast();

  const {
    roles, loading: loadingRoles, error: errorRoles, actualizando,
    refetch, obtener, crear, actualizar, activar, desactivar,
    obtenerArbolPermisos, obtenerPermisosDelRol, sincronizarPermisos,
  } = useRoles();

  const [tree,            setTree]            = useState([]);
  const [loadingTree,     setLoadingTree]     = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [loadingDetalle,  setLoadingDetalle]  = useState(false);
  const [selectedPerms,   setSelectedPerms]   = useState([]);
  const [loadingPerms,    setLoadingPerms]    = useState(false);
  const [tab,             setTab]             = useState('detalle');
  const [modalRol,        setModalRol]        = useState(false);
  const [rolEditar,       setRolEditar]       = useState(null);
  const [confirmPermisos, setConfirmPermisos] = useState(false);
  const [confirmToggle,   setConfirmToggle]   = useState(false);

  useEffect(() => {
    setLoadingTree(true);
    obtenerArbolPermisos()
      .then((d) => setTree(Array.isArray(d) ? d : []))
      .catch(() => toast.error('No se pudo cargar el árbol de permisos.'))
      .finally(() => setLoadingTree(false));
  }, []); // eslint-disable-line

  const handleSelectRol = useCallback(async (rolBasico) => {
    setTab('detalle');
    setSelectedPerms([]);
    setLoadingDetalle(true);
    setRolSeleccionado(null);
    try {
      const res = await obtener(rolBasico.id);
      setRolSeleccionado(res?.data ?? res);
    } catch {
      toast.error('No se pudo cargar el detalle del rol.');
    } finally {
      setLoadingDetalle(false);
    }
  }, [obtener, toast]);

  const handleTabPermisos = useCallback(async () => {
    if (!rolSeleccionado) return;
    setTab('permisos');
    if (selectedPerms.length > 0) return;
    setLoadingPerms(true);
    try {
      const data = await obtenerPermisosDelRol(rolSeleccionado.id);
      const ids  = data
        .map((rp) => rp?.permission?.id ?? rp?.permission_id ?? rp?.id ?? null)
        .filter(Boolean);
      setSelectedPerms(ids);
    } catch {
      toast.error('Error al cargar los permisos del rol.');
    } finally {
      setLoadingPerms(false);
    }
  }, [rolSeleccionado, obtenerPermisosDelRol, selectedPerms.length, toast]);

  const handleTabDetalle = () => {
    setTab('detalle');
    setSelectedPerms([]);
  };

  const handleGuardarPermisos = async () => {
    setConfirmPermisos(false);
    try {
      const res = await sincronizarPermisos(rolSeleccionado.id, selectedPerms);
      toast.success(res?.message ?? 'Permisos actualizados correctamente.');
      const detalle = await obtener(rolSeleccionado.id);
      setRolSeleccionado(detalle?.data ?? detalle);
    } catch (e) {
      toast.error(e?.response?.data?.detail || e?.response?.data?.error || 'Error al guardar los permisos.');
    }
  };

  const handleToggleActivo = async () => {
    setConfirmToggle(false);
    try {
      const fn  = rolSeleccionado.is_active ? desactivar : activar;
      const res = await fn(rolSeleccionado.id);
      toast.success(res?.message ?? `Rol ${rolSeleccionado.is_active ? 'desactivado' : 'activado'}.`);
      const detalle = await obtener(rolSeleccionado.id);
      setRolSeleccionado(detalle?.data ?? detalle);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'No se pudo cambiar el estado del rol.');
    }
  };

  const handleRolGuardado = async () => {
    setModalRol(false);
    await refetch();
    if (rolSeleccionado && rolEditar) {
      const detalle = await obtener(rolSeleccionado.id);
      setRolSeleccionado(detalle?.data ?? detalle);
    }
    setRolEditar(null);
  };

  const TABS = [
    { key: 'detalle',  label: 'Detalle del Rol', icon: 'info',        onClick: handleTabDetalle  },
    { key: 'permisos', label: 'Editar Permisos',  icon: 'lock_person', onClick: handleTabPermisos },
  ];

  return (
    <div className="page-wrapper">

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Roles y Permisos</h1>
            <p className="page-subtitle">
              Configure permisos granulares de acceso por microservicio para cada rol institucional.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              title="Recargar roles"
              className="btn-icon"
              disabled={loadingRoles}
            >
              <Icon
                name="refresh"
                className={`text-[18px] ${loadingRoles ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={() => { setRolEditar(null); setModalRol(true); }}
              className="btn-primary"
            >
              <Icon name="add" className="text-[18px]" />
              Nuevo Rol
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {TABS.map(({ key, label, icon, onClick }) => (
            <button
              key={key}
              onClick={onClick}
              disabled={key === 'permisos' && !rolSeleccionado}
              className={tab === key ? 'tab-btn-active' : 'tab-btn-inactive'}
              style={key === 'permisos' && !rolSeleccionado ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
            >
              <Icon name={icon} className="text-[17px]" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenido scrollable ──────────────────────────────────────────── */}
      <div className="page-content">

        {/* KPI Stats */}
        <RolesStats roles={roles} loading={loadingRoles} />

        {/* Panel de dos columnas */}
        <div
          className="flex gap-5 overflow-hidden"
          style={{ height: 'calc(100vh - 342px)', minHeight: '360px' }}
        >
          {/* ── Lista de roles ─────────────────────────────────────────── */}
          <aside
            className="w-64 shrink-0 flex flex-col overflow-hidden"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between shrink-0"
              style={{
                background: 'var(--color-surface-alt)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Lista de Roles
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                  {roles.length} rol{roles.length !== 1 ? 'es' : ''} registrado{roles.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={refetch} title="Recargar" className="btn-icon">
                <Icon name="refresh" className="text-[17px]" />
              </button>
            </div>

            {/* Filas */}
            <div className="flex-1 overflow-y-auto">
              {loadingRoles ? (
                <div className="p-3 space-y-2">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
                </div>
              ) : errorRoles ? (
                <div className="p-4">
                  <ErrorState message={errorRoles} onRetry={refetch} />
                </div>
              ) : (
                roles.map((r) => (
                  <RoleCard
                    key={r.id}
                    role={r}
                    isSelected={rolSeleccionado?.id === r.id}
                    onClick={() => handleSelectRol(r)}
                  />
                ))
              )}
            </div>
          </aside>

          {/* ── Panel principal ────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 overflow-hidden">

            {/* Vacío */}
            {!rolSeleccionado && !loadingDetalle && (
              <div
                className="h-full flex flex-col items-center justify-center gap-3"
                style={{
                  background: 'var(--color-surface)',
                  border: '2px dashed var(--color-border)',
                  borderRadius: '12px',
                }}
              >
                <Icon
                  name="admin_panel_settings"
                  className="text-6xl"
                  style={{ color: 'var(--color-text-faint)' }}
                />
                <p className="text-sm font-bold" style={{ color: 'var(--color-text-muted)' }}>
                  Seleccione un rol para ver o configurar permisos
                </p>
              </div>
            )}

            {/* Spinner */}
            {loadingDetalle && (
              <div
                className="h-full flex items-center justify-center"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full animate-spin border-4"
                  style={{
                    borderColor: 'var(--color-border-light)',
                    borderTopColor: 'var(--color-primary)',
                  }}
                />
              </div>
            )}

            {/* Contenido */}
            {rolSeleccionado && !loadingDetalle && (
              <div
                className="flex flex-col h-full overflow-hidden"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                }}
              >
                {tab === 'detalle' && (
                  <RolDetallePanel
                    rol={rolSeleccionado}
                    onEditar={() => { setRolEditar(rolSeleccionado); setModalRol(true); }}
                    onToggleActivo={() => setConfirmToggle(true)}
                    actualizando={actualizando}
                  />
                )}
                {tab === 'permisos' && (
                  <PermissionTree
                    tree={tree}
                    selectedIds={selectedPerms}
                    onToggle={(id) =>
                      setSelectedPerms((prev) =>
                        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
                      )
                    }
                    onSave={() => setConfirmPermisos(true)}
                    loading={loadingTree || loadingPerms}
                    actualizando={actualizando}
                    rolNombre={rolSeleccionado.name}
                    esSysadmin={rolSeleccionado.name === 'SYSADMIN'}
                  />
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Modales — llamados sin cambios ────────────────────────────────── */}
      <ModalRol
        open={modalRol}
        onClose={() => { setModalRol(false); setRolEditar(null); }}
        onGuardado={handleRolGuardado}
        crear={crear}
        actualizar={actualizar}
        actualizando={actualizando}
        rolEditar={rolEditar}
      />

      <ConfirmDialog
        open={confirmPermisos}
        title="Guardar cambios de permisos"
        message={`¿Confirmas los cambios de permisos para "${rolSeleccionado?.name}"? Se reemplazarán todos los permisos actuales del rol.`}
        confirmLabel="Sí, guardar"
        variant="primary"
        loading={actualizando}
        onConfirm={handleGuardarPermisos}
        onClose={() => setConfirmPermisos(false)}
      />

      <ConfirmDialog
        open={confirmToggle}
        title={rolSeleccionado?.is_active ? 'Desactivar rol' : 'Activar rol'}
        message={
          rolSeleccionado?.is_active
            ? `¿Desactivar "${rolSeleccionado?.name}"? Los usuarios con este rol perderán acceso al sistema.`
            : `¿Activar "${rolSeleccionado?.name}"? Los usuarios podrán ser asignados a este rol.`
        }
        confirmLabel={rolSeleccionado?.is_active ? 'Sí, desactivar' : 'Sí, activar'}
        variant={rolSeleccionado?.is_active ? 'danger' : 'primary'}
        loading={actualizando}
        onConfirm={handleToggleActivo}
        onClose={() => setConfirmToggle(false)}
      />
    </div>
  );
}