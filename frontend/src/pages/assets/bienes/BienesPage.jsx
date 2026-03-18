import { useState, useEffect } from 'react';
import { useBienes }             from '../../../hooks/useBienes';
import { useLocaciones }         from '../../../hooks/useLocaciones';
import { useCatalogos }          from '../../../hooks/useCatalogos';
import { useUsuarios }           from '../../../hooks/useUsuarios';
import { useToast }              from '../../../hooks/useToast';
import { useBienesEnriquecidos } from '../../../hooks/useBienesEnriquecidos';

import BienesStats               from './components/BienesStats';
import BienesFiltros, { useFiltradoLocal } from './components/BienesFiltros';
import BienesTabla               from './components/BienesTabla';
import ModalBienForm             from './modals/ModalBienForm';
import ModalDetalleBien          from './modals/ModalDetalleBien';

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
  const toast = useToast();
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const { bienes, loading, error, actualizando, refetch } = useBienes({});
  const { sedes = [], modulos = [] } = useLocaciones();
  const { usuarios = [] } = useUsuarios({ is_active: true });
  const { fetchCatalogos, tiposBien = [], estadosFuncionamiento = [] } = useCatalogos();

  useEffect(() => { fetchCatalogos(['tiposBien', 'estadosFuncionamiento']); }, []);

  const bienesConNombres = useBienesEnriquecidos(bienes, { sedes, modulos, usuarios });
  const bienesFiltrados  = useFiltradoLocal(bienesConNombres, filtros);

  const [modalForm,    setModalForm]    = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [itemEditar,   setItemEditar]   = useState(null);
  const [itemDetalle,  setItemDetalle]  = useState(null);

  const onFiltroChange  = (key, val) => setFiltros(prev => ({ ...prev, [key]: val }));
  const onLimpiarFiltros = () => setFiltros(FILTROS_INICIALES);

  const handleNuevo      = () => { setItemEditar(null); setModalForm(true); };
  const handleEditar     = item => { setItemEditar(item); setModalForm(true); };
  const handleVerDetalle = item => { setItemDetalle(item); setModalDetalle(true); };

  const handleGuardado = () => {
    setModalForm(false);
    setItemEditar(null);
    toast.success(itemEditar ? 'Bien actualizado.' : 'Bien registrado.');
    refetch();
  };

  const hayFiltros = filtros.search || filtros.sede_id || filtros.tipo_bien_id || filtros.estado_funcionamiento_id;

  return (
    <div className="p-4 max-w-[1600px] animate-in fade-in duration-500 pb-20 space-y-5">

      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgb(127 29 29 / 0.1)' }}>
              <Icon name="inventory_2" className="text-[24px]" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 className="page-title">Inventario de Activos</h1>
              <p className="page-subtitle">
                {loading
                  ? 'Cargando inventario...'
                  : `${bienesFiltrados.length} bien(es) ${hayFiltros ? 'filtrado(s)' : 'en total'} de ${bienes.length}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refetch} disabled={loading}
              className="size-9 flex items-center justify-center rounded-xl transition-all cursor-pointer"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <Icon name="refresh"
                className={`text-[20px] ${loading ? 'animate-spin' : ''}`}
                style={{ color: loading ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
            </button>
            <button onClick={handleNuevo} disabled={actualizando}
              className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm">
              <Icon name="add_circle" className="text-[18px]" />
              <span className="font-black uppercase tracking-widest text-[10px]">Nuevo Registro</span>
            </button>
          </div>
        </div>
        <div className="flex gap-6 mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2"
            style={{ color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)' }}>
            <Icon name="grid_view" className="text-[16px]" />Inventario
          </button>
        </div>
      </div>

      <div className="page-content">
        <BienesStats bienes={bienes} loading={loading} />

        <BienesFiltros
          filtros={filtros}
          onFiltroChange={onFiltroChange}
          onLimpiar={onLimpiarFiltros}
          sedes={sedes}
          modulos={modulos}
          tiposBien={tiposBien}
          estadosFuncionamiento={estadosFuncionamiento}
        />

        <BienesTabla
          items={bienesFiltrados}
          loading={loading}
          error={error}
          refetch={refetch}
          onVerDetalle={handleVerDetalle}
          onEditar={handleEditar}
        />
      </div>

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