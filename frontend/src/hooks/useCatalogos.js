import { useState, useCallback } from 'react';
import catalogosService from '../services/catalogos.service';


const INITIAL_STATE = Object.keys(catalogosService).reduce((acc, key) => {
  acc[key] = [];
  return acc;
}, {});

export function useCatalogos() {
  const [catalogos, setCatalogos] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const fetchCatalogos = useCallback(async (nombres = []) => {
    if (nombres.length === 0) return;    
    setLoading(true);
    setError(null);
    try {
      const promesas = nombres.map(nombre => {
        if (!catalogosService[nombre]) {
          console.warn(`Catálogo "${nombre}" no definido en catalogosService`);
          return null;
        }
        return catalogosService[nombre].listar();
      });      
      const resultados = await Promise.all(promesas);      
      setCatalogos(prev => {
        const nuevoEstado = { ...prev };
        nombres.forEach((nombre, index) => {
          if (resultados[index]) {
            const res = resultados[index];
            nuevoEstado[nombre] = Array.isArray(res) ? res : res?.results ?? [];
          }
        });
        return nuevoEstado;
      });
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar catálogos');
    } finally {
      setLoading(false);
    }
  }, []);
  // ── Operaciones CRUD ──────────────────────────────────────────────────────
  const ejecutarAccion = async (catalogoNombre, accion, ...args) => {
    const service = catalogosService[catalogoNombre];
    if (!service) throw new Error(`Catálogo ${catalogoNombre} no existe`);
    setActualizando(true);
    try {
      const result = await service[accion](...args);
      await fetchCatalogos([catalogoNombre]);
      return result;
    } catch (e) {
      const msg = e?.response?.data?.error || `Error en ${catalogoNombre}`;
      setError(msg);
      throw e;
    } finally {
      setActualizando(false);
    }
  };

  return {
    ...catalogos, 
    loading,
    error,
    actualizando,
    fetchCatalogos,

    obtenerItem: (cat, id) => catalogosService[cat].obtener(id),
    crearItem:   (cat, d) => ejecutarAccion(cat, 'crear', d),
    actualizarItem: (cat, id, d) => ejecutarAccion(cat, 'actualizar', id, d),
    activarItem: (cat, id) => ejecutarAccion(cat, 'activar', id),
    desactivarItem: (cat, id) => ejecutarAccion(cat, 'desactivar', id),
  };
}