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
function TarjetaPendiente({ t, role, sedeId, onDetalle, onAprobado,onDownload,subirFirmado,user }) {
  const toast   = useToast();
  const fileRef = useRef();
  const [busy,    setBusy]    = useState(false);
  const [modalDv, setModalDv] = useState(null);
  const estado     = t.estado_transferencia;
  const esTraslado = t.tipo === 'TRASLADO_SEDE';
  console.log(t)
  const bienes     = t.bienes ?? [];
  const esAdminAprobador = ['ADMINSEDE', 'COORDSISTEMA', 'SYSADMIN'].includes(role);
  const esSegur          = ['SEGURSEDE', 'SYSADMIN'].includes(role);
  const esASISTSISTEMA   = ['ASISTSISTEMA', 'SYSADMIN'].includes(role);
  const miSede = String(sedeId);

  const adminAprobado   = !!t.aprobado_por_adminsede_id;
  const segurSalidaOk   = !!t.aprobado_segur_salida_id;
  const segurEntradaOk  = !!t.aprobado_segur_entrada_id;
  const retornoSalidaOk = !!t.aprobado_retorno_salida_id;
  const sedeOrigen  = String(t.sede_origen_id  ?? '');
  const sedeDestino = String(t.sede_destino_id ?? '');

   const puedeAprobarAdmin =
    esAdminAprobador &&
    estado === 'PENDIENTE_APROBACION' &&
    !adminAprobado;

  const puedeAprobarSalida =
    esSegur && esTraslado &&
    estado === 'PENDIENTE_APROBACION' &&
    adminAprobado && !segurSalidaOk &&
    sedeOrigen === miSede;

  const puedeAprobarEntrada =
    esSegur && esTraslado &&
    estado === 'PENDIENTE_APROBACION' &&
    segurSalidaOk && !segurEntradaOk &&
    sedeDestino === miSede;

  const puedeConfirmarRecepcion =
    esASISTSISTEMA && esTraslado &&
    estado === 'EN_ESPERA_CONFORMIDAD' &&
    sedeDestino === miSede;

  const soloInformativoConformidad =
    esAdminAprobador && !esASISTSISTEMA && esTraslado &&
    estado === 'EN_ESPERA_CONFORMIDAD' &&
    sedeDestino === miSede;

  const puedeDescargarPDF =
    (esASISTSISTEMA ) &&
    estado === 'EN_ESPERA_FIRMA' &&
    (
      (esTraslado  && sedeDestino === miSede) ||
      (!esTraslado && (sedeOrigen === miSede || sedeDestino === miSede))
    );
  const puedeSubirActa=puedeDescargarPDF ;

  const puedeRetornoSalida =
    esSegur && esTraslado &&
    estado === 'EN_RETORNO' &&
    !retornoSalidaOk &&
    sedeDestino === miSede;

  const puedeRetornoEntrada =
    esSegur && esTraslado &&
    estado === 'EN_RETORNO' &&
    retornoSalidaOk &&
    !t.aprobado_retorno_entrada_id && t.aprobado_retorno_salida_id&&
    sedeOrigen === miSede;
  const hayAccionPrimaria = puedeAprobarAdmin || puedeAprobarSalida || puedeAprobarEntrada ||
                            puedeConfirmarRecepcion || puedeSubirActa ||
                            puedeRetornoSalida || puedeRetornoEntrada;

  // ── Ejecutor genérico ────────────────────────────────────────────────────
  const accion = async (fn, msg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      onAprobado();
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.response?.data?.detail ||e?.detail || 'Error al procesar.');
    } finally {
      setBusy(false);
    }
  };
  const handleDevolver        = async (m) => { setModalDv(null); await accion(() => transferenciasService.devolver(t.id, { motivo_devolucion: m }), 'Transferencia devuelta al registrador.'); };
  const handleRechazarSalida  = async (m) => { setModalDv(null); await accion(() => transferenciasService.rechazarSalidaSeguridad(t.id, { motivo_devolucion: m }), 'Salida rechazada.'); };
  const handleRechazarEntrada = async (m) => { setModalDv(null); await accion(() => transferenciasService.rechazarEntradaSeguridad(t.id, { motivo_devolucion: m }), 'Entrada rechazada. En retorno.'); };

  const handleSubirFirmado = async e => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setBusy(true);
    try {      
      const result = await subirFirmado(t.id, archivo, user?.id);
      toast.success(result?.message || 'Acta firmada subida correctamente.');
      onAprobado();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al subir el acta.');
    } finally {
      setBusy(false);
    }
  };

  const getPaso = () => {
    if (puedeAprobarAdmin)          return { paso: '①', desc: esTraslado ? 'Requiere aprobación de Admin Sede' : 'Requiere aprobación de Admin Sede', color: 'var(--color-primary)' };
    if (puedeAprobarSalida)         return { paso: '②', desc: 'Requiere V°B° de Seguridad — Salida física (tu sede)', color: '#7c3aed' };
    if (puedeAprobarEntrada)        return { paso: '③', desc: 'Requiere V°B° de Seguridad — Entrada física (tu sede)', color: '#1d4ed8' };
    if (puedeConfirmarRecepcion)    return { paso: '④', desc: 'Requiere confirmación de recepción del destinatario', color: '#1d4ed8' };
    if (soloInformativoConformidad) return { paso: '④', desc: 'Esperando que el asistente de destino confirme la recepción', color: '#94a3b8' };
    if (puedeSubirActa)             return { paso: '⑦', desc: 'Acta lista — descárgala, fírmala físicamente y sube el escaneado', color: '#7c3aed' };
    if (puedeRetornoSalida)         return { paso: '⑤', desc: 'Bien en retorno — confirmar salida desde tu sede', color: '#b45309' };
    if (puedeRetornoEntrada)        return { paso: '⑥', desc: 'Bien en retorno — confirmar llegada a sede origen', color: '#16a34a' };
    return null;
  };

  const paso = getPaso();

  const MODAL_CFG = {
    devolver:         { titulo: 'Devolver al registrador',     placeholder: 'Describe el motivo de la devolución...' },
    rechazar_salida:  { titulo: 'Rechazar salida física',      placeholder: 'Describe el motivo del rechazo de salida...' },
    rechazar_entrada: { titulo: 'Rechazar entrada — retorno',  placeholder: 'Describe el motivo del rechazo de entrada...' },
  };
  const modalCfg = modalDv ? MODAL_CFG[modalDv] : null; 

  return (
    <>     
      <div
        className="card p-4 hover:shadow-md transition-shadow"
        style={{
          borderLeft: puedeSubirActa
            ? '3px solid rgb(124 58 237 / 0.5)'
            : soloInformativoConformidad
            ? '3px solid rgb(37 99 235 / 0.3)'
            : undefined,
        }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: esTraslado ? 'rgb(37 99 235 / 0.08)' : 'rgb(127 29 29 / 0.08)' }}>
              <Icon
                name={esTraslado ? 'local_shipping' : 'person_add'}
                className="text-[20px]"
                style={{ color: esTraslado ? '#1d4ed8' : 'var(--color-primary)' }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-black" style={{ color: 'var(--color-text-primary)' }}>{t.numero_orden}</p>
                <EstadoChip estado={estado} />
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                  {esTraslado ? 'Traslado' : 'Asignación'}
                </span>
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Origen: <strong>{t.sede_origen_nombre ?? `Sede #${t.sede_origen_id}`}</strong>
                {esTraslado && (
                  <> <span className="mx-1 opacity-40">→</span> Destino: <strong>{t.sede_destino_nombre ?? `Sede #${t.sede_destino_id}`}</strong></>
                )}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                {fmtT(t.fecha_registro)} · {bienes.length} bien(es)
              </p>
              {bienes.length > 0 && (
                <p className="text-[10px] mt-0.5 font-mono truncate max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {bienes.slice(0, 2).map(b => `${b.tipo_bien_nombre ?? 'Bien'} ${b.codigo_patrimonial ?? b.numero_serie ?? ''}`).join(' · ')}
                  {bienes.length > 2 && ` +${bienes.length - 2} más`}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => onDetalle(t)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer shrink-0"
            style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}
          >
            <Icon name="visibility" className="text-[14px]" />
            Detalle
          </button>
        </div>

        {paso && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
            style={{ background: `${paso.color}08`, border: `1px dashed ${paso.color}30` }}
          >
            <span className="text-[12px] font-black shrink-0" style={{ color: paso.color }}>{paso.paso}</span>
            <p className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>{paso.desc}</p>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap border-t pt-3" style={{ borderColor: 'var(--color-border-light)' }}>

          {puedeAprobarAdmin && (<>
            <ActionBtn icon="check_circle" label={esTraslado ? 'Aprobar Traslado' : 'Aprobar Asignación'}
              color="#16a34a" bgColor="rgb(22 163 74 / 0.08)" borderColor="rgb(22 163 74 / 0.3)"
              disabled={busy}
              onClick={() => accion(() => transferenciasService.aprobarAdminsede(t.id), 'Transferencia aprobada.')} />
            <ActionBtn icon="reply" label="Devolver"
              color="#dc2626" bgColor="rgb(220 38 38 / 0.06)" borderColor="rgb(220 38 38 / 0.25)"
              disabled={busy} onClick={() => setModalDv('devolver')} />
          </>)}

          {puedeAprobarSalida && (<>
            <ActionBtn icon="output" label="V°B° Salida"
              color="#7c3aed" bgColor="rgb(124 58 237 / 0.08)" borderColor="rgb(124 58 237 / 0.3)"
              disabled={busy}
              onClick={() => accion(() => transferenciasService.aprobarSalidaSeguridad(t.id, {}), 'Salida física aprobada.')} />
            <ActionBtn icon="block" label="Rechazar Salida"
              color="#dc2626" bgColor="rgb(220 38 38 / 0.06)" borderColor="rgb(220 38 38 / 0.25)"
              disabled={busy} onClick={() => setModalDv('rechazar_salida')} />
          </>)}

          {puedeAprobarEntrada && (<>
            <ActionBtn icon="input" label="V°B° Entrada"
              color="#1d4ed8" bgColor="rgb(37 99 235 / 0.08)" borderColor="rgb(37 99 235 / 0.3)"
              disabled={busy}
              onClick={() => accion(() => transferenciasService.aprobarEntradaSeguridad(t.id, {}), 'Entrada física aprobada.')} />
            <ActionBtn icon="keyboard_return" label="Rechazar Entrada"
              color="#c2410c" bgColor="rgb(194 65 12 / 0.06)" borderColor="rgb(194 65 12 / 0.25)"
              disabled={busy} onClick={() => setModalDv('rechazar_entrada')} />
          </>)}

          {puedeConfirmarRecepcion && (
            <ActionBtn icon="front_hand" label="Confirmar Recepción"
              color="#1d4ed8" bgColor="rgb(37 99 235 / 0.08)" borderColor="rgb(37 99 235 / 0.3)"
              disabled={busy}
              onClick={() => accion(() => transferenciasService.confirmarRecepcion(t.id, {}), 'Recepción confirmada. Descarga el acta y súbela firmada.')} />
          )}

          {soloInformativoConformidad && (
            <InfoChip icon="hourglass_top" label="Esperando confirmación del asistente de destino" color="#64748b" />
          )}
          
          {puedeDescargarPDF && (            
            <ActionBtn icon="download" label="Descargar Acta PDF"
              color="#7c3aed" bgColor="rgb(124 58 237 / 0.08)" borderColor="rgb(124 58 237 / 0.3)"
              disabled={busy}
              onClick={() => onDownload(t.id)} />
          )}
            <input 
            ref={fileRef} 
            type="file" 
            accept=".pdf,.jpg,.jpeg,.png" 
            className="hidden" 
            onChange={handleSubirFirmado} />
          {puedeSubirActa && (
            <ActionBtn icon="upload_file" label="Subir Acta Firmada"
              color="#7c3aed" bgColor="rgb(124 58 237 / 0.12)" borderColor="rgb(124 58 237 / 0.45)"
              disabled={busy} 
              onClick={() => fileRef.current?.click()} />
          )}

          {puedeRetornoSalida && (
            <ActionBtn icon="undo" label="Confirmar Retorno Salida"
              color="#b45309" bgColor="rgb(180 83 9 / 0.08)" borderColor="rgb(180 83 9 / 0.3)"
              disabled={busy}
              onClick={() => accion(() => transferenciasService.retornoSalida(t.id, {}), 'Salida de retorno confirmada.')} />
          )}

          {puedeRetornoEntrada && (
            <ActionBtn icon="home" label="Confirmar Retorno Entrada"
              color="#16a34a" bgColor="rgb(22 163 74 / 0.08)" borderColor="rgb(22 163 74 / 0.3)"
              disabled={busy}
              onClick={() => accion(() => transferenciasService.retornoEntrada(t.id, {}), 'Retorno completado.')} />
          )}

          {!hayAccionPrimaria && !soloInformativoConformidad && (
            <p className="text-[10px] italic" style={{ color: 'var(--color-text-faint)' }}>
              Sin acciones disponibles para tu rol en esta etapa.
            </p>
          )}
        </div>
      </div>

      {/* Modal de motivo */}
      {modalDv && modalCfg && (
        <MiniModalMotivo
          open={!!modalDv} onClose={() => setModalDv(null)} loading={busy}
          titulo={modalCfg.titulo} placeholder={modalCfg.placeholder}
          onConfirm={
            modalDv === 'devolver' ? handleDevolver
            : modalDv === 'rechazar_salida' ? handleRechazarSalida
            : handleRechazarEntrada
          }
        />
      )}
    </>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AlertasPendientesTransferencias({ onVerDetalle,onDownload,subirFirmado }) {
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
          onDownload={onDownload}
          subirFirmado={subirFirmado}
          user={user}
        />
      ))}
    </div>
  );
}