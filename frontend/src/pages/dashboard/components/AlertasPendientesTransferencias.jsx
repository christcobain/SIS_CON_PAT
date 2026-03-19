import { useState, useEffect, useCallback } from 'react';
import { useAuthStore }       from '../../../store/authStore';
import { useToast }           from '../../../hooks/useToast';
import transferenciasService  from '../../../services/transferencias.service';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

const ESTADO_CFG = {
  PENDIENTE_APROBACION:  { label: 'PENDIENTE_APROBACION',          bg: 'rgb(180 83 9 / 0.1)',    color: '#b45309' },
  EN_ESPERA_CONFORMIDAD: { label: 'EN_ESPERA_CONFORMIDAD',   bg: 'rgb(37 99 235 / 0.1)',   color: '#1d4ed8' },
  EN_RETORNO:            { label: 'En EN_RETORNO',         bg: 'rgb(124 58 237 / 0.1)',  color: '#7c3aed' },
  DEVUELTO:              { label: 'DEVUELTO',           bg: 'rgb(220 38 38 / 0.1)',   color: '#dc2626' },
};

function EstadoChip({ estado }) {
  const cfg = ESTADO_CFG[estado] ?? { label: estado, bg: 'var(--color-border)', color: 'var(--color-text-muted)' };
  return (
    <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase"
      style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
  );
}

function MiniModalDevolver({ open, onClose, onConfirm, loading }) {
  const [motivo, setMotivo] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rounded-2xl p-5 w-[380px] space-y-4 shadow-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>Motivo de devolución</p>
          <button onClick={onClose} style={{ color: 'var(--color-text-faint)' }}>
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
          placeholder="Describe el motivo por el que se devuelve esta transferencia..."
          className="w-full text-sm rounded-xl px-3 py-2.5 resize-none"
          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }} />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary text-xs">Cancelar</button>
          <button onClick={() => onConfirm(motivo)} disabled={loading || motivo.trim().length < 5}
            className="btn-primary flex items-center gap-2 text-xs">
            {loading && <span className="btn-loading-spin" />}
            Devolver
          </button>
        </div>
      </div>
    </div>
  );
}

function TarjetaPendiente({ t, role, sedeId, onDetalle, onAprobado }) {
  const toast       = useToast();
  const [acc,  setAcc]  = useState(false);
  const [mdv,  setMdv]  = useState(false);
  const [busy, setBusy] = useState(false);

  const bienes = t.bienes ?? [];
  const puedeAprobarAdminSede = ['adminSede', 'coordSistema', 'SYSADMIN'].includes(role) &&
    !t.aprobado_por_adminsede_id && t.estado_transferencia === 'PENDIENTE_APROBACION';
  const puedeAprobarSalida = ['segurSede', 'SYSADMIN'].includes(role) &&
    t.aprobado_por_adminsede_id && !t.aprobado_segur_salida_id &&
    t.tipo === 'TRASLADO_SEDE' && String(t.sede_origen_id) === String(sedeId);
  const puedeAprobarEntrada = ['segurSede', 'SYSADMIN'].includes(role) &&
    t.aprobado_segur_salida_id && !t.aprobado_segur_entrada_id &&
    t.tipo === 'TRASLADO_SEDE' && String(t.sede_destino_id) === String(sedeId);
  const puedeConfirmar = t.estado_transferencia === 'EN_ESPERA_CONFORMIDAD' &&
    ['asistSistema', 'SYSADMIN'].includes(role);
  const puedeAprobarRetornoSalida = ['segurSede', 'SYSADMIN'].includes(role) &&
    t.estado_transferencia === 'EN_RETORNO' && !t.aprobado_retorno_salida_id &&
    String(t.sede_destino_id) === String(sedeId);
  const puedeAprobarRetornoEntrada = ['segurSede', 'SYSADMIN'].includes(role) &&
    t.estado_transferencia === 'EN_RETORNO' && t.aprobado_retorno_salida_id && !t.aprobado_retorno_entrada_id &&
    String(t.sede_origen_id) === String(sedeId);

  const puedeDevolver = puedeAprobarAdminSede;

  const accion = async (fn, msg) => {
    setBusy(true);
    try { await fn(); toast.success(msg); onAprobado(); }
    catch (e) { toast.error(e?.response?.data?.error || 'Error'); }
    finally { setBusy(false); }
  };

  const handleDevolver = async (motivo) => {
    setMdv(false);
    await accion(
      () => transferenciasService.devolverAprobacion(t.id, { motivo_devolucion: motivo }),
      'Transferencia devuelta.'
    );
  };

  const accionLabel = () => {
    if (puedeConfirmar)           return { label: 'Confirmar Recepción', fn: () => transferenciasService.confirmarRecepcion(t.id), msg: 'Recepción confirmada.', color: '#16a34a' };
    if (puedeAprobarAdminSede)    return { label: 'Aprobar',             fn: () => transferenciasService.aprobarAdminSede(t.id), msg: 'Aprobado.', color: '#1d4ed8' };
    if (puedeAprobarSalida)       return { label: 'V°B° Salida',         fn: () => transferenciasService.aprobarSalidaSeguridad(t.id, {}), msg: 'Salida aprobada.', color: '#7c3aed' };
    if (puedeAprobarEntrada)      return { label: 'V°B° Entrada',        fn: () => transferenciasService.aprobarEntradaSeguridad(t.id, {}), msg: 'Entrada aprobada.', color: '#16a34a' };
    if (puedeAprobarRetornoSalida) return { label: 'Retorno Salida',     fn: () => transferenciasService.retornoSalida(t.id, {}), msg: 'Retorno salida aprobado.', color: '#b45309' };
    if (puedeAprobarRetornoEntrada) return { label: 'Retorno Entrada',   fn: () => transferenciasService.retornoEntrada(t.id, {}), msg: 'Retorno entrada confirmado.', color: '#b45309' };
    return null;
  };

  const acc_cfg = accionLabel();

  return (
    <>
      <div className="card p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: t.tipo === 'TRASLADO_SEDE' ? 'rgb(37 99 235 / 0.08)' : 'rgb(127 29 29 / 0.08)' }}>
              <Icon name={t.tipo === 'TRASLADO_SEDE' ? 'local_shipping' : 'person_add'} className="text-[20px]"
                style={{ color: t.tipo === 'TRASLADO_SEDE' ? '#1d4ed8' : 'var(--color-primary)' }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-black" style={{ color: 'var(--color-text-primary)' }}>{t.numero_orden}</p>
                <EstadoChip estado={t.estado_transferencia} />
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                  {t.tipo === 'TRASLADO_SEDE' ? 'Traslado' : 'Asignación'}
                </span>
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Sede origen: <strong>{t.sede_origen_nombre ?? `#${t.sede_origen_id}`}</strong>
                {t.tipo === 'TRASLADO_SEDE' && (
                  <> → Destino: <strong>{t.sede_destino_nombre ?? `#${t.sede_destino_id}`}</strong></>
                )}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                {fmtT(t.fecha_registro)} · {bienes.length} bien(es)
              </p>
              {bienes.length > 0 && (
                <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--color-text-muted)' }}>
                  {bienes.slice(0, 2).map(b => `${b.tipo_bien_nombre} ${b.codigo_patrimonial ?? b.numero_serie ?? ''}`).join(', ')}
                  {bienes.length > 2 && ` +${bienes.length - 2} más`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => onDetalle(t)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
              style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}>
              <Icon name="visibility" className="text-[14px]" />Detalle
            </button>

            {puedeDevolver && (
              <button onClick={() => setMdv(true)} disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                style={{ background: 'rgb(220 38 38 / 0.06)', border: '1px solid rgb(220 38 38 / 0.2)', color: '#dc2626' }}>
                <Icon name="undo" className="text-[14px]" />Devolver
              </button>
            )}

            {acc_cfg && (
              <button onClick={() => accion(acc_cfg.fn, acc_cfg.msg)} disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                style={{ background: `${acc_cfg.color}15`, border: `1px solid ${acc_cfg.color}40`, color: acc_cfg.color }}>
                {busy ? <span className="btn-loading-spin" style={{ borderColor: `${acc_cfg.color}40`, borderTopColor: acc_cfg.color }} />
                  : <Icon name="check_circle" className="text-[14px]" />}
                {acc_cfg.label}
              </button>
            )}
          </div>
        </div>
      </div>

      <MiniModalDevolver open={mdv} onClose={() => setMdv(false)} onConfirm={handleDevolver} loading={busy} />
    </>
  );
}

export default function AlertasPendientesTransferencias({ onVerDetalle }) {
  const role    = useAuthStore(s => s.role);
  const sedes   = useAuthStore(s => s.sedes);
  const sedeId  = sedes?.[0]?.id;

  const [pendientes, setPendientes] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [recargar,   setRecargar]   = useState(0);

  const esSegur      = role === 'segurSede';
  const esAprobador  = ['adminSede', 'coordSistema', 'SYSADMIN', 'asistSistema'].includes(role);

  const cargar = useCallback(async () => {
    if (!esSegur && !esAprobador) { setPendientes([]); return; }
    setLoading(true);
    try {
      let data;
      if (esSegur) {
        data = await transferenciasService.pendientesSegur();
      } else {
        data = await transferenciasService.pendientesAprobacion();
      }
      setPendientes(Array.isArray(data) ? data : data?.results ?? []);
    } catch { setPendientes([]); }
    finally { setLoading(false); }
  }, [role, recargar]);

  useEffect(() => { cargar(); }, [cargar]);

  const refresh = () => setRecargar(r => r + 1);

  if (!esSegur && !esAprobador) return (
    <div className="text-center py-10 card">
      <Icon name="check_circle" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
      <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>No tienes aprobaciones pendientes</p>
    </div>
  );

  if (loading) return (
    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
  );

  if (!pendientes.length) return (
    <div className="text-center py-12 card rounded-2xl">
      <Icon name="task_alt" className="text-[44px]" style={{ color: 'var(--color-text-faint)' }} />
      <p className="text-sm font-semibold mt-3" style={{ color: 'var(--color-text-muted)' }}>Sin pendientes</p>
      <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>No hay transferencias que requieran tu acción</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          {pendientes.length} transferencia(s) pendiente(s)
        </p>
        <button onClick={refresh}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
          <Icon name="refresh" className="text-[14px]" />Actualizar
        </button>
      </div>
      {pendientes.map(t => (
        <TarjetaPendiente key={t.id} t={t} role={role} sedeId={sedeId}
          onDetalle={onVerDetalle} onAprobado={refresh} />
      ))}
    </div>
  );
}