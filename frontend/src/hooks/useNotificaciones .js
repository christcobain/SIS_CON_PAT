import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import transferenciasService from '../services/transferencias.service';
import mantenimientosService from '../services/mantenimientos.service';

const EVENTO_REFETCH = 'notificaciones:refetch';

export function dispararRefetchNotificaciones() {
  window.dispatchEvent(new CustomEvent(EVENTO_REFETCH));
}

const POLLING_MS = 60_000; 
export function useNotificaciones() {
  const role = useAuthStore(s => s.role);
  const user = useAuthStore(s => s.user);
  const [transferenciasPendientes, setTransferenciasPendientes] = useState([]);
  const [mantenimientosPendientes, setMantenimientosPendientes] = useState([]);
  const [bajasPendientes,          setBajasPendientes]          = useState([]);
  const [historial,                setHistorial]                = useState([]);
  const [loading,                  setLoading]                  = useState(false);
  const fetchIdRef = useRef(0);
  const esAprobadorTransf = ['ADMINSEDE', 'COORDSISTEMA', 'SYSADMIN', 'ASISTSISTEMA'].includes(role);
  const esSegur           = role === 'SEGURSEDE';
  const esAprobadorMant   = ['ADMINSEDE', 'COORDSISTEMA', 'SYSADMIN'].includes(role);
  const esAprobadorBajas  = ['ADMINSEDE', 'COORDSISTEMA', 'SYSADMIN'].includes(role);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const myId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const [transfPend, mantPend, bajasPend, transfHist, mantHist] = await Promise.allSettled([
        (esAprobadorTransf || esSegur)
          ? (esSegur
              ? transferenciasService.pendientesSegur()
              : transferenciasService.pendientesAprobacion())
          : Promise.resolve([]),
        esAprobadorMant
          ? mantenimientosService.pendientesAprobacion()
          : Promise.resolve([]),
        esAprobadorBajas
          ? import('../services/bajas.service')
              .then(m => m.default.listar({ estado_baja: 'PENDIENTE_APROBACION' }))
              .catch(() => [])
          : Promise.resolve([]),
        transferenciasService.listar({ estado_transferencia: 'ATENDIDO' }),
        mantenimientosService.misMantenimientos({ estado_mantenimiento: 'ATENDIDO' }),
      ]);

      if (myId !== fetchIdRef.current) return;

      const toArray = r =>
        r.status === 'fulfilled'
          ? (Array.isArray(r.value) ? r.value : r.value?.results ?? [])
          : [];

      setTransferenciasPendientes(toArray(transfPend));
      setMantenimientosPendientes(toArray(mantPend));
      setBajasPendientes(toArray(bajasPend));

      const transfAtendidas = toArray(transfHist);
      const mantAtendidos   = toArray(mantHist);

      const histTransf = transfAtendidas.slice(0, 8).map(t => {
        const ultimaAprob = t.aprobaciones?.slice(-1)[0];
        const fechaRef    = t.fecha_aprobacion_adminsede ?? ultimaAprob?.fecha ?? null;
        return {
          icono: 'swap_horiz', color: 'text-blue-500',
          accion: 'Transferencia aprobada',
          detalle: `#${t.numero_orden ?? t.id} · ${t.sede_origen_nombre ?? ''} → ${t.sede_destino_nombre ?? ''}`,
          tiempo: fechaRef ? new Date(fechaRef).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—',
          fecha: fechaRef,
        };
      });

      const histMant = mantAtendidos.slice(0, 8).map(m => {
        const ultimaAprob = m.aprobaciones?.slice(-1)[0];
        const fechaRef    = m.fecha_aprobacion_adminsede ?? ultimaAprob?.fecha ?? null;
        return {
          icono: 'build', color: 'text-primary',
          accion: 'Mantenimiento aprobado',
          detalle: `#${m.numero_orden ?? m.id} · ${m.modulo_nombre ?? ''} · ${m.total_bienes ?? 0} bien(es)`,
          tiempo: fechaRef ? new Date(fechaRef).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—',
          fecha: fechaRef,
        };
      });

      setHistorial(
        [...histTransf, ...histMant]
          .sort((a, b) => new Date(b.fecha ?? 0) - new Date(a.fecha ?? 0))
          .slice(0, 15)
      );
    } finally {
      if (myId === fetchIdRef.current) setLoading(false);
    }
  }, [user, role]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const timer = setInterval(fetchAll, POLLING_MS);
    return () => clearInterval(timer);
  }, [fetchAll]);

  useEffect(() => {
    window.addEventListener(EVENTO_REFETCH, fetchAll);
    return () => window.removeEventListener(EVENTO_REFETCH, fetchAll);
  }, [fetchAll]);

  return {
    transferenciasPendientes,
    mantenimientosPendientes,
    bajasPendientes,
    historial,
    loading,
    totalPendientes:  transferenciasPendientes.length + mantenimientosPendientes.length + bajasPendientes.length,
    transfPendientes: transferenciasPendientes.length,
    mantPendientes:   mantenimientosPendientes.length,
    bajasPend:        bajasPendientes.length,
    historialHoy:     historial.filter(h => h.fecha && new Date(h.fecha).toDateString() === new Date().toDateString()).length,
    refetchNotif:     fetchAll,
  };
}