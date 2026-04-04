import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useTransferencias } from '../../../hooks/useTransferencias';
import { useToast }          from '../../../hooks/useToast';
import { useAuth }           from '../../../hooks/useAuth';
import { usePermission }     from '../../../hooks/usePermission';
import ConfirmDialog         from '../../../components/feedback/ConfirmDialog';
import TransferenciasStats   from './components/TransferenciasStats';
import TransferenciasFiltros from './components/TransferenciasFiltros';
import TransferenciasTabla   from './components/TransferenciasTabla';

const ModalTransferencia        = lazy(() => import('./modals/ModalTransferencia'));
const ModalDetalleTransferencia = lazy(() => import('./modals/ModalDetalleTransferencia'));

// ── Icono utilitario ──────────────────────────────────────────────────────────
const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

// ── Filtros iniciales ─────────────────────────────────────────────────────────
const FILTROS_INICIALES = {
  search: '', estado: '', misTransferencias: false,
};

// ── Filtrado LOCAL reactivo ───────────────────────────────────────────────────
// Recibe los items ya cargados por el hook y aplica filtros en memoria,
// sin generar ninguna llamada adicional al backend.
function aplicarFiltros(items, filtros, activeTab) {
  let res = [...items];
  const q = filtros.search?.trim().toLowerCase();

  switch (activeTab) {

    case 'TRASLADO_SEDE':
      if (q) res = res.filter(t =>
        t.numero_orden?.toLowerCase().includes(q)          ||
        t.sede_origen_nombre?.toLowerCase().includes(q)    ||
        t.sede_destino_nombre?.toLowerCase().includes(q)   ||
        t.usuario_origen_nombre?.toLowerCase().includes(q) ||
        t.usuario_destino_nombre?.toLowerCase().includes(q)
      );
      if (filtros.estado) res = res.filter(t => t.estado_transferencia === filtros.estado);
      break;

    case 'ASIGNACION_INTERNA':
      if (q) res = res.filter(t =>
        t.numero_orden?.toLowerCase().includes(q)           ||
        t.usuario_destino_nombre?.toLowerCase().includes(q) ||
        t.modulo_destino_nombre?.toLowerCase().includes(q)  ||
        t.usuario_origen_nombre?.toLowerCase().includes(q)
      );
      if (filtros.estado) res = res.filter(t => t.estado_transferencia === filtros.estado);
      break;

    default:
      break;
  }

  return res;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function TransferenciasPage() {
  const toast    = useToast();
  const { user } = useAuth();
  const { can }  = usePermission();

  // ── Permisos por tab ──────────────────────────────────────────────────────
  const canTraslado        = can('ms-bienes:transferencias:view_transferencia');
  const canAsignacion      = can('ms-bienes:transferencias:view_transferenciadetalle');
  const canCrearTraslado   = can('ms-bienes:transferencias:add_transferencia');
  const canCrearAsignacion = can('ms-bienes:transferencias:add_transferenciadetalle');
  const canEditarTraslado   = can('ms-bienes:transferencias:change_transferencia');
  const canEditarAsignacion = can('ms-bienes:transferencias:change_transferenciadetalle');

  // ── Tabs filtrados por permiso ────────────────────────────────────────────
  const TABS = useMemo(() => {
    const allTabs = [
      {
        id:         'TRASLADO_SEDE',
        label:      'Traslados Sedes',
        icon:       'local_shipping',
        permission: 'ms-bienes:transferencias:view_transferencia',
      },
      {
        id:         'ASIGNACION_INTERNA',
        label:      'Asignaciones',
        icon:       'person_add',
        permission: 'ms-bienes:transferencias:view_transferenciadetalle',
      },
    ];
    return allTabs.filter(tab => can(tab.permission));
  }, [can]);

  // ── Estado de navegación ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(() => {
    if (canTraslado)   return 'TRASLADO_SEDE';
    if (canAsignacion) return 'ASIGNACION_INTERNA';
    return '';
  });
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  // ── Estado de modales ─────────────────────────────────────────────────────
  const [modalForm,    setModalForm]    = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);

  // ── Estado de confirmaciones ──────────────────────────────────────────────
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [itemCancel,    setItemCancel]    = useState(null);
  const [cancelling,    setCancelling]    = useState(false);

  // ── Estado de ítems en edición / detalle ─────────────────────────────────
  const [itemEditar,  setItemEditar]  = useState(null);
  const [itemDetalle, setItemDetalle] = useState(null);

  // ── Hook de transferencias ────────────────────────────────────────────────

  const {
    transferencias, loading, error, actualizando,
    refetchTransf,
    obtenerTransf,            
    descargarPDFTransf,
    crearTraslado,
    crearAsignacion,
    aprobarAdminsede,
    devolver,
    aprobarSalidaSeguridad,
    aprobarEntradaSeguridad,
    retornoSalida,
    retornoEntrada,
    reenviarTransferencia,
    cancelar,
    subirFirmado,
    rechazarSalidaSeguridad,
    rechazarEntradaSeguridad,
  } = useTransferencias(
    activeTab,
    { misTransferencias: filtros.misTransferencias, usuarioId: user?.id },
  );

  // ── Filtrado LOCAL sobre los datos ya cargados por el hook ───────────────
  const itemsFiltrados = useMemo(
    () => aplicarFiltros(transferencias ?? [], filtros, activeTab),
    [transferencias, filtros, activeTab]
  );

  const onFiltroChange = (key, val) =>
    setFiltros(f => ({ ...f, [key]: val }));

  // ── Si el activeTab queda fuera de los tabs disponibles ───────────────────
  useEffect(() => {
    if (TABS.length && !TABS.find(t => t.id === activeTab)) {
      setActiveTab(TABS[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [TABS]);

  // ── Limpiar filtros al cambiar de tab ─────────────────────────────────────
  useEffect(() => {
    setFiltros(FILTROS_INICIALES);
  }, [activeTab]);

  // ── Acciones de modales ───────────────────────────────────────────────────
  const handleNuevo      = ()     => { setItemEditar(null); setModalForm(true); };
  const handleEditar     = (item) => { setItemEditar(item); setModalForm(true); setModalDetalle(false); };
  const handleVerDetalle = (item) => { setItemDetalle(item); setModalDetalle(true); };

  // ── Acción: cancelar ──────────────────────────────────────────────────────
  const handleCancelarClick = (item) => { setItemCancel(item); setConfirmCancel(true); };

  const confirmarCancelacion = async () => {
    setConfirmCancel(false); setCancelling(true);
    try {
      const result = await cancelar(itemCancel.id, {
        motivo_cancelacion_id: 1,
        detalle_cancelacion:   'Cancelado desde panel',
      });
      toast.success(result?.message || 'Transferencia cancelada.');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo cancelar.');
    } finally { setCancelling(false); setItemCancel(null); }
  };

  // ── Acción: descargar PDF ─────────────────────────────────────────────────
  const handleDownload = async (id) => {
    try {
      await descargarPDFTransf(id);
    } catch (e) {
      toast.error(e?.error || e?.response?.data?.error || 'No se pudo generar el documento.');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 max-w-[1600px] animate-in fade-in duration-500 pb-20 space-y-5">

      {/* ── Cabecera + Tabs ── */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">

          {/* Título */}
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgb(127 29 29 / 0.1)' }}
            >
              <Icon name="swap_horiz" className="text-[24px]" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 className="page-title">Gestión de Transferencias</h1>
              <p className="page-subtitle">
                Traslados entre sedes y asignaciones internas de activos.
              </p>
            </div>
          </div>

          {/* Acciones de cabecera */}
          <div className="flex items-center gap-2">

            {/* Sincronizar */}
            <button
              onClick={refetchTransf}
              disabled={loading}
              className="btn-icon bg-surface border border-border"
              title="Sincronizar"
            >
              <Icon
                name="sync"
                className={`text-[18px] ${loading ? 'animate-spin text-primary' : 'text-faint'}`}
              />
            </button>

            {/* Nuevo — visible sólo si el usuario puede crear en el tab activo */}
            {((activeTab === 'TRASLADO_SEDE'     && canCrearTraslado)   ||
              (activeTab === 'ASIGNACION_INTERNA' && canCrearAsignacion)) && (
              <button
                className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm"
                onClick={handleNuevo}
                disabled={actualizando}
              >
                <Icon name="add_circle" className="text-[18px]" />
                <span className="font-black uppercase tracking-widest text-[10px]">
                  {activeTab === 'TRASLADO_SEDE' ? 'Nuevo Traslado' : 'Nueva Asignación'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-6 border-t overflow-x-auto pt-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all whitespace-nowrap shrink-0"
              style={{
                color:        activeTab === id ? 'var(--color-primary)' : 'var(--color-text-faint)',
                borderBottom: activeTab === id ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}
            >
              <Icon name={icon} className="text-[16px]" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <TransferenciasStats data={transferencias} loading={loading} />

      {/* ── Filtros reactivos — sin botón Buscar ── */}
      <TransferenciasFiltros
        activeTab={activeTab}
        filtros={filtros}
        onFiltroChange={onFiltroChange}
        onLimpiar={() => setFiltros(FILTROS_INICIALES)}
      />

      {/* ── Tabla ── */}
      <div className="card p-5">
        <TransferenciasTabla
          activeTab={activeTab}
          items={itemsFiltrados}
          loading={loading}
          error={error}
          refetch={refetchTransf}
          onVerDetalle={handleVerDetalle}
          onEditar={canEditarTraslado || canEditarAsignacion ? handleEditar : undefined}
          onCancelar={handleCancelarClick}
          onDownload={handleDownload}
        />
      </div>

      {/* ── Modales lazy ── */}
      <Suspense fallback={null}>
        {modalForm && (
          <ModalTransferencia
            open={modalForm}
            onClose={() => { setModalForm(false); setItemEditar(null); }}
            item={itemEditar}
            activeTab={activeTab}
            actualizando={actualizando}
            crearTraslado={crearTraslado}
            crearAsignacion={crearAsignacion}
            reenviarTransferencia={reenviarTransferencia}
            obtenerTransf={obtenerTransf}
            onGuardado={() => { setModalForm(false); setItemEditar(null); refetchTransf(); }}
          />
        )}

        {modalDetalle && (
          <ModalDetalleTransferencia
            open={modalDetalle}
            onClose={() => setModalDetalle(false)}
            item={itemDetalle}
            actualizando={actualizando}
            acciones={{
              aprobarAdminsede,
              aprobarSalidaSeguridad,
              aprobarEntradaSeguridad,
              retornoSalida,
              retornoEntrada,
              devolver,
              descargarPDFTransf,
              subirFirmado,
              rechazarSalidaSeguridad,
              rechazarEntradaSeguridad,
            }}
            onAccionExitosa={() => { setModalDetalle(false); refetchTransf(); }}
          />
        )}
      </Suspense>

      {/* ── Confirmación cancelación ── */}
      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar Transferencia"
        message={`¿Cancelar la orden ${itemCancel?.numero_orden}? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, cancelar"
        variant="danger"
        loading={cancelling}
        onConfirm={confirmarCancelacion}
        onClose={() => { setConfirmCancel(false); setItemCancel(null); }}
      />
    </div>
  );
}