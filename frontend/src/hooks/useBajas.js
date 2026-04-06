import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import bajasService from '../services/bajas.service';

export function useBajas(filtrosIniciales = {}) {
  const userId = useAuthStore((s) => s.userId);

  const [bajas, setBajas]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const [filtros, setFiltros]           = useState(filtrosIniciales);

  const buildParams = useCallback(
    (f) => {
      const params = {};
      if (f.estado_baja)           params.estado_baja        = f.estado_baja;
      if (f.sede_elabora_id)       params.sede_elabora_id    = f.sede_elabora_id;
      if (f.misInformes && userId) params.usuario_elabora_id = userId;
      return params;
    },
    [userId]
  );

  const fetchBajas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bajasService.listar(buildParams(filtros));
      setBajas(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar las bajas');
    } finally {
      setLoading(false);
    }
  }, [filtros, buildParams]);

  useEffect(() => { fetchBajas(); }, [fetchBajas]);

  const ejecutarYRefrescar = async (metodo, ...args) => {
    setActualizando(true);
    setError(null);
    try {
      const res = await metodo(...args);
      await fetchBajas();
      return res;
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.detail || 'Error en la operación';
      setError(msg);
      throw e;
    } finally {
      setActualizando(false);
    }
  };
  const descargarPDFBaja = async (id, firmado = false, nombreArchivo = 'baja.pdf') => {
    try {
        const blob = await bajasService.descargarPDF(id, firmado);        
        const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', nombreArchivo);
        document.body.appendChild(link);
        link.click();        
        link.remove();
        window.URL.revokeObjectURL(url); 
    } catch (e) {
        setError(e?.response?.data?.error || 'No se pudo descargar el documento');
    }
    };

  const aplicarFiltros = (nuevosFiltros) =>
    setFiltros((prev) => ({ ...prev, ...nuevosFiltros }));

  return {
    bajas, loading, error, actualizando, filtros,
    aplicarFiltros,
    refetch:               fetchBajas,
    obtener:               (id)         => bajasService.obtener(id),
    bienesParaBaja:        (params)     => bajasService.bienesParaBaja(params),
    mantenimientosDelBien: (bienId)     => bajasService.mantenimientosDelBien(bienId),
    crearBaja:                 (data)       => ejecutarYRefrescar(bajasService.crear, data),
    aprobarBaja:               (id)         => ejecutarYRefrescar(bajasService.aprobar, id),
    devolverBaja:              (id, motivo) => ejecutarYRefrescar(bajasService.devolver, id, motivo),
    cancelarBaja:              (id, data)   => ejecutarYRefrescar(bajasService.cancelar, id, data),
    reenviarBaja:              (id, data)   => ejecutarYRefrescar(bajasService.reenviar, id, data),
    descargarPDFBaja,
    pdfFirmadoBaja:             (id, formData) => ejecutarYRefrescar(bajasService.pdfFirmado, id, formData),
  };
}