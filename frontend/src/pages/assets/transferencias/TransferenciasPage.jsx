import { useState, useMemo } from 'react'; 
import { useTransferencias } from '../../../hooks/useTransferencias';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../../../hooks/useAuth';
import ConfirmDialog         from '../../../components/feedback/ConfirmDialog';
import TransferenciasStats from './components/TransferenciasStats';
import TransferenciasFiltros from './components/TransferenciasFiltros';
import TransferenciasTabla from './components/TransferenciasTabla';
import ModalDetalleTransferencia from './modals/ModalDetalleTransferencia';
import ModalTransferencia from './modals/ModalTransferencia';


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
    const [itemEditar, setItemEditar] = useState(null);
    const [itemDetalle, setItemDetalle] = useState(null);
    const [itemCancel, setItemCancel] = useState(null);
    const { 
        transferencias, loading, error, actualizando, refetch, 
        descargarPDF, crearTraslado, crearAsignacion, aprobarAdminSede, 
        devolverAprobacion, aprobarSalidaSeguridad, aprobarEntradaSeguridad,
        retornoSalida, retornoEntrada, reenviarTransferencia, cancelar,
    } = useTransferencias(activeTab, {misTransferencias: filtros.misTransferencias,usuarioId: user?.id}); 
    const rawData = { transferencias };
    const handleNuevo        = ()     => { setItemEditar(null); setModalForm(true); };
    const handleEditar       = (item) => { setItemEditar(item); setModalForm(true); setModalDetalle(false)};
    const handleVerDetalle   = (item) => { setItemDetalle(item); setModalDetalle(true); };
    const handleCancelarClick = (item) => {setItemCancel(item); setConfirmCancel(true);};
    const onConfirmarCancelacion = async () => {
        try {
        await cancelar(itemCancel.id, { motivo_cancelacion_id: 1, detalle_cancelacion: 'Cancelado desde panel' });
        toast.success('Transferencia cancelada correctamente');
        setConfirmCancel(false);
        setItemCancel(null);
        } catch (e) {
        toast.error(e?.response?.data?.error || 'No se pudo cancelar');
        }
    };
    const handleDownload = async (id) => {
        try {
        await descargarPDF(id);
        toast.info('Generando documento...');
        } catch (e) {
            console.log(e)
        toast.error('Error al descargar el PDF');
        }
    }; 
  return (
    <div className="page-wrapper">
      
      <div className="page-header">
        <div className="page-header-top">
          <div>            
            <h1 className="page-title">Gestión de Transferencias</h1>
            <p className="page-subtitle">
              Administre las sedes institucionales, módulos y ubicaciones físicas del Poder Judicial.
            </p>
          </div>

        <div className="flex items-center gap-1">
          <button 
            className="btn-primary " 
            onClick={handleNuevo} disabled={actualizando}
          >
            <Icon name="add" className="text-[18px]" />
            Nueva {activeTab === 'TRASLADO_SEDE' ? 'Transferencia' : 'Asignación'}
          </button>
        </div>
        </div>

        <div className="tab-bar">             
          {TABS.map(tab => {
            const active =tab.id;
            const count  = (rawData[active] ?? []).length;
            return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(active)}
                className={active ? 'tab-btn-active' : 'tab-btn-inactive'}
            >
              <Icon name={tab.icon} className="text-[18px]" />
              {tab.label}
              <span className={active ? 'tab-count-active' : 'tab-count-inactive'}>
                  {count}
                </span>
            </button>
            );
            })}
        </div>
      </div>

      {/* STATS - Mantiene el ancho total */}
      <div className="page-content">
      <TransferenciasStats data={transferencias} loading={loading} />
      {/* SECCIÓN DE FILTROS Y TABLA */}      
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
        {/* ── Modales ────────────────────────────────────────────────────────── */}
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
    </div>
  );
}