import { useState, useEffect, useCallback,useRef } from 'react';
import { useToast }      from '../../../hooks/useToast';
import bajasService      from '../../../services/bajas.service';
import { usePermission } from '../../../hooks/usePermission';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const fmtT = (iso) =>
  !iso ? '—' : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

// ── Mini-modal motivo devolución ──────────────────────────────────────────────
function MiniModalMotivo({ open, onClose, onConfirm, loading }) {
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
      onClick={(e) => { if (e.target === e.currentTarget) { onClose(); setMotivo(''); } }}
    >
      <div
        className="rounded-2xl p-5 w-[400px] space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl flex items-center justify-center" style={{ background: 'rgb(220 38 38 / 0.1)' }}>
              <Icon name="assignment_return" className="text-[16px]" style={{ color: '#dc2626' }} />
            </div>
            <p className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>
              Devolver informe de baja
            </p>
          </div>
          <button onClick={() => { onClose(); setMotivo(''); }} style={{ color: 'var(--color-text-faint)' }}>
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          placeholder="Describe el motivo de devolución al asistente (mín. 5 caracteres)..."
          className="w-full text-sm rounded-xl px-3 py-2.5 resize-none"
          style={{
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
          onBlur={(e) => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
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
            <Icon name="assignment_return" className="text-[14px]" />
            Confirmar devolución
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Botón de acción ───────────────────────────────────────────────────────────
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

// ── Tarjeta individual de baja pendiente ─────────────────────────────────────
function TarjetaBaja({ baja, userId,sedeId, onDetalle, acciones }) {
  const toast            = useToast();
  const fileRef = useRef();
  const [busy, setBusy]  = useState(false);
  const [modalDv, setModalDv] = useState(false);
  const { can } = usePermission();
  const {aprobarBaja,devolverBaja,descargarPDFBaja,pdfFirmadoBaja}=acciones;
  const esAprobador = can('ms-bienes:bajas:add_bajaaprobacion')&&baja.usuario_destino_id==userId &&!baja.aprobado_por_coordsistema_id;
  const esUsuarioRegistra = can('ms-bienes:bajas:add_baja')&&baja.usuario_elabora_id&&baja.sede_elabora_id==sedeId;
  
  const puedeAprobar =    esAprobador && baja.estado_baja === 'PENDIENTE_APROBACION';
  const puedeDescargarPDF = esUsuarioRegistra&& baja.estado_baja === 'APROBADO' && baja.sede_elabora_id === sedeId ;
  const puedeSubirActa = puedeDescargarPDF;
  const hayAccion = puedeAprobar ;



  const ejecutar = async (fn, ...args) => {
    if (!fn) return;
    setBusy(true);
    try {
      const res = await fn(...args);
      toast.success(res?.message || res?.response?.message ||res?.response?.data?.message || 'Operación realizada con éxito');
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.response?.data?.detail || 'Error al procesar la solicitud');
    } finally {
      setBusy(false);
    }
  };


  // const handleAprobar = async () => {
  //   setBusy(true);
  //   try {
  //     const res = await bajasService.aprobar(baja.id);
  //     toast.success(res?.message || 'Baja aprobada correctamente.');
  //     onAprobado();
  //   } catch (err) {
  //     toast.error(err?.response?.data?.error || 'Error al aprobar la baja.');
  //   } finally {
  //     setBusy(false);
  //   }
  // };

  // const handleDevolver = async (motivo) => {
  //   setModalDv(false);
  //   setBusy(true);
  //   try {
  //     const res = await bajasService.devolver(baja.id, motivo);
  //     toast.success(res?.message || 'Informe devuelto al asistente.');
  //     onAprobado();
  //   } catch (err) {
  //     toast.error(err?.response?.data?.error || 'Error al devolver el informe.');
  //   } finally {
  //     setBusy(false);
  //   }
  // };

  const handleSubirFirmado = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    await ejecutar(pdfFirmadoBaja, baja.id, archivo, userId);
    if (fileRef.current) fileRef.current.value = "";
  };
  // ── Indicador de paso activo ───────────────────────────────────────────────
  const getPaso = () => {
    if (puedeAprobar) return {paso: '①', desc: 'Requiere V°B° de Admin Sede para continuar el flujo', color: 'var(--color-primary)',};
    return null;
  };
  const paso = getPaso();



  return (
    <>
      <div
        className="card p-4 hover:shadow-md transition-shadow"
        style={{ borderLeft: puedeAprobar ? '3px solid rgb(127 29 29 / 0.4)' : undefined }}
      >
        {/* ── Cabecera ── */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgb(127 29 29 / 0.08)' }}
            >
              <Icon name="delete_sweep" className="text-[22px]" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>
                  {baja.numero_informe}
                </p>
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase"
                  style={{ background: 'rgb(180 83 9 / 0.1)', color: '#b45309' }}
                >
                  Pend. Aprobación
                </span>
              </div>

              <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                Elaborado por: <span className="font-bold">{baja.nombre_elabora || '—'}</span>
                {baja.cargo_elabora ? ` · ${baja.cargo_elabora}` : ''}
              </p>
              <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--color-text-muted)' }}>
                {baja.sede_elabora_nombre || '—'}
                {baja.modulo_elabora_nombre ? ` / ${baja.modulo_elabora_nombre}` : ''}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                {fmtT(baja.fecha_registro)} · {baja.total_bienes ?? 0} bien(es)
              </p>
            </div>
          </div>

          {/* Botón Detalle */}
          <button
            onClick={() => onDetalle(baja)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer shrink-0"
            style={{
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-body)',
            }}
          >
            <Icon name="visibility" className="text-[14px]" />
            Detalle
          </button>
        </div>

        {/* ── Indicador de paso ── */}
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
        <div
          className="flex items-center gap-2 flex-wrap border-t pt-3"
          style={{ borderColor: 'var(--color-border-light)' }}
        >
          {puedeAprobar && (
            <>
              <ActionBtn
                icon="check_circle" label="Aprobar Baja" color="#16a34a"
                bgColor="rgb(22 163 74 / 0.08)" borderColor="rgb(22 163 74 / 0.3)"
                disabled={busy}  onClick={() => ejecutar(aprobarBaja, baja.id)} 
              />
              <ActionBtn
                icon="assignment_return" label="Devolver"  color="#dc2626"
                bgColor="rgb(220 38 38 / 0.06)" borderColor="rgb(220 38 38 / 0.25)"
                disabled={busy} onClick={() => setModalDv('devolverBaja')}
              />
            </>
          )}
          {puedeDescargarPDF && 
          <ActionBtn icon="download" label="Descargar Acta PDF" color="#7c3aed" bgColor="rgb(124 58 237 / 0.08)" borderColor="rgb(124 58 237 / 0.3)" 
            disabled={busy} onClick={() => ejecutar(descargarPDFBaja, baja.id, {})} />}
          <input 
          ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" 
          className="hidden" onChange={handleSubirFirmado} />

          {puedeSubirActa && 
          <ActionBtn 
          icon="upload_file" label="Subir Acta Firmada" 
          color="#7c3aed" bgColor="rgb(124 58 237 / 0.12)" borderColor="rgb(124 58 237 / 0.45)" disabled={busy} 
          onClick={() => fileRef.current?.click()} />
          }
          {!hayAccion && (
            <p className="text-[10px] italic" style={{ color: 'var(--color-text-faint)' }}>
              Sin acciones disponibles para tu rol en esta etapa.
            </p>
          )}
        </div>
      </div>

      <MiniModalMotivo
        open={modalDv}
        onClose={() => setModalDv(false)}
        loading={busy}
        onConfirm={(m) => {
            const fn = modalDv === 'devolverBaja' ? devolverBaja:null;
            setModalDv(null);
            ejecutar(fn, m.id, { motivo_devolucion: m });
        }}
      />
    </>
  );
}

// ── Componente principal exportado ────────────────────────────────────────────
export default function AlertasBajas({ onVerDetalle, userId,sedeId, 
  acciones,onRefreshReady }) {

  const [pendientes, setPendientes] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [recargar,   setRecargar]   = useState(0);
  const { canAny } = usePermission();
  const esAprobador = canAny('ms-bienes:mantenimientos:add_baja','ms-bienes:mantenimientos:add_bajaaprobacion');

  const cargar = useCallback(async () => {
    if (!esAprobador) { setPendientes([]); return; }
    setLoading(true);
    try {
      const data = await bajasService.pendientesAprobacion();
      setPendientes(Array.isArray(data) ? data : data?.results ?? []);
    } catch {
      setPendientes([]);
    } finally {
      setLoading(false);
    }
  }, [ recargar]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { cargar(); }, [cargar]);
  const refresh = () => setRecargar((r) => r + 1); 

  useEffect(() => {
    onRefreshReady?.(refresh);
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!esAprobador) {
    return (
      <div className="text-center py-10 card rounded-xl">
        <Icon name="check_circle" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
        <p className="text-sm mt-2 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          No tienes informes de baja pendientes de aprobar
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-[140px] rounded-2xl" />)}
      </div>
    );
  }

  if (!pendientes.length) {
    return (
      <div className="text-center py-12 card rounded-2xl">
        <Icon name="task_alt" className="text-[44px]" style={{ color: 'var(--color-text-faint)' }} />
        <p className="text-sm font-semibold mt-3" style={{ color: 'var(--color-text-muted)' }}>
          Sin informes de baja pendientes
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
          No hay bajas que requieran tu aprobación en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          {pendientes.length} informe(s) pendiente(s) de aprobación
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

      {pendientes.map((baja) => (
        <TarjetaBaja
          key={baja.id}
          baja={baja}
          userId={userId}
          sedeId={sedeId}
          onDetalle={onVerDetalle}
          acciones={acciones}
        />
      ))}
    </div>
  );
}