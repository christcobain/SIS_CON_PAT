import { useState, useEffect, useCallback } from 'react';
import transferenciasService from '../services/transferencias.service';

export function useTransferencias(filtrosIniciales = {}) {
  const [transferencias, setTransferencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const { misTransferencias, ...filtrosRest } = filtros;
  const fetchTransferencias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (misTransferencias) {
        data = await transferenciasService.misTransferencias(filtrosRest);
      } else {
        data = await transferenciasService.listar(filtrosRest);
      }
      setTransferencias(Array.isArray(data) ? data : data?.results ?? []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar transferencias');
    } finally {
      setLoading(false);
    }
  }, [filtrosRest,misTransferencias]);

  useEffect(() => {
    fetchTransferencias();
  }, [fetchTransferencias]);

  // ── Helper para operaciones de escritura ──────────────────────────────────
  const ejecutarYRefrescar = async (fn, ...args) => {
    setActualizando(true);
    setError(null);
    try {
      const result = await fn(...args);
      await fetchTransferencias();
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
    const descargarPDF= async (id) => {
      try {
        const blob = await transferenciasService.descargarPDF(id);
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `transferencia_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        setError('No se pudo descargar el documento de transferencia',e);
      }
    };
  // ── Métodos del Hook ──────────────────────────────────────────────────────
  return {
    transferencias,
    loading,
    error,
    actualizando,
    filtros,
    aplicarFiltros,

    refetch: fetchTransferencias,    
    obtener: (id) => transferenciasService.obtener(id),
    misTransferencias: (params) => transferenciasService.misTransferencias(params),
    descargarPDF,
    crearTraslado: (data) => ejecutarYRefrescar(transferenciasService.crearTraslado, data),
    crearAsignacion: (data) => ejecutarYRefrescar(transferenciasService.crearAsignacion, data),
    aprobarAdminSede: (id) => ejecutarYRefrescar(transferenciasService.aprobarAdminSede, id),
    devolverAprobacion: (id, motivo) => ejecutarYRefrescar(transferenciasService.devolverAprobacion, id, motivo),
    aprobarSalidaSeguridad: (id, data) => ejecutarYRefrescar(transferenciasService.aprobarSalidaSeguridad, id, data),
    aprobarEntradaSeguridad: (id, data) => ejecutarYRefrescar(transferenciasService.aprobarEntradaSeguridad, id, data),
    retornoSalida: (id, data) => ejecutarYRefrescar(transferenciasService.retornoSalida, id, data),
    retornoEntrada: (id, data) =>  ejecutarYRefrescar(transferenciasService.retornoEntrada, id, data),
    cancelar: (id, data) =>  ejecutarYRefrescar(transferenciasService.cancelar, id, data),
    reenviar: (id, data) =>  ejecutarYRefrescar(transferenciasService.reenviar, id, data),
    subirFirmado: (id, archivo) => ejecutarYRefrescar(transferenciasService.subirFirmado, id, archivo),
  };
}