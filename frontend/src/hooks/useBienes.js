import { useState, useEffect, useCallback } from 'react';
import bienesService from '../services/bienes.service';


export function useBienes(filtrosIniciales = {}) {
  const [bienes, setBienes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [actualizando, setActualizando] = useState(false);
  const fetchBienes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bienesService.listar(filtros);
      setBienes(Array.isArray(data) ? data : data?.results ?? []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.detail || 'Error al cargar bienes');
    } finally {
      setLoading(false);
    }
  }, [filtros]);
  useEffect(() => {
    fetchBienes();
  }, [fetchBienes]);
  // ── Helper para operaciones de escritura ──────────────────────────────────
  const ejecutarYRefrescar = async (fn, ...args) => {
    setActualizando(true);
    setError(null);
    try {
      const result = await fn(...args);
      await fetchBienes();
      return result;
    } catch (e) {
      const msg = e?.response?.data?.error || 'Error en la operación';
      setError(msg);
      throw e;
    } finally {
      setActualizando(false);
    }
  };
  const aplicarFiltros = (nuevosFiltros) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
  };
  // ── Métodos del Hook ──────────────────────────────────────────────────────
  return {
    bienes,
    loading,
    error,
    actualizando,
    filtros,

    aplicarFiltros,
    refetch: fetchBienes,
    obtener: (id) => bienesService.obtener(id),
    crear: (payload) => ejecutarYRefrescar(bienesService.crear, payload),
    actualizar: (id, payload) => ejecutarYRefrescar(bienesService.actualizar, id, payload),
    listarPorUsuario: (usuarioId) => bienesService.listarPorUsuario(usuarioId),
    listarDisponiblesSede: (sedeId) => bienesService.listarDisponiblesSede(sedeId),    
  };
}