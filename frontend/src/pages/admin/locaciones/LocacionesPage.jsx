import { useState, useMemo } from 'react';
import { useLocaciones }     from '../../../hooks/useLocaciones';
import { useToast }          from '../../../hooks/useToast';
import ConfirmDialog         from '../../../components/feedback/ConfirmDialog';
import LocacionesStats       from '../locaciones/components/LocacionesStats';
import LocacionesFiltros     from '../locaciones/components/LocacionesFiltros';
import LocacionesTabla       from '../locaciones/components/LocacionesTabla';
import ModalLocacion         from '../locaciones/modals/ModalLocacion';
import ModalDetalleLocacion  from '../locaciones/modals/ModalDetalleLocacion';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const TABS = [
  { id: 'sedes',       label: 'Sedes',       icon: 'domain'      },
  { id: 'modulos',     label: 'Módulos',     icon: 'widgets'     },
  { id: 'ubicaciones', label: 'Ubicaciones', icon: 'location_on' },
];

const FILTROS_INICIALES = { search: '', is_active: '', empresa_id: '' };

export default function LocacionesPage() {
  const toast = useToast();

  const {
    sedes, modulos, ubicaciones, empresas,
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

  const onFiltroChange = (key, val) => setFiltros((prev) => ({ ...prev, [key]: val }));
  
  const onLimpiarFiltros = () => setFiltros(FILTROS_INICIALES);

  const rawData = { sedes, modulos, ubicaciones };

  const itemsFiltrados = useMemo(() => {
    const lista = rawData[activeTab] ?? [];
    return lista.filter((item) => {
      const txt = filtros.search.toLowerCase().trim();
      const matchSearch = !txt || (() => {
        const campos = [item.nombre, item.descripcion, item.direccion,
                        item.empresa_nombre, item.distrito_nombre,
                        item.provincia_nombre, item.departamento_nombre];
        return campos.some((c) => c?.toLowerCase().includes(txt));
      })();
      const matchEstado = filtros.is_active === '' || String(item.is_active) === filtros.is_active;
      const matchEmpresa = !filtros.empresa_id || activeTab !== 'sedes' || String(item.empresa_id) === String(filtros.empresa_id);

      return matchSearch && matchEstado && matchEmpresa;
    });
  }, [activeTab, sedes, modulos, ubicaciones, filtros]);

  const handleNuevo         = ()     => { setItemEditar(null); setModalForm(true); };
  const handleEditar        = (item) => { setItemEditar(item); setModalForm(true); };
  const handleVerDetalle    = (item) => { setItemDetalle(item); setModalDetalle(true); };
  const handleToggleEstado  = (item) => { setItemToggle(item); setConfirmToggle(true); };

  const handleConfirmToggle = async () => {
    setConfirmToggle(false);
    if (!itemToggle) return;
    const { id, is_active } = itemToggle;
    try {
      let res;
      if      (activeTab === 'sedes')   res = is_active ? await desactivarSede(id)    : await activarSede(id);
      else if (activeTab === 'modulos') res = is_active ? await desactivarModulo(id)  : await activarModulo(id);
      else                              res = is_active ? await desactivarUbicacion(id) : await activarUbicacion(id);
      
      toast.success(res?.message ?? `Registro ${is_active ? 'desactivado' : 'activado'}.`);
      refetch(); // Sincronizar tras cambio
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Error al cambiar el estado.');
    } finally {
      setItemToggle(null);
    }
  };

  const handleGuardado = () => {
    setModalForm(false);
    setItemEditar(null);
    refetch();
  };

  return (
    <div className="gap-1 p-4 max-w-[1600px] animate-in fade-in duration-500 h-auto pb-20">
      
      {/* ── CABECERA Y TABS (Diseño Final) ────────────────────────── */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon name="location_away" className="text-[24px]" />
            </div>
            <div>
              <h1 className="page-title">Gestión de Locaciones</h1>
              <p className="page-subtitle">Administre las sedes, módulos y ubicaciones físicas institucionales.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={refetch} 
              disabled={loading}
              className="btn-icon bg-surface border border-border"
              title="Sincronizar"
            >
              <Icon name="sync" className={`text-[18px] ${loading ? 'animate-spin text-primary' : 'text-faint'}`} />
            </button>
            
            <button 
              onClick={handleNuevo} 
              disabled={actualizando} 
              className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm"
            >
              <Icon name="add_circle" className="text-[18px]" />
              <span className="font-black uppercase tracking-widest text-[10px]">Nuevo Registro</span>
            </button>
          </div>
        </div>

        <div className="flex gap-6 mt-4 border-t border-border pt-3">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); onLimpiarFiltros(); }}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${
                activeTab === id 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-faint hover:text-main'
              }`}
            >
              <Icon name={icon} className="text-[16px]" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <LocacionesStats
          sedes={sedes} modulos={modulos} ubicaciones={ubicaciones}
          empresas={empresas} loading={loading}
        />

        {/* ── Filtros ──────────────────────────────────────────────────────── */}
        <LocacionesFiltros
          filtros={filtros}
          onFiltroChange={onFiltroChange}
          empresas={empresas}
          activeTab={activeTab}
          onLimpiar={onLimpiarFiltros}
        />

        {/* ── Tabla ────────────────────────────────────────────────────────── */}
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

      {/* ── Modales ────────────────────────────────────────────────────────── */}
      <ModalLocacion
        open={modalForm}
        onClose={() => { setModalForm(false); setItemEditar(null); }}
        activeTab={activeTab}
        item={itemEditar}
        empresas={empresas}
        crearSede={crearSede}           actualizarSede={actualizarSede}
        crearModulo={crearModulo}       actualizarModulo={actualizarModulo}
        crearUbicacion={crearUbicacion} actualizarUbicacion={actualizarUbicacion}
        actualizando={actualizando}
        onGuardado={handleGuardado}
      />

      <ModalDetalleLocacion
        open={modalDetalle}
        onClose={() => setModalDetalle(false)}
        activeTab={activeTab}
        item={itemDetalle}
        onEditar={handleEditar}
      />

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