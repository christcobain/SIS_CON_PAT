import { useState, lazy, Suspense } from 'react';
import { useBajas } from '../../../hooks/useBajas';
import { useLocaciones } from '../../../hooks/useLocaciones';
import { useToast } from '../../../hooks/useToast';
import { usePermission } from '../../../hooks/usePermission';
import { useAuthStore } from '../../../store/authStore'
import Can from '../../../components/auth/Can';
import BajasStats from './components/BajasStats';
import BajasFiltros from './components/BajasFiltros';
import BajasTabla from './components/BajasTabla';

const ModalCrearBaja    = lazy(() => import('./modals/ModalCrearBaja'));
const ModalDetalleBaja  = lazy(() => import('./modals/ModalDetalleBaja'));
const ModalGestionarBaja = lazy(() => import('./modals/ModalGestionarBaja'));
const ModalCancelarBaja  = lazy(() => import('./modals/ModalCancelarBaja'));

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function BajasPage() {
  const toast = useToast();
  const { sedes } = useLocaciones();
  const { can } = usePermission();
  const userId = useAuthStore((state) => state.user?.id);
  const {
    bajas, loading, error,
    refetch, filtros, aplicarFiltros,
    aprobar, devolver, cancelar, reenviar, descargarPDF,pdfFirmado,
  } = useBajas({});
  const [modalCrear,    setModalCrear]    = useState(false);
  const [modalDetalle,  setModalDetalle]  = useState(false);
  const [modalGestionar, setModalGestionar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [itemActivo,    setItemActivo]    = useState(null);
  const [modoGestion,   setModoGestion]   = useState('aprobar');

  const onFiltroChange = (key, val) => aplicarFiltros({ [key]: val });
  const onLimpiarFiltros = () => aplicarFiltros({ estado_baja: '', sede_elabora_id: '', misInformes: false });

  const handleVerDetalle = (item) => { setItemActivo(item); setModalDetalle(true); };

  const handleGestionar = (item, modo) => {
    setItemActivo(item);
    setModoGestion(modo);
    setModalDetalle(false);
    setModalGestionar(true);
  };

  const handleCancelar = (item) => {
    setItemActivo(item);
    setModalDetalle(false);
    setModalCancelar(true);
  };

  const handleAccionExitosa = (res) => {
    setModalGestionar(false);
    setModalDetalle(false);
    setModalCancelar(false);
    setItemActivo(null);
    toast.success(res?.message || 'Operación realizada con éxito');
  };

  return (
    <div className="p-4 max-w-[1600px] animate-in fade-in duration-500 pb-20 space-y-5">

      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgb(127 29 29 / 0.1)' }}
            >
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
              <button onClick={() => setModalCrear(true)} className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm">
                <Icon name="add_circle" className="text-[18px]" />
                <span className="font-black uppercase tracking-widest text-[10px]">Nuevo Informe</span>
              </button>
            </Can>
          </div>
        </div>
      </div>

      <div className="page-content">
        <BajasStats items={bajas} loading={loading} />
        <BajasFiltros filtros={filtros} onChange={onFiltroChange} onLimpiar={onLimpiarFiltros} sedes={sedes} />
        <BajasTabla
          items={bajas} loading={loading} error={error}
          onVerDetalle={handleVerDetalle}
          onGestionar={handleGestionar}
          onCancelar={handleCancelar}
          onDescargarPDF={descargarPDF}
          onUser={userId}
        />
      </div>

      <Suspense fallback={null}>
        {modalCrear && (
          <ModalCrearBaja
            open={modalCrear}
            onClose={() => { setModalCrear(false); refetch(); }}
          />
        )}

        {modalDetalle && (
          <ModalDetalleBaja
            open={modalDetalle}
            onClose={() => { setModalDetalle(false); setItemActivo(null); }}
            item={itemActivo}
            onGestionar={handleGestionar}
            onCancelar={handleCancelar}
            puedeAccionesRegistrador={can('ms-bienes:bajas:add_baja')}
            puedeAccionesAprobador={can('ms-bienes:bajas:change_baja')}
            onUser={userId}
            onDescargarPDF={descargarPDF}
            pdfFirmado={pdfFirmado}
          />
        )}

        {modalGestionar && (
          <ModalGestionarBaja
            open={modalGestionar}
            onClose={() => { setModalGestionar(false); setItemActivo(null); }}
            item={itemActivo}
            modo={modoGestion}
            onAprobar={async (id) => {
              const res = await aprobar(id);
              handleAccionExitosa(res);
            }}
            onDevolver={async (id, motivo) => {
              const res = await devolver(id, motivo);
              handleAccionExitosa(res);
            }}
            onReenviar={async (id, data) => {
              const res = await reenviar(id, data);
              handleAccionExitosa(res);
            }}
          />
        )}

        {modalCancelar && (
          <ModalCancelarBaja
            open={modalCancelar}
            onClose={() => { setModalCancelar(false); setItemActivo(null); }}
            item={itemActivo}
            onCancelar={async (id, payload) => {
              const res = await cancelar(id, payload);
              handleAccionExitosa(res);
            }}
          />
        )}
      </Suspense>
    </div>
  );
}