import { useState, lazy, Suspense, useMemo, useRef } from 'react';
import { useTransferencias }             from '../../hooks/useTransferencias';
import { useMantenimientos }             from '../../hooks/useMantenimientos';
import { useBajas }                      from '../../hooks/useBajas';
import { useNotificaciones,
         dispararRefetchNotificaciones } from '../../hooks/useNotificaciones ';
import { useToast }                      from '../../hooks/useToast';
import { usePermission }                 from '../../hooks/usePermission';
import { useAuthStore }                  from '../../store/authStore';
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
  const sedes  = useAuthStore(s => s.sedes);
  const user   = useAuthStore(s => s.user);
  const userId = user?.id;
  const sedeId = sedes?.[0]?.id;
  const toast  = useToast();
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
          'ms-bienes:transferencias:add_transferenciadetalle',
          'ms-bienes:transferencias:add_transferenciaaprobacion',
          'ms-bienes:transferencias:change_transferencia'
        ),
      },
      {
        id: 'mantenimiento',
        label: 'Mantenimientos',
        icon: 'build',
        visible: canAny(
          'ms-bienes:mantenimientos:add_mantenimiento',
          'ms-bienes:mantenimientos:add_mantenimientoaprobacion'
        ),
      },
      {
        id: 'bajas',
        label: 'Bajas',
        icon: 'delete_sweep',
        visible: canAny(
          'ms-bienes:bajas:add_baja',
          'ms-bienes:bajas:add_bajaaprobacion'
        ),
      },
      {
        id: 'historial',
        label: 'Historial',
        icon: 'history',
        visible: true,
      },
    ];
    return allTabs.filter((tab) => tab.visible);
  }, [canAny]);

  const {
    historial,
    loadingNotif,
    totalPendientes,
    transfPendientes,
    mantPendientes,
    historialHoy,
    refetchNotif,
  } = useNotificaciones();

  // ── Transferencias ──────────────────────────────────────────────────────────
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
    refetchTransf,
  } = useTransferencias('TRASLADO_SEDE', { misTransferencias: false, usuarioId: user?.id });

  // ── Mantenimientos ──────────────────────────────────────────────────────────
  const [modalDetalleMant, setModalDetalleMant] = useState(false);
  const [itemActivoMant,   setItemActivoMant]   = useState(null);

  const {
    actualizandoMant,
    refetchMant,
    aprobarMant,
    devolverMant,
    descargarPDFMant,
    subirFirmadoMant,
  } = useMantenimientos({});

  // ── Bajas ───────────────────────────────────────────────────────────────────
  const [modalDetalleBaja,   setModalDetalleBaja]   = useState(false);
  const [modalGestionarBaja, setModalGestionarBaja] = useState(false);
  const [modoGestionBaja,    setModoGestionBaja]    = useState('aprobar');
  const [itemActivoBaja,     setItemActivoBaja]     = useState(null);

 
  const {
    aprobarBaja,
    devolverBaja,
    reenviarBaja,
    descargarPDFBaja,
    pdfFirmadoBaja,
    obtenerBaja,
  } = useBajas({});

  const refreshPendientesRef = useRef(null);

  const notificarYRefrescar = () => {
    dispararRefetchNotificaciones();
    refetchNotif();
  };

  const handleSync = () => {
    setLoadingSync(true);
    notificarYRefrescar();
    setTimeout(() => setLoadingSync(false), 600);
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleVerDetalleTransf = (item) => { setItemDetalleTransf(item); setModalDetalleTransf(true); };
  const handleVerDetalleMant   = (item) => { setItemActivoMant(item); setModalDetalleMant(true); };
  const handleVerDetalleBaja   = (item) => { setItemActivoBaja(item); setModalDetalleBaja(true); };

  const handleGestionarBaja = (item, modo) => {
    setItemActivoBaja(item);
    setModoGestionBaja(modo);
    setModalDetalleBaja(false);
    setModalGestionarBaja(true);
  };

  const handleAccionBajaExitosa = (res) => {
    setModalGestionarBaja(false);
    setModalDetalleBaja(false);
    setItemActivoBaja(null);
    toast.success(res?.message || 'Operación realizada con éxito.');
    notificarYRefrescar();
  };

  // ── Objetos de acciones ─────────────────────────────────────────────────────
  const accionesTransf = {
    aprobarAdminsede, aprobarSalidaSeguridad, aprobarEntradaSeguridad,
    rechazarSalidaSeguridad, rechazarEntradaSeguridad,
    retornoSalida, retornoEntrada, devolver,
    descargarPDFTransf, subirFirmado,
  };

  const accionesMant = {
    aprobarMant, devolverMant,
    descargarPDFMant, subirFirmadoMant,
  };


  const accionesBaja = {
    aprobarBaja,
    devolverBaja,
    descargarPDFBaja,
    pdfFirmadoBaja,
    obtenerBaja,

    aprobar:  aprobarBaja,
    devolver: devolverBaja,
    reenviar: reenviarBaja,
  };

  return (
    <div className="p-4 max-w-[1600px] animate-in fade-in duration-500 pb-20">

      {/* ── Cabecera ── */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgb(127 29 29 / 0.1)' }}>
              <Icon name="notifications_active" className="text-[24px]" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 className="page-title">Centro de Alertas</h1>
              <p className="page-subtitle">Acciones y aprobaciones pendientes para tu usuario.</p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={loadingSync}
            className="size-9 flex items-center justify-center rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
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

      <div className="page-content mt-6">
        <AlertasStats
          loading={loadingSync || loadingNotif}
          totalPendientes={totalPendientes}
          transfPendientes={transfPendientes}
          mantPendientes={mantPendientes}
          historialHoy={historialHoy}
        />

        <div className="mt-6">

          {/* ── Tab Transferencias ── */}
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
                userId={userId}
                sedeId={sedeId}
                acciones={accionesTransf}
                onRefreshReady={(fn) => { refreshPendientesRef.current = fn; }}
              />
            </div>
          )}

          <Suspense fallback={null}>
            {modalDetalleTransf && (
              <ModalDetalleTransferencia
                open={modalDetalleTransf}
                onClose={() => { setModalDetalleTransf(false); setItemDetalleTransf(null); }}
                item={itemDetalleTransf}
                actualizando={actualizando}
                acciones={accionesTransf}
                onAccionExitosa={() => {
                  setModalDetalleTransf(false);
                  setItemDetalleTransf(null);
                  refreshPendientesRef.current?.();
                  refetchTransf();
                  notificarYRefrescar();
                }}
              />
            )}
          </Suspense>

          {/* ── Tab Mantenimientos ── */}
          {activeTab === 'mantenimiento' && can('ms-bienes:mantenimientos:view_mantenimiento') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1" style={{ color: 'var(--color-text-faint)' }}>
                <Icon name="engineering" className="text-[18px]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Mantenimientos que requieren tu aprobación
                </p>
              </div>
              <AlertasMantenimientos
                onVerDetalle={handleVerDetalleMant}
                userId={userId}
                sedeId={sedeId}
                acciones={accionesMant}
                onAccionExitosa={() => { refetchMant(); notificarYRefrescar(); }}
                onRefreshReady={(fn) => { refreshPendientesRef.current = fn; }}
              />
            </div>
          )}

          <Suspense fallback={null}>
            {modalDetalleMant && (
              <ModalDetalleMantenimiento
                open={modalDetalleMant}
                onClose={() => { setModalDetalleMant(false); setItemActivoMant(null); }}
                item={itemActivoMant}
                actualizando={actualizandoMant}
                acciones={accionesMant}
              />
            )}
          </Suspense>

          {/* ── Tab Bajas ── */}
          {activeTab === 'bajas' && canAny('ms-bienes:bajas:add_baja', 'ms-bienes:bajas:add_bajaaprobacion') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1" style={{ color: 'var(--color-text-faint)' }}>
                <Icon name="delete_sweep" className="text-[18px]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Informes de baja que requieren tu acción
                </p>
              </div>
              <AlertasBajas
                onVerDetalle={handleVerDetalleBaja}
                userId={userId}
                sedeId={sedeId}
                acciones={accionesBaja}
                onRefreshReady={(fn) => { refreshPendientesRef.current = fn; }}
              />
            </div>
          )}

        </div>
      </div>

      {/* ── Modales Bajas (fuera del page-content para no recortarse) ── */}
      <Suspense fallback={null}>
        {modalDetalleBaja && (
          <ModalDetalleBaja
            open={modalDetalleBaja}
            onClose={() => { setModalDetalleBaja(false); setItemActivoBaja(null); }}
            item={itemActivoBaja}
            acciones={accionesBaja}
            onGestionar={handleGestionarBaja}
            onUser={userId}
          />
        )}

        {modalGestionarBaja && (
          <ModalGestionarBaja
            open={modalGestionarBaja}
            onClose={() => { setModalGestionarBaja(false); setItemActivoBaja(null); }}
            item={itemActivoBaja}
            modo={modoGestionBaja}
            acciones={accionesBaja}
            onAccionExitosa={handleAccionBajaExitosa}
          />
        )}
      </Suspense>

      {/* ── Tab Historial ── */}
      {activeTab === 'historial' && (
        <div className="space-y-4 mt-6">
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
  );
}