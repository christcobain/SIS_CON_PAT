import { useState, useCallback, useRef } from 'react';
import catalogosService from '../services/catalogos.service';


const INITIAL_STATE = Object.keys(catalogosService).reduce((acc, key) => {
  acc[key] = [];
  return acc;
}, {});

export function useCatalogos() {
  const [catalogos,   setCatalogos]   = useState(INITIAL_STATE);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const setCatalogosRef = useRef(setCatalogos);
  setCatalogosRef.current = setCatalogos;
  const fetchCatalogos = useCallback(async (nombres = []) => {
    if (!nombres.length) return;
    setLoading(true);
    setError(null);
    const nombresValidos = nombres.filter(nombre => {
      if (!catalogosService[nombre]) {
        console.warn(
          `[useCatalogos] La key "${nombre}" no existe en catalogosService. ` +
          `Keys disponibles: ${Object.keys(catalogosService).join(', ')}`
        );
        return false;
      }
      return true;
    });

    if (!nombresValidos.length) {
      setLoading(false);
      return;
    }
    const resultados = await Promise.allSettled(
      nombresValidos.map(nombre => catalogosService[nombre].listar())
    );

    setCatalogosRef.current(prev => {
      const nuevoEstado = { ...prev };
      nombresValidos.forEach((nombre, index) => {
        const resultado = resultados[index];
        if (resultado.status === 'fulfilled') {
          const res = resultado.value;
          nuevoEstado[nombre] = Array.isArray(res) ? res : (res?.results ?? []);
        } else {
          const err = resultado.reason;
          const status = err?.response?.status;
          const msg    = err?.response?.data?.error ?? err?.message ?? 'Error desconocido';
          console.error(
            `[useCatalogos] Error cargando "${nombre}" ` +
            `(slug: ${catalogosService[nombre]?._slug ?? '?'}) ` +
            `HTTP ${status ?? '?'}: ${msg}`
          );
          if (status !== 404) {
            setError(`Error cargando ${nombre}: ${msg}`);
          }
        }
      });

      return nuevoEstado;
    });

    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Operaciones CRUD ────────────────────────────────────────────────────
  const ejecutarAccion = async (catalogoNombre, accion, ...args) => {
    const service = catalogosService[catalogoNombre];
    if (!service) throw new Error(`Catálogo "${catalogoNombre}" no existe en catalogosService`);
    setActualizando(true);
    try {
      const result = await service[accion](...args);
      await fetchCatalogos([catalogoNombre]);
      return result;
    } catch (e) {
      const msg = e?.response?.data?.error || `Error en operación sobre ${catalogoNombre}`;
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
    obtenerItem:    (cat, id)    => catalogosService[cat].obtener(id),
    crearItem:      (cat, d)     => ejecutarAccion(cat, 'crear', d),
    actualizarItem: (cat, id, d) => ejecutarAccion(cat, 'actualizar', id, d),
    activarItem:    (cat, id)    => ejecutarAccion(cat, 'activar', id),
    desactivarItem: (cat, id)    => ejecutarAccion(cat, 'desactivar', id),
  };
}