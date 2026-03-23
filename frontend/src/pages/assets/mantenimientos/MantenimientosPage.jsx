import { useState, lazy, Suspense } from 'react';
import { useMantenimientos } from '../../../hooks/useMantenimientos';
import { useLocaciones } from '../../../hooks/useLocaciones';
import { useToast } from '../../../hooks/useToast';
import { usePermission } from '../../../hooks/usePermission';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog';
import MantenimientosStats from './components/MantenimientosStats';
import MantenimientosFiltros from './components/MantenimientosFiltros';
import MantenimientosTabla from './components/MantenimientosTabla';
import Can from '../../../components/auth/Can';

const ModalCrearMantenimiento = lazy(() => import('./modals/ModalCrearMantenimiento'));
const ModalDetalleMantenimiento = lazy(() => import('./modals/ModalDetalleMantenimiento'));
const ModalEnviarAprobacion = lazy(() => import('./modals/ModalEnviarAprobacion'));
const ModalAprobacionMantenimiento = lazy(() => import('./modals/ModalAprobacionMantenimiento'));

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const FILTROS_INICIALES = { estado: '', sede_id: '', search: '', misMantenimientos: false };

export default function MantenimientosPage() {
  const toast = useToast();
  const { sedes } = useLocaciones();
  const { can } = usePermission();

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const {
    mantenimientos, loading, actualizando, refetch, aplicarFiltros,
    enviarAprobacion, aprobar, devolver, confirmarConformidad, cancelar,
  } = useMantenimientos(filtros);

  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalEnviar, setModalEnviar] = useState(false);
  const [modalAprobacion, setModalAprobacion] = useState(false);
  const [modoAprobacion, setModoAprobacion] = useState('aprobar');
  const [confirmCancelar, setConfirmCancelar] = useState(false);
  const [itemActivo, setItemActivo] = useState(null);
  const [itemCancelar, setItemCancelar] = useState(null);

  const onFiltroChange = (key, val) => {
    const next = { ...filtros, [key]: val };
    setFiltros(next);
    aplicarFiltros(next);
  };

  const onLimpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    aplicarFiltros(FILTROS_INICIALES);
  };

  const handleVerDetalle = item => { setItemActivo(item); setModalDetalle(true); };

  const handleAprobar = item => {
    setItemActivo(item);
    setModoAprobacion('aprobar');
    setModalDetalle(false);
    setModalAprobacion(true);
  };

  const handleDevolver = item => {
    setItemActivo(item);
    setModoAprobacion('devolver');
    setModalDetalle(false);
    setModalAprobacion(true);
  };

  const handleEnviar = item => {
    setItemActivo(item);
    setModalDetalle(false);
    setModalEnviar(true);
  };

  const handleConformar = item => {
    setItemActivo(item);
    setModoAprobacion('conformidad');
    setModalDetalle(false);
    setModalAprobacion(true);
  };

  const handleCancelar = item => {
    setItemCancelar(item);
    setConfirmCancelar(true);
  };

  const confirmarCancelacion = async () => {
    try {
      await cancelar(itemCancelar.id, { motivo_cancelacion_id: 1, detalle_cancelacion: 'Cancelado desde panel' });
      toast.success('Mantenimiento cancelado.');
      setConfirmCancelar(false);
      setItemCancelar(null);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al cancelar.');
    }
  };

  const handleAccionExitosa = () => {
    setModalAprobacion(false);
    setModalEnviar(false);
    setModalDetalle(false);
    setItemActivo(null);
    toast.success('Proceso actualizado exitosamente.');
    refetch();
  };

  return (
    <div className="p-4 max-w-[1600px] animate-in fade-in duration-500 pb-20 space-y-5">
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgb(127 29 29 / 0.1)' }}>
              <Icon name="engineering" className="text-[24px]" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 className="page-title">Mantenimiento de Bienes</h1>
              <p className="page-subtitle">Gestión de reparaciones, informes técnicos y servicios preventivos.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refetch} disabled={loading}
              className="size-9 flex items-center justify-center rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <Icon name="refresh" className={`text-[20px] ${loading ? 'animate-spin text-primary' : 'text-faint'}`} />
            </button>
            
            <Can perform="ms-bienes:mantenimientos:add_mantenimiento">
              <button onClick={() => setModalCrear(true)}
                className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm">
                <Icon name="add_circle" className="text-[18px]" />
                <span className="font-black uppercase tracking-widest text-[10px]">Nueva orden</span>
              </button>
            </Can>
          </div>
        </div>
      </div>

      <div className="page-content">
        <MantenimientosStats items={mantenimientos} loading={loading} />

        <MantenimientosFiltros
          filtros={filtros}
          onChange={onFiltroChange}
          onLimpiar={onLimpiarFiltros}
          sedes={sedes}
        />

        <MantenimientosTabla
          items={mantenimientos}
          loading={loading}
          onVerDetalle={handleVerDetalle}
          onAprobar={handleAprobar}
          onDevolver={handleDevolver}
          onEnviar={handleEnviar}
          onCancelar={handleCancelar}
          puedeAprobar={can('ms-bienes:mantenimientos:change_mantenimiento')}
          puedeCancelar={can('ms-bienes:mantenimientos:delete_mantenimiento')}
          puedeEnviar={can('ms-bienes:mantenimientos:add_mantenimiento')}
        />
      </div>

      <Suspense fallback={null}>
        {modalCrear && (
          <ModalCrearMantenimiento
            open={modalCrear}
            onClose={() => setModalCrear(false)}
            onGuardado={() => { setModalCrear(false); refetch(); }}
          />
        )}

        {modalDetalle && (
          <ModalDetalleMantenimiento
            open={modalDetalle}
            onClose={() => { setModalDetalle(false); setItemActivo(null); }}
            item={itemActivo}
            onAprobar={handleAprobar}
            onDevolver={handleDevolver}
            onEnviar={handleEnviar}
            onConformar={handleConformar}
            onCancelar={handleCancelar}
            onSubirFirmado={handleAccionExitosa}
            puedeAccionesTecnicas={can('ms-bienes:mantenimientos:add_mantenimiento')}
            puedeAccionesAdmin={can('ms-bienes:mantenimientos:change_mantenimiento')}
          />
        )}

        {modalEnviar && (
          <ModalEnviarAprobacion
            open={modalEnviar}
            onClose={() => { setModalEnviar(false); setItemActivo(null); }}
            item={itemActivo}
            onEnviar={async (id, data) => {
              await enviarAprobacion(id, data);
              handleAccionExitosa();
            }}
          />
        )}

        {modalAprobacion && (
          <ModalAprobacionMantenimiento
            open={modalAprobacion}
            onClose={() => { setModalAprobacion(false); setItemActivo(null); }}
            item={itemActivo}
            modo={modoAprobacion}
            onAprobar={async (id, obs) => { await aprobar(id, obs); handleAccionExitosa(); }}
            onDevolver={async (id, motivo) => { await devolver(id, motivo); handleAccionExitosa(); }}
            onConformar={async (id) => { await confirmarConformidad(id); handleAccionExitosa(); }}
          />
        )}
      </Suspense>

      <ConfirmDialog
        open={confirmCancelar}
        title="Cancelar mantenimiento"
        message={`¿Cancelar la orden "${itemCancelar?.numero_orden}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, cancelar" variant="danger" loading={actualizando}
        onConfirm={confirmarCancelacion}
        onClose={() => { setConfirmCancelar(false); setItemCancelar(null); }}
      />
    </div>
  );
}