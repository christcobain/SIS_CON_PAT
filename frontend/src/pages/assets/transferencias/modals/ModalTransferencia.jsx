import { useState, useEffect, useMemo } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useBienes }     from '../../../../hooks/useBienes';
import { useLocaciones } from '../../../../hooks/useLocaciones';
import { useUsuarios }   from '../../../../hooks/useUsuarios';
import { useCatalogos }  from '../../../../hooks/useCatalogos';
import { useBienesEnriquecidos } from '../../../../hooks/useBienesEnriquecidos';
import { useAuthStore }  from '../../../../store/authStore';
import { useToast }      from '../../../../hooks/useToast';
import usuariosService   from '../../../../services/usuarios.service';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const S = { input: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' } };
const onF  = e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; };
const offF = e => { e.currentTarget.style.border = '1px solid var(--color-border)'; };

function FLabel({ children, required }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </p>
  );
}
function FSelect({ value, onChange, children, disabled }) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled}
      className="w-full text-sm rounded-xl px-3 py-2.5 cursor-pointer"
      style={{ ...S.input, opacity: disabled ? 0.6 : 1 }} onFocus={onF} onBlur={offF}>
      {children}
    </select>
  );
}

const ESTADO_BIEN_COLOR = (n = '') => {
  const u = n.toUpperCase();
  if (u === 'ACTIVO')              return { color: '#16a34a', bg: 'rgb(22 163 74 / 0.1)', ok: true };
  if (u.includes('TRASLADO'))      return { color: '#b45309', bg: 'rgb(180 83 9 / 0.1)',  ok: false };
  if (u.includes('ASIGNACI'))      return { color: '#b45309', bg: 'rgb(180 83 9 / 0.1)',  ok: false };
  if (u.includes('MANTENIMIENTO')) return { color: '#7c3aed', bg: 'rgb(124 58 237 / 0.1)', ok: false };
  if (u.includes('BAJA'))          return { color: '#dc2626', bg: 'rgb(220 38 38 / 0.1)', ok: false };
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
  const estadoB = ESTADO_BIEN_COLOR(b.estado_bien_nombre ?? '');
  const funcB   = FUNC_COLOR(b.estado_funcionamiento_nombre ?? '');
  const puedeSeleccionar = estadoB.ok;

  return (
    <label
      className={`flex items-start gap-4 p-2.5 rounded-xl transition-all ${
        puedeSeleccionar ? 'cursor-pointer hover:bg-surface-alt' : 'cursor-not-allowed opacity-60'
      }`}
      style={{
        background: seleccionado ? 'rgb(var(--color-primary-rgb) / 0.05)' : 'var(--color-surface)',
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
            borderColor: seleccionado ? 'var(--color-primary)' : 'var(--color-border-dark)',
            background: seleccionado ? 'var(--color-primary)' : 'transparent',
          }} 
        />
        {seleccionado && <Icon name="check" className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white" />}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-black uppercase truncate" style={{ color: 'var(--color-text-primary)' }}>
              {b.tipo_bien_nombre}
            </span>
            <span className="text-[10px] font-bold opacity-60 truncate">
              {b.marca_nombre} — {b.modelo}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-black px-2 py-0.5 rounded border" style={{ color: funcB.color, borderColor: funcB.color + '33' }}>
              {b.estado_funcionamiento_nombre}
            </span>
            <span className="text-[9px] font-black px-2 py-0.5 rounded border" style={{ color: estadoB.color, borderColor: estadoB.color + '33' }}>
              {b.estado_bien_nombre}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-x-3 text-[10px] border-t border-border/40 pt-1">
          <div className="flex items-center gap-1 shrink-0">
            <Icon name="qr_code" className="text-[12px] text-primary" />
            <span className="font-mono font-bold">{b.codigo_patrimonial || 'S/C'}</span>
          </div>
          <div className="flex items-center gap-1 truncate opacity-80">
            <Icon name="location_on" className="text-[12px]" />
            <span className="font-bold">{b.sede_nombre}</span>
            <span className="opacity-50">/</span>
            <span>{b.modulo_nombre || 'S.M.'}</span>
            <span className="opacity-50">/</span>
            <span className="font-medium">{b.ubicacion_nombre || 'U.'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px]">
          <Icon name="person" className="text-[12px] text-primary" />
          <span className="font-black uppercase" style={{ color: b.usuario_asignado_nombre ? 'var(--color-text-primary)' : 'var(--color-text-faint)' }}>
            {b.usuario_asignado_nombre || 'Sin asignar'}
          </span>
          {b.usuario_asignado_cargo && (
            <>
              <span className="opacity-30">|</span>
              <span className="text-[9px] font-bold opacity-60 italic truncate">
                {b.usuario_asignado_cargo}
              </span>
            </>
          )}
        </div>

        {!puedeSeleccionar && (
          <div className="flex items-center gap-1 mt-0.5 text-[8px] font-black text-red-500 uppercase tracking-tighter">
            <Icon name="block" className="text-[10px]" />
            Bloqueado por estado del bien: {b.estado_bien_nombre}
          </div>
        )}
      </div>
    </label>
  );
}

function ResumenBienesSeleccionados({ bienesSeleccionados, onQuitar }) {
  if (!bienesSeleccionados.length) return null;
  return (
    <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgb(127 29 29 / 0.05)', border: '1px solid rgb(127 29 29 / 0.2)' }}>
      <p className="text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-primary)' }}>
        <Icon name="check_circle" className="text-[13px]" />
        {bienesSeleccionados.length} bien(es) seleccionado(s)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {bienesSeleccionados.map(b => (
          <div key={b.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
            style={{ background: 'var(--color-surface)', border: '1px solid rgb(127 29 29 / 0.25)', color: 'var(--color-text-primary)' }}>
            <Icon name="devices" className="text-[12px]" style={{ color: 'var(--color-primary)' }} />
            <span className="truncate max-w-[120px]">
              {b.tipo_bien_nombre ?? 'Bien'} — {b.codigo_patrimonial ?? b.modelo ?? `#${b.id}`}
            </span>
            <button
              type="button"
              onClick={() => onQuitar(b.id)}
              className="size-4 flex items-center justify-center rounded-full hover:bg-red-500 hover:text-white transition-all shrink-0"
              style={{ color: 'var(--color-text-muted)' }}>
              <Icon name="close" className="text-[10px]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const FORM_BASE = {
  bien_ids: [], usuario_destino_id: '', sede_destino_id: '',
  modulo_destino_id: '', ubicacion_destino_id: '',
  piso_destino: '', motivo_transferencia: '', descripcion: '',
};

export default function ModalTransferencia({
  open, onClose, activeTab, item, actualizando,
  crearTraslado, crearAsignacion, reenviarTransferencia, 
  obtenerTransf, onGuardado,
}) {
  const toast      = useToast();
  const isTraslado = activeTab === 'TRASLADO_SEDE';
  const isEditar   = !!item;

  const sedes_auth   = useAuthStore(s => s.sedes);
  const sede_auth_id = sedes_auth?.[0]?.id;

  const { bienes: todosBienes, loading: loadingBienes } = useBienes({});
  const { sedes, modulos, ubicaciones }                 = useLocaciones();
  const { usuarios: usuariosMs }                        = useUsuarios({ is_active: true });
  const { fetchCatalogos, motivosTransferencia = [] }   = useCatalogos();
  const [usuariosPorSede, setUsuariosPorSede] = useState([]);
  const [loadingUsuariosSede, setLoadingUsuariosSede] = useState(false);
  const bienesConNombres = useBienesEnriquecidos(todosBienes, { sedes, modulos, ubicaciones, usuarios: usuariosMs });

  const [form,           setForm]           = useState({ ...FORM_BASE });
  const [itemCompleto,   setItemCompleto]   = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [buscador,       setBuscador]       = useState('');
  const [errors,         setErrors]         = useState({});
  const [confirm,        setConfirm]        = useState(false);
  const [guardando,      setGuardando]      = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchCatalogos(['motivosTransferencia']);
    setErrors({});
    setBuscador('');
    setItemCompleto(null);

    if (isEditar && item) {
      setLoadingDetalle(true);
      obtenerTransf(item.id)
        .then(data => {
          const detalle = data?.data ?? data;
          setItemCompleto(detalle);
          const bienIds = (detalle.bienes ?? []).map(b => b.bien_id).filter(Boolean);
          setForm({
            bien_ids:                bienIds,
            usuario_destino_id:      String(detalle.usuario_destino_id ?? ''),
            sede_destino_id:         String(detalle.sede_destino_id ?? ''),
            modulo_destino_id:       String(detalle.modulo_destino_id ?? ''),
            ubicacion_destino_id:    String(detalle.ubicacion_destino_id ?? ''),
            piso_destino:            detalle.piso_destino ?? '',
            motivo_transferencia_id: String(detalle.motivo_transferencia_id ?? ''),
            descripcion:             detalle.descripcion ?? '',
          });
        })
        .catch(() => {
          const bienIds = (item.bienes ?? []).map(b => b.bien_id).filter(Boolean);
          setForm({
            bien_ids:                bienIds,
            usuario_destino_id:      String(item.usuario_destino_id ?? ''),
            sede_destino_id:         String(item.sede_destino_id ?? ''),
            modulo_destino_id:       String(item.modulo_destino_id ?? ''),
            ubicacion_destino_id:    String(item.ubicacion_destino_id ?? ''),
            piso_destino:            item.piso_destino ?? '',
            motivo_transferencia_id: String(item.motivo_transferencia_id ?? ''),
            descripcion:             item.descripcion ?? '',
          });
        })
        .finally(() => setLoadingDetalle(false));
    } else {
      setForm({ ...FORM_BASE, sede_destino_id: isTraslado ? '' : String(sede_auth_id ?? '') });
    }
  }, [open, item?.id, isTraslado]);

  const itemData = itemCompleto ?? item;

  useEffect(() => {
    const sedeId = form.sede_destino_id;
    if (!sedeId) {
      if (!isTraslado) {
        const misUsuarios = usuariosMs.filter(u =>
          (u.sedes ?? []).some(s => String(s.id) === String(sede_auth_id))
        );
        setUsuariosPorSede(misUsuarios);
      } else {
        setUsuariosPorSede([]);
      }
      return;
    }
    const usuariosFiltrados = usuariosMs.filter(u =>
      (u.sedes ?? []).some(s => String(s.id) === String(sedeId))
    );
    if (usuariosFiltrados.length > 0) {
      setUsuariosPorSede(usuariosFiltrados);
    } else {
      setLoadingUsuariosSede(true);
      usuariosService.listar({ is_active: true })
        .then(data => {
          const lista = Array.isArray(data) ? data : data?.results ?? [];
          const filtrados = lista.filter(u =>
            (u.sedes ?? []).some(s => String(s.id) === String(sedeId))
          );
          setUsuariosPorSede(filtrados);
        })
        .catch(() => setUsuariosPorSede([]))
        .finally(() => setLoadingUsuariosSede(false));
    }
  }, [form.sede_destino_id, isTraslado, usuariosMs, sede_auth_id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const bienesFiltradosBuscador = useMemo(() => {
    const base = isTraslado
      ? bienesConNombres
      : bienesConNombres.filter(b => String(b.sede_id) === String(sede_auth_id));
    if (!buscador.trim()) return base;
    const q = buscador.trim().toLowerCase();
    return base.filter(b =>
      b.codigo_patrimonial?.toLowerCase().includes(q) ||
      b.numero_serie?.toLowerCase().includes(q)       ||
      b.tipo_bien_nombre?.toLowerCase().includes(q)   ||
      b.marca_nombre?.toLowerCase().includes(q)       ||
      b.modelo?.toLowerCase().includes(q)
    );
  }, [bienesConNombres, buscador, isTraslado, sede_auth_id]);

  const bienesSeleccionados = useMemo(() => {
    const fromInventario = bienesConNombres.filter(b => form.bien_ids.includes(b.id));
    if (fromInventario.length === form.bien_ids.length) return fromInventario;
    const bienesDelItem = (itemData?.bienes ?? []);
    return form.bien_ids.map(id => {
      const enInventario = bienesConNombres.find(b => b.id === id);
      if (enInventario) return enInventario;
      const enItem = bienesDelItem.find(b => b.bien_id === id);
      if (enItem) return {
        id,
        tipo_bien_nombre:   enItem.tipo_bien_nombre   ?? '—',
        codigo_patrimonial: enItem.codigo_patrimonial ?? '—',
        marca_nombre:       enItem.marca_nombre       ?? '—',
        modelo:             enItem.modelo             ?? '—',
      };
      return { id, tipo_bien_nombre: `Bien #${id}`, codigo_patrimonial: '—' };
    });
  }, [bienesConNombres, form.bien_ids, itemData]);

  const ubicacionesDest = (ubicaciones ?? []).filter(m => m.is_active !== false);
  const modulosActivos  = (modulos ?? []).filter(m => m.is_active !== false);
  console.log('modulosActivos= ',modulosActivos)

  const toggleBien = id => set('bien_ids',
    form.bien_ids.includes(id) ? form.bien_ids.filter(x => x !== id) : [...form.bien_ids, id]
  );

  const validar = () => {
    const e = {};
    if (!form.bien_ids.length)    e.bien_ids           = 'Selecciona al menos un bien.';
    if (!form.usuario_destino_id) e.usuario_destino_id = 'Campo obligatorio.';
    if (!form.sede_destino_id)    e.sede_destino_id    = 'Campo obligatorio.';
    return e;
  };

  const handleSubmit = async () => {
    setConfirm(false);
    setGuardando(true);
    const payload = {
      bien_ids:             form.bien_ids.map(Number),
      usuario_destino_id:   Number(form.usuario_destino_id),
      sede_destino_id:      Number(form.sede_destino_id),
      ...(form.modulo_destino_id    && { modulo_destino_id:    Number(form.modulo_destino_id)    }),
      ...(form.ubicacion_destino_id && { ubicacion_destino_id: Number(form.ubicacion_destino_id) }),
      ...(form.piso_destino         && { piso_destino:         Number(form.piso_destino)         }),
      ...(form.motivo_transferencia_id && { motivo_transferencia_id: Number(form.motivo_transferencia_id) }),
      ...(form.descripcion?.trim()  && { descripcion: form.descripcion.trim() }),
    };
    try {
      let result;
      if (isEditar)        result = await reenviarTransferencia(item.id, payload);
      else if (isTraslado) result = await crearTraslado(payload);
      else                 result = await crearAsignacion(payload);
      toast.success(result?.message ?? 'Operación exitosa.');
      onGuardado();
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.response?.data || err?.response?.detail || 'Error al registrar.');
    } finally { setGuardando(false); }
  };

  const handleSolicitar = () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    setConfirm(true);
  };

  const tipoLabel    = isTraslado ? 'Traslado' : 'Asignación';
  const origenNombre = itemData?.sede_origen_nombre ?? (sedes_auth?.[0]?.nombre ?? '');
  const origenModulo = itemData?.modulo_origen_nombre ?? '';

  return (
    <>
      <Modal open={open} onClose={onClose} size="xl">
        <ModalHeader
          icon={isTraslado ? 'local_shipping' : 'person_add'}
          title={isEditar
            ? `Reenviar ${itemData?.numero_orden ?? item?.numero_orden ?? ''}`
            : (isTraslado ? 'Nuevo traslado entre sedes' : 'Nueva asignación interna')}
          subtitle={isEditar
            ? `${tipoLabel} devuelto — corrige y reenvía a aprobación`
            : (isTraslado
              ? 'Mueve bienes hacia otra sede. Requiere aprobación de ADMINSEDE y V°B° SEGURSEDE.'
              : 'Asigna bienes a un usuario final dentro de tu sede.')}
          onClose={onClose}
        />

        <ModalBody>
          {loadingDetalle ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">

              {/* ── Columna izquierda: selección de bienes ── */}
              <div className="space-y-3">

                {isEditar && itemData && (
                  <div className="p-3 rounded-xl space-y-1.5"
                    style={{ background: 'rgb(127 29 29 / 0.05)', border: '1px solid rgb(127 29 29 / 0.2)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
                      Datos de origen — {itemData.numero_orden}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
                      <p style={{ color: 'var(--color-text-muted)' }}>
                        <span className="font-black text-body">Tipo: </span>{tipoLabel}
                      </p>
                      <p style={{ color: 'var(--color-text-muted)' }}>
                        <span className="font-black text-body">Sede origen: </span>{origenNombre || '—'}
                      </p>
                      {origenModulo && (
                        <p style={{ color: 'var(--color-text-muted)' }}>
                          <span className="font-black text-body">Módulo origen: </span>{origenModulo}
                        </p>
                      )}
                      {itemData.motivo_devolucion && (
                        <p className="col-span-2" style={{ color: '#b45309' }}>
                          <span className="font-black">Motivo devolución: </span>{itemData.motivo_devolucion}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <FLabel required>Bienes a transferir</FLabel>
                    {form.bien_ids.length > 0 && (
                      <span className="text-[10px] font-black" style={{ color: 'var(--color-primary)' }}>
                        {form.bien_ids.length} seleccionado(s)
                      </span>
                    )}
                  </div>

                  <div className="relative mb-2">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[17px] pointer-events-none"
                      style={{ color: buscador ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
                    <input type="text" value={buscador} onChange={e => setBuscador(e.target.value)}
                      placeholder="Buscar por código, serie, tipo, marca..."
                      className="w-full text-xs rounded-xl py-2.5 pr-4 transition-all"
                      style={{ ...S.input, paddingLeft: 36 }} onFocus={onF} onBlur={offF} />
                  </div>

                  <ResumenBienesSeleccionados
                    bienesSeleccionados={bienesSeleccionados}
                    onQuitar={toggleBien}
                  />

                  {loadingBienes ? (
                    <div className="space-y-2 mt-2">{[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
                  ) : bienesFiltradosBuscador.length === 0 ? (
                    <div className="text-center py-8 rounded-xl mt-2" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                      <Icon name="inventory_2" className="text-[32px]" style={{ color: 'var(--color-text-faint)' }} />
                      <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                        Sin bienes{buscador ? ' con esa búsqueda' : ' disponibles'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 overflow-y-auto pr-1 mt-2" style={{ maxHeight: '40vh' }}>
                      {bienesFiltradosBuscador.map(b => (
                        <TarjetaBien
                          key={b.id}
                          b={b}
                          seleccionado={form.bien_ids.includes(b.id)}
                          onToggle={toggleBien}
                        />
                      ))}
                    </div>
                  )}

                  {errors.bien_ids && (
                    <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                      <Icon name="error" className="text-[11px]" />{errors.bien_ids}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Columna derecha: datos del destino ── */}
              <div className="space-y-4">

                {isTraslado && (
                  <div>
                    <FLabel required>Sede destino</FLabel>
                    <FSelect
                      value={form.sede_destino_id}
                      onChange={v => {
                        set('sede_destino_id', v);
                        set('modulo_destino_id', '');
                        set('ubicacion_destino_id', '');
                        set('usuario_destino_id', '');
                      }}>
                      <option value="">Seleccionar sede...</option>
                      {(sedes ?? []).filter(s => s.is_active !== false).map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </FSelect>
                    {errors.sede_destino_id && <p className="text-[10px] text-red-500 mt-1">{errors.sede_destino_id}</p>}
                  </div>
                )}

                <div>
                  <FLabel required>
                    Usuario destinatario
                    {isTraslado && form.sede_destino_id && (
                      <span className="ml-2 text-[9px] font-bold normal-case" style={{ color: 'var(--color-text-muted)' }}>
                        (usuarios de la sede seleccionada)
                      </span>
                    )}
                  </FLabel>
                  {loadingUsuariosSede ? (
                    <div className="skeleton h-10 rounded-xl" />
                  ) : (
                    <FSelect
                      value={form.usuario_destino_id}
                      onChange={v => set('usuario_destino_id', v)}
                      disabled={isTraslado && !form.sede_destino_id}
                    >
                      <option value="">
                        {isTraslado && !form.sede_destino_id
                          ? '← Selecciona primero la sede'
                          : usuariosPorSede.length === 0
                            ? 'Sin usuarios en esta sede'
                            : 'Seleccionar usuario...'}
                      </option>
                      {usuariosPorSede.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.first_name} {u.last_name} — {u.cargo || u.role?.name || 'Sin cargo'}
                        </option>
                      ))}
                    </FSelect>
                  )}
                  {errors.usuario_destino_id && <p className="text-[10px] text-red-500 mt-1">{errors.usuario_destino_id}</p>}
                </div>

                <div>
                  <FLabel>Módulo destino</FLabel>
                  <FSelect 
                    value={form.modulo_destino_id} 
                    onChange={v => { set('modulo_destino_id', v); 
                    set('ubicacion_destino_id', ''); }}>
                    <option value="">Sin módulo específico</option>
                    {modulosActivos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </FSelect>
                </div>

                <div>
                  <FLabel>Ubicación destino</FLabel>
                  <FSelect value={form.ubicacion_destino_id} onChange={v => set('ubicacion_destino_id', v)}>
                    <option value="">Sin ubicación específica</option>
                    {ubicacionesDest.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                  </FSelect>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FLabel>Piso</FLabel>
                    <input type="number" value={form.piso_destino}
                      onChange={e => set('piso_destino', e.target.value)}
                      placeholder="Ej: 2"
                      className="w-full text-sm rounded-xl px-3 py-2.5"
                      style={S.input} onFocus={onF} onBlur={offF} />
                  </div>
                  <div>
                    <FLabel>Motivo</FLabel>
                    <FSelect value={form.motivo_transferencia_id} onChange={v => set('motivo_transferencia_id', v)}>
                      <option value="">Sin motivo</option>
                      {motivosTransferencia.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </FSelect>
                  </div>
                </div>

                <div>
                  <FLabel>Descripción / Justificación</FLabel>
                  <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3}
                    placeholder="Describe el motivo del movimiento..."
                    className="w-full text-sm rounded-xl px-3 py-2.5 resize-none"
                    style={S.input} onFocus={onF} onBlur={offF} />
                </div>

                <div className="p-3 rounded-xl" style={{
                  background: isTraslado ? 'rgb(37 99 235 / 0.06)' : 'rgb(22 163 74 / 0.06)',
                  border: `1px solid ${isTraslado ? 'rgb(37 99 235 / 0.2)' : 'rgb(22 163 74 / 0.2)'}`,
                }}>
                  <div className="flex items-start gap-2">
                    <Icon name="info" className="text-[16px] shrink-0 mt-0.5"
                      style={{ color: isTraslado ? '#1d4ed8' : '#16a34a' }} />
                    <p className="text-[11px]" style={{ color: 'var(--color-text-body)' }}>
                      {isTraslado
                        ? 'Solo bienes ACTIVO pueden trasladarse. Flujo: ADMINSEDE → SEGURSEDE salida → SEGURSEDE entrada.'
                        : 'Solo bienes ACTIVO de tu sede pueden asignarse. Requiere aprobación de ADMINSEDE.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter align="right">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSolicitar} disabled={guardando || actualizando || loadingDetalle}
            className="btn-primary flex items-center gap-2">
            {(guardando || actualizando) ? <span className="btn-loading-spin" /> : <Icon name={isEditar ? 'send' : 'add_circle'} className="text-[16px]" />}
            {isEditar ? 'Reenviar orden' : (isTraslado ? 'Registrar traslado' : 'Registrar asignación')}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={confirm}
        title={isEditar ? 'Confirmar reenvío' : (isTraslado ? 'Confirmar traslado' : 'Confirmar asignación')}
        message={`¿${isEditar ? 'Reenviar' : 'Registrar'} con ${form.bien_ids.length} bien(es) seleccionado(s)?`}
        confirmLabel={isEditar ? 'Sí, reenviar' : 'Sí, registrar'}
        variant="primary" loading={guardando}
        onConfirm={handleSubmit} onClose={() => setConfirm(false)} />
    </>
  );
}