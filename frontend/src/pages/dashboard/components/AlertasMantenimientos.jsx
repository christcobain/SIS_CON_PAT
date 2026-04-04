import { useState, useEffect, useCallback,useRef } from 'react';
import { useToast }           from '../../../hooks/useToast';
import mantenimientosService  from '../../../services/mantenimientos.service';
import { usePermission } from '../../../hooks/usePermission';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const fmtT = iso => !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

// ── Badges de estado ──────────────────────────────────────────────────────────
const ESTADO_CFG = {
  EN_PROCESO:            { label: 'En Proceso',         bg: 'rgb(37 99 235 / 0.1)',  color: '#1d4ed8' },
  PENDIENTE_APROBACION:  { label: 'Pend. Aprobación',   bg: 'rgb(180 83 9 / 0.1)',   color: '#b45309' },
  APROBADO: { label: 'Aprobado', bg: 'rgb(124 58 237 / 0.1)', color: '#7c3aed' },
  DEVUELTO:              { label: 'Devuelto',           bg: 'rgb(220 38 38 / 0.1)',  color: '#dc2626' },
  ATENDIDO:              { label: 'Atendido',           bg: 'rgb(22 163 74 / 0.1)',  color: '#16a34a' },
  CANCELADO:             { label: 'Cancelado',          bg: 'rgb(100 116 139 / 0.1)', color: '#64748b' },
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

// ── Mini-modal para ingresar motivo de devolución ─────────────────────────────
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
            <div className="size-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgb(220 38 38 / 0.1)' }}>
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
          style={{
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            outline: 'none',
          }}
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
            {loading && (
              <span className="btn-loading-spin" style={{ borderColor: '#fca5a5', borderTopColor: '#dc2626' }} />
            )}
            <Icon name="reply" className="text-[14px]" />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Botón de acción reutilizable ──────────────────────────────────────────────
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

// ── Tarjeta individual de mantenimiento pendiente ─────────────────────────────
function TarjetaMantenimiento({ m, sedeId,userId, onDetalle, onAprobado,  acciones  }) {
  const toast = useToast();
  const fileRef = useRef();
  const [busy,    setBusy]    = useState(false);
  const [modalDv, setModalDv] = useState(false);
  const { can } = usePermission();
  const {aprobarMant,devolverMant,descargarPDFMant,subirFirmadoMant}=acciones;

  const estado   = m.estado_mantenimiento;
  const detalles = m.detalles ?? m.detalles_mantenimiento ?? [];
  const totalBienes = m.total_bienes ?? detalles.length;
  const esAdminAprobador = can('ms-bienes:mantenimientos:add_mantenimientoaprobacion') &&!m.aprobado_por_adminsede_id;
  const esUsuarioFinal = can('ms-bienes:mantenimientos:add_mantenimiento')
  const miSede = String(sedeId);
  const sedeOrigen = String(m.sede_id ?? '');

  const puedeAprobar =    esAdminAprobador && estado === 'PENDIENTE_APROBACION' && !m.aprobado_por_adminsede_id&& sedeOrigen === miSede;
  const puedeDevolver = puedeAprobar; 
  const soloInformativoConformidad = esAdminAprobador && !esUsuarioFinal  && estado === 'PENDIENTE_APROBACION' && sedeOrigen === miSede;

  const puedeDescargarPDF = esUsuarioFinal&& estado === 'APROBADO' && sedeOrigen === miSede ;
  const puedeSubirActa = puedeDescargarPDF;
  const hayAccion = puedeAprobar || puedeDevolver;

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
    await ejecutar(subirFirmadoMant, m.id, archivo, userId);
    if (fileRef.current) fileRef.current.value = "";
  };
 
  // const handleAprobar = async() =>{    
  //   try{
  //     const result = await mantenimientosService.aprobar(m.id, '');
  //     toast.success(result?.message || 'Acta firmada subida correctamente.');
  //   }catch (err) {
  //     toast.error(err?.response?.data?.error || 'Error al subir el acta.');
  //   }finally {
  //     setBusy(false);
  //   }    
  // };

  // const handleDevolver = async(motivo) => {
  //   setModalDv(false);
  //   try{
  //     const result = await mantenimientosService.devolver(m.id, motivo);
  //     toast.success(result?.message||result?.response?.data?.message|| 'Mant. Devuelto.');
  //   }catch (err) {
  //     toast.error(err?.response?.data?.error || 'Error al subir el acta.');
  //   }finally {
  //     setBusy(false);
  //   }    
  // };

  // ── Indicador de paso activo ───────────────────────────────────────────────
  const getPaso = () => {
    if (puedeAprobar) return {paso: '①', desc: 'Requiere V°B° de Admin Sede para continuar el flujo', color: 'var(--color-primary)',};
    return null;
  };
  const paso = getPaso();

  return (
    <>
      <div className="card p-4 hover:shadow-md transition-shadow" style={{ borderLeft: puedeAprobar ? '3px solid rgb(127 29 29 / 0.4)' : undefined,
        }}
      >
        {/* ── Cabecera ── */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgb(127 29 29 / 0.08)' }}>
              <Icon name="engineering" className="text-[20px]" style={{ color: 'var(--color-primary)' }} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-black" style={{ color: 'var(--color-text-primary)' }}>
                  {m.numero_orden}
                </p>
                <EstadoChip estado={estado} />
              </div>

              {/* Sede y propietario */}
              <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Sede: <strong>{m.sede_nombre ?? `Sede #${m.sede_id}`}</strong>
                {m.usuario_propietario_nombre && (
                  <> · Propietario: <strong>{m.usuario_propietario_nombre}</strong></>
                )}
              </p>

              {/* Fecha registro */}
              <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                {fmtT(m.fecha_registro)} · {totalBienes} bien(es)
              </p>

              {/* Resumen de bienes */}
              {detalles.length > 0 && (
                <p className="text-[10px] mt-0.5 font-mono truncate max-w-sm"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {detalles.slice(0, 2).map(d =>
                    `${d.tipo_bien_nombre ?? 'Bien'} ${d.codigo_patrimonial ?? d.numero_serie ?? ''}`).join(' · ')}
                  {detalles.length > 2 && ` +${detalles.length - 2} más`}
                </p>
              )}

              {/* Quien realizó */}
              {m.usuario_realiza_nombre && (
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                  Realizado por: <span className="font-bold">{m.usuario_realiza_nombre}</span>
                </p>
              )}
            </div>
          </div>

          {/* Botón Detalle */}
          <button
            onClick={() => onDetalle(m)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer shrink-0"
            style={{
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-body)',
            }}
          >
            <Icon name="visibility" className="text-[14px]" /> Detalle
          </button>
        </div>

        {/* ── Indicador de paso activo ── */}
        {paso && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
            style={{ background: `${paso.color}08`, border: `1px dashed ${paso.color}30` }}
          >
            <span className="text-[12px] font-black shrink-0" style={{ color: paso.color }}>
              {paso.paso}
            </span>
            <p className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              {paso.desc}
            </p>
          </div>
        )}

        {/* ── Barra de acciones ── */}
        <div className="flex items-center gap-2 flex-wrap border-t pt-3"
          style={{ borderColor: 'var(--color-border-light)' }}>

          {/* V°B° Aprobar */}
          {puedeAprobar && (
            <ActionBtn
              icon="check_circle" label="Aprobar"
              color="#16a34a" bgColor="rgb(22 163 74 / 0.08)" borderColor="rgb(22 163 74 / 0.3)"
              disabled={busy}  onClick={() => ejecutar(aprobarMant, m.id)} 
            />
          )}
          {puedeDevolver && (
            <ActionBtn
              icon="reply" label="Devolver"
              color="#dc2626" bgColor="rgb(220 38 38 / 0.06)" borderColor="rgb(220 38 38 / 0.25)"
              disabled={busy}  onClick={() => setModalDv('devolverMant')}
            />
          )}   

          {soloInformativoConformidad && <InfoChip icon="hourglass_top" label="Esperando confirmación del asistente" color="#64748b" />}

          {puedeDescargarPDF && 
          <ActionBtn icon="download" label="Descargar Acta PDF" color="#7c3aed" bgColor="rgb(124 58 237 / 0.08)" borderColor="rgb(124 58 237 / 0.3)" 
            disabled={busy} onClick={() => ejecutar(descargarPDFMant, m.id, {})} />}
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleSubirFirmado} />

          {puedeSubirActa && 
          <ActionBtn 
          icon="upload_file" label="Subir Acta Firmada" 
          color="#7c3aed" bgColor="rgb(124 58 237 / 0.12)" borderColor="rgb(124 58 237 / 0.45)" disabled={busy} 
          onClick={() => fileRef.current?.click()} />}

          {/* Sin acciones disponibles */}
          {!hayAccion && (
            <p className="text-[10px] italic" style={{ color: 'var(--color-text-faint)' }}>
              Sin acciones disponibles para tu rol en esta etapa.
            </p>
          )}
        </div>
      </div>

      {/* Mini-modal de motivo devolución */}
      {modalDv && (
      <MiniModalMotivo
        open={modalDv}
        onClose={() => setModalDv(null)}
        loading={busy}
        titulo="Devolver mantenimiento"
        placeholder="Describe el motivo de la devolución al asistente..."
        onConfirm={(m) => {
            const fn = modalDv === 'devolverMant' ? devolverMant:null;
            setModalDv(null);
            ejecutar(fn, m.id, { motivo_devolucion: m });
        }}
      />
       )}
    </>
  );
}

// ── Componente principal exportado ────────────────────────────────────────────
export default function AlertasMantenimientos({ onVerDetalle,sedeId,userId, acciones, onRefreshReady }) {
  const [pendientes, setPendientes] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [recargar,   setRecargar]   = useState(0);
  const { canAny } = usePermission();
  // const esAprobador = ['ADMINSEDE', 'COORDSISTEMA', 'SYSADMIN'].includes(role);
  const esAprobador = canAny(
    'ms-bienes:mantenimientos:add_mantenimientoaprobacion',
    'ms-bienes:mantenimientos:add_mantenimiento'
  );
  const cargar = useCallback(async () => {
    if (!esAprobador) { setPendientes([]); return; }
    setLoading(true);
    try {
      const data = await mantenimientosService.pendientesAprobacion();
      setPendientes(Array.isArray(data) ? data : data?.results ?? []);
    } catch {
      setPendientes([]);
    } finally {
      setLoading(false);
    }
  }, [ recargar]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { cargar(); }, [cargar]);
  const refresh = () => setRecargar(r => r + 1);

  useEffect(() => {
    onRefreshReady?.(refresh);
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!esAprobador) {
    return (
      <div className="text-center py-10 card rounded-xl">
        <Icon name="check_circle" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
        <p className="text-sm mt-2 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          No tienes mantenimientos pendientes de aprobar
        </p>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-[130px] rounded-2xl" />)}
      </div>
    );
  }
  // ── Sin pendientes ────────────────────────────────────────────────────────
  if (!pendientes.length) {
    return (
      <div className="text-center py-12 card rounded-2xl">
        <Icon name="task_alt" className="text-[44px]" style={{ color: 'var(--color-text-faint)' }} />
        <p className="text-sm font-semibold mt-3" style={{ color: 'var(--color-text-muted)' }}>
          Sin mantenimientos pendientes
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
          No hay órdenes que requieran tu aprobación ahora mismo.
        </p>
      </div>
    );
  }
  // ── Lista ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}>
          {pendientes.length} orden(es) pendiente(s) de aprobación
        </p>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          style={{
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          <Icon name="refresh" className="text-[14px]" />
          Actualizar
        </button>
      </div>

      {pendientes.map(m => (
        <TarjetaMantenimiento
          key={m.id}
          m={m}
          sedeId={sedeId}
          user={userId}
          onDetalle={onVerDetalle}
          onAprobado={refresh}
          acciones={acciones}
        />
      ))}
    </div>
  );
}