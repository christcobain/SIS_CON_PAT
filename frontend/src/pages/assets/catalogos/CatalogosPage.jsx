import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useCatalogos }    from '../../../hooks/useCatalogos';
import { useToast }        from '../../../hooks/useToast';
import ConfirmDialog       from '../../../components/feedback/ConfirmDialog';
import CatalogosStats      from './components/CatalogosStats';
import CatalogosFiltros     from './components/CatalogosFiltros';
import CatalogosTabla      from './components/CatalogosTabla';
import { CATALOGOS_META, GRUPOS, getCatalogosPorGrupo } from './catalogosMeta';

const ModalCatalogo = lazy(() => import('./modals/ModalCatalogo'));

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const FILTROS_INICIALES = { search: '', is_active: '' };

function CatalogoSelector({ catalogoActivo, onSeleccionar, conteos, loading }) {
  return (
    <aside className="flex flex-col h-full bg-surface border-r border-border min-h-[600px]">
      <div className="p-4 border-b border-border bg-surface-alt/10">
        <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-faint flex items-center gap-2">
          <Icon name="database" className="text-[14px]" />
          Diccionario de Datos
        </h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
        {GRUPOS.map((grupo) => {
          const items = getCatalogosPorGrupo(grupo.id);
          return (
            <div key={grupo.id} className="mb-4">
              <div className="flex items-center gap-2 px-3 py-2 opacity-50">
                <Icon name={grupo.icon} className="text-[14px]" />
                <span className="text-[9px] font-bold uppercase tracking-widest">{grupo.label}</span>
              </div>
              
              <div className="flex flex-col gap-0.5">
                {items.map((cat) => {
                  const activo = catalogoActivo?.key === cat.key;
                  const total  = conteos[cat.key] ?? 0;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => onSeleccionar(cat)}
                      className={`
                        w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all
                        ${activo 
                          ? 'bg-primary text-white shadow-lg shadow-primary/25 translate-x-1' 
                          : 'hover:bg-primary/5 text-body font-semibold active:scale-95'}
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon name={cat.icon} className={`text-[18px] ${activo ? 'text-white' : 'text-primary'}`} />
                        <span className="text-xs truncate">{cat.label}</span>
                      </div>
                      <span className={`
                        text-[9px] font-black px-1.5 py-0.5 rounded-lg
                        ${activo ? 'bg-white/20 text-white' : 'bg-surface-alt text-muted border border-border'}
                      `}>
                        {loading && activo ? '...' : total}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export default function CatalogosPage() {
  const toast = useToast();
  
  const [catalogoActivo, setCatalogoActivo] = useState(CATALOGOS_META[0]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [conteos, setConteos] = useState({});

  const {
    loading,
    error,
    actualizando,
    fetchCatalogos,
    activarItem,
    desactivarItem,
    ...catalogoData
  } = useCatalogos();

  useEffect(() => {
    if (catalogoActivo?.key) {
      fetchCatalogos([catalogoActivo.key]);
    }
  }, [catalogoActivo?.key]);

  const itemsActivos = useMemo(() => catalogoData[catalogoActivo?.key] ?? [], [catalogoData, catalogoActivo?.key]);
  
  useEffect(() => {
    if (catalogoActivo?.key && !loading) {
      setConteos(prev => ({ ...prev, [catalogoActivo.key]: itemsActivos.length }));
    }
  }, [itemsActivos.length, loading, catalogoActivo?.key]);

  const onFiltroChange = useCallback((key, val) => {
    setFiltros(prev => ({ ...prev, [key]: val }));
  }, []);

  const onLimpiarFiltros = useCallback(() => {
    setFiltros(FILTROS_INICIALES);
  }, []);

  const itemsFiltrados = useMemo(() => {
    const txt = filtros.search.toLowerCase().trim();
    return itemsActivos.filter((item) => {
      const matchSearch = !txt || 
        item.nombre?.toLowerCase().includes(txt) || 
        item.descripcion?.toLowerCase().includes(txt);
      const matchEstado = filtros.is_active === '' || String(item.is_active) === filtros.is_active;
      return matchSearch && matchEstado;
    });
  }, [itemsActivos, filtros]);

  const [modalForm, setModalForm] = useState(false);
  const [itemEditar, setItemEditar] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [itemToggle, setItemToggle] = useState(null);

  const handleNuevo  = () => { setItemEditar(null); setModalForm(true); };
  const handleEditar = (item) => { setItemEditar(item); setModalForm(true); };
  const handleToggle = (item) => { setItemToggle(item); setConfirmToggle(true); };

  const handleConfirmToggle = async () => {
    setConfirmToggle(false);
    try {
      const res = itemToggle.is_active 
        ? await desactivarItem(catalogoActivo.key, itemToggle.id)
        : await activarItem(catalogoActivo.key, itemToggle.id);
      toast.success(res?.message || 'Estado actualizado correctamente');
    } catch (e) {
      toast.error('No se pudo actualizar el estado del registro');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-[1600px] mx-auto animate-in fade-in duration-500 h-auto pb-20">
      
      <header className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon name="settings_suggest" className="text-[26px]" />
            </div>
            <div>
              <h1 className="page-title">Mantenimiento de Catálogos</h1>
              <p className="page-subtitle">Gestión de parámetros globales y tablas maestras del sistema.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => fetchCatalogos([catalogoActivo?.key])} className="btn-icon bg-surface border border-border" disabled={loading}>
              <Icon name="refresh" className={loading ? 'animate-spin text-primary' : 'text-faint'} />
            </button>
            <button onClick={handleNuevo} disabled={actualizando} className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm shadow-primary/20">
              <Icon name="add_circle" className="text-[18px]" />
              <span className="font-black uppercase tracking-widest text-[10px]">Nuevo Registro</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-6">
        
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="card !p-0 overflow-hidden sticky top-4 border border-border shadow-sm">
            <CatalogoSelector 
              catalogoActivo={catalogoActivo} 
              onSeleccionar={(cat) => { setCatalogoActivo(cat); onLimpiarFiltros(); }} 
              conteos={conteos} 
              loading={loading} 
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6 min-w-0">
          
          <CatalogosStats items={itemsActivos} loading={loading} />

          <div className="card p-4 bg-surface-alt/10 border border-border shadow-sm">
            <CatalogosFiltros 
              filtros={filtros} 
              onFiltroChange={onFiltroChange} 
              onLimpiar={onLimpiarFiltros} 
            />
          </div>

          <div className="card !p-0 border border-border shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 py-4 bg-surface border-b border-border flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center">
                    <Icon name={catalogoActivo.icon} className="text-[18px]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-main leading-none">{catalogoActivo.label}</h2>
                    <p className="text-[10px] text-muted font-medium mt-1 uppercase">{catalogoActivo.descripcion || 'Gestión de registros'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-md uppercase tracking-tighter">
                   {itemsFiltrados.length} Items encontrados
                 </span>
               </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
              <CatalogosTabla 
                items={itemsFiltrados} 
                loading={loading} 
                catalogoMeta={catalogoActivo} 
                onEditar={handleEditar} 
                onToggleEstado={handleToggle} 
              />
            </div>
          </div>
        </div>
      </main>

      <Suspense fallback={null}>
        {modalForm && (
          <ModalCatalogo 
            open={modalForm} 
            onClose={() => setModalForm(false)} 
            item={itemEditar} 
            catalogoKey={catalogoActivo?.key} 
            catalogoMeta={catalogoActivo} 
            onGuardado={() => { setModalForm(false); fetchCatalogos([catalogoActivo.key]); }} 
          />
        )}
      </Suspense>
      
      <ConfirmDialog 
        open={confirmToggle} 
        title={itemToggle?.is_active ? 'Desactivar Registro' : 'Activar Registro'} 
        message={`¿Está seguro de cambiar el estado de "${itemToggle?.nombre}"?`} 
        confirmLabel="Confirmar Cambios" 
        variant={itemToggle?.is_active ? 'danger' : 'primary'} 
        loading={actualizando} 
        onConfirm={handleConfirmToggle} 
        onClose={() => setConfirmToggle(false)} 
      />
    </div>
  );
}