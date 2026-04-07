import { useState, lazy, Suspense } from 'react';
import { useBajas }      from '../../../hooks/useBajas';
import { useLocaciones } from '../../../hooks/useLocaciones';
import { useToast }      from '../../../hooks/useToast';
import { useAuthStore }  from '../../../store/authStore';
import Can               from '../../../components/auth/Can';
import BajasStats        from './components/BajasStats';
import BajasFiltros      from './components/BajasFiltros';
import BajasTabla        from './components/BajasTabla';

const ModalCrearBaja     = lazy(() => import('./modals/ModalCrearBaja'));
const ModalDetalleBaja   = lazy(() => import('./modals/ModalDetalleBaja'));
const ModalGestionarBaja = lazy(() => import('./modals/ModalGestionarBaja'));
const ModalCancelarBaja  = lazy(() => import('./modals/ModalCancelarBaja'));

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const FILTROS_INICIALES = { estado_baja: '', sede_elabora_id: '', misInformes: false };

export default function BajasPage() {
  const toast     = useToast();
  const { sedes } = useLocaciones();
  const userId    = useAuthStore((s) => s.user?.id);

  const {
    bajas, loading, error,
    refetch, aplicarFiltros,
    bienesParaBaja,
    crearBaja,
    aprobarBaja, devolverBaja, cancelarBaja, reenviarBaja,
    descargarPDFBaja, pdfFirmadoBaja,
    obtenerBaja,
  } = useBajas({});

  const [filtrosLocales, setFiltrosLocales] = useState(FILTROS_INICIALES);
  const [itemEditar,     setItemEditar]     = useState(null);
  const [itemActivo,     setItemActivo]     = useState(null);
  const [itemCancelar,   setItemCancelar]   = useState(null);
  const [modoGestion,    setModoGestion]    = useState('aprobar');

  const [modalCrear,     setModalCrear]     = useState(false);
  const [modalDetalle,   setModalDetalle]   = useState(false);
  const [modalGestionar, setModalGestionar] = useState(false);
  const [modalCancelar,  setModalCancelar]  = useState(false);

  const onFiltroChange = (key, val) => {
    const next = { ...filtrosLocales, [key]: val };
    setFiltrosLocales(next);
    aplicarFiltros(next);
  };

  const onLimpiarFiltros = () => {
    setFiltrosLocales(FILTROS_INICIALES);
    aplicarFiltros(FILTROS_INICIALES);
  };

  const handleNuevo      = ()     => { setItemEditar(null); setModalCrear(true); };
  const handleVerDetalle = (item) => { setItemActivo(item); setModalDetalle(true); };

  const handleGestionar = (item, modo) => {
    setItemActivo(item);
    setModoGestion(modo);
    setModalDetalle(false);
    setModalGestionar(true);
  };

  const handleCancelar = (item) => {
    setItemCancelar(item);
    setModalDetalle(false);
    setModalCancelar(true);
  };

  const handleAccionExitosa = (res) => {
    setModalGestionar(false);
    setModalDetalle(false);
    setModalCancelar(false);
    setItemActivo(null);
    setItemCancelar(null);
    toast.success(res?.message || 'Operación realizada con éxito');
    refetch();
  };

  const acciones = {
    bienesParaBaja,
    crearBaja,
    aprobarBaja,
    devolverBaja,
    cancelarBaja,
    reenviarBaja,
    descargarPDFBaja,
    pdfFirmadoBaja,
    obtenerBaja,
  };

  return (
    <div className="p-4 max-w-[1600px] animate-in fade-in duration-500 pb-20 space-y-5">

      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgb(127 29 29 / 0.1)' }}>
              <Icon name="delete_sweep" className="text-[24px]" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 className="page-title">Baja de Bienes</h1>
              <p className="page-subtitle">Gestión de salida definitiva de activos del inventario patrimonial.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              disabled={loading}
              className="size-9 flex items-center justify-center rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <Icon name="refresh" className={`text-[20px] ${loading ? 'animate-spin text-primary' : 'text-faint'}`} />
            </button>
            <Can perform="ms-bienes:bajas:add_baja">
              <button onClick={handleNuevo} className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm">
                <Icon name="description" className="text-[18px]" />
                <span className="font-black uppercase tracking-widest text-[10px]">Registrar Baja</span>
              </button>
            </Can>
          </div>
        </div>
      </div>

      <div className="page-content">
        <BajasStats items={bajas} loading={loading} />
        <BajasFiltros
          filtros={filtrosLocales}
          onChange={onFiltroChange}
          onLimpiar={onLimpiarFiltros}
          sedes={sedes}
        />
        <BajasTabla
          items={bajas}
          loading={loading}
          error={error}
          onVerDetalle={handleVerDetalle}
          onGestionar={handleGestionar}
          onCancelar={handleCancelar}
          onDescargarPDF={descargarPDFBaja}
          onUser={userId}
        />
      </div>

      <Suspense fallback={null}>

        {modalCrear && (
          <ModalCrearBaja
            open={modalCrear}
            onClose={() => { setModalCrear(false); setItemEditar(null); }}
            item={itemEditar}
            acciones={acciones}
            onGuardado={() => { setModalCrear(false); refetch(); }}
          />
        )}

        {modalDetalle && (
          <ModalDetalleBaja
            open={modalDetalle}
            onClose={() => { setModalDetalle(false); setItemActivo(null); }}
            item={itemActivo}
            acciones={acciones}
            onGestionar={handleGestionar}
            onUser={userId}
          />
        )}

        {modalGestionar && (
          <ModalGestionarBaja
            open={modalGestionar}
            onClose={() => { setModalGestionar(false); setItemActivo(null); }}
            item={itemActivo}
            modo={modoGestion}
            acciones={acciones}
            onAccionExitosa={handleAccionExitosa}
          />
        )}

        {modalCancelar && (
          <ModalCancelarBaja
            open={modalCancelar}
            onClose={() => { setModalCancelar(false); setItemCancelar(null); }}
            item={itemCancelar}
            acciones={acciones}
            onAccionExitosa={handleAccionExitosa}
          />
        )}

      </Suspense>
    </div>
  );
}