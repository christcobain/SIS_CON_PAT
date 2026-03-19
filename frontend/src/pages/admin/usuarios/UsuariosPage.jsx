import { useState, useEffect, useMemo, lazy, Suspense } from 'react'; 
import { useUsuarios }          from '../../../hooks/useUsuarios';
import { useToast }             from '../../../hooks/useToast';
import { usePermission }        from '../../../hooks/usePermission';
import ConfirmDialog            from '../../../components/feedback/ConfirmDialog';
import UsuariosStats            from './components/UsuariosStats';
import UsuariosFiltros          from './components/UsuariosFiltros';
import UsuariosTabla            from './components/UsuariosTabla';
import Can                      from '../../../components/auth/Can';


const ModalUsuario            = lazy(() => import('./modal/ModalUsuario '));
const ModalDependencia        = lazy(() => import('./modal/ModalDependencia'));
const ModalDetalleUsuario     = lazy(() => import('./modal/ModalDetalleUsuario'));
const ModalDetalleDependencia = lazy(() => import('./modal/ModalDetalleDependencia'));

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const TABS_CONFIG = [
  { 
    id: 'usuarios', 
    label: 'Usuarios', 
    icon: 'group',
    permisoVer: 'ms-usuarios:users:view_user',
    permisoCrear: 'ms-usuarios:users:add_user',
    permisoEditar: 'ms-usuarios:users:change_user'
  },
  { 
    id: 'dependencias', 
    label: 'Dependencias', 
    icon: 'account_tree',
    permisoVer: 'ms-usuarios:users:view_dependencia',
    permisoCrear: 'ms-usuarios:users:add_dependencia',
    permisoEditar: 'ms-usuarios:users:change_dependencia'
  },
];

const FILTROS_INICIALES = { search: '', role: '', is_active: '' };

export default function UsuariosPage() {
  const toast = useToast();
  const { can } = usePermission();

  const tabsDisponibles = useMemo(() => 
    TABS_CONFIG.filter(tab => can(tab.permisoVer)), 
  [can]);

  const {
    usuarios,
    loading: loadingUsuarios,
    error: errorUsuarios,
    actualizando,
    refetch: refetchUsuarios,
    activar,
    desactivar,
    listarDependencias,
    activarDependencia,
    desactivarDependencia,
  } = useUsuarios();

  const [dependencias,     setDependencias]     = useState([]);
  const [loadingDeps,      setLoadingDeps]      = useState(false);
  const [errorDeps,        setErrorDeps]        = useState(null);
  const [actualizandoDeps, setActualizandoDeps] = useState(false);

  const fetchDependencias = async () => {
    if (!can('ms-usuarios:users:view_dependencia')) return;
    setLoadingDeps(true);
    try {
      const data = await listarDependencias();
      setDependencias(Array.isArray(data) ? data : data?.results ?? []);
    } catch (e) {
      setErrorDeps(e?.response?.data?.error || 'Error al cargar dependencias');
    } finally {
      setLoadingDeps(false);
    }
  };

  useEffect(() => { fetchDependencias(); }, []);

  const [activeTab, setActiveTab] = useState(() => tabsDisponibles[0]?.id || 'usuarios');
  const [filtros,   setFiltros]   = useState(FILTROS_INICIALES);

  const [modalUsuario,         setModalUsuario]         = useState(false);
  const [modalDependencia,     setModalDependencia]     = useState(false);
  const [modalDetalleUsuario,  setModalDetalleUsuario]  = useState(false);
  const [modalDetalleDep,      setModalDetalleDep]      = useState(false);

  const [itemEditarUsuario, setItemEditarUsuario] = useState(null);
  const [itemEditarDep,     setItemEditarDep]     = useState(null);
  const [itemDetalle,       setItemDetalle]       = useState(null);
  const [confirmToggle,     setConfirmToggle]     = useState(false);
  const [itemToggle,        setItemToggle]        = useState(null);

  const onFiltroChange   = (key, val) => setFiltros(prev => ({ ...prev, [key]: val }));
  const onLimpiarFiltros = () => setFiltros(FILTROS_INICIALES);

  const currentTabConfig = useMemo(() => 
    TABS_CONFIG.find(t => t.id === activeTab), 
  [activeTab]);

  const itemsFiltrados = useMemo(() => {
    const lista = activeTab === 'usuarios' ? usuarios : dependencias;
    const txt   = filtros.search.toLowerCase().trim();
    return lista.filter(item => {
      const matchSearch = !txt || (() => {
        if (activeTab === 'usuarios') {
          const rolNombre = typeof item.role === 'object' ? item.role?.name : item.role;
          return [item.first_name, item.last_name, item.dni, rolNombre, item.cargo].some(c => c?.toLowerCase().includes(txt));
        }
        return [item.nombre, item.codigo].some(c => c?.toLowerCase().includes(txt));
      })();
      const matchEstado = filtros.is_active === '' || String(item.is_active) === filtros.is_active;
      const matchRol    = !filtros.role || activeTab !== 'usuarios' ||
        (typeof item.role === 'object' ? item.role?.name : item.role) === filtros.role;
      return matchSearch && matchEstado && matchRol;
    });
  }, [activeTab, usuarios, dependencias, filtros]);

  const loadingActivo = activeTab === 'usuarios' ? loadingUsuarios : loadingDeps;
  const errorActivo   = activeTab === 'usuarios' ? errorUsuarios   : errorDeps;
  const refetchActivo = activeTab === 'usuarios' ? refetchUsuarios  : fetchDependencias;

  const handleNuevo = () => {
    if (activeTab === 'usuarios') { setItemEditarUsuario(null); setModalUsuario(true); }
    else                          { setItemEditarDep(null);     setModalDependencia(true); }
  };

  const handleEditar = (item) => {
    if (activeTab === 'usuarios') {
      setItemEditarUsuario(item);
      setModalUsuario(true);
      setModalDetalleUsuario(false);
    } else {
      setItemEditarDep(item);
      setModalDependencia(true);
      setModalDetalleDep(false);
    }
  };

  const handleVerDetalle = (item) => {
    setItemDetalle(item);
    if (activeTab === 'usuarios') setModalDetalleUsuario(true);
    else                          setModalDetalleDep(true);
  };

  const handleToggle = (item) => { setItemToggle(item); setConfirmToggle(true); };

  const handleConfirmToggle = async () => {
    setConfirmToggle(false);
    if (!itemToggle) return;
    const { id, is_active } = itemToggle;
    const nombre = activeTab === 'usuarios'
      ? `${itemToggle.first_name ?? ''} ${itemToggle.last_name ?? ''}`.trim()
      : (itemToggle.nombre ?? '');
    
    try {
      let res;
      if (activeTab === 'usuarios') {
        res = is_active ? await desactivar(id) : await activar(id);
        refetchUsuarios();
      } else {
        setActualizandoDeps(true);
        res = is_active ? await desactivarDependencia(id) : await activarDependencia(id);
        await fetchDependencias();
        setActualizandoDeps(false);
      }
      toast.success(res?.message ?? `"${nombre}" ${is_active ? 'desactivado' : 'activado'}.`);
    } catch (e) {
      setActualizandoDeps(false);
      toast.error(e?.response?.data?.error || 'Error al cambiar el estado.');
    } finally { setItemToggle(null); }
  };

  const btnLabel = activeTab === 'usuarios'
    ? { icon: 'person_add', text: 'Nuevo Usuario' }
    : { icon: 'domain_add', text: 'Nueva Dependencia' };

  return (
    <div className="gap-1 p-4 max-w-[1600px] animate-in fade-in duration-500 h-auto pb-20">
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon name="badge" className="text-[24px]" />
            </div>
            <div>
              <h1 className="page-title">Gestión de Usuarios</h1>
              <p className="page-subtitle">Administre usuarios, accesos y dependencias del Poder Judicial.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refetchActivo} disabled={loadingActivo} className="btn-icon bg-surface border border-border" title="Sincronizar">
              <Icon name="sync" className={`text-[18px] ${loadingActivo ? 'animate-spin text-primary' : 'text-faint'}`} />
            </button>
            
            <Can perform={currentTabConfig?.permisoCrear}>
              <button onClick={handleNuevo} disabled={actualizando || actualizandoDeps} className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm">
                <Icon name={btnLabel.icon} className="text-[18px]" />
                <span className="font-black uppercase tracking-widest text-[10px]">{btnLabel.text}</span>
              </button>
            </Can>
          </div>
        </div>

        <div className="flex gap-6 mt-4 border-t border-border pt-3">
          {tabsDisponibles.map(({ id, label, icon }) => (
            <button key={id}
              onClick={() => { setActiveTab(id); onLimpiarFiltros(); }}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all border-b-2 ${
                activeTab === id ? 'text-primary border-primary' : 'text-faint border-transparent hover:text-main'
              }`}
            >
              <Icon name={icon} className="text-[16px]" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content custom-scrollbar">
        <UsuariosStats usuarios={usuarios} dependencias={dependencias} loading={loadingUsuarios || loadingDeps} />
        <UsuariosFiltros filtros={filtros} onFiltroChange={onFiltroChange} onLimpiar={onLimpiarFiltros} activeTab={activeTab} />
        
        <UsuariosTabla
          activeTab={activeTab}
          items={itemsFiltrados}
          loading={loadingActivo}
          error={errorActivo}
          refetch={refetchActivo}
          onVerDetalle={handleVerDetalle}
          onEditar={handleEditar}
          onToggleEstado={handleToggle}
          puedeEditar={can(currentTabConfig?.permisoEditar)}
        />
      </div>

      {/* 3. Envolvemos los modales con Suspense */}
      {/* El fallback puede ser null o un spinner pequeño */}
      <Suspense fallback={null}>
        {modalUsuario && (
          <ModalUsuario
            open={modalUsuario}
            onClose={() => { setModalUsuario(false); setItemEditarUsuario(null); }}
            item={itemEditarUsuario}
            onGuardado={() => { setModalUsuario(false); setItemEditarUsuario(null); refetchUsuarios(); }}
          />
        )}

        {modalDependencia && (
          <ModalDependencia
            open={modalDependencia}
            onClose={() => { setModalDependencia(false); setItemEditarDep(null); }}
            item={itemEditarDep}
            onGuardado={() => { setModalDependencia(false); setItemEditarDep(null); fetchDependencias(); }}
          />
        )}

        {modalDetalleUsuario && (
          <ModalDetalleUsuario
            open={modalDetalleUsuario}
            onClose={() => setModalDetalleUsuario(false)}
            item={activeTab === 'usuarios' ? itemDetalle : null}
            onEditar={handleEditar}
            puedeEditar={can('ms-usuarios:users:change_user')}
          />
        )}

        {modalDetalleDep && (
          <ModalDetalleDependencia
            open={modalDetalleDep}
            onClose={() => setModalDetalleDep(false)}
            item={activeTab === 'dependencias' ? itemDetalle : null}
            onEditar={handleEditar}
            puedeEditar={can('ms-usuarios:users:change_dependencia')}
          />
        )}
      </Suspense>

      <ConfirmDialog
        open={confirmToggle}
        title={itemToggle?.is_active ? 'Desactivar Registro' : 'Activar Registro'}
        message={(() => {
          const nombre = activeTab === 'usuarios'
            ? `${itemToggle?.first_name ?? ''} ${itemToggle?.last_name ?? ''}`.trim()
            : (itemToggle?.nombre ?? '');
          return itemToggle?.is_active
            ? `¿Desactivar "${nombre}"? ${activeTab === 'usuarios' ? 'Perderá acceso al sistema inmediatamente.' : 'Dejará de estar disponible para asignación.'}`
            : `¿Activar "${nombre}"? ${activeTab === 'usuarios' ? 'Recuperará el acceso al sistema con sus permisos previos.' : 'Estará disponible nuevamente.'}`;
        })()}
        confirmLabel={itemToggle?.is_active ? 'Sí, desactivar' : 'Sí, activar'}
        variant={itemToggle?.is_active ? 'danger' : 'primary'}
        loading={actualizando || actualizandoDeps}
        onConfirm={handleConfirmToggle}
        onClose={() => { setConfirmToggle(false); setItemToggle(null); }}
      />
    </div>
  );
}