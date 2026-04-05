import { useState, lazy, Suspense } from 'react';
import { useMantenimientos } from '../../../hooks/useMantenimientos';
import { useLocaciones }     from '../../../hooks/useLocaciones';
import MantenimientosStats   from './components/MantenimientosStats';
import MantenimientosFiltros from './components/MantenimientosFiltros';
import MantenimientosTabla   from './components/MantenimientosTabla';

const ModalCrearMantenimiento      = lazy(() => import('./modals/ModalCrearMantenimiento'));
const ModalDetalleMantenimiento    = lazy(() => import('./modals/ModalDetalleMantenimiento'));
const ModalEnviarAprobacion        = lazy(() => import('./modals/ModalEnviarAprobacion'));
const ModalAprobacionMantenimiento = lazy(() => import('./modals/ModalAprobacionMantenimiento'));
const ModalCancelarMantenimiento   = lazy(() => import('./modals/ModalCancelarMantenimiento'));

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const FILTROS_INICIALES = { estado: '', sede_id: '', search: '', misMantenimientos: false };

export default function MantenimientosPage() {
  const { sedes }  = useLocaciones();
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const {
    mantenimientos,
    loading,
    actualizandoMant,
    refetchMant,
    aplicarFiltros,
    enviarAprobacion,
    aprobarMant,
    devolverMant,
    cancelarMant,
    descargarPDFMant,
    subirFirmadoMant,
    subirImagenMant,
    crearMant,
  } = useMantenimientos(filtros);

  // ── Estado de modales ──────────────────────────────────────────────────────
  const [itemEditar,   setItemEditar]   = useState(null);
  const [itemActivo,   setItemActivo]   = useState(null);
  const [itemCancelar, setItemCancelar] = useState(null);

  const [modalCrear,      setModalCrear]      = useState(false);
  const [modalDetalle,    setModalDetalle]    = useState(false);
  const [modalEnviar,     setModalEnviar]     = useState(false);
  const [modalAprobacion, setModalAprobacion] = useState(false);
  const [modalCancelar,   setModalCancelar]   = useState(false);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const onFiltroChange = (key, val) => {
    const next = { ...filtros, [key]: val };
    setFiltros(next);
    aplicarFiltros(next);
  };

  const onLimpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    aplicarFiltros(FILTROS_INICIALES);
  };

  // ── Navegación entre modales ───────────────────────────────────────────────
  const handleNuevo      = ()     => { setItemEditar(null); setModalCrear(true); };
  const handleEditar     = item   => { setItemEditar(item); setModalCrear(true); setModalDetalle(false); };
  const handleVerDetalle = item   => { setItemActivo(item); setModalDetalle(true); };

  const handleAbrirEnviar = item => {
    setItemActivo(item);
    setModalDetalle(false);
    setModalEnviar(true);
  };
  const handleAbrirAprobacion = item => {
    setItemActivo(item);
    setModalDetalle(false);
    setModalAprobacion(true);
  };
  const handleAbrirCancelar = item => {
    setItemCancelar(item);
    setModalDetalle(false);
    setModalCancelar(true);
  };

  const acciones = {
    enviarAprobacion,
    aprobarMant,
    devolverMant,
    cancelarMant,
    descargarPDFMant,
    subirFirmadoMant,
    subirImagenMant,
    crearMant,
  };

  // ── Navegación de modales agrupada ────────────────────────────────────────
  const navegacion = {
    abrirEnviar:     handleAbrirEnviar,
    abrirAprobacion: handleAbrirAprobacion,
    abrirCancelar:   handleAbrirCancelar,
    abrirEditar:     handleEditar,
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
            <button
              className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm"
              onClick={handleNuevo}
              disabled={actualizandoMant}
            >
              <Icon name="add_circle" className="text-[18px]" />
              <span className="font-black uppercase tracking-widest text-[10px]">Nuevo Mantenimiento</span>
            </button>
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
          acciones={acciones}
          navegacion={navegacion}
        />
      </div>

      {/* ── Modales ── */}
      <Suspense fallback={null}>

        {modalCrear && (
          <ModalCrearMantenimiento
            open={modalCrear}
            onClose={() => { setModalCrear(false); setItemEditar(null); }}
            item={itemEditar}
            onGuardado={() => { setModalCrear(false); refetchMant(); }}
          />
        )}

        {modalDetalle && (
          <ModalDetalleMantenimiento
            open={modalDetalle}
            onClose={() => { setModalDetalle(false); setItemActivo(null); }}
            item={itemActivo}
            actualizando={actualizandoMant}
            acciones={acciones}
            navegacion={navegacion}
          />
        )}

        {modalEnviar && (
          <ModalEnviarAprobacion
            open={modalEnviar}
            onClose={() => { setModalEnviar(false); setItemActivo(null); }}
            item={itemActivo}
            acciones={acciones}
            onGuardado={() => { setModalEnviar(false); refetchMant(); }}
          />
        )}

        {modalAprobacion && (
          <ModalAprobacionMantenimiento
            open={modalAprobacion}
            onClose={() => { setModalAprobacion(false); setItemActivo(null); }}
            item={itemActivo}
            actualizando={actualizandoMant}
            acciones={acciones}
            onGuardado={() => { setModalAprobacion(false); refetchMant(); }}
          />
        )}

        {modalCancelar && (
          <ModalCancelarMantenimiento
            open={modalCancelar}
            onClose={() => { setModalCancelar(false); setItemCancelar(null); }}
            item={itemCancelar}
            actualizando={actualizandoMant}
            acciones={acciones}
            onGuardado={() => { setModalCancelar(false); refetchMant(); }}
          />
        )}

      </Suspense>
    </div>
  );
}