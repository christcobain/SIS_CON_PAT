import { useState }       from 'react';
import { useBienes }      from '../../../hooks/useBienes';
import { useLocaciones }  from '../../../hooks/useLocaciones';
import { useCatalogos }   from '../../../hooks/useCatalogos';
import { useToast }       from '../../../hooks/useToast';
import BienesStats        from './../bienes/components/BienesStats';
import BienesFiltros      from './../bienes/components/BienesFiltros';
import BienesTabla        from './../bienes/components/BienesTabla';
import ModalBienForm      from './../bienes/modals/ModalBienForm';
import ModalDetalleBien   from './../bienes/modals/ModalDetalleBien';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);


const FILTROS_INICIALES = {
  search:                   '',
  sede_id:                  '',
  tipo_bien_id:             '',
  estado_funcionamiento_id: '',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function BienesPage() {
  const toast = useToast();

  // ── Hooks ─────────────────────────────────────────────────────────────────

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const {
    bienes,
    loading,
    error,
    actualizando,
    refetch,
    aplicarFiltros,
  } = useBienes(filtros);
  const { fetchCatalogos, tiposBien = [], estadosFuncionamiento = [] } = useCatalogos();
  const { sedes = [] } = useLocaciones();

  useState(() => {
    fetchCatalogos(['tiposBien', 'estadosFuncionamiento']);
  });

  // ── Estado de UI ──────────────────────────────────────────────────────────
  const [modalForm,    setModalForm]    = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [itemEditar,   setItemEditar]   = useState(null);
  const [itemDetalle,  setItemDetalle]  = useState(null);

  // ── Handlers de filtros ───────────────────────────────────────────────────
  const onFiltroChange = (key, val) => {
    const nuevosFiltros = { ...filtros, [key]: val };
    setFiltros(nuevosFiltros);
    aplicarFiltros(nuevosFiltros);
  };

  const onLimpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    aplicarFiltros(FILTROS_INICIALES);
  };

  // ── Handlers de tabla ─────────────────────────────────────────────────────
  const handleNuevo      = ()     => { setItemEditar(null); setModalForm(true); };
  const handleEditar     = (item) => { setItemEditar(item); setModalForm(true); };
  const handleVerDetalle = (item) => { setItemDetalle(item); setModalDetalle(true); };

  const handleGuardado = () => {
    setModalForm(false);
    setItemEditar(null);
    refetch();
  };

  return (
    <div className="page-wrapper">

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Inventario de Bienes</h1>
            <p className="page-subtitle">
              Gestión del inventario patrimonial de bienes muebles institucionales.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              title="Recargar datos"
              className="btn-icon"
              disabled={loading}>
              <Icon name="refresh" className={`text-[18px] ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleNuevo}
              disabled={actualizando}
              className="btn-primary">
              <Icon name="add" className="text-[18px]" />
              Registrar Bien
            </button>
          </div>
        </div>
        {/* Tab único — la estructura permite agregar más tabs (Bajas, etc.) */}
        <div className="tab-bar">
          <button className="tab-btn-active">
            <Icon name="inventory_2" className="text-[17px]" />
            Inventario
            <span className="tab-count-active">
              {loading ? '…' : bienes.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      <div className="page-content">
        <BienesStats bienes={bienes} loading={loading} />
        <BienesFiltros
          filtros={filtros}
          onFiltroChange={onFiltroChange}
          onLimpiar={onLimpiarFiltros}
          sedes={sedes}
          tiposBien={tiposBien}
          estadosFuncionamiento={estadosFuncionamiento}
        />
        <BienesTabla
          items={bienes}
          loading={loading}
          error={error}
          refetch={refetch}
          onVerDetalle={handleVerDetalle}
          onEditar={handleEditar}
        />
      </div>
      {/* ── Modales ────────────────────────────────────────────────────────── */}
      <ModalBienForm
        open={modalForm}
        onClose={() => { setModalForm(false); setItemEditar(null); }}
        item={itemEditar}
        onGuardado={handleGuardado}
      />
      <ModalDetalleBien
        open={modalDetalle}
        onClose={() => setModalDetalle(false)}
        item={itemDetalle}
        onEditar={handleEditar}
      />

    </div>
  );
}