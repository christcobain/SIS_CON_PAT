import { useState, useEffect } from 'react';
import { useBienes }       from '../../../hooks/useBienes';
import { useLocaciones }   from '../../../hooks/useLocaciones';
import { useCatalogos }    from '../../../hooks/useCatalogos';
import { useToast }        from '../../../hooks/useToast';

import BienesStats         from './../bienes/components/BienesStats';
import BienesFiltros       from './../bienes/components/BienesFiltros';
import BienesTabla         from './../bienes/components/BienesTabla';
import ModalBienForm       from './../bienes/modals/ModalBienForm';
import ModalDetalleBien    from './../bienes/modals/ModalDetalleBien';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const FILTROS_INICIALES = {
  search:                   '',
  sede_id:                  '',
  tipo_bien_id:             '',
  estado_funcionamiento_id: '',
};

export default function BienesPage() {
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

  useEffect(() => {
    fetchCatalogos(['tiposBien', 'estadosFuncionamiento']);
  }, []);

  const [modalForm,    setModalForm]    = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [itemEditar,   setItemEditar]   = useState(null);
  const [itemDetalle,  setItemDetalle]  = useState(null);

  const onFiltroChange = (key, val) => {
    const nuevosFiltros = { ...filtros, [key]: val };
    setFiltros(nuevosFiltros);
    aplicarFiltros(nuevosFiltros);
  };

  const onLimpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    aplicarFiltros(FILTROS_INICIALES);
  };

  const handleNuevo      = () => { setItemEditar(null); setModalForm(true); };
  const handleEditar     = (item) => { setItemEditar(item); setModalForm(true); };
  const handleVerDetalle = (item) => { setItemDetalle(item); setModalDetalle(true); };

  const handleGuardado = () => {
    setModalForm(false);
    setItemEditar(null);
    refetch();
  };

  return (
    <div className="gap-1 p-4 max-w-[1600px] animate-in fade-in duration-500 h-auto pb-20">
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon name="inventory_2" className="text-[24px]" />
            </div>
            <div>
              <h1 className="page-title">Inventario de Bienes</h1>
              <p className="page-subtitle">Gestión del patrimonio mobiliario institucional.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 ">
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
          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary border-b-2 border-primary pb-2">
            <Icon name="grid_view" className="text-[16px]" />
            Inventario
          </button>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="page-content">
      <BienesStats bienes={bienes} loading={loading} />

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <BienesFiltros
        filtros={filtros}
        onFiltroChange={onFiltroChange}
        onLimpiar={onLimpiarFiltros}
        sedes={sedes}
        tiposBien={tiposBien}
        estadosFuncionamiento={estadosFuncionamiento}
      />

      {/* ── Tabla (Crecerá hacia abajo naturalmente) ────────────────────── */}
     
        <BienesTabla
          items={bienes}
          loading={loading}
          error={error}
          refetch={refetch}
          onVerDetalle={handleVerDetalle}
          onEditar={handleEditar}
        />
      

      {/* Modales */}
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
    </div>
    
  );
}