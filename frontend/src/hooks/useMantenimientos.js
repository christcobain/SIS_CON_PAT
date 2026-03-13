import { useState, useEffect, useCallback } from 'react';
import mantenimientosService from '../services/mantenimientos.service';

export function useMantenimientos(filtrosIniciales = {}) {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [actualizando,   setActualizando]   = useState(false);
  const [filtros,        setFiltros]        = useState(filtrosIniciales);

  // ── CORRECCIÓN: destructuring DENTRO del callback, no fuera ──────────────
  // Si se hace fuera, `filtrosRest` es un objeto nuevo en cada render y
  // provoca que useCallback recree la función → useEffect re-ejecuta → bucle.
  const fetchMantenimientos = useCallback(async () => {
    const { misMantenimientos, ...filtrosRest } = filtros;   // ← dentro
    setLoading(true);
    setError(null);
    try {
      const data = misMantenimientos
        ? await mantenimientosService.misMantenimientos(filtrosRest)
        : await mantenimientosService.listar(filtrosRest);
      setMantenimientos(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (e) {
      setError(
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        'Error al cargar mantenimientos'
      );
    } finally {
      setLoading(false);
    }
  }, [filtros]); // ← solo `filtros` (referencia estable al estado)

  useEffect(() => {
    fetchMantenimientos();
  }, [fetchMantenimientos]);

  // ── Helper para operaciones de escritura ──────────────────────────────────
  const ejecutarYRefrescar = async (fn, ...args) => {
    setActualizando(true);
    setError(null);
    try {
      const result = await fn(...args);
      await fetchMantenimientos();
      return result;
    } catch (e) {
      const msg = e?.response?.data?.error || 'Error en la operación de mantenimiento';
      setError(msg);
      throw e;
    } finally {
      setActualizando(false);
    }
  };

  const subirImagen = async (id, archivo, descripcion) => {
    setActualizando(true);
    try {
      return await mantenimientosService.subirImagen(id, archivo, descripcion);
    } finally {
      setActualizando(false);
    }
  };

  const descargarPDF = async (id) => {
    try {
      const blob = await mantenimientosService.descargarPDF(id);
      const url  = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `mantenimiento_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setError('No se pudo descargar el documento',e);
    }
  };

  const aplicarFiltros = (nuevosFiltros) => {
    setFiltros((prev) => ({ ...prev, ...nuevosFiltros }));
  };

  // ── API pública del hook ──────────────────────────────────────────────────
  return {
    mantenimientos,
    loading,
    error,
    actualizando,
    filtros,

    aplicarFiltros,
    refetch: fetchMantenimientos,
    obtener:             (id)          => mantenimientosService.obtener(id),
    misMantenimientos:   (params)      => mantenimientosService.misMantenimientos(params),
    descargarPDF,
    subirImagen,
    crear:               (data)        => ejecutarYRefrescar(mantenimientosService.crear, data),
    enviarAprobacion:    (id, data)    => ejecutarYRefrescar(mantenimientosService.enviarAprobacion, id, data),
    aprobar:             (id, obs)     => ejecutarYRefrescar(mantenimientosService.aprobar, id, obs),
    devolver:            (id, motivo)  => ejecutarYRefrescar(mantenimientosService.devolver, id, motivo),
    confirmarConformidad:(id)          => ejecutarYRefrescar(mantenimientosService.confirmarConformidad, id),
    cancelar:            (id, data)    => ejecutarYRefrescar(mantenimientosService.cancelar, id, data),
    subirFirmado:        (id, archivo) => ejecutarYRefrescar(mantenimientosService.subirFirmado, id, archivo),
  };
}