import { useState, useEffect, useMemo } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useMantenimientos }      from '../../../../hooks/useMantenimientos';
import { useBienes }              from '../../../../hooks/useBienes';
import { useLocaciones }          from '../../../../hooks/useLocaciones';
import { useUsuarios }            from '../../../../hooks/useUsuarios';
import { useBienesEnriquecidos }  from '../../../../hooks/useBienesEnriquecidos';
import { useAuthStore }           from '../../../../store/authStore';
import { useToast }               from '../../../../hooks/useToast';

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
const onF  = e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; };
const offF = e => { e.currentTarget.style.border = '1px solid var(--color-border)'; };

const ESTADO_BIEN_COLOR = (n = '') => {
  const u = n.toUpperCase();
  if (u === 'ACTIVO')              return { color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)',    ok: true  };
  if (u.includes('TRASLADO'))      return { color: '#b45309', bg: 'rgb(180 83 9 / 0.1)',     ok: false };
  if (u.includes('MANTENIMIENTO')) return { color: '#7c3aed', bg: 'rgb(124 58 237 / 0.1)',  ok: false };
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

function TarjetaBien({ b, seleccionado, onToggle }) {
  const estadoB         = ESTADO_BIEN_COLOR(b.estado_bien_nombre ?? '');
  const funcB           = FUNC_COLOR(b.estado_funcionamiento_nombre ?? '');
  const puedeSeleccionar = estadoB.ok;

  return (
    <label
      className={`flex items-start gap-4 p-3 rounded-xl transition-all ${
        puedeSeleccionar ? 'cursor-pointer hover:bg-surface-alt' : 'cursor-not-allowed opacity-60'
      }`}
      style={{
        background: seleccionado ? 'rgb(127 29 29 / 0.05)' : 'var(--color-surface)',
        border: `1px solid ${seleccionado ? 'var(--color-primary)' : 'var(--color-border)'}`,
      }}
    >
      <div className="relative size-5 shrink-0 mt-1">
        <input
          type="checkbox"
          checked={seleccionado}
          onChange={() => puedeSeleccionar && onToggle(b.id)}
          disabled={!puedeSeleccionar}
          className="appearance-none size-5 rounded-lg border-2 transition-all"
          style={{
            borderColor: seleccionado ? 'var(--color-primary)' : 'var(--color-border)',
            background: seleccionado ? 'var(--color-primary)' : 'transparent',
          }}
        />
        {seleccionado && (
          <Icon
            name="check"
            className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white"
          />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-black uppercase truncate"
              style={{ color: 'var(--color-text-primary)' }}>
              {b.tipo_bien_nombre}
            </span>
            <span className="text-[10px] font-bold opacity-60 truncate">
              {b.marca_nombre} — {b.modelo}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-black px-2 py-0.5 rounded border"
              style={{ color: funcB.color, borderColor: funcB.color + '33' }}>
              {b.estado_funcionamiento_nombre}
            </span>
            <span className="text-[9px] font-black px-2 py-0.5 rounded border"
              style={{ color: estadoB.color, borderColor: estadoB.color + '33' }}>
              {b.estado_bien_nombre}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1 text-[10px] border-t border-border/40 pt-1.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 shrink-0">
              <Icon name="qr_code" className="text-[13px] text-primary" />
              <span className="font-mono font-bold">{b.codigo_patrimonial || 'S/C'}</span>
            </div>
            <span className="opacity-20">|</span>
            <div className="flex items-center gap-1 truncate opacity-80">
              <Icon name="location_on" className="text-[13px]" />
              <span className="font-bold">{b.sede_nombre}</span>
              <span className="opacity-40">/</span>
              <span>{b.modulo_nombre || 'S.M.'}</span>
              {b.ubicacion_nombre && (
                <><span className="opacity-40">/</span><span>{b.ubicacion_nombre}</span></>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Icon name="person" className="text-[13px] text-primary" />
            <span className="font-black uppercase truncate"
              style={{ color: b.usuario_asignado_nombre ? 'var(--color-text-primary)' : 'var(--color-text-faint)' }}>
              {b.usuario_asignado_nombre || 'Sin asignar'}
            </span>
            {b.usuario_asignado_cargo && (
              <span className="text-[9px] font-bold opacity-50 truncate">— {b.usuario_asignado_cargo}</span>
            )}
          </div>
        </div>

        {!puedeSeleccionar && (
          <div className="flex items-center gap-1 mt-0.5 text-[8px] font-black text-red-500 uppercase tracking-tighter">
            <Icon name="block" className="text-[10px]" />
            Bloqueado: {b.estado_bien_nombre}
          </div>
        )}
      </div>
    </label>
  );
}

function ResumenSeleccionados({ seleccionados, todosBienes, onQuitar }) {
  if (!seleccionados.length) return null;
  const filtrados = todosBienes.filter(b => seleccionados.includes(b.id));

  return (
    <div className="mt-3 p-3 rounded-xl"
      style={{ background: 'rgb(127 29 29 / 0.04)', border: '1px solid rgb(127 29 29 / 0.15)' }}>
      <p className="text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"
        style={{ color: 'var(--color-primary)' }}>
        <Icon name="check_circle" className="text-[14px]" />
        {seleccionados.length} bien(es) para mantenimiento
      </p>
      <div className="flex flex-wrap gap-1.5">
        {filtrados.map(b => (
          <div key={b.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-white border border-primary/20 shadow-sm">
            <Icon name="devices" className="text-[12px] text-primary" />
            <span className="truncate max-w-[150px]">
              {b.tipo_bien_nombre} — {b.codigo_patrimonial || b.modelo}
            </span>
            <button
              type="button"
              onClick={() => onQuitar(b.id)}
              className="size-4 flex items-center justify-center rounded-full hover:bg-red-50 hover:text-red-600 transition-all shrink-0"
            >
              <Icon name="close" className="text-[10px]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ModalCrearMantenimiento({ open, item, onClose, onGuardado }) {
  const toast = useToast();
  const userSedes = useAuthStore(s => s.sedes);
  const miSedeId = userSedes?.length > 0 ? userSedes[0].id : null;
  const isEditar = !!item;
  const { crear, enviarAprobacion } = useMantenimientos();
  const { bienes: bienesRaw, loading: loadingBienes, aplicarFiltros } = useBienes({
    sede_id: miSedeId,
    is_active: true,
  });
  const { sedes, modulos, ubicaciones } = useLocaciones();
  const { usuarios } = useUsuarios();
  const [seleccionados, setSeleccionados] = useState([]);
  const [buscador,      setBuscador]      = useState('');
  const [errors,        setErrors]        = useState({});
  const [confirm,       setConfirm]       = useState(false);
  const [guardando,     setGuardando]     = useState(false);

  const bienesEnriquecidos = useBienesEnriquecidos(bienesRaw, { sedes, modulos, ubicaciones, usuarios });

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setBuscador('');
    if (miSedeId) {
      aplicarFiltros({ sede_id: miSedeId, is_active: true });
    }
    if (isEditar && item) {
      const bienIds = (item.detalles ?? []).map(d => d.bien_id).filter(Boolean);
      setSeleccionados(bienIds);
    } else {
      setSeleccionados([]);
    }
  }, [open, item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const bienesFiltrados = useMemo(() => {
    const q = buscador.trim().toLowerCase();
    if (!q) return bienesEnriquecidos;
    return bienesEnriquecidos.filter(b =>
      b.codigo_patrimonial?.toLowerCase().includes(q) ||
      b.numero_serie?.toLowerCase().includes(q)       ||
      b.tipo_bien_nombre?.toLowerCase().includes(q)   ||
      b.marca_nombre?.toLowerCase().includes(q)       ||
      b.modelo?.toLowerCase().includes(q)             ||
      b.usuario_asignado_nombre?.toLowerCase().includes(q)
    );
  }, [bienesEnriquecidos, buscador]);

  const toggleBien = id =>
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const selectAllVisible = () => {
    const ids = bienesFiltrados
      .filter(b => ESTADO_BIEN_COLOR(b.estado_bien_nombre).ok)
      .map(b => b.id);
    setSeleccionados(ids);
  };

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
        const result = await crear({ bien_ids: seleccionados });
        toast.success(result?.message || 'Orden de mantenimiento creada correctamente.');
      }
      onGuardado();
    } catch (e) {
      console.log(e?.error)
      console.log(e?.response?.error )
      console.log(e?.response?.data?.error)
      toast.error(
        e?.error ||
        e?.response?.error ||
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        'Error al procesar la orden de mantenimiento.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="lg">
        <ModalHeader
          icon={isEditar ? 'send' : 'build_circle'}
          title={isEditar ? `Reenviar Orden #${item?.numero_orden ?? item?.id}` : 'Solicitud de Mantenimiento'}
          subtitle={isEditar
            ? 'Modifica los bienes si lo requieres y reenvía la orden a aprobación'
            : 'Selecciona los bienes operativos para enviarlos a revisión técnica'
          }
          onClose={onClose}
        />

        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
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
                  onFocus={onF}
                  onBlur={offF}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllVisible}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                >
                  Todo visible
                </button>
                <button
                  onClick={() => setSeleccionados([])}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl bg-surface-alt border border-border text-muted hover:bg-border transition-all"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <ResumenSeleccionados
              seleccionados={seleccionados}
              todosBienes={bienesEnriquecidos}
              onQuitar={toggleBien}
            />

            {loadingBienes ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
              </div>
            ) : bienesFiltrados.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border">
                <Icon name="inventory_2" className="text-[40px] opacity-20" />
                <p className="text-xs mt-2 font-bold opacity-40 uppercase tracking-tighter">
                  No se encontraron bienes operativos
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
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

            {errors.bienes && (
              <p className="text-[10px] text-red-500 font-bold flex items-center gap-1.5">
                <Icon name="error" className="text-[14px]" />{errors.bienes}
              </p>
            )}

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
              <Icon name="info" className="text-[18px] text-blue-600 shrink-0" />
              <p className="text-[11px] text-blue-800/80 leading-relaxed">
                {isEditar
                  ? <>Los bienes preseleccionados corresponden a la orden original. Puedes agregar o quitar bienes antes de <strong>reenviar a aprobación</strong>.</>
                  : <>Los bienes entrarán en estado <strong>MANTENIMIENTO</strong> y no podrán ser transferidos ni asignados hasta que el técnico cierre la orden. Todos los bienes deben pertenecer al mismo custodio.</>
                }
              </p>
            </div>
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