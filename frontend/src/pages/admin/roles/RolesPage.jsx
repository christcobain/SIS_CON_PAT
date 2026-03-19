import { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import { useRoles }    from '../../../hooks/useRoles';
import { useToast }    from '../../../hooks/useToast';
import Can             from '../../../components/auth/Can';
import ConfirmDialog   from '../../../components/feedback/ConfirmDialog';
import RolesStats      from './components/RolesStats';
import RoleCard        from './components/RoleCard';
import PermissionTree  from './components/PermissionTree';

const ModalRol = lazy(() => import('./modals/ModalRol'));

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const getRoleVisuals = (roleName) => {
  const name = roleName?.toUpperCase() || '';
  if (name.includes('ADMIN') || name.includes('SYS')) 
    return { icon: 'shield_person', bg: 'bg-primary/10', text: 'text-primary' };
  if (name.includes('COORD') || name.includes('JEFE'))
    return { icon: 'hub', bg: 'bg-blue-100', text: 'text-blue-600' };
  if (name.includes('SEGURID'))
    return { icon: 'security', bg: 'bg-orange-100', text: 'text-orange-600' };
  return { icon: 'person', bg: 'bg-slate-100', text: 'text-slate-500' };
};

const MS_LABEL = {
  'ms-bienes':   'Gestión de Bienes',
  'ms-usuarios': 'Gestión de Usuarios',
  'ms-reportes': 'Analítica y Reportes',
};

function RolDetallePanel({ rol, onEditar, onToggleActivo, actualizando }) {
  const grouped = rol.permissions_grouped ?? {};
  const visuals = useMemo(() => getRoleVisuals(rol.name), [rol.name]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-5 flex items-start justify-between gap-4 border-b border-border bg-surface-alt/30">
        <div className="flex items-center gap-4">
          <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${visuals.bg}`}>
            <Icon name={visuals.icon} className={`text-[28px] ${visuals.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-main leading-none">{rol.name}</h2>
              <span className={rol.is_active ? 'badge-activo' : 'badge-inactivo'}>
                {rol.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-xs text-muted mt-1.5 max-w-md">{rol.description || 'Sin descripción'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Can perform="ms-usuarios:roles:change_role">
            <button onClick={onEditar} className="btn-secondary py-2 px-4 text-xs font-bold gap-2">
              <Icon name="edit" className="text-[16px]" />
              Editar Datos
            </button>
            {rol.name !== 'SYSADMIN' && (
              <button
                onClick={onToggleActivo}
                disabled={actualizando}
                className={`btn text-xs font-bold gap-2 px-4 py-2 rounded-xl border transition-all 
                  ${rol.is_active 
                    ? 'border-red-100 text-red-500 hover:bg-red-50' 
                    : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}
              >
                <Icon name={rol.is_active ? 'block' : 'check_circle'} className="text-[16px]" />
                {rol.is_active ? 'Desactivar' : 'Activar'}
              </button>
            )}
          </Can>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-surface">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-faint">
            <Icon name="lock_open" className="text-5xl mb-2 opacity-20" />
            <p className="text-sm font-bold text-muted">Sin permisos asignados</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([ms, apps]) => (
              <div key={ms} className="animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <Icon name={ms === 'ms-bienes' ? 'inventory_2' : ms === 'ms-usuarios' ? 'group' : 'assessment'} className="text-[18px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">{ms}</span>
                    <span className="text-xs font-bold text-main">{MS_LABEL[ms] ?? ms}</span>
                  </div>
                  <div className="h-px bg-border flex-1 ml-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(apps).flatMap(([appLabel, codenames]) =>
                    codenames.map((codename) => (
                      <div key={`${appLabel}-${codename}`} 
                           className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-alt/50 hover:bg-surface-alt transition-colors group">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-main truncate group-hover:text-primary transition-colors">{codename}</p>
                          <p className="text-[10px] text-muted truncate">{appLabel}</p>
                        </div>
                        <Icon name="verified_user" className="text-primary text-[16px] opacity-40 group-hover:opacity-100" />
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

export default function RolesPage() {
  const toast = useToast();
  const {
    roles, loading: loadingRoles, actualizando,
    refetch, obtener, crear, actualizar, activar, desactivar,
    obtenerArbolPermisos, obtenerPermisosDelRol, sincronizarPermisos,
  } = useRoles();

  const [tree,             setTree]             = useState([]);
  const [loadingTree,      setLoadingTree]      = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [loadingDetalle,   setLoadingDetalle]   = useState(false);
  const [selectedPerms,    setSelectedPerms]    = useState([]);
  const [loadingPerms,     setLoadingPerms]     = useState(false);
  const [tab,              setTab]              = useState('detalle');
  const [modalRol,         setModalRol]         = useState(false);
  const [rolEditar,        setRolEditar]        = useState(null);
  const [confirmPermisos, setConfirmPermisos] = useState(false);
  const [confirmToggle,    setConfirmToggle]    = useState(false);

  useEffect(() => {
    setLoadingTree(true);
    obtenerArbolPermisos()
      .then((d) => setTree(Array.isArray(d) ? d : []))
      .catch(() => toast.error('Error al cargar árbol de permisos.'))
      .finally(() => setLoadingTree(false));
  }, [ toast]);

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
      toast.error('Error al cargar permisos del rol.');
    } finally {
      setLoadingPerms(false);
    }
  }, [rolSeleccionado, obtenerPermisosDelRol, selectedPerms.length, toast]);

  const handleRolGuardado = async () => {
    setModalRol(false);
    await refetch();
    if (rolSeleccionado && rolEditar) {
      const detalle = await obtener(rolSeleccionado.id);
      setRolSeleccionado(detalle?.data ?? detalle);
    }
    setRolEditar(null);
  };

  const handleGuardarPermisos = async () => {
    setConfirmPermisos(false);
    try {
      const res = await sincronizarPermisos(rolSeleccionado.id, selectedPerms);
      toast.success(res?.message ?? 'Permisos actualizados.');
      const detalle = await obtener(rolSeleccionado.id);
      setRolSeleccionado(detalle?.data ?? detalle);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Error al guardar permisos.');
    }
  };

  const handleToggleActivo = async () => {
    setConfirmToggle(false);
    try {
      const fn  = rolSeleccionado.is_active ? desactivar : activar;
      const res = await fn(rolSeleccionado.id);
      toast.success(res?.message ?? 'Estado actualizado.');
      const detalle = await obtener(rolSeleccionado.id);
      setRolSeleccionado(detalle?.data ?? detalle);
      refetch();
    } catch (e) {
      toast.error('No se pudo cambiar el estado.');
    }
  };

  return (
    <div className="gap-1 p-4 max-w-[1600px] animate-in fade-in duration-500 h-auto pb-20">
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon name="admin_panel_settings" className="text-[24px]" />
            </div>
            <div>
              <h1 className="page-title">Roles y Permisos</h1>
              <p className="page-subtitle">Configuración granular de accesos por microservicio.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              disabled={loadingRoles}
              className="btn-icon bg-surface border border-border"
              title="Sincronizar"
            >
              <Icon name="sync" className={`text-[18px] ${loadingRoles ? 'animate-spin text-primary' : 'text-faint'}`} />
            </button>
            

            <Can perform="ms-usuarios:roles:add_role">
              <button
                onClick={() => { setRolEditar(null); setModalRol(true); }}
                className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm"
              >
                <Icon name="add_circle" className="text-[18px]" />
                <span className="font-black uppercase tracking-widest text-[10px]">Nuevo Rol</span>
              </button>
            </Can>
          </div>
        </div>

        <div className="flex gap-6 mt-4 border-t border-border pt-3">
          <button 
            onClick={() => setTab('detalle')}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${
              tab === 'detalle' ? 'text-primary border-b-2 border-primary' : 'text-faint hover:text-main'
            }`}
          >
            <Icon name="info" className="text-[16px]" />
            Detalle del Rol
          </button>
          
    
          <Can perform="ms-usuarios:roles:add_rolepermission">
            <button 
              disabled={!rolSeleccionado}
              onClick={handleTabPermisos}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${
                tab === 'permisos' ? 'text-primary border-b-2 border-primary' : 'text-faint hover:text-main'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <Icon name="lock_person" className="text-[16px]" />
              Configurar Permisos
            </button>
          </Can>
        </div>
      </div>

      <div className="page-content">
        <RolesStats roles={roles} loading={loadingRoles} />

        <div className="flex gap-4 h-[calc(100vh-320px)] min-h-[500px]">
          <aside className="w-80 shrink-0 flex flex-col rounded-2xl overflow-hidden shadow-sm bg-surface border border-border">
            <div className="px-4 py-3 bg-surface-alt/50 border-b border-border flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">Roles Registrados</span>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{roles.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingRoles ? (
                Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)
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

          <main className="flex-1 min-w-0 bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            {!rolSeleccionado && !loadingDetalle ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-10">
                <div className="size-20 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-border">
                  <Icon name="ads_click" className="text-4xl text-faint" />
                </div>
                <h3 className="text-sm font-black text-main uppercase tracking-tighter">Selección Requerida</h3>
                <p className="text-xs text-muted mt-1">Elige un rol de la lista para visualizar sus propiedades y permisos.</p>
              </div>
            ) : loadingDetalle ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-4">Cargando Detalle...</p>
              </div>
            ) : (
              <div className="h-full">
                {tab === 'detalle' ? (
                  <RolDetallePanel
                    rol={rolSeleccionado}
                    onEditar={() => { setRolEditar(rolSeleccionado); setModalRol(true); }}
                    onToggleActivo={() => setConfirmToggle(true)}
                    actualizando={actualizando}
                  />
                ) : (
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

      <Suspense fallback={null}>
        {modalRol && (
          <ModalRol
            open={modalRol}
            onClose={() => { setModalRol(false); setRolEditar(null); }}
            onGuardado={handleRolGuardado}
            crear={crear}
            actualizar={actualizar}
            actualizando={actualizando}
            rolEditar={rolEditar}
          />
        )}
      </Suspense>

      <ConfirmDialog
        open={confirmPermisos}
        title="Actualizar Permisos"
        message={`¿Confirmas los cambios de privilegios para "${rolSeleccionado?.name}"?`}
        confirmLabel="Confirmar Cambios"
        variant="primary"
        loading={actualizando}
        onConfirm={handleGuardarPermisos}
        onClose={() => setConfirmPermisos(false)}
      />

      <ConfirmDialog
        open={confirmToggle}
        title={rolSeleccionado?.is_active ? 'Desactivar Rol' : 'Activar Rol'}
        message={`¿Estás seguro de cambiar el estado de acceso para el rol "${rolSeleccionado?.name}"?`}
        confirmLabel="Cambiar Estado"
        variant={rolSeleccionado?.is_active ? 'danger' : 'primary'}
        loading={actualizando}
        onConfirm={handleToggleActivo}
        onClose={() => setConfirmToggle(false)}
      />
    </div>
  );
}