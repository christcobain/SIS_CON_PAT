import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore }      from '../../../store/authStore';
import { useToast }          from '../../../hooks/useToast';
import transferenciasService from '../../../services/transferencias.service';


const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

// ── Configuración de badges de estado ─────────────────────────────────────────
const ESTADO_CFG = {
  PENDIENTE_APROBACION:  { label: 'Pendiente Aprobación', bg: 'rgb(180 83 9 / 0.1)',   color: '#b45309' },
  EN_ESPERA_CONFORMIDAD: { label: 'Espera Conformidad',   bg: 'rgb(37 99 235 / 0.1)',  color: '#1d4ed8' },
  EN_ESPERA_FIRMA:       { label: 'Espera Acta Firmada',  bg: 'rgb(124 58 237 / 0.1)', color: '#7c3aed' },
  EN_RETORNO:            { label: 'En Retorno',           bg: 'rgb(220 38 38 / 0.1)',  color: '#dc2626' },
  DEVUELTO:              { label: 'Devuelto',             bg: 'rgb(220 38 38 / 0.1)',  color: '#dc2626' },
};

function EstadoChip({ estado }) {
  const cfg = ESTADO_CFG[estado] ?? { label: estado, bg: 'var(--color-border)', color: 'var(--color-text-muted)' };
  return (
    <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── Mini-modal para ingresar motivo ───────────────────────────────────────────
function MiniModalMotivo({ open, onClose, onConfirm, loading, titulo, placeholder }) {
  const [motivo, setMotivo] = useState('');
  if (!open) return null;

  const handleConfirm = () => {
    if (motivo.trim().length < 5) return;
    onConfirm(motivo.trim());
    setMotivo('');
  };
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) { onClose(); setMotivo(''); } }}
    >
      <div className="rounded-2xl p-5 w-[400px] space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl flex items-center justify-center" style={{ background: 'rgb(220 38 38 / 0.1)' }}>
              <Icon name="reply" className="text-[16px]" style={{ color: '#dc2626' }} />
            </div>
            <p className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>{titulo}</p>
          </div>
          <button onClick={() => { onClose(); setMotivo(''); }} style={{ color: 'var(--color-text-faint)' }}>
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full text-sm rounded-xl px-3 py-2.5 resize-none"
          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
          onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
          onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
        />
        {motivo.trim().length > 0 && motivo.trim().length < 5 && (
          <p className="text-[10px] text-red-500 font-semibold -mt-2">Mínimo 5 caracteres.</p>
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={() => { onClose(); setMotivo(''); }} className="btn-secondary text-xs">Cancelar</button>
          <button
            onClick={handleConfirm}
            disabled={loading || motivo.trim().length < 5}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: 'rgb(220 38 38 / 0.1)', color: '#dc2626', border: '1px solid rgb(220 38 38 / 0.25)' }}
          >
            {loading && <span className="btn-loading-spin" style={{ borderColor: '#fca5a5', borderTopColor: '#dc2626' }} />}
            <Icon name="reply" className="text-[14px]" />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Botón de acción primario ──────────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, disabled, color, bgColor, borderColor }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: bgColor, color, border: `1px solid ${borderColor}` }}
    >
      {disabled
        ? <span className="btn-loading-spin" style={{ borderColor: `${color}40`, borderTopColor: color }} />
        : <Icon name={icon} className="text-[14px]" />
      }
      {label}
    </button>
  );
}

// ── Chip meramente informativo (sin acción) ───────────────────────────────────
function InfoChip({ icon, label, color }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold italic"
      style={{ background: `${color}08`, color, border: `1px dashed ${color}30` }}>
      <Icon name={icon} className="text-[13px]" />
      {label}
    </div>
  );
}

// ── Tarjeta individual de transferencia ───────────────────────────────────────
function TarjetaPendiente({ t, role, sedeId, onDetalle, onAprobado, user, acciones }) {
  const toast = useToast();
  const fileRef = useRef();
  const [busy, setBusy] = useState(false);
  const [modalDv, setModalDv] = useState(null);

  const {
    aprobarAdminsede, aprobarSalidaSeguridad, aprobarEntradaSeguridad,
    rechazarSalidaSeguridad, rechazarEntradaSeguridad,
    retornoSalida, retornoEntrada, devolver,
    descargarPDFTransf, subirFirmado
  } = acciones;

  const estado = t.estado_transferencia;
  const esTraslado = t.tipo === 'TRASLADO_SEDE';
  const esAdminAprobador = ['ADMINSEDE', 'COORDSISTEMA', 'SYSADMIN'].includes(role);
  const esSegur = ['SEGURSEDE', 'SYSADMIN'].includes(role);
  const esASISTSISTEMA = ['ASISTSISTEMA', 'SYSADMIN'].includes(role);
  const miSede = String(sedeId);
  const adminAprobado = !!t.aprobado_por_adminsede_id;
  const segurSalidaOk = !!t.aprobado_segur_salida_id;
  const segurEntradaOk = !!t.aprobado_segur_entrada_id;
  const retornoSalidaOk = !!t.aprobado_retorno_salida_id;
  const sedeOrigen = String(t.sede_origen_id ?? '');
  const sedeDestino = String(t.sede_destino_id ?? '');

  const puedeAprobarAdmin = esAdminAprobador && estado === 'PENDIENTE_APROBACION' && !adminAprobado;
  const puedeAprobarSalida = esSegur && esTraslado && estado === 'PENDIENTE_APROBACION' && adminAprobado && !segurSalidaOk && sedeOrigen === miSede;
  const puedeAprobarEntrada = esSegur && esTraslado && estado === 'PENDIENTE_APROBACION' && segurSalidaOk && !segurEntradaOk && sedeDestino === miSede;
  const puedeConfirmarRecepcion = esASISTSISTEMA && esTraslado && estado === 'EN_ESPERA_CONFORMIDAD' && sedeDestino === miSede;
  const puedeDescargarPDF = esASISTSISTEMA && estado === 'EN_ESPERA_FIRMA' && ((esTraslado && sedeDestino === miSede) || (!esTraslado && (sedeOrigen === miSede || sedeDestino === miSede)));
  const puedeSubirActa = puedeDescargarPDF;
  const puedeRetornoSalida = esSegur && esTraslado && estado === 'EN_RETORNO' && !retornoSalidaOk && sedeDestino === miSede;
  const puedeRetornoEntrada = esSegur && esTraslado && estado === 'EN_RETORNO' && retornoSalidaOk && !t.aprobado_retorno_entrada_id && sedeOrigen === miSede;

  const ejecutar = async (fn, ...args) => {
    if (!fn) return;
    setBusy(true);
    try {
      const res = await fn(...args);
      toast.success(res?.message || res?.response?.data?.message || 'Operación realizada con éxito');
      onAprobado();
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.response?.data?.detail || 'Error al procesar la solicitud');
    } finally {
      setBusy(false);
    }
  };

  const handleSubirFirmado = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    await ejecutar(subirFirmado, t.id, archivo, user?.id);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="card p-4 rounded-2xl relative border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onDetalle(t)}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider" 
                  style={{ background: t.tipo === 'TRASLADO_SEDE' ? 'rgb(59 130 246 / 0.1)' : 'rgb(16 185 129 / 0.1)', color: t.tipo === 'TRASLADO_SEDE' ? '#2563eb' : '#059669' }}>
              {t.tipo?.replace('_', ' ')}
            </span>
            <span className="text-xs font-mono font-medium text-[var(--color-text-muted)]">#{t.correlativo || t.id}</span>
          </div>
          <p className="text-sm font-bold truncate mb-1 text-[var(--color-text)]">{t.motivo || 'Sin motivo'}</p>
          <div className="flex items-center gap-4 text-[11px] text-[var(--color-text-faint)]">
            <div className="flex items-center gap-1"><Icon name="calendar_today" className="text-[14px]" /> {new Date(t.created_at).toLocaleDateString()}</div>
            <div className="flex items-center gap-1"><Icon name="inventory_2" className="text-[14px]" /> {t.bienes_count || 0} bienes</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0 items-end">
          {puedeAprobarAdmin && (
            <>
              <button disabled={busy} onClick={() => ejecutar(aprobarAdminsede, t.id)} className="btn-primary py-2 px-4 text-xs flex items-center gap-2">
                {busy ? <span className="btn-loading-spin" /> : <Icon name="verified" className="text-sm" />} Aprobar {t.tipo === 'ASIGNACION_DIRECTA' ? 'Asignación' : 'Traslado'}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setModalDv('DEVOLVER'); }} className="text-[11px] font-bold uppercase tracking-tight text-[#b45309] hover:underline">
                Devolver
              </button>
            </>
          )}

          {puedeAprobarSalida && (
            <>
              <button disabled={busy} onClick={() => ejecutar(aprobarSalidaSeguridad, t.id)} className="btn-primary py-2 px-4 text-xs flex items-center gap-2">
                {busy ? <span className="btn-loading-spin" /> : <Icon name="output" className="text-sm" />} Aprobar Salida
              </button>
              <button onClick={(e) => { e.stopPropagation(); setModalDv('RECHAZAR_SALIDA'); }} className="text-[11px] font-bold uppercase tracking-tight text-[#dc2626] hover:underline">
                Rechazar Salida
              </button>
            </>
          )}

          {puedeAprobarEntrada && (
            <>
              <button disabled={busy} onClick={() => ejecutar(aprobarEntradaSeguridad, t.id)} className="btn-primary py-2 px-4 text-xs flex items-center gap-2">
                {busy ? <span className="btn-loading-spin" /> : <Icon name="input" className="text-sm" />} Aprobar Entrada
              </button>
              <button onClick={(e) => { e.stopPropagation(); setModalDv('RECHAZAR_ENTRADA'); }} className="text-[11px] font-bold uppercase tracking-tight text-[#dc2626] hover:underline">
                Rechazar Entrada
              </button>
            </>
          )}

          {puedeConfirmarRecepcion && (
            <button disabled={busy} onClick={() => onDetalle(t)} className="btn-primary py-2 px-4 text-xs flex items-center gap-2 bg-[#7c3aed] border-[#7c3aed]">
              <Icon name="check_circle" className="text-sm" /> Confirmar Recepción
            </button>
          )}

          {puedeSubirActa && (
            <div className="flex gap-2">
              <button disabled={busy} onClick={() => descargarPDFTransf(t.id)} className="p-2 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
                <Icon name="picture_as_pdf" />
              </button>
              <button disabled={busy} onClick={() => fileRef.current?.click()} className="btn-primary py-2 px-4 text-xs flex items-center gap-2">
                <Icon name="upload_file" className="text-sm" /> Subir Acta
              </button>
              <input ref={fileRef} type="file" hidden accept=".pdf" onChange={handleSubirFirmado} />
            </div>
          )}

          {puedeRetornoSalida && (
            <button disabled={busy} onClick={() => ejecutar(retornoSalida, t.id)} className="btn-primary py-2 px-4 text-xs flex items-center gap-2 bg-[#c2410c] border-[#c2410c]">
              {busy ? <span className="btn-loading-spin" /> : <Icon name="assignment_return" className="text-sm" />} Registrar Retorno (Salida)
            </button>
          )}

          {puedeRetornoEntrada && (
            <button disabled={busy} onClick={() => ejecutar(retornoEntrada, t.id)} className="btn-primary py-2 px-4 text-xs flex items-center gap-2 bg-[#c2410c] border-[#c2410c]">
              {busy ? <span className="btn-loading-spin" /> : <Icon name="assignment_return" className="text-sm" />} Registrar Retorno (Entrada)
            </button>
          )}
        </div>
      </div>

      {modalDv === 'DEVOLVER' && (
        <MiniModalMotivo
          onClose={() => setModalDv(null)}
          onConfirm={(m) => { setModalDv(null); ejecutar(devolver, t.id, { motivo_devolucion: m }); }}
          title="Devolver transferencia"
          label="Motivo de la devolución"
          color="#b45309"
        />
      )}

      {modalDv === 'RECHAZAR_SALIDA' && (
        <MiniModalMotivo
          onClose={() => setModalDv(null)}
          onConfirm={(m) => { setModalDv(null); ejecutar(rechazarSalidaSeguridad, t.id, { motivo_devolucion: m }); }}
          title="Rechazar salida física"
          label="Motivo del rechazo"
          color="#dc2626"
        />
      )}

      {modalDv === 'RECHAZAR_ENTRADA' && (
        <MiniModalMotivo
          onClose={() => setModalDv(null)}
          onConfirm={(m) => { setModalDv(null); ejecutar(rechazarEntradaSeguridad, t.id, { motivo_devolucion: m }); }}
          title="Rechazar entrada"
          label="Motivo del rechazo"
          color="#dc2626"
        />
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AlertasPendientesTransferencias({ onVerDetalle,acciones}) {
  const role   = useAuthStore(s => s.role);
  const sedes  = useAuthStore(s => s.sedes);
  const user = useAuthStore(s => s.user);
  const sedeId = sedes?.[0]?.id;

  const [pendientes, setPendientes] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [recargar,   setRecargar]   = useState(0);

  const esSegur     = role === 'SEGURSEDE';
  const esAprobador = ['ADMINSEDE', 'COORDSISTEMA', 'SYSADMIN', 'ASISTSISTEMA'].includes(role);

  const cargar = useCallback(async () => {
    if (!esSegur && !esAprobador) { setPendientes([]); return; }
    setLoading(true);
    try {
      const data = esSegur
        ? await transferenciasService.pendientesSegur()
        : await transferenciasService.pendientesAprobacion();
      setPendientes(Array.isArray(data) ? data : data?.results ?? []);
    } catch {
      setPendientes([]);
    } finally {
      setLoading(false);
    }
  }, [role, recargar]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { cargar(); }, [cargar]);
  const refresh = () => setRecargar(r => r + 1);

  if (!esSegur && !esAprobador) {
    return (
      <div className="text-center py-10 card rounded-xl">
        <Icon name="check_circle" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
        <p className="text-sm mt-2 font-semibold" style={{ color: 'var(--color-text-muted)' }}>No tienes aprobaciones pendientes</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-[130px] rounded-2xl" />)}
      </div>
    );
  }

  if (!pendientes.length) {
    return (
      <div className="text-center py-12 card rounded-2xl">
        <Icon name="task_alt" className="text-[44px]" style={{ color: 'var(--color-text-faint)' }} />
        <p className="text-sm font-semibold mt-3" style={{ color: 'var(--color-text-muted)' }}>Sin pendientes</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>No hay transferencias que requieran tu acción ahora mismo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          {pendientes.length} transferencia(s) pendiente(s)
        </p>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          <Icon name="refresh" className="text-[14px]" />
          Actualizar
        </button>
      </div>

      {pendientes.map(t => (
        <TarjetaPendiente
          key={t.id}
          t={t}
          role={role}
          sedeId={sedeId}
          onDetalle={onVerDetalle}
          onAprobado={refresh}
          acciones={acciones}
          user={user}
        />
      ))}
    </div>
  );
}