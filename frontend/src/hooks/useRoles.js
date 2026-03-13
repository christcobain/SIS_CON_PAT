import { useState, useEffect, useCallback } from 'react';
import rolesService from '../services/roles.service';

export function useRoles(filtrosIniciales = {}) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [actualizando, setActualizando] = useState(false);
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rolesService.listar(filtros);
      setRoles(Array.isArray(data) ? data : data?.results ?? []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar los roles');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // ── Helper para acciones de escritura ─────────────────────────────────────
  const ejecutarYRefrescar = async (fn, ...args) => {
    setActualizando(true);
    setError(null);
    try {
      const result = await fn(...args);
      await fetchRoles();
      return result;
    } catch (e) {
      const msg = e?.response?.data?.error || 'Error en la operación de roles';
      setError(msg);
      throw e;
    } finally {
      setActualizando(false);
    }
  };
  // ── Métodos del Hook ──────────────────────────────────────────────────────
  return {
    roles,
    loading,
    error,
    actualizando,
    filtros,

    refetch: fetchRoles,
    setFiltros: (nuevosFiltros) => setFiltros(prev => ({ ...prev, ...nuevosFiltros })),
    obtener: (id) => rolesService.obtener(id),
    crear: (data) => ejecutarYRefrescar(rolesService.crear, data),
    actualizar: (id, data) => ejecutarYRefrescar(rolesService.actualizar, id, data),
    activar: (id) => ejecutarYRefrescar(rolesService.activar, id),
    desactivar: (id) => ejecutarYRefrescar(rolesService.desactivar, id),    
    obtenerPermisosDelRol: (id) => rolesService.obtenerPermisosPorRol(id),
    sincronizarPermisos: (id, permissionIds) =>ejecutarYRefrescar(rolesService.sincronizarPermisos, id, permissionIds),
    obtenerArbolPermisos: async () => {
      setLoading(true);
      try {
        return await rolesService.obtenerArbolPermisos();
      } finally {
        setLoading(false);
      }
    },    
    listarPermisosPlano: (params) => rolesService.listarPermisos(params),
    listarMicroservicios: () => rolesService.listarMicroservicios(),
  
  };
}