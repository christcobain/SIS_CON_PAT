import { useState, lazy, Suspense, useMemo } from 'react';
import { useTransferencias }             from '../../hooks/useTransferencias';
import { useMantenimientos }             from '../../hooks/useMantenimientos';
import { useNotificaciones,
         dispararRefetchNotificaciones } from '../../hooks/useNotificaciones ';
import { useAuth }                       from '../../hooks/useAuth';
import { useToast }                      from '../../hooks/useToast';
import { usePermission }                 from '../../hooks/usePermission';
import AlertasStats                      from './components/AlertasStats';
import AlertasMantenimientos             from './components/AlertasMantenimientos';
import AlertasHistorial                  from './components/AlertasHistorial';
import AlertasPendientesTransferencias   from './components/AlertasPendientesTransferencias';
import AlertasBajas                      from './components/AlertasBajas';

const ModalDetalleTransferencia = lazy(() =>
  import('../assets/transferencias/modals/ModalDetalleTransferencia')
);
const ModalDetalleMantenimiento = lazy(() =>
  import('../assets/mantenimientos/modals/ModalDetalleMantenimiento')
);
const ModalAprobacionMantenimiento = lazy(() =>
  import('../assets/mantenimientos/modals/ModalAprobacionMantenimiento')
);
const ModalEnviarAprobacion = lazy(() =>
  import('../assets/mantenimientos/modals/ModalEnviarAprobacion')
);
const ModalDetalleBaja = lazy(() =>
  import('../assets/bajas/modals/ModalDetalleBaja')
);
const ModalGestionarBaja = lazy(() =>
  import('../assets/bajas/modals/ModalGestionarBaja')
);

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function Alertas() {
  const { user } = useAuth();
  const toast    = useToast();
  const { canAny, can } = usePermission();
  const [activeTab,   setActiveTab]   = useState('pendientes');
  const [loadingSync, setLoadingSync] = useState(false);

  const TABS = useMemo(() => {
    const allTabs = [
      {
        id: 'pendientes',
        label: 'Transferencias',
        icon: 'bolt',
        visible: canAny(
          'ms-bienes:transferencias:view_transferencia',
          'ms-bienes:transferencias:view_transferenciadetalle'
        ),
      },
      {
        id: 'mantenimiento',
        label: 'Mantenimientos',
        icon: 'build',
        visible: can('ms-bienes:mantenimientos:view_mantenimiento'),
      },
      {
        id: 'bajas',
        label: 'Bajas',
        icon: 'delete_sweep',
        visible: can('ms-bienes:bajas:view_baja'),
      },
      {
        id: 'historial',
        label: 'Historial',
        icon: 'history',
        visible: true,
      },
    ];
    return allTabs.filter((tab) => tab.visible);
  }, [can, canAny]);

  const {
    historial,
    loading:         loadingNotif,
    totalPendientes,
    transfPendientes,
    mantPendientes,
    historialHoy,
    refetchNotif,
  } = useNotificaciones();

  // ── Transferencias ────────────────────────────────────────────────────────
  const [modalDetalleTransf, setModalDetalleTransf] = useState(false);
  const [itemDetalleTransf,  setItemDetalleTransf]  = useState(null);

  const {
    actualizando,
    aprobarAdminsede,
    devolver,
    aprobarSalidaSeguridad,
    aprobarEntradaSeguridad,
    rechazarSalidaSeguridad,
    rechazarEntradaSeguridad,
    retornoSalida,
    retornoEntrada,
    descargarPDFTransf,
    subirFirmado,
    refetch: refetchTransf,
  } = useTransferencias('TRASLADO_SEDE', { misTransferencias: false, usuarioId: user?.id });

  // ── Mantenimientos ────────────────────────────────────────────────────────
  const [modalDetalleMant, setModalDetalleMant] = useState(false);
  const [modalEnviar,      setModalEnviar]      = useState(false);
  const [modalAprobacion,  setModalAprobacion]  = useState(false);
  const [modoAprobacion,   setModoAprobacion]   = useState('aprobar');
  const [itemActivoMant,   setItemActivoMant]   = useState(null);

  const {
    refetchMant,
    enviarAprobacion,
    aprobar:             aprobarMant,
    devolver:            devolverMant,
    confirmarConformidad,
    cancelar:            cancelarMant,
  } = useMantenimientos({});

  // ── Bajas ─────────────────────────────────────────────────────────────────
  const [modalDetalleBaja,  setModalDetalleBaja]  = useState(false);
  const [modalGestionarBaja, setModalGestionarBaja] = useState(false);
  const [modoGestionBaja,   setModoGestionBaja]   = useState('aprobar');
  const [itemActivoBaja,    setItemActivoBaja]    = useState(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const notificarYRefrescar = () => {
    refetchNotif();
    dispararRefetchNotificaciones();
  };

  const handleSync = () => {
    setLoadingSync(true);
    notificarYRefrescar();
    setTimeout(() => setLoadingSync(false), 600);
  };

  // ── Transferencias handlers ───────────────────────────────────────────────
  const handleVerDetalleTransf = (item) => { 
    setItemDetalleTransf(item); 
    setModalDetalleTransf(true); 
  };


  // ── Mantenimientos handlers ───────────────────────────────────────────────
  const handleVerDetalleMant = (item) => { setItemActivoMant(item); setModalDetalleMant(true); };
  const handleAprobarMant    = (item) => { setItemActivoMant(item); setModoAprobacion('aprobar'); setModalDetalleMant(false); setModalAprobacion(true); };
  const handleDevolverMant   = (item) => { setItemActivoMant(item); setModoAprobacion('devolver'); setModalDetalleMant(false); setModalAprobacion(true); };
  const handleEnviarMant     = (item) => { setItemActivoMant(item); setModalDetalleMant(false); setModalEnviar(true); };
  const handleConformarMant  = (item) => { setItemActivoMant(item); setModoAprobacion('conformidad'); setModalDetalleMant(false); setModalAprobacion(true); };
  const handleCancelarMant   = async (item) => {
    try {
      await cancelarMant(item.id, { motivo_cancelacion_id: 1, detalle_cancelacion: 'Cancelado desde alertas' });
      toast.success('Mantenimiento cancelado.');
      refetchMant(); notificarYRefrescar();
    } catch (e) { toast.error(e?.response?.data?.error || 'Error al cancelar.'); }
  };
  const handleAccionMantExitosa = () => {
    setModalAprobacion(false); setModalEnviar(false); setModalDetalleMant(false); setItemActivoMant(null);
    toast.success('Proceso actualizado exitosamente.');
    refetchMant(); notificarYRefrescar();
  };

  // ── Bajas handlers ────────────────────────────────────────────────────────
  const handleVerDetalleBaja = (item) => { 
    setItemActivoBaja(item); 
    setModalDetalleBaja(true); 
  };
  const handleGestionarBaja  = (item, modo) => {
    setItemActivoBaja(item);
    setModoGestionBaja(modo);
    setModalDetalleBaja(false);
    setModalGestionarBaja(true);
  };
  const handleAccionBajaExitosa = (res) => {
    setModalGestionarBaja(false); setModalDetalleBaja(false); setItemActivoBaja(null);
    toast.success(res?.message || 'Operación realizada con éxito.');
    notificarYRefrescar();
  };

  return (
    <div className="p-4 max-w-[1600px] animate-in fade-in duration-500 pb-20">

      {/* ── Cabecera ── */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon name="notifications_active" className="text-[24px]" />
            </div>
            <div>
              <h1 className="page-title">Centro de Notificaciones</h1>
              <p className="page-subtitle">Aprobaciones pendientes, mantenimientos y actividad reciente.</p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={loadingSync}
            className="btn-icon bg-surface border border-border"
            title="Sincronizar"
          >
            <Icon name="sync" className={`text-[18px] ${loadingSync ? 'animate-spin text-primary' : 'text-faint'}`} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-6 mt-4 pt-3 border-t border-border">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all border-b-2 ${
                activeTab === id
                  ? 'text-primary border-primary'
                  : 'text-faint border-transparent hover:text-main'
              }`}
            >
              <Icon name={icon} className="text-[16px]" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="page-content mt-6">
        <AlertasStats
          loading={loadingSync || loadingNotif}
          totalPendientes={totalPendientes}
          transfPendientes={transfPendientes}
          mantPendientes={mantPendientes}
          historialHoy={historialHoy}
        />

        <div className="mt-6">

          {/* Transferencias */}
          {activeTab === 'pendientes' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1" style={{ color: 'var(--color-text-faint)' }}>
                <Icon name="bolt" className="text-[18px]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Transferencias que requieren tu acción
                </p>
              </div>
              <AlertasPendientesTransferencias
                onVerDetalle={handleVerDetalleTransf}
                item={itemDetalleTransf}
                acciones={{
                  aprobarAdminsede, aprobarSalidaSeguridad, aprobarEntradaSeguridad,
                  rechazarSalidaSeguridad, rechazarEntradaSeguridad,
                  retornoSalida, retornoEntrada, devolver,
                  descargarPDFTransf, subirFirmado,
                }}
                onAccionExitosa={() => { setModalDetalleTransf(false); refetchTransf(); notificarYRefrescar(); }}
              />
            </div>
          )}

          {/* Mantenimientos */}
          {activeTab === 'mantenimiento' && can('ms-bienes:mantenimientos:view_mantenimiento') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1" style={{ color: 'var(--color-text-faint)' }}>
                <Icon name="engineering" className="text-[18px]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Mantenimientos que requieren tu aprobación
                </p>
              </div>
              <AlertasMantenimientos onVerDetalle={handleVerDetalleMant} />
            </div>
          )}

          {/* Bajas */}
          {activeTab === 'bajas' && can('ms-bienes:bajas:view_baja') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1" style={{ color: 'var(--color-text-faint)' }}>
                <Icon name="delete_sweep" className="text-[18px]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Informes de baja que requieren tu aprobación
                </p>
              </div>
              <AlertasBajas onVerDetalle={handleVerDetalleBaja} />
            </div>
          )}

          {/* Historial */}
          {activeTab === 'historial' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1" style={{ color: 'var(--color-text-faint)' }}>
                <Icon name="history" className="text-[18px]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Registro de Actividad Reciente
                </p>
              </div>
              <AlertasHistorial items={historial} loading={loadingSync || loadingNotif} />
            </div>
          )}

        </div>
      </div>

      {/* ── Modales Transferencias ── */}
      <Suspense fallback={null}>
        {modalDetalleTransf && (
          <ModalDetalleTransferencia
            open={modalDetalleTransf}
            onClose={() => { setModalDetalleTransf(false); setItemDetalleTransf(null); }}
            item={itemDetalleTransf}
            actualizando={actualizando}
            acciones={{
              aprobarAdminsede, aprobarSalidaSeguridad, aprobarEntradaSeguridad,
              rechazarSalidaSeguridad, rechazarEntradaSeguridad,
              retornoSalida, retornoEntrada, devolver,
              descargarPDFTransf, subirFirmado,
            }}
            onAccionExitosa={() => {  refetchTransf(); notificarYRefrescar(); }}
          />
        )}
      </Suspense>

      {/* ── Modales Mantenimientos ── */}
      <Suspense fallback={null}>
        {modalDetalleMant && (
          <ModalDetalleMantenimiento
            open={modalDetalleMant}
            onClose={() => { setModalDetalleMant(false); setItemActivoMant(null); }}
            item={itemActivoMant}
            onAprobar={handleAprobarMant}
            onDevolver={handleDevolverMant}
            onEnviar={handleEnviarMant}
            onConformar={handleConformarMant}
            onCancelar={handleCancelarMant}
            onSubirFirmado={handleAccionMantExitosa}            
          />
        )}
        {modalEnviar && (
          <ModalEnviarAprobacion
            open={modalEnviar}
            onClose={() => { setModalEnviar(false); setItemActivoMant(null); }}
            item={itemActivoMant}
            onEnviar={async (id, data) => { await enviarAprobacion(id, data); handleAccionMantExitosa(); }}
          />
        )}
        {modalAprobacion && (
          <ModalAprobacionMantenimiento
            open={modalAprobacion}
            onClose={() => { setModalAprobacion(false); setItemActivoMant(null); }}
            item={itemActivoMant}
            modo={modoAprobacion}
            onAprobar={async (id, obs) => { await aprobarMant(id, obs); handleAccionMantExitosa(); }}
            onDevolver={async (id, motivo) => { await devolverMant(id, motivo); handleAccionMantExitosa(); }}
            onConformar={async (id) => { await confirmarConformidad(id); handleAccionMantExitosa(); }}
          />
        )}
      </Suspense>

      {/* ── Modales Bajas ── */}
      <Suspense fallback={null}>
        {modalDetalleBaja && (
          <ModalDetalleBaja
            open={modalDetalleBaja}
            onClose={() => { setModalDetalleBaja(false); setItemActivoBaja(null); }}
            item={itemActivoBaja}
            onGestionar={handleGestionarBaja}
            onCancelar={() => {}}
            puedeAccionesRegistrador={false}
            puedeAccionesAprobador={can('ms-bienes:bajas:change_baja')}
            onUser={user?.id}
            descargarPDF={async (id, firmado) => {
              const { default: bajasService } = await import('../../services/bajas.service');
              const blob = await bajasService.descargarPDF(id, firmado);
              const url  = window.URL.createObjectURL(new Blob([blob]));
              const link = document.createElement('a');
              link.href  = url;
              link.setAttribute('download', 'baja.pdf');
              document.body.appendChild(link);
              link.click();
              link.remove();
            }}
            pdfFirmado={null}
          />
        )}
        {modalGestionarBaja && (
          <ModalGestionarBaja
            open={modalGestionarBaja}
            onClose={() => { setModalGestionarBaja(false); setItemActivoBaja(null); }}
            item={itemActivoBaja}
            modo={modoGestionBaja}
            onAprobar={async (id) => {
              const { default: bajasService } = await import('../../services/bajas.service');
              const res = await bajasService.aprobar(id);
              handleAccionBajaExitosa(res);
            }}
            onDevolver={async (id, motivo) => {
              const { default: bajasService } = await import('../../services/bajas.service');
              const res = await bajasService.devolver(id, motivo);
              handleAccionBajaExitosa(res);
            }}
            onReenviar={() => {}}
          />
        )}
      </Suspense>
    </div>
  );
}