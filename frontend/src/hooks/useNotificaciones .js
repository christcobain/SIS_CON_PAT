import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import transferenciasService from '../services/transferencias.service';
import mantenimientosService from '../services/mantenimientos.service';

const EVENTO_REFETCH = 'notificaciones:refetch';

export function dispararRefetchNotificaciones() {
  window.dispatchEvent(new CustomEvent(EVENTO_REFETCH));
}

export function useNotificaciones() {
  const role = useAuthStore(s => s.role);
  const user = useAuthStore(s => s.user);

  const [transferenciasPendientes, setTransferenciasPendientes] = useState([]);
  const [mantenimientosPendientes, setMantenimientosPendientes] = useState([]);
  const [historial,                setHistorial]                = useState([]);
  const [loading,                  setLoading]                  = useState(false);

  const esAprobadorTransf = ['ADMINSEDE', 'COORDSISTEMA', 'SYSADMIN', 'ASISTSISTEMA'].includes(role);
  const esSegur           = role === 'SEGURSEDE';
  const esAprobadorMant   = ['ADMINSEDE', 'COORDSISTEMA', 'SYSADMIN'].includes(role);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [transfPend, mantPend, transfHist, mantHist] = await Promise.allSettled([
        (esAprobadorTransf || esSegur)
          ? (esSegur
              ? transferenciasService.pendientesSegur()
              : transferenciasService.pendientesAprobacion())
          : Promise.resolve([]),

        esAprobadorMant
          ? mantenimientosService.pendientesAprobacion()
          : Promise.resolve([]),

        transferenciasService.listar({ estado: 'ATENDIDO' }),

        mantenimientosService.misMantenimientos({ estado_mantenimiento: 'ATENDIDO' }),
      ]);

      const transfData = transfPend.status === 'fulfilled'
        ? (Array.isArray(transfPend.value) ? transfPend.value : transfPend.value?.results ?? [])
        : [];

      const mantData = mantPend.status === 'fulfilled'
        ? (Array.isArray(mantPend.value) ? mantPend.value : mantPend.value?.results ?? [])
        : [];

      setTransferenciasPendientes(transfData);
      setMantenimientosPendientes(mantData);

      const transfAtendidas = transfHist.status === 'fulfilled'
        ? (Array.isArray(transfHist.value) ? transfHist.value : transfHist.value?.results ?? [])
        : [];

      const mantAtendidos = mantHist.status === 'fulfilled'
        ? (Array.isArray(mantHist.value) ? mantHist.value : mantHist.value?.results ?? [])
        : [];

      const histTransf = transfAtendidas.slice(0, 8).map(t => {
        const ultimaAprob = t.aprobaciones?.slice(-1)[0];
        const fechaRef    = t.fecha_aprobacion_adminsede ?? ultimaAprob?.fecha ?? null;
        return {
          icono:  'swap_horiz',
          color:  'text-blue-500',
          accion: 'Transferencia aprobada',
          detalle: `#${t.numero_orden ?? t.id} · ${t.sede_origen_nombre ?? ''} → ${t.sede_destino_nombre ?? ''}`,
          tiempo: fechaRef
            ? new Date(fechaRef).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
            : '—',
          fecha: fechaRef,
        };
      });

      const histMant = mantAtendidos.slice(0, 8).map(m => {
        const ultimaAprob = m.aprobaciones?.slice(-1)[0];
        const fechaRef    = m.fecha_aprobacion_adminsede ?? ultimaAprob?.fecha ?? null;
        return {
          icono:  'build',
          color:  'text-primary',
          accion: 'Mantenimiento aprobado',
          detalle: `#${m.numero_orden ?? m.id} · ${m.modulo_nombre ?? ''} · ${m.total_bienes ?? 0} bien(es)`,
          tiempo: fechaRef
            ? new Date(fechaRef).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
            : '—',
          fecha: fechaRef,
        };
      });

      const combinado = [...histTransf, ...histMant]
        .sort((a, b) => new Date(b.fecha ?? 0) - new Date(a.fecha ?? 0))
        .slice(0, 15);

      setHistorial(combinado);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    window.addEventListener(EVENTO_REFETCH, fetchAll);
    return () => window.removeEventListener(EVENTO_REFETCH, fetchAll);
  }, [fetchAll]);

  const totalPendientes  = transferenciasPendientes.length + mantenimientosPendientes.length;
  const transfPendientes = transferenciasPendientes.length;
  const mantPendientes   = mantenimientosPendientes.length;
  const historialHoy     = historial.filter(h => {
    if (!h.fecha) return false;
    return new Date(h.fecha).toDateString() === new Date().toDateString();
  }).length;

  return {
    transferenciasPendientes,
    mantenimientosPendientes,
    historial,
    loading,
    totalPendientes,
    transfPendientes,
    mantPendientes,
    historialHoy,
    refetch: fetchAll,
  };
}