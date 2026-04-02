import { useState, useMemo, lazy, Suspense } from 'react'; 
import { useTransferencias } from '../../../hooks/useTransferencias';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../../../hooks/useAuth';
import { usePermission } from '../../../hooks/usePermission';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog';
import TransferenciasStats from './components/TransferenciasStats';
import TransferenciasFiltros from './components/TransferenciasFiltros';
import TransferenciasTabla from './components/TransferenciasTabla';
import Can from '../../../components/auth/Can';


const ModalTransferencia = lazy(() => import('./modals/ModalTransferencia'));
const ModalDetalleTransferencia = lazy(() => import('./modals/ModalDetalleTransferencia'));

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const TABS_CONFIG = [
  { 
    id: 'TRASLADO_SEDE', 
    label: 'Traslados Sedes', 
    icon: 'local_shipping',
    permisoVer: 'ms-bienes:transferencias:view_transferencia',
    permisoCrear: 'ms-bienes:transferencias:add_transferencia',
    permisoEditar: 'ms-bienes:transferencias:change_transferencia'
  },
  { 
    id: 'ASIGNACION_INTERNA', 
    label: 'Asignaciones', 
    icon: 'person_add',
    permisoVer: 'ms-bienes:transferencias:view_transferenciadetalle',
    permisoCrear: 'ms-bienes:transferencias:add_transferenciadetalle',
    permisoEditar: 'ms-bienes:transferencias:change_transferenciadetalle'
  },
];

const FILTROS_INICIALES = { search: '', estado: '', misTransferencias: false };

export default function TransferenciasPage() {
    const toast = useToast();
    const { user } = useAuth();
    const { can } = usePermission();

    const tabsDisponibles = useMemo(() => 
        TABS_CONFIG.filter(tab => can(tab.permisoVer)), 
    [can]);

    const [activeTab, setActiveTab] = useState(() => tabsDisponibles[0]?.id || '');
    const [filtros, setFiltros] = useState(FILTROS_INICIALES);
    
    const [modalForm, setModalForm] = useState(false);
    const [modalDetalle, setModalDetalle] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    
    const [itemEditar, setItemEditar] = useState(null);
    const [itemDetalle, setItemDetalle] = useState(null);
    const [itemCancel, setItemCancel] = useState(null);

    const {
        transferencias, loading, error, actualizando, refetch, 
        descargarPDF, crearTraslado, crearAsignacion, aprobarAdminsede,
        devolver, aprobarSalidaSeguridad, aprobarEntradaSeguridad,
        retornoSalida, retornoEntrada, reenviarTransferencia, cancelar,subirFirmado
    } = useTransferencias(activeTab, { misTransferencias: filtros.misTransferencias, usuarioId: user?.id });

    const currentTabConfig = useMemo(() => 
        TABS_CONFIG.find(t => t.id === activeTab), 
    [activeTab]);

    const handleNuevo = () => { setItemEditar(null); setModalForm(true); };
    const handleEditar = (item) => { setItemEditar(item); setModalForm(true); setModalDetalle(false); };
    const handleVerDetalle = (item) => { setItemDetalle(item); setModalDetalle(true); };
    const handleCancelarClick = (item) => { setItemCancel(item); setConfirmCancel(true); };

    const onConfirmarCancelacion = async () => {
        try {
            const result = await cancelar(itemCancel.id, { motivo_cancelacion_id: 1, detalle_cancelacion: 'Cancelado desde panel' });
            toast.success(result?.message);
            setConfirmCancel(false);
            setItemCancel(null);
            refetch();
        } catch (e) {
            toast.error(e?.response?.data?.error || 'No se pudo cancelar');
        }
    };

    const handleDownload = async (id) => {
        try {
            await descargarPDF(id);
        } catch (e) {
            toast.error(e.response?.data?.error||'No se pudo generar el documento');
        }
    };

    return (
        <div className="p-4 max-w-[1600px] animate-in fade-in duration-500 pb-20">
            <div className="card p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Icon name="swap_horiz" className="text-[24px]" />
                        </div>
                        <div>
                            <h1 className="page-title">Gestión de Transferencias</h1>
                            <p className="page-subtitle">Traslados entre sedes y asignaciones internas de activos.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={refetch} disabled={loading}
                            className="btn-icon bg-surface border border-border" title="Sincronizar">
                            <Icon name="sync" className={`text-[18px] ${loading ? 'animate-spin text-primary' : 'text-faint'}`} />
                        </button>
                        
                        <Can perform={currentTabConfig?.permisoCrear}>
                            <button className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm"
                                onClick={handleNuevo} disabled={actualizando}>
                                <Icon name="add_circle" className="text-[18px]" />
                                <span className="font-black uppercase tracking-widest text-[10px]">
                                    {activeTab === 'TRASLADO_SEDE' ? 'Nuevo Traslado' : 'Nueva Asignación'}
                                </span>
                            </button>
                        </Can>
                    </div>
                </div>

                <div className="flex gap-6 mt-4 pt-3 border-t border-border">
                    {tabsDisponibles.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all border-b-2 ${
                                activeTab === tab.id ? 'text-primary border-primary' : 'text-faint border-transparent hover:text-main'
                            }`}>
                            <Icon name={tab.icon} className="text-[16px]" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="page-content mt-4 space-y-4">
                <TransferenciasStats data={transferencias} loading={loading} />
                <TransferenciasFiltros
                    filtros={filtros}
                    onFiltroChange={(k, v) => setFiltros(prev => ({ ...prev, [k]: v }))}
                    onLimpiar={() => setFiltros(FILTROS_INICIALES)}
                    activeTab={activeTab}
                />
                <TransferenciasTabla
                    items={transferencias}
                    filtros={filtros}
                    loading={loading}
                    error={error}
                    refetch={refetch}
                    activeTab={activeTab}
                    onVerDetalle={handleVerDetalle}
                    onEditar={handleEditar}
                    onCancelar={handleCancelarClick}
                    onDownload={handleDownload}
                />
            </div>

            {/* 3. Renderizado Condicional + Suspense para optimizar recursos */}
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
                        onGuardado={() => { setModalForm(false); setItemEditar(null); refetch(); }}
                    />
                )}

                {modalDetalle && (
                    <ModalDetalleTransferencia
                        open={modalDetalle}
                        onClose={() => setModalDetalle(false)}
                        item={itemDetalle}
                        actualizando={actualizando}
                        acciones={{ aprobarAdminsede, aprobarSalidaSeguridad, 
                            aprobarEntradaSeguridad, retornoSalida, retornoEntrada, 
                            devolver,descargarPDF,subirFirmado }}
                        onAccionExitosa={() => { setModalDetalle(false); refetch(); }}
                    />
                )}
            </Suspense>

            <ConfirmDialog
                open={confirmCancel}
                title="Cancelar Transferencia"
                message={`¿Cancelar la orden ${itemCancel?.numero_orden}?`}
                confirmLabel="Sí, cancelar"
                variant="danger"
                onConfirm={onConfirmarCancelacion}
                onClose={() => { setConfirmCancel(false); setItemCancel(null); }}
            />
        </div>
    );
}