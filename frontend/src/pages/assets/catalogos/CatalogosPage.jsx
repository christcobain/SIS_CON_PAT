import { useState, useEffect, useMemo } from 'react';
import { useCatalogos }    from '../../../hooks/useCatalogos';
import { useToast }        from '../../../hooks/useToast';
import ConfirmDialog       from '../../../components/feedback/ConfirmDialog';
import CatalogosStats      from './components/CatalogosStats';
import CatalogosFiltros    from './components/CatalogosFiltros';
import CatalogosTabla      from './components/CatalogosTabla';
import ModalCatalogo       from './modals/ModalCatalogo';
import { CATALOGOS_META, GRUPOS, getCatalogosPorGrupo } from './catalogosMeta';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const FILTROS_INICIALES = { search: '', is_active: '' };

// ── Selector lateral de catálogos ─────────────────────────────────────────────
// Muestra todos los 18 catálogos agrupados, con badge de total de registros
function CatalogoSelector({ catalogoActivo, onSeleccionar, conteos, loading }) {
  return (
    <div className="flex flex-col h-full"
         style={{ borderRight: '1px solid var(--color-border-light)' }}>
      <div className="px-4 py-3 shrink-0"
           style={{ borderBottom: '1px solid var(--color-border-light)' }}>
        <p className="text-[9px] font-black uppercase tracking-widest"
           style={{ color: 'var(--color-text-muted)' }}>
          Catálogos ({CATALOGOS_META.length})
        </p>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {GRUPOS.map((grupo) => {
          const items = getCatalogosPorGrupo(grupo.id);
          return (
            <div key={grupo.id}>
              {/* Cabecera del grupo */}
              <div className="flex items-center gap-2 px-4 py-2 mt-1">
                <Icon name={grupo.icon} className="text-[13px]"
                      style={{ color: 'var(--color-text-faint)' }} />
                <span className="text-[9px] font-black uppercase tracking-widest"
                      style={{ color: 'var(--color-text-faint)' }}>
                  {grupo.label}
                </span>
              </div>
              {/* Items del grupo */}
              {items.map((cat) => {
                const activo = catalogoActivo?.key === cat.key;
                const total  = conteos[cat.key] ?? null;
                return (
                  <button
                    key={cat.key}
                    onClick={() => onSeleccionar(cat)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2 text-left transition-all"
                    style={{
                      background: activo ? 'rgba(127,29,29,0.08)' : 'transparent',
                      borderLeft: activo ? '2px solid var(--color-primary)' : '2px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!activo) e.currentTarget.style.background = 'var(--color-surface-alt)';
                    }}
                    onMouseLeave={(e) => {
                      if (!activo) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon name={cat.icon}
                            className="text-[15px] shrink-0"
                            style={{ color: activo ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                      <span className="text-xs truncate font-semibold"
                            style={{ color: activo ? 'var(--color-primary)' : 'var(--color-text-body)' }}>
                        {cat.label}
                      </span>
                    </div>
                    {total !== null && (
                      <span className="text-[9px] font-black shrink-0 px-1.5 py-0.5 rounded-full"
                            style={{
                              background: activo ? 'rgba(127,29,29,0.12)' : 'var(--color-border-light)',
                              color:      activo ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            }}>
                        {loading ? '…' : total}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function CatalogosPage() {
  const toast = useToast();

  // Hook de catálogos — carga solo el catálogo activo cuando cambia
  const {
    loading,
    error,
    actualizando,
    fetchCatalogos,
    activarItem,
    desactivarItem,
    ...catalogoData
  } = useCatalogos();

  // ── Catálogo activo — por defecto el primero ──────────────────────────────
  const [catalogoActivo, setCatalogoActivo] = useState(CATALOGOS_META[0]);
  const [filtros,        setFiltros]        = useState(FILTROS_INICIALES);

  // Conteo de registros por catálogo (para el selector lateral)
  // Solo cargamos el catálogo seleccionado; los demás muestran null hasta que se visiten
  const [conteos, setConteos] = useState({});

  // Carga el catálogo activo al cambiar la selección
  useEffect(() => {
    if (!catalogoActivo?.key) return;
    fetchCatalogos([catalogoActivo.key]);
  }, [catalogoActivo?.key]);

  // Actualiza el conteo del catálogo activo cuando cambian los datos
  const itemsActivos = catalogoData[catalogoActivo?.key] ?? [];
  useEffect(() => {
    if (!catalogoActivo?.key || loading) return;
    setConteos((prev) => ({ ...prev, [catalogoActivo.key]: itemsActivos.length }));
  }, [catalogoActivo?.key, itemsActivos.length, loading]);

  // ── Filtrado cliente-side ─────────────────────────────────────────────────
  const itemsFiltrados = useMemo(() => {
    const txt = filtros.search.toLowerCase().trim();
    return itemsActivos.filter((item) => {
      const matchSearch = !txt ||
        item.nombre?.toLowerCase().includes(txt) ||
        item.descripcion?.toLowerCase().includes(txt);
      const matchEstado = filtros.is_active === '' ||
        String(item.is_active) === filtros.is_active;
      return matchSearch && matchEstado;
    });
  }, [itemsActivos, filtros]);

  const onFiltroChange   = (key, val) => setFiltros((prev) => ({ ...prev, [key]: val }));
  const onLimpiarFiltros = () => setFiltros(FILTROS_INICIALES);

  const handleSeleccionarCatalogo = (cat) => {
    setCatalogoActivo(cat);
    onLimpiarFiltros();
  };

  // ── Modales ───────────────────────────────────────────────────────────────
  const [modalForm,     setModalForm]     = useState(false);
  const [itemEditar,    setItemEditar]    = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [itemToggle,    setItemToggle]    = useState(null);

  const handleNuevo  = ()     => { setItemEditar(null); setModalForm(true); };
  const handleEditar = (item) => { setItemEditar(item); setModalForm(true); };
  const handleToggle = (item) => { setItemToggle(item); setConfirmToggle(true); };

  const handleConfirmToggle = async () => {
    setConfirmToggle(false);
    if (!itemToggle || !catalogoActivo?.key) return;
    try {
      const res = itemToggle.is_active
        ? await desactivarItem(catalogoActivo.key, itemToggle.id)
        : await activarItem(catalogoActivo.key, itemToggle.id);
      toast.success(
        res?.message
          ?? `"${itemToggle.nombre}" ${itemToggle.is_active ? 'desactivado' : 'activado'}.`
      );
    } catch (e) {
      toast.error(e?.response?.data?.error ?? 'Error al cambiar el estado.');
    } finally {
      setItemToggle(null);
    }
  };

  const handleGuardado = () => {
    setModalForm(false);
    setItemEditar(null);
  };

  return (
    <div className="page-wrapper">

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Catálogos</h1>
            <p className="page-subtitle">
              Gestión de catálogos del sistema patrimonial — {CATALOGOS_META.length} catálogos disponibles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchCatalogos([catalogoActivo?.key])}
              title="Recargar"
              className="btn-icon"
              disabled={loading}>
              <Icon name="refresh" className={`text-[18px] ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleNuevo}
              disabled={actualizando}
              className="btn-primary">
              <Icon name="add" className="text-[18px]" />
              Nuevo registro
            </button>
          </div>
        </div>

        {/* Breadcrumb del catálogo activo */}
        {catalogoActivo && (
          <div className="flex items-center gap-2 pt-1">
            <Icon name="dataset" className="text-[15px]"
                  style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Catálogo seleccionado:
            </span>
            <div className="flex items-center gap-1.5">
              <Icon name={catalogoActivo.icon} className="text-[14px] text-primary" />
              <span className="text-xs font-black"
                    style={{ color: 'var(--color-text-primary)' }}>
                {catalogoActivo.label}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
              {loading ? '…' : `${itemsActivos.length} registros`}
            </span>
          </div>
        )}
      </div>

      {/* ── Contenido: layout de 2 paneles ────────────────────────────────── */}
      <div className="page-content">

        {/* KPIs del catálogo activo */}
        <CatalogosStats items={itemsActivos} loading={loading} />

        {/* Panel principal con selector lateral + tabla */}
        <div className="card overflow-hidden flex"
             style={{ minHeight: 520 }}>

          {/* Sidebar selector — ancho fijo */}
          <div className="shrink-0" style={{ width: '240px' }}>
            <CatalogoSelector
              catalogoActivo={catalogoActivo}
              onSeleccionar={handleSeleccionarCatalogo}
              conteos={conteos}
              loading={loading}
            />
          </div>

          {/* Panel derecho: filtros + tabla */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Cabecera del panel derecho */}
            <div className="flex items-center justify-between gap-4 px-5 py-3 shrink-0"
                 style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <div className="flex items-center gap-2 min-w-0">
                {catalogoActivo && (
                  <>
                    <div className="size-7 rounded-lg flex items-center justify-center shrink-0"
                         style={{ background: 'rgba(127,29,29,0.08)' }}>
                      <Icon name={catalogoActivo.icon} className="text-[14px] text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate"
                         style={{ color: 'var(--color-text-primary)' }}>
                        {catalogoActivo.label}
                      </p>
                      {catalogoActivo.descripcion && (
                        <p className="text-[10px] truncate"
                           style={{ color: 'var(--color-text-muted)' }}>
                          {catalogoActivo.descripcion}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Filtros */}
            <div className="px-5 py-3 shrink-0"
                 style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <CatalogosFiltros
                filtros={filtros}
                onFiltroChange={onFiltroChange}
                onLimpiar={onLimpiarFiltros}
              />
            </div>

            {/* Tabla */}
            <div className="flex-1 overflow-auto">
              <CatalogosTabla
                items={itemsFiltrados}
                loading={loading}
                error={error}
                refetch={() => fetchCatalogos([catalogoActivo?.key])}
                catalogoMeta={catalogoActivo}
                onEditar={handleEditar}
                onToggleEstado={handleToggle}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Modales ────────────────────────────────────────────────────────── */}
      <ModalCatalogo
        open={modalForm}
        onClose={() => { setModalForm(false); setItemEditar(null); }}
        item={itemEditar}
        catalogoKey={catalogoActivo?.key}
        catalogoMeta={catalogoActivo}
        onGuardado={handleGuardado}
      />

      <ConfirmDialog
        open={confirmToggle}
        title={itemToggle?.is_active ? 'Desactivar registro' : 'Activar registro'}
        message={
          itemToggle?.is_active
            ? `¿Desactivar "${itemToggle?.nombre}"? Dejará de estar disponible en el sistema.`
            : `¿Activar "${itemToggle?.nombre}"? Estará disponible nuevamente.`
        }
        confirmLabel={itemToggle?.is_active ? 'Sí, desactivar' : 'Sí, activar'}
        variant={itemToggle?.is_active ? 'danger' : 'primary'}
        loading={actualizando}
        onConfirm={handleConfirmToggle}
        onClose={() => { setConfirmToggle(false); setItemToggle(null); }}
      />
    </div>
  );
}