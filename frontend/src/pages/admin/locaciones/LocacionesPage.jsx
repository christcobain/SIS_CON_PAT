import { useState, useMemo, lazy, Suspense } from 'react';
import { useLocaciones }     from '../../../hooks/useLocaciones';
import { useToast }          from '../../../hooks/useToast';
import Can                   from '../../../components/auth/Can';
import ConfirmDialog         from '../../../components/feedback/ConfirmDialog';
import LocacionesStats       from '../locaciones/components/LocacionesStats';
import LocacionesFiltros     from '../locaciones/components/LocacionesFiltros';
import LocacionesTabla       from '../locaciones/components/LocacionesTabla';

// Carga perezosa de modales
const ModalLocacion = lazy(() => import('../locaciones/modals/ModalLocacion'));
const ModalDetalleLocacion = lazy(() => import('../locaciones/modals/ModalDetalleLocacion'));

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const TABS = [
  { id: 'sedes',       label: 'Sedes',       icon: 'domain',       permission: 'ms-usuarios:locations:add_sede' },
  { id: 'modulos',     label: 'Módulos',     icon: 'widgets',      permission: 'ms-usuarios:locations:add_modulo' },
  { id: 'ubicaciones', label: 'Ubicaciones', icon: 'location_on',  permission: 'ms-usuarios:locations:add_ubicacion' },
];

const FILTROS_INICIALES = { search: '', is_active: '', empresa_id: '' };

export default function LocacionesPage() {
  const toast = useToast();
  const {
    sedes, modulos, ubicaciones, empresas, departamentos,
    loading, error, actualizando, refetch,
    crearSede,       actualizarSede,       activarSede,       desactivarSede,
    crearModulo,     actualizarModulo,     activarModulo,     desactivarModulo,
    crearUbicacion,  actualizarUbicacion,  activarUbicacion,  desactivarUbicacion,
  } = useLocaciones();

  const [activeTab,     setActiveTab]     = useState('sedes');
  const [filtros,       setFiltros]       = useState(FILTROS_INICIALES);
  const [modalForm,     setModalForm]     = useState(false);
  const [modalDetalle,  setModalDetalle]  = useState(false);
  const [itemEditar,    setItemEditar]    = useState(null);
  const [itemDetalle,   setItemDetalle]   = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [itemToggle,    setItemToggle]    = useState(null);

  const onFiltroChange  = (key, val) => setFiltros((prev) => ({ ...prev, [key]: val }));
  const onLimpiarFiltros = () => setFiltros(FILTROS_INICIALES);

  const rawData = { sedes, modulos, ubicaciones };

  const itemsFiltrados = useMemo(() => {
    const lista = rawData[activeTab] ?? [];
    const txt   = filtros.search.toLowerCase().trim();
    return lista.filter(item => {
      const matchSearch = !txt || [item.nombre, item.direccion, item.empresa_nombre, item.distrito_nombre]
        .some(c => c?.toLowerCase().includes(txt));
      const matchEstado    = filtros.is_active === '' || String(item.is_active) === filtros.is_active;
      const matchEmpresa   = !filtros.empresa_id || activeTab !== 'sedes' ||
        String(item.empresa_id) === String(filtros.empresa_id);
      return matchSearch && matchEstado && matchEmpresa;
    });
  }, [activeTab, sedes, modulos, ubicaciones, filtros]);

  const handleNuevo        = ()     => { setItemEditar(null);  setModalForm(true); };
  const handleEditar       = (item) => { setItemEditar(item);  setModalForm(true); setModalDetalle(false); };
  const handleVerDetalle   = (item) => { setItemDetalle(item); setModalDetalle(true); };
  const handleToggleEstado = (item) => { setItemToggle(item);  setConfirmToggle(true); };
  const handleGuardado     = ()     => { setModalForm(false);  setItemEditar(null); refetch(); };

  const handleConfirmToggle = async () => {
    setConfirmToggle(false);
    if (!itemToggle) return;
    const { id, is_active } = itemToggle;
    try {
      if (activeTab === 'sedes') {
        is_active ? await desactivarSede(id) : await activarSede(id);
      } else if (activeTab === 'modulos') {
        is_active ? await desactivarModulo(id) : await activarModulo(id);
      } else {
        is_active ? await desactivarUbicacion(id) : await activarUbicacion(id);
      }
      toast.success(`"${itemToggle.nombre}" ${is_active ? 'desactivado' : 'activado'} correctamente.`);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al cambiar el estado.');
    } finally {
      setItemToggle(null);
    }
  };

  const currentTabCfg = useMemo(() => TABS.find(t => t.id === activeTab), [activeTab]);
  
  const btnLabels = { 
    sedes: { icon: 'add_business', text: 'Nueva Sede' }, 
    modulos: { icon: 'add', text: 'Nuevo Módulo' }, 
    ubicaciones: { icon: 'add_location', text: 'Nueva Ubicación' } 
  };
  const btn = btnLabels[activeTab];

  return (
    <div className="gap-1 p-4 max-w-[1600px] animate-in fade-in duration-500 h-auto pb-20">

      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon name="location_city" className="text-[24px]" />
            </div>
            <div>
              <h1 className="page-title">Gestión de Locaciones</h1>
              <p className="page-subtitle">Administre sedes, módulos y ubicaciones del Poder Judicial.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refetch} disabled={loading} className="btn-icon bg-surface border border-border" title="Sincronizar">
              <Icon name="sync" className={`text-[18px] ${loading ? 'animate-spin text-primary' : 'text-faint'}`} />
            </button>

            <Can perform={currentTabCfg?.permission}>
              <button onClick={handleNuevo} disabled={actualizando} className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm">
                <Icon name={btn.icon} className="text-[18px]" />
                <span className="font-black uppercase tracking-widest text-[10px]">{btn.text}</span>
              </button>
            </Can>
          </div>
        </div>

        <div className="flex gap-6 mt-4 border-t border-border pt-3">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); onLimpiarFiltros(); }}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${
                activeTab === id ? 'text-primary border-b-2 border-primary' : 'text-faint hover:text-main'
              }`}
            >
              <Icon name={icon} className="text-[16px]" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        <LocacionesStats
          sedes={sedes} modulos={modulos} ubicaciones={ubicaciones}
          empresas={empresas} loading={loading}
        />
        <LocacionesFiltros
          filtros={filtros}
          onFiltroChange={onFiltroChange}
          empresas={empresas}
          activeTab={activeTab}
          onLimpiar={onLimpiarFiltros}
        />
        <LocacionesTabla
          activeTab={activeTab}
          items={itemsFiltrados}
          loading={loading}
          error={error}
          refetch={refetch}
          totalItems={itemsFiltrados.length}
          onVerDetalle={handleVerDetalle}
          onEditar={handleEditar}
          onToggleEstado={handleToggleEstado}
        />
      </div>
  
      <Suspense fallback={null}>
        {modalForm && (
          <ModalLocacion
            open={modalForm}
            onClose={() => { setModalForm(false); setItemEditar(null); }}
            activeTab={activeTab}
            item={itemEditar}
            empresas={empresas}
            departamentos={departamentos}
            crearSede={crearSede}           actualizarSede={actualizarSede}
            crearModulo={crearModulo}       actualizarModulo={actualizarModulo}
            crearUbicacion={crearUbicacion} actualizarUbicacion={actualizarUbicacion}
            actualizando={actualizando}
            onGuardado={handleGuardado}
          />
        )}

        {modalDetalle && (
          <ModalDetalleLocacion
            open={modalDetalle}
            onClose={() => setModalDetalle(false)}
            activeTab={activeTab}
            item={itemDetalle}
            onEditar={handleEditar}
          />
        )}
      </Suspense>

      <ConfirmDialog
        open={confirmToggle}
        title={itemToggle?.is_active ? 'Desactivar registro' : 'Activar registro'}
        message={
          itemToggle?.is_active
            ? `¿Desactivar "${itemToggle?.nombre}"? Dejará de aparecer como opción disponible.`
            : `¿Activar "${itemToggle?.nombre}"? Estará nuevamente disponible en el sistema.`
        }
        confirmLabel={itemToggle?.is_active ? 'Sí, desactivar' : 'Sí, activar'}
        variant={itemToggle?.is_active ? 'danger' : 'primary'}
        loading={actualizando}
        onConfirm={handleConfirmToggle}
        onClose={() => { setConfirmToggle(false); setItemToggle(null); }}
      />
    </div>
  );
}