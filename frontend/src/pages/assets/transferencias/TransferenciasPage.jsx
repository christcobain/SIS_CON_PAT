import { useState, useMemo } from 'react'; 
import { useTransferencias } from '../../../hooks/useTransferencias';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../../../hooks/useAuth';
import ConfirmDialog         from '../../../components/feedback/ConfirmDialog';
import TransferenciasStats   from './components/TransferenciasStats';
import TransferenciasFiltros from './components/TransferenciasFiltros';
import TransferenciasTabla   from './components/TransferenciasTabla';
import ModalDetalleTransferencia from './modals/ModalDetalleTransferencia';
import ModalTransferencia        from './modals/ModalTransferencia';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const TABS = [
  { id: 'TRASLADO_SEDE',      label: 'Traslados Sedes', icon: 'local_shipping' },
  { id: 'ASIGNACION_INTERNA', label: 'Asignaciones',    icon: 'person_add' },
];

const FILTROS_INICIALES = { search: '', estado: '', misTransferencias: false };

export default function TransferenciasPage() {
    const toast = useToast(); 
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('TRASLADO_SEDE');
    const [filtros, setFiltros] = useState(FILTROS_INICIALES);
    
    const [modalForm,     setModalForm]     = useState(false);
    const [modalDetalle,  setModalDetalle]  = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [itemEditar, setItemEditar]   = useState(null);
    const [itemDetalle, setItemDetalle] = useState(null);
    const [itemCancel, setItemCancel]   = useState(null);

    const { 
        transferencias, loading, error, actualizando, refetch, 
        descargarPDF, crearTraslado, crearAsignacion, aprobarAdminSede, 
        devolverAprobacion, aprobarSalidaSeguridad, aprobarEntradaSeguridad,
        retornoSalida, retornoEntrada, reenviarTransferencia, cancelar,
    } = useTransferencias(activeTab, {
        misTransferencias: filtros.misTransferencias,
        usuarioId: user?.id
    }); 

    const handleNuevo         = ()     => { setItemEditar(null); setModalForm(true); };
    const handleEditar        = (item) => { setItemEditar(item); setModalForm(true); setModalDetalle(false)};
    const handleVerDetalle    = (item) => { setItemDetalle(item); setModalDetalle(true); };
    const handleCancelarClick = (item) => { setItemCancel(item); setConfirmCancel(true); };

    const onConfirmarCancelacion = async () => {
        try {
            await cancelar(itemCancel.id, { motivo_cancelacion_id: 1, detalle_cancelacion: 'Cancelado desde panel' });
            toast.success('Transferencia cancelada correctamente');
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
            toast.info('Generando documento...');
        } catch (e) {
            toast.error('Error al descargar el PDF');
        }
    }; 

    return (
    <div className="gap-1 p-4 max-w-[1600px] animate-in fade-in duration-500 h-auto pb-20">
            
            {/* ── CABECERA Y TABS (Siguiendo patrón Bienes) ──────────────── */}
            <div className="card p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Icon name="swap_horiz" className="text-[24px]" />
                        </div>
                        <div>
                            <h1 className="page-title">Gestión de Transferencias</h1>
                            <p className="page-subtitle">
                                Administre los traslados entre sedes y las asignaciones internas de activos.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={refetch} 
                            disabled={loading}
                            className="btn-icon bg-surface border border-border"
                            title="Sincronizar"
                        >
                            <Icon name="sync" className={`text-[18px] ${loading ? 'animate-spin text-primary' : 'text-faint'}`} />
                        </button>

                        <button 
                            className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm" 
                            onClick={handleNuevo} 
                            disabled={actualizando}
                        >
                            <Icon name="add_circle" className="text-[18px]" />
                            <span className="font-black uppercase tracking-widest text-[10px]">
                                Nueva {activeTab === 'TRASLADO_SEDE' ? 'Transferencia' : 'Asignación'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="flex gap-6 mt-4 border-t border-border pt-3">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${
                                activeTab === tab.id 
                                ? 'text-primary border-b-2 border-primary' 
                                : 'text-faint hover:text-main'
                            }`}
                        >
                            <Icon name={tab.icon} className="text-[16px]" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── CONTENIDO ──────────────────────────────────────────────── */}
            <div className="page-content">
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

            {/* ── MODALES ────────────────────────────────────────────────── */}
            <ModalTransferencia
                open={modalForm}
                onClose={() => { setModalForm(false); setItemEditar(null); }}
                item={itemEditar}
                activeTab={activeTab}
                actualizando={actualizando}
                crearTraslado={crearTraslado}
                crearAsignacion={crearAsignacion}
                reenviarTransferencia={reenviarTransferencia}
                onGuardado={() => { 
                    setModalForm(false); 
                    setItemEditar(null); 
                    toast.success(itemEditar ? 'Actualizado correctamente' : 'Registrado correctamente');
                    refetch();
                }}
            />

            <ModalDetalleTransferencia
                open={modalDetalle}
                onClose={() => setModalDetalle(false)}
                item={itemDetalle}
                actualizando={actualizando}
                acciones={{
                    aprobarAdminSede,
                    aprobarSalidaSeguridad,
                    aprobarEntradaSeguridad,
                    retornoSalida,
                    retornoEntrada,
                    devolverAprobacion
                }}
                onAccionExitosa={() => {
                    setModalDetalle(false);
                    toast.success('Proceso actualizado');
                    refetch();
                }}
            />

            <ConfirmDialog
                open={confirmCancel}
                title="Cancelar Transferencia"
                message={`¿Está seguro de cancelar la orden ${itemCancel?.numero_orden}? Esta acción no se puede deshacer.`}
                confirmLabel="Sí, cancelar orden"
                variant="danger"
                loading={actualizando}
                onConfirm={onConfirmarCancelacion}
                onClose={() => { setConfirmCancel(false); setItemCancel(null); }}
            />
        </div>
    );
}