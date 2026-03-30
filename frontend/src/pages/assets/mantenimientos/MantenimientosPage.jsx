import { useState, lazy, Suspense } from 'react';
import { useMantenimientos } from '../../../hooks/useMantenimientos';
import { useLocaciones } from '../../../hooks/useLocaciones';
import { useToast } from '../../../hooks/useToast';
import { usePermission } from '../../../hooks/usePermission';
import MantenimientosStats from './components/MantenimientosStats';
import MantenimientosFiltros from './components/MantenimientosFiltros';
import MantenimientosTabla from './components/MantenimientosTabla';
import Can from '../../../components/auth/Can';

const ModalCrearMantenimiento     = lazy(() => import('./modals/ModalCrearMantenimiento'));
const ModalDetalleMantenimiento   = lazy(() => import('./modals/ModalDetalleMantenimiento'));
const ModalEnviarAprobacion       = lazy(() => import('./modals/ModalEnviarAprobacion'));
const ModalAprobacionMantenimiento = lazy(() => import('./modals/ModalAprobacionMantenimiento'));
const ModalCancelarMantenimiento  = lazy(() => import('./modals/ModalCancelarMantenimiento'));

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);
const FILTROS_INICIALES = { estado: '', sede_id: '', search: '', misMantenimientos: false };

export default function MantenimientosPage() {
  const toast    = useToast();
  const { sedes } = useLocaciones();
  const { can }  = usePermission();
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const {
    mantenimientos,
    loading,
    actualizandoMant,
    refetchMant,         
    aplicarFiltros,
    enviarAprobacion,
    aprobar,
    devolver,
    cancelar,
    descargarPDF
  } = useMantenimientos(filtros);
  const [itemEditar, setItemEditar] = useState(null);

  const [modalCrear,      setModalCrear]      = useState(false);
  const [modalDetalle,    setModalDetalle]    = useState(false);
  const [modalEnviar,     setModalEnviar]     = useState(false);
  const [modalAprobacion, setModalAprobacion] = useState(false);
  const [modalCancelar,   setModalCancelar]   = useState(false);  
  const [modoAprobacion,  setModoAprobacion]  = useState('aprobar');
  const [itemActivo,      setItemActivo]      = useState(null);
  const [itemCancelar,    setItemCancelar]    = useState(null);

  // ── Filtros ───────────────────────────────────────────────────────────────
  const onFiltroChange = (key, val) => {
    const next = { ...filtros, [key]: val };
    setFiltros(next);
    aplicarFiltros(next);
  };

  const onLimpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    aplicarFiltros(FILTROS_INICIALES);
  };

  // ── Handlers de navegación entre modales ──────────────────────────────────
  const handleVerDetalle = item => { setItemActivo(item); setModalDetalle(true); };
  const handleEditar = (item) => { setItemEditar(item); setModalCrear(true); setModalDetalle(false); };

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

  // ── Cancelar: abre el nuevo modal con selección de motivo ─────────────────
  const handleCancelar = item => {
    setItemCancelar(item);
    setModalDetalle(false);   
    setModalCancelar(true);
  };

  const handleAccionExitosa = (res) => {
    setModalAprobacion(false);
    setModalEnviar(false);
    setModalDetalle(false);
    setModalCancelar(false);
    setItemActivo(null);
    setItemCancelar(null);
    toast.success(res?.message || 'Operación realizada con éxito');
    refetchMant();
  };

  return (
    <div className="p-4 max-w-[1600px] animate-in fade-in duration-500 pb-20 space-y-5">

      {/* ── Cabecera ── */}
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
            <button
              onClick={refetchMant}
              disabled={loading}
              className="size-9 flex items-center justify-center rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <Icon name="refresh" className={`text-[20px] ${loading ? 'animate-spin text-primary' : 'text-faint'}`} />
            </button>

            <Can perform="ms-bienes:mantenimientos:add_mantenimiento">
              <button
                onClick={() => setModalCrear(true)}
                className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm"
              >
                <Icon name="add_circle" className="text-[18px]" />
                <span className="font-black uppercase tracking-widest text-[10px]">Nueva orden</span>
              </button>
            </Can>
          </div>
        </div>
      </div>

      {/* ── Contenido principal ── */}
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
          onEditar={handleEditar}
          onDescargarPDF={descargarPDF}
        />
      </div>

      {/* ── Modales ── */}
      <Suspense fallback={null}>

        {/* Crear */}
        {modalCrear && (
          <ModalCrearMantenimiento
            open={modalCrear}
            onClose={() => setModalCrear(false)}
            item={itemEditar}
            onGuardado={() => {
              setModalCrear(false);
              refetchMant();
            }}            
          />
        )}

        {/* Detalle */}
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
            refetchMant={refetchMant}
            puedeAccionesTecnicas={can('ms-bienes:mantenimientos:add_mantenimiento')}
            puedeAccionesAdmin={can('ms-bienes:mantenimientos:change_mantenimiento')}
          />
        )}

        {/* Enviar a aprobación */}
        {modalEnviar && (
          <ModalEnviarAprobacion
            open={modalEnviar}
            onClose={() => { setModalEnviar(false); setItemActivo(null); }}
            item={itemActivo}
            onEnviar={async (id, data) => {
              const res = await enviarAprobacion(id, data)
              handleAccionExitosa(res);
            }}
          />
        )}

        {modalAprobacion && (
          <ModalAprobacionMantenimiento
            open={modalAprobacion}
            onClose={() => { setModalAprobacion(false); setItemActivo(null); }}
            item={itemActivo}
            modo={modoAprobacion}
            onAprobar={async (id, obs) => { 
                const res = await aprobar(id, obs); 
                handleAccionExitosa(res); 
            }}
            onDevolver={async (id, motivo) => { 
                const res = await devolver(id, motivo); 
                handleAccionExitosa(res); 
            }}
          />
        )}

        {modalCancelar && (
          <ModalCancelarMantenimiento
            open={modalCancelar}
            onClose={() => { setModalCancelar(false); setItemCancelar(null); }}
            item={itemCancelar}
            onCancelar={async (id, payload) => {
              const res = await cancelar(id, payload);
              handleAccionExitosa(res); 
            }}
            actualizando={actualizandoMant}
          />
        )}
      </Suspense>
    </div>
  );
}