import { useState, useEffect, useCallback } from 'react';
import locacionesService from '../services/locaciones.service';


export function useLocaciones(filtrosIniciales = {}) {
  const [data, setData] = useState({
    empresas: [],
    sedes: [],
    modulos: [],
    ubicaciones: [],
    departamentos: [],
    provincias: [],
    distritos: []
  });  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [actualizando, setActualizando] = useState(false);
  // ── Carga de Datos ────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [emp, sed, mod, ubi,dep] = await Promise.all([
        locacionesService.listarEmpresas(filtros),
        locacionesService.listarSedes(filtros),
        locacionesService.listarModulos(filtros),
        locacionesService.listarUbicaciones(filtros),
        locacionesService.listarDepartamentos()
      ]);
      setData(prev => ({
        ...prev,
        empresas: emp?.results || emp,
        sedes: sed?.results || sed,
        modulos: mod?.results || mod,
        ubicaciones: ubi?.results || ubi,
        departamentos: dep?.results || dep
      }));
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar locaciones');
    } finally {
      setLoading(false);
    }
  }, [filtros]);
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Helper para operaciones de escritura ──────────────────────────────────
  const ejecutarYRefrescar = async (fn, ...args) => {
    setActualizando(true);
    try {
      const result = await fn(...args);
      await fetchAll();
      return result;
    } catch (e) {
      const msg = e?.response?.data?.error || 'Error en la operación';
      setError(msg);
      throw e;
    } finally {
      setActualizando(false);
    }
  };
  // ── Métodos del Hook ──────────────────────────────────────────────────────
  return {
    ...data,
    filtros,
    loading,
    error,
    actualizando,
    refetch: fetchAll,
    setFiltros: (nuevosFiltros) => setFiltros(prev => ({ ...prev, ...nuevosFiltros })),
    listarEmpresa:     () => locacionesService.listarEmpresas(),
    obtenerEmpresa:    (id) => locacionesService.obtenerEmpresa(id),
    crearEmpresa:     (d) => ejecutarYRefrescar(locacionesService.crearEmpresa, d),
    actualizarEmpresa: (id, d) => ejecutarYRefrescar(locacionesService.actualizarEmpresa, id, d),
    activarEmpresa:    (id) => ejecutarYRefrescar(locacionesService.activarEmpresa, id),
    desactivarEmpresa: (id) => ejecutarYRefrescar(locacionesService.desactivarEmpresa, id),

    listarDepartamentos: () => locacionesService.listarDepartamentos(), 
    obtenerDepartamento: (id) => locacionesService.obtenerDepartamento(id),
    listarProvincias:    (depId) => locacionesService.listarProvincias(depId),
    obtenerProvincia:    (id) => locacionesService.obtenerProvincia(id),
    listarDistritos:     (provId) => locacionesService.listarDistritos(provId),
    obtenerDistrito:     (id) => locacionesService.obtenerDistrito(id),

    listarSedes:         () => locacionesService.listarSedes(),
    obtenerSede:         (id) => locacionesService.obtenerSede(id),
    crearSede:     (d) => ejecutarYRefrescar(locacionesService.crearSede, d),
    actualizarSede: (id, d) => ejecutarYRefrescar(locacionesService.actualizarSede, id, d),
    activarSede:    (id) => ejecutarYRefrescar(locacionesService.activarSede, id),
    desactivarSede: (id) => ejecutarYRefrescar(locacionesService.desactivarSede, id),

    listarModulos:     () => locacionesService.listarModulos(),
    obtenerModulo:     (id) => locacionesService.obtenerModulo(id),
    crearModulo:     (d) => ejecutarYRefrescar(locacionesService.crearModulo, d),
    actualizarModulo: (id, d) => ejecutarYRefrescar(locacionesService.actualizarModulo, id, d),
    activarModulo:    (id) => ejecutarYRefrescar(locacionesService.activarModulo, id),
    desactivarModulo: (id) => ejecutarYRefrescar(locacionesService.desactivarModulo, id),


    listarUbicaciones:     () => locacionesService.listarUbicaciones(),
    obtenerUbicacion:     (id) => locacionesService.obtenerUbicacion(id),
    crearUbicacion:     (d) => ejecutarYRefrescar(locacionesService.crearUbicacion, d),
    actualizarUbicacion: (id, d) => ejecutarYRefrescar(locacionesService.actualizarUbicacion, id, d),
    activarUbicacion:    (id) => ejecutarYRefrescar(locacionesService.activarUbicacion, id),
    desactivarUbicacion: (id) => ejecutarYRefrescar(locacionesService.desactivarUbicacion, id),
    
    }
  };
