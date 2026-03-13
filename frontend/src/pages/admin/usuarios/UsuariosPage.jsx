import { useState, useEffect, useMemo } from 'react';
import { useUsuarios }    from '../../../hooks/useUsuarios';
import { useToast }       from '../../../hooks/useToast';
import ConfirmDialog      from '../../../components/feedback/ConfirmDialog';
import UsuariosStats      from './components/UsuariosStats';
import UsuariosFiltros    from './components/UsuariosFiltros';
import UsuariosTabla      from './components/UsuariosTabla';
// import ModalUsuario    from './modals/ModalUsuario';     // pendiente
import ModalDetalleUsuario from './modal/ModalDetalleUsuario';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const TABS = [
  { id: 'usuarios',     label: 'Usuarios',     icon: 'group'        },
  { id: 'dependencias', label: 'Dependencias', icon: 'account_tree' },
];

const FILTROS_INICIALES = { search: '', role: '', is_active: '' };

// ─────────────────────────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const toast = useToast();

  // ── Hook principal: usuarios ──────────────────────────────────────────────
  const {
    usuarios,
    loading:      loadingUsuarios,
    error:        errorUsuarios,
    actualizando,
    refetch:      refetchUsuarios,
    activar,
    desactivar,
    // Dependencias via el mismo hook
    listarDependencias,
    crearDependencia,
    actualizarDependencia,
    activarDependencia,
    desactivarDependencia,
  } = useUsuarios();

  // ── Estado local de dependencias ──────────────────────────────────────────
  const [dependencias,     setDependencias]     = useState([]);
  const [loadingDeps,      setLoadingDeps]      = useState(false);
  const [errorDeps,        setErrorDeps]        = useState(null);
  const [actualizandoDeps, setActualizandoDeps] = useState(false);

  const fetchDependencias = async () => {
    setLoadingDeps(true);
    setErrorDeps(null);
    try {
      const data = await listarDependencias();
      setDependencias(Array.isArray(data) ? data : data?.results ?? []);
    } catch (e) {
      setErrorDeps(e?.response?.data?.error || 'Error al cargar dependencias');
    } finally {
      setLoadingDeps(false);
    }
  };

  // Carga inicial de dependencias al montar
  useEffect(() => { fetchDependencias(); }, []);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab,     setActiveTab]     = useState('usuarios');
  const [filtros,       setFiltros]       = useState(FILTROS_INICIALES);
  const [modalForm,     setModalForm]     = useState(false);
  const [modalDetalle,  setModalDetalle]  = useState(false);
  const [itemEditar,    setItemEditar]    = useState(null);
  const [itemDetalle,   setItemDetalle]   = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [itemToggle,    setItemToggle]    = useState(null);

  const onFiltroChange   = (key, val) => setFiltros((prev) => ({ ...prev, [key]: val }));
  const onLimpiarFiltros = () => setFiltros(FILTROS_INICIALES);

  // ── Filtrado cliente-side ─────────────────────────────────────────────────
  const itemsFiltrados = useMemo(() => {
    const lista = activeTab === 'usuarios' ? usuarios : dependencias;
    const txt   = filtros.search.toLowerCase().trim();

    return lista.filter((item) => {
      // Búsqueda texto
      const matchSearch = !txt || (() => {
        if (activeTab === 'usuarios') {
          const rolNombre = typeof item.role === 'object' ? item.role?.name : item.role;
          return [item.first_name, item.last_name, item.dni, rolNombre, item.cargo]
            .some((c) => c?.toLowerCase().includes(txt));
        }
        // dependencias: busca en nombre y codigo
        return [item.nombre, item.codigo]
          .some((c) => c?.toLowerCase().includes(txt));
      })();

      // Filtro estado
      const matchEstado = filtros.is_active === '' ||
        String(item.is_active) === filtros.is_active;

      // Filtro rol (solo usuarios)
      const matchRol = !filtros.role || activeTab !== 'usuarios' ||
        (typeof item.role === 'object' ? item.role?.name : item.role) === filtros.role;

      return matchSearch && matchEstado && matchRol;
    });
  }, [activeTab, usuarios, dependencias, filtros]);

  // ── Loading / error según tab activo ─────────────────────────────────────
  const loadingActivo = activeTab === 'usuarios' ? loadingUsuarios : loadingDeps;
  const errorActivo   = activeTab === 'usuarios' ? errorUsuarios   : errorDeps;
  const refetchActivo = activeTab === 'usuarios' ? refetchUsuarios : fetchDependencias;

  // ── Handlers de tabla ─────────────────────────────────────────────────────
  const handleNuevo      = ()     => { setItemEditar(null); setModalForm(true); };
  const handleEditar     = (item) => { setItemEditar(item); setModalForm(true); };
  const handleVerDetalle = (item) => { setItemDetalle(item); setModalDetalle(true); };
  const handleToggle     = (item) => { setItemToggle(item); setConfirmToggle(true); };

  const handleConfirmToggle = async () => {
    setConfirmToggle(false);
    if (!itemToggle) return;
    const { id, is_active } = itemToggle;

    // Nombre legible para el toast
    const nombreItem = activeTab === 'usuarios'
      ? `${itemToggle.first_name ?? ''} ${itemToggle.last_name ?? ''}`.trim()
      : (itemToggle.nombre ?? '');

    try {
      let res;
      if (activeTab === 'usuarios') {
        setActualizandoDeps(false); // solo por limpieza
        res = is_active ? await desactivar(id) : await activar(id);
      } else {
        setActualizandoDeps(true);
        try {
          res = is_active
            ? await desactivarDependencia(id)
            : await activarDependencia(id);
          await fetchDependencias();
        } finally {
          setActualizandoDeps(false);
        }
      }
      toast.success(res?.message ?? `"${nombreItem}" ${is_active ? 'desactivado' : 'activado'}.`);
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.response?.data?.detail || 'Error al cambiar el estado.');
    } finally {
      setItemToggle(null);
    }
  };

  // Botón de acción cambia según tab
  const btnLabel = activeTab === 'usuarios'
    ? { icon: 'person_add', text: 'Nuevo Usuario' }
    : { icon: 'add',        text: 'Nueva Dependencia' };

  const countTab = {
    usuarios:     usuarios.length,
    dependencias: dependencias.length,
  };

  return (
    <div className="page-wrapper">

      {/* ── Cabecera ───────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Gestión de Usuarios</h1>
            <p className="page-subtitle">
              Administre usuarios institucionales, roles de acceso y dependencias del Poder Judicial.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetchActivo}
              title="Recargar datos"
              className="btn-icon"
              disabled={loadingActivo}
            >
              <Icon name="refresh"
                    className={`text-[18px] ${loadingActivo ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleNuevo}
              disabled={actualizando || actualizandoDeps}
              className="btn-primary"
            >
              <Icon name={btnLabel.icon} className="text-[18px]" />
              {btnLabel.text}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {TABS.map(({ id, label, icon }) => {
            const count  = countTab[id] ?? 0;
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); onLimpiarFiltros(); }}
                className={active ? 'tab-btn-active' : 'tab-btn-inactive'}
              >
                <Icon name={icon} className="text-[17px]" />
                {label}
                <span className={active ? 'tab-count-active' : 'tab-count-inactive'}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      <div className="page-content">

        <UsuariosStats
          usuarios={usuarios}
          dependencias={dependencias}
          loading={loadingUsuarios || loadingDeps}
        />

        <UsuariosFiltros
          filtros={filtros}
          onFiltroChange={onFiltroChange}
          onLimpiar={onLimpiarFiltros}
          activeTab={activeTab}
        />

        <UsuariosTabla
          activeTab={activeTab}
          items={itemsFiltrados}
          loading={loadingActivo}
          error={errorActivo}
          refetch={refetchActivo}
          onVerDetalle={handleVerDetalle}
          onEditar={handleEditar}
          onToggleEstado={handleToggle}
        />
      </div>

      {/* ── Modales ────────────────────────────────────────────────────────── */}
      {/* <ModalUsuario
        open={modalForm}
        onClose={() => { setModalForm(false); setItemEditar(null); }}
        activeTab={activeTab}
        item={itemEditar}
        actualizando={actualizando || actualizandoDeps}
        onGuardado={async () => {
          setModalForm(false);
          setItemEditar(null);
          activeTab === 'dependencias' ? await fetchDependencias() : await refetchUsuarios();
        }}
      /> */}

      <ModalDetalleUsuario
        open={modalDetalle}
        onClose={() => setModalDetalle(false)}
        item={itemDetalle}
        onEditar={handleEditar}
      />

      <ConfirmDialog
        open={confirmToggle}
        title={
          itemToggle?.is_active
            ? `Desactivar ${activeTab === 'usuarios' ? 'usuario' : 'dependencia'}`
            : `Activar ${activeTab === 'usuarios' ? 'usuario' : 'dependencia'}`
        }
        message={(() => {
          const nombre = activeTab === 'usuarios'
            ? `${itemToggle?.first_name ?? ''} ${itemToggle?.last_name ?? ''}`.trim()
            : (itemToggle?.nombre ?? '');
          return itemToggle?.is_active
            ? `¿Desactivar "${nombre}"? ${activeTab === 'usuarios' ? 'Perderá acceso al sistema.' : 'Dejará de estar disponible.'}`
            : `¿Activar "${nombre}"? ${activeTab === 'usuarios' ? 'Recuperará el acceso al sistema.' : 'Estará disponible nuevamente.'}`;
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