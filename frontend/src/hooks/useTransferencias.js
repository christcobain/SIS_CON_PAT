import { useState, useEffect, useCallback } from 'react';
import transferenciasService from '../services/transferencias.service';

export function useTransferencias(activeTab, params) {
  const [transferencias, setTransferencias] = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [actualizando,   setActualizando]   = useState(false);

  const fetchTransferencias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { misTransferencias, usuarioId } = params;
      let data;
      if (misTransferencias === true) {
        data = await transferenciasService.misTransferencias(usuarioId, { tipo: activeTab });
      } else {
        data = await transferenciasService.listar({ tipo: activeTab });
      }
      setTransferencias(Array.isArray(data) ? data : data?.results ?? []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar transferencias');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);
 
  useEffect(() => {
    fetchTransferencias();
  }, [fetchTransferencias]);

  const ejecutarYRefrescar = async (fn, ...args) => {
    setActualizando(true);
    setError(null);
    try {
      const resultado= await fn(...args);
      await fetchTransferencias();
      return resultado;
    } catch (e) {
      const msg = e?.response?.data || 'Error en la operación de transferencia';
      setError(msg);
      throw e;
    } finally {
      setActualizando(false);
    }
  };

  const descargarPDFTransf = async (id) => {
    try {
      const blob = await transferenciasService.descargarPDF(id);
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `transferencia-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Error descargando PDF', e);
    }
  };

  return {
    transferencias,
    loading,
    error,
    actualizando,
    refetchTransf: fetchTransferencias,
    descargarPDFTransf,
    obtenerTransf:             (id)          => transferenciasService.obtener(id),
    crearTraslado:          (data)         => ejecutarYRefrescar(transferenciasService.crearTraslado, data),
    crearAsignacion:        (data)         => ejecutarYRefrescar(transferenciasService.crearAsignacion, data),
    aprobarAdminsede:       (id)           => ejecutarYRefrescar(transferenciasService.aprobarAdminsede, id),
    devolver:     (id, motivo)   => ejecutarYRefrescar(transferenciasService.devolver, id, motivo),
    aprobarSalidaSeguridad: (id, data)     => ejecutarYRefrescar(transferenciasService.aprobarSalidaSeguridad, id, data),
    aprobarEntradaSeguridad:(id, data)     => ejecutarYRefrescar(transferenciasService.aprobarEntradaSeguridad, id, data),
    rechazarSalidaSeguridad:(id, data)     => ejecutarYRefrescar(transferenciasService.rechazarSalidaSeguridad, id, data),
    rechazarEntradaSeguridad:(id, data)    => ejecutarYRefrescar(transferenciasService.rechazarEntradaSeguridad, id, data),
    retornoSalida:          (id, data)     => ejecutarYRefrescar(transferenciasService.retornoSalida, id, data),
    retornoEntrada:         (id, data)     => ejecutarYRefrescar(transferenciasService.retornoEntrada, id, data),
    reenviarTransferencia:  (id, data)     => ejecutarYRefrescar(transferenciasService.reenviar, id, data),
    cancelar:               (id, data)     => ejecutarYRefrescar(transferenciasService.cancelar, id, data),
    subirFirmado:           (id, archivo)  => ejecutarYRefrescar(transferenciasService.subirFirmado, id, archivo),
  };
}