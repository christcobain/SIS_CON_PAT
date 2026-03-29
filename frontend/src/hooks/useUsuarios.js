import { useState, useEffect, useCallback } from 'react';
import usuariosService from '../services/usuarios.service';


export function useUsuarios(filtrosIniciales = {}) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [actualizando, setActualizando] = useState(false);
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usuariosService.listar(filtros); 
      setUsuarios(Array.isArray(data) ? data : data?.results ?? []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar usuarios'); 
    } finally {
      setLoading(false);
    }
  }, [filtros]);
  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);
  
   const filtrarUsuarios = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await usuariosService.filtrar(params);
      const lista = Array.isArray(data) ? data : (data?.results ?? []);
      setUsuarios(lista);
      return lista;
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al filtrar usuarios');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  // ── Helper para acciones que requieren refrescar la lista ─────────────────
  const ejecutarYRefrescar = async (fn, ...args) => {
    setActualizando(true);
    setError(null);
    try {
      const result = await fn(...args);
      await fetchUsuarios(); 
      return result;
    } catch (e) {
      const msg = e?.response?.data?.error || 'Error en la operación';
      setError(msg);
      throw e;
    } finally {
      setActualizando(false);
    }
  };
  // ── Búsqueda y Filtros ────────────────────────────────────────────────────
  const buscar = (texto) => {
    setFiltros(prev => ({ ...prev, search: texto }));
  };
  const aplicarFiltros = (nuevosFiltros) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
  };
  // ── Métodos del Hook ──────────────────────────────────────────────────────
  return {
    usuarios,
    loading,
    error,
    actualizando,
    filtros,
    
    buscar,
    aplicarFiltros,    
    buscarEmpleado: (dni) => usuariosService.buscarEmpleadoPorDni(dni),
    refetch: fetchUsuarios,
    obtener: (id) => usuariosService.obtener(id),    
    crear: (data) => ejecutarYRefrescar(usuariosService.crear, data),    
    actualizar: (id, data) => ejecutarYRefrescar(usuariosService.actualizar, id, data),
    activar: (id) => ejecutarYRefrescar(usuariosService.activar, id),
    desactivar: (id) =>ejecutarYRefrescar(usuariosService.desactivar, id),
    filtrarUsuarios: filtrarUsuarios,
    listarDependencias: () => usuariosService.listarDependencias(),
    obtenerDependencias: (id) => usuariosService.obtenerDependencia(id),
    crearDependencia: (data) => usuariosService.crearDependencia(data),
    actualizarDependencia: (id, data) => usuariosService.actualizarDependencia(id, data),
    activarDependencia: (id) => usuariosService.activarDependencia(id),
    desactivarDependencia: (id) =>usuariosService.desactivarDependencia(id),
  };
}