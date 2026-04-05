import { useState, useEffect, useMemo } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useMantenimientos }     from '../../../../hooks/useMantenimientos';
import { useBienes }             from '../../../../hooks/useBienes';
import { useLocaciones }         from '../../../../hooks/useLocaciones';
import { useUsuarios }           from '../../../../hooks/useUsuarios';
import { useBienesEnriquecidos } from '../../../../hooks/useBienesEnriquecidos';
import { useAuthStore }          from '../../../../store/authStore';
import { useToast }              from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const S = {
  input: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
    outline: 'none',
  },
};
const onFocus = e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; };
const onBlur  = e => { e.currentTarget.style.border = '1px solid var(--color-border)'; };

const ESTADO_BIEN_COLOR = (n = '') => {
  const u = n.toUpperCase();
  if (u === 'ACTIVO')              return { color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)',   ok: true  };
  if (u.includes('TRASLADO'))      return { color: '#b45309', bg: 'rgb(180 83 9 / 0.1)',    ok: false };
  if (u.includes('MANTENIMIENTO')) return { color: '#7c3aed', bg: 'rgb(124 58 237 / 0.1)', ok: false };
  if (u.includes('BAJA'))          return { color: '#dc2626', bg: 'rgb(220 38 38 / 0.1)',   ok: false };
  return { color: '#64748b', bg: 'var(--color-border-light)', ok: false };
};

const FUNC_COLOR = (n = '') => {
  const u = n.toUpperCase();
  if (u === 'OPERATIVO')   return { color: '#1d4ed8', bg: 'rgb(37 99 235 / 0.1)'  };
  if (u === 'AVERIADO')    return { color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   };
  if (u === 'INOPERATIVO') return { color: '#dc2626', bg: 'rgb(220 38 38 / 0.1)'  };
  return { color: '#64748b', bg: 'var(--color-border-light)' };
};

// ── Tarjeta individual de un bien ─────────────────────────────────────────────
function TarjetaBien({ b, seleccionado, onToggle }) {
  const estadoB          = ESTADO_BIEN_COLOR(b.estado_bien_nombre ?? '');
  const funcB            = FUNC_COLOR(b.estado_funcionamiento_nombre ?? '');
  const puedeSeleccionar = estadoB.ok;

  return (
    <label
      className={`flex items-start gap-3 p-3.5 rounded-xl transition-all ${
        puedeSeleccionar ? 'cursor-pointer' : 'cursor-not-allowed opacity-55'
      }`}
      style={{
        background: seleccionado ? 'rgb(127 29 29 / 0.05)' : 'var(--color-surface)',
        border: `1px solid ${seleccionado ? 'var(--color-primary)' : 'var(--color-border)'}`,
      }}
    >
      {/* Checkbox */}
      <div className="relative size-5 shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={seleccionado}
          onChange={() => puedeSeleccionar && onToggle(b.id)}
          disabled={!puedeSeleccionar}
          className="appearance-none size-5 rounded-md border-2 transition-all"
          style={{
            borderColor: seleccionado ? 'var(--color-primary)' : 'var(--color-border)',
            background:  seleccionado ? 'var(--color-primary)' : 'transparent',
          }}
        />
        {seleccionado && (
          <Icon name="check" className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white" />
        )}
      </div>

      {/* Info del bien */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Nombre + badges */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase truncate"
              style={{ color: 'var(--color-text-primary)' }}>{b.tipo_bien_nombre}</p>
            <p className="text-[10px] font-medium mt-0.5"
              style={{ color: 'var(--color-text-muted)' }}>{b.marca_nombre} — {b.modelo}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <span className="text-[9px] font-black px-2 py-0.5 rounded-md"
              style={{ color: funcB.color, background: funcB.bg }}>
              {b.estado_funcionamiento_nombre}
            </span>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-md"
              style={{ color: estadoB.color, background: estadoB.bg }}>
              {b.estado_bien_nombre}
            </span>
          </div>
        </div>

        {/* Código + ubicación */}
        <div className="flex items-center gap-3 text-[10px] flex-wrap"
          style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 6 }}>
          <div className="flex items-center gap-1">
            <Icon name="qr_code" className="text-[12px]" style={{ color: 'var(--color-primary)' }} />
            <span className="font-mono font-bold">{b.codigo_patrimonial || 'S/C'}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0" style={{ color: 'var(--color-text-muted)' }}>
            <Icon name="location_on" className="text-[12px]" />
            <span className="truncate">{b.sede_nombre}</span>
            {b.modulo_nombre && <><span className="opacity-40">/</span><span className="truncate">{b.modulo_nombre}</span></>}
          </div>
          {b.usuario_asignado_nombre && (
            <div className="flex items-center gap-1">
              <Icon name="person" className="text-[12px]" style={{ color: 'var(--color-primary)' }} />
              <span className="font-black truncate max-w-[130px]" style={{ color: 'var(--color-text-primary)' }}>
                {b.usuario_asignado_nombre}
              </span>
            </div>
          )}
        </div>

        {!puedeSeleccionar && (
          <div className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500">
            <Icon name="block" className="text-[11px]" />
            Bloqueado: {b.estado_bien_nombre}
          </div>
        )}
      </div>
    </label>
  );
}

// ── Chips de bienes seleccionados ─────────────────────────────────────────────
function ResumenSeleccionados({ seleccionados, todosBienes, onQuitar }) {
  if (!seleccionados.length) return null;
  const filtrados = todosBienes.filter(b => seleccionados.includes(b.id));
  return (
    <div className="p-3 rounded-xl"
      style={{ background: 'rgb(127 29 29 / 0.04)', border: '1px solid rgb(127 29 29 / 0.15)' }}>
      <p className="text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"
        style={{ color: 'var(--color-primary)' }}>
        <Icon name="check_circle" className="text-[14px]" />
        {seleccionados.length} bien(es) seleccionado(s)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {filtrados.map(b => (
          <div key={b.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm"
            style={{ background: 'var(--color-surface)', border: '1px solid rgb(127 29 29 / 0.2)' }}>
            <Icon name="devices" className="text-[12px]" style={{ color: 'var(--color-primary)' }} />
            <span className="truncate max-w-[150px]">
              {b.tipo_bien_nombre} — {b.codigo_patrimonial || b.modelo}
            </span>
            <button
              type="button"
              onClick={() => onQuitar(b.id)}
              className="size-4 flex items-center justify-center rounded-full transition-all hover:text-red-600"
              style={{ color: 'var(--color-text-faint)' }}
            >
              <Icon name="close" className="text-[10px]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────
export default function ModalCrearMantenimiento({ open, item, onClose, onGuardado }) {
  const toast     = useToast();
  const userSedes = useAuthStore(s => s.sedes);
  const miSedeId  = userSedes?.length > 0 ? userSedes[0].id : null;
  const isEditar  = !!item;

  const { crearMant, enviarAprobacion } = useMantenimientos();
  const { bienes: bienesRaw, loading: loadingBienes, aplicarFiltros } = useBienes({
    sede_id: miSedeId, is_active: true,
  });
  const { sedes, modulos, ubicaciones } = useLocaciones();
  const { usuarios }    = useUsuarios();
  const bienesEnriquecidos = useBienesEnriquecidos(bienesRaw, { sedes, modulos, ubicaciones, usuarios });

  const [seleccionados, setSeleccionados] = useState([]);
  const [buscador,      setBuscador]      = useState('');
  const [errors,        setErrors]        = useState({});
  const [confirm,       setConfirm]       = useState(false);
  const [guardando,     setGuardando]     = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setBuscador('');
    if (miSedeId) aplicarFiltros({ sede_id: miSedeId, is_active: true });
    if (isEditar && item) {
      setSeleccionados((item.detalles ?? []).map(d => d.bien_id).filter(Boolean));
    } else {
      setSeleccionados([]);
    }
  }, [open, item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const bienesFiltrados = useMemo(() => {
    const q = buscador.trim().toLowerCase();
    if (!q) return bienesEnriquecidos;
    return bienesEnriquecidos.filter(b =>
      b.codigo_patrimonial?.toLowerCase().includes(q)    ||
      b.numero_serie?.toLowerCase().includes(q)          ||
      b.tipo_bien_nombre?.toLowerCase().includes(q)      ||
      b.marca_nombre?.toLowerCase().includes(q)          ||
      b.modelo?.toLowerCase().includes(q)                ||
      b.usuario_asignado_nombre?.toLowerCase().includes(q)
    );
  }, [bienesEnriquecidos, buscador]);

  const toggleBien = id =>
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectAllVisible = () =>
    setSeleccionados(bienesFiltrados.filter(b => ESTADO_BIEN_COLOR(b.estado_bien_nombre).ok).map(b => b.id));

  const handleSolicitar = () => {
    if (!seleccionados.length) {
      setErrors({ bienes: 'Selecciona al menos un bien para continuar.' });
      return;
    }
    setConfirm(true);
  };

  const handleGuardar = async () => {
    setConfirm(false);
    setGuardando(true);
    try {
      if (isEditar) {
        const result = await enviarAprobacion(item.id, { bien_ids: seleccionados });
        toast.success(result?.message || 'Orden reenviada a aprobación correctamente.');
      } else {
        const result = await crearMant({ bien_ids: seleccionados });
        toast.success(result?.message || 'Orden de mantenimiento creada correctamente.');
      }
      onGuardado();
    } catch (e) {
      toast.error(
        e?.error || e?.response?.error || e?.response?.data?.error ||
        e?.response?.data?.detail || 'Error al procesar la orden de mantenimiento.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const totalDisponibles = bienesEnriquecidos.filter(b => ESTADO_BIEN_COLOR(b.estado_bien_nombre).ok).length;
  const totalBloqueados  = bienesEnriquecidos.length - totalDisponibles;

  return (
    <>
      <Modal open={open} onClose={onClose} size="xl">
        <ModalHeader
          icon={isEditar ? 'send' : 'build_circle'}
          title={isEditar ? `Reenviar Orden #${item?.numero_orden ?? item?.id}` : 'Nueva solicitud de mantenimiento'}
          subtitle={isEditar
            ? 'Modifica los bienes si lo requieres y reenvía la orden a aprobación'
            : 'Selecciona los bienes a incluir en la orden de mantenimiento técnico'}
          onClose={onClose}
        />

        <ModalBody className="p-0">
          <div className="flex" style={{ minHeight: '60vh', maxHeight: '68vh' }}>

            {/* ── Panel principal (lista de bienes) ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-w-0">

              {/* Buscador + acciones rápidas */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Icon
                    name="search"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[17px] pointer-events-none"
                    style={{ color: buscador ? 'var(--color-primary)' : 'var(--color-text-faint)' }}
                  />
                  <input
                    type="text"
                    value={buscador}
                    onChange={e => setBuscador(e.target.value)}
                    placeholder="Buscar por código, serie, custodio, modelo..."
                    className="w-full text-xs rounded-xl py-2.5 pr-4 transition-all"
                    style={{ ...S.input, paddingLeft: 36 }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <button
                  onClick={selectAllVisible}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all whitespace-nowrap"
                  style={{ background: 'rgb(127 29 29 / 0.08)', color: 'var(--color-primary)', border: '1px solid rgb(127 29 29 / 0.2)' }}
                >
                  Todo visible
                </button>
                <button
                  onClick={() => setSeleccionados([])}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all whitespace-nowrap"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  Limpiar
                </button>
              </div>

              {/* Chips seleccionados */}
              <ResumenSeleccionados
                seleccionados={seleccionados}
                todosBienes={bienesEnriquecidos}
                onQuitar={toggleBien}
              />

              {/* Error de validación */}
              {errors.bienes && (
                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1.5">
                  <Icon name="error" className="text-[14px]" />{errors.bienes}
                </p>
              )}

              {/* Lista de bienes */}
              {loadingBienes ? (
                <div className="space-y-2.5">
                  {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
                </div>
              ) : bienesFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <Icon name="inventory_2" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
                  <p className="text-xs font-bold uppercase tracking-tighter" style={{ color: 'var(--color-text-faint)' }}>
                    No se encontraron bienes operativos
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {bienesFiltrados.map(b => (
                    <TarjetaBien
                      key={b.id}
                      b={b}
                      seleccionado={seleccionados.includes(b.id)}
                      onToggle={toggleBien}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Panel lateral resumen ── */}
            <aside className="w-56 shrink-0 p-4 space-y-4 overflow-y-auto border-l"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}>

              {/* Selección actual */}
              <div className="card p-3 space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}>Selección actual</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-xl flex items-center justify-center"
                      style={{ background: seleccionados.length ? 'rgb(127 29 29 / 0.1)' : 'var(--color-border-light)' }}>
                      <Icon name="check_circle" className="text-[18px]"
                        style={{ color: seleccionados.length ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
                    </div>
                    <div>
                      <p className="text-2xl font-black leading-none"
                        style={{ color: seleccionados.length ? 'var(--color-primary)' : 'var(--color-text-faint)' }}>
                        {seleccionados.length}
                      </p>
                      <p className="text-[9px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
                        {seleccionados.length === 1 ? 'bien' : 'bienes'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disponibilidad */}
              {!loadingBienes && (
                <div className="card p-3 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest"
                    style={{ color: 'var(--color-text-muted)' }}>Disponibilidad</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-green-500" />
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Disponibles</span>
                      </div>
                      <span className="text-[10px] font-black" style={{ color: '#16a34a' }}>{totalDisponibles}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-red-400" />
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Bloqueados</span>
                      </div>
                      <span className="text-[10px] font-black" style={{ color: '#dc2626' }}>{totalBloqueados}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full" style={{ background: 'var(--color-border)' }} />
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Total</span>
                      </div>
                      <span className="text-[10px] font-black" style={{ color: 'var(--color-text-primary)' }}>{bienesEnriquecidos.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Información */}
              <div className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background: 'rgb(37 99 235 / 0.06)', border: '1px solid rgb(37 99 235 / 0.15)' }}>
                <Icon name="info" className="text-[14px] shrink-0 mt-0.5" style={{ color: '#1d4ed8' }} />
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-body)' }}>
                  {isEditar
                    ? 'Los bienes preseleccionados corresponden a la orden original. Agrega o quita bienes antes de reenviar.'
                    : 'Los bienes seleccionados pasarán a estado MANTENIMIENTO y no podrán transferirse hasta cerrar la orden.'}
                </p>
              </div>

              {/* Leyenda de colores */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}>Leyenda estados</p>
                {[
                  { label: 'Activo',         color: '#16a34a' },
                  { label: 'Mantenimiento',  color: '#7c3aed' },
                  { label: 'Traslado',       color: '#b45309' },
                  { label: 'Baja',           color: '#dc2626' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full shrink-0" style={{ background: l.color }} />
                    <span className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </ModalBody>

        <ModalFooter align="right">
          <button onClick={onClose} className="btn-secondary">Cerrar</button>
          <button
            onClick={handleSolicitar}
            disabled={guardando || !seleccionados.length}
            className="btn-primary flex items-center gap-2"
          >
            {guardando
              ? <span className="btn-loading-spin" />
              : <Icon name={isEditar ? 'send' : 'build_circle'} className="text-[16px]" />
            }
            {isEditar ? 'Reenviar orden' : 'Crear orden'}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={confirm}
        title={isEditar ? 'Reenviar orden de mantenimiento' : 'Crear orden de mantenimiento'}
        message={isEditar
          ? `¿Reenviar la orden #${item?.numero_orden ?? item?.id} con ${seleccionados.length} bien(es) a aprobación?`
          : `¿Confirmar la solicitud con ${seleccionados.length} bien(es)? Los bienes quedarán bloqueados temporalmente.`
        }
        confirmLabel={isEditar ? 'Sí, reenviar' : 'Sí, crear orden'}
        variant="primary"
        loading={guardando}
        onConfirm={handleGuardar}
        onClose={() => setConfirm(false)}
      />
    </>
  );
}