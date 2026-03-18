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
      className={`flex items-start gap-3 p-3 rounded-xl transition-all ${puedeSeleccionar ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
      style={{
        background: seleccionado ? 'rgb(127 29 29 / 0.06)' : 'var(--color-surface-alt)',
        border: `1px solid ${seleccionado ? 'rgb(127 29 29 / 0.3)' : 'var(--color-border)'}`,
      }}>
      <div className="relative size-5 mt-0.5 shrink-0">
        <input type="checkbox" checked={seleccionado} onChange={() => puedeSeleccionar && onToggle(b.id)}
          disabled={!puedeSeleccionar}
          className="appearance-none size-5 rounded transition-all"
          style={{
            border: `2px solid ${seleccionado ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: seleccionado ? 'var(--color-primary)' : 'transparent',
          }} />
        {seleccionado && <Icon name="check" className="absolute inset-0 flex items-center justify-center text-[11px] pointer-events-none" style={{ color: '#fff' }} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{b.tipo_bien_nombre} — {b.marca_nombre}</p>
            <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{b.codigo_patrimonial ?? 'S/C'} · {b.modelo}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: estadoB.bg, color: estadoB.color }}>
              {b.estado_bien_nombre ?? '—'}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: funcB.bg, color: funcB.color }}>
              {b.estado_funcionamiento_nombre ?? '—'}
            </span>
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Icon name="domain" className="text-[12px]" style={{ color: 'var(--color-text-faint)' }} />
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{b.sede_nombre ?? `Sede #${b.sede_id}`}</span>
          </div>
          {b.modulo_nombre && (
            <div className="flex items-center gap-1">
              <Icon name="grid_view" className="text-[12px]" style={{ color: 'var(--color-text-faint)' }} />
              <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{b.modulo_nombre}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Icon name="person" className="text-[12px]" style={{ color: 'var(--color-text-faint)' }} />
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{b.usuario_asignado_nombre ?? '—'}</span>
          </div>
          {b.piso != null && (
            <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>Piso {b.piso}</span>
          )}
        </div>
        {!puedeSeleccionar && (
          <p className="text-[10px] mt-1.5 font-semibold" style={{ color: estadoB.color }}>
            ⚠ No disponible — estado: {b.estado_bien_nombre}
          </p>
        )}
      </div>
    </label>
  );
}

const FORM_BASE = {
  bien_ids: [], usuario_destino_id: '', sede_destino_id: '',
  modulo_destino_id: '', ubicacion_destino_id: '',
  piso_destino: '', motivo_transferencia: '', descripcion: '',
};

export default function ModalTransferencia({
  open, onClose, activeTab, item, actualizando,
  crearTraslado, crearAsignacion, reenviarTransferencia, onGuardado,
}) {
  const toast      = useToast();
  const isTraslado = activeTab === 'TRASLADO_SEDE';
  const isEditar   = !!item;
 
  const sedes_auth = useAuthStore(s => s.sedes);
  const sede_auth_id = sedes_auth?.[0]?.id;


  const { bienes: todosBienes, loading: loadingBienes } = useBienes({});
  const { sedes, modulos,ubicaciones } = useLocaciones();
  const { usuarios: usuariosMs } = useUsuarios({ is_active: true });
  const { fetchCatalogos, motivosTransferencia = [] } = useCatalogos();

  const bienesConNombres = useBienesEnriquecidos(todosBienes, { sedes, modulos, usuarios: usuariosMs });

  const [form,      setForm]      = useState({ ...FORM_BASE });
  const [buscador,  setBuscador]  = useState('');
  const [errors,    setErrors]    = useState({});
  const [confirm,   setConfirm]   = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchCatalogos(['motivosTransferencia']);
    setErrors({}); setBuscador('');
    if (isEditar && item) {
      setForm({
        bien_ids:             (item.bienes ?? []).map(b => b.bien_id).filter(Boolean),
        usuario_destino_id:   String(item.usuario_destino_id ?? ''),
        sede_destino_id:      String(item.sede_destino_id ?? ''),
        modulo_destino_id:    String(item.modulo_destino_id ?? ''),
        ubicacion_destino_id: String(item.ubicacion_destino_id ?? ''),
        piso_destino:         item.piso_destino ?? '',
        motivo_transferencia_id:            String(item.motivo_transferencia_id ?? ''),
        descripcion:          item.descripcion ?? '',
      });
    } else {
      setForm({ ...FORM_BASE, sede_destino_id: isTraslado ? '' : String(sede_auth_id ?? '') });
    }
  }, [open, item?.id, isTraslado]);

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

  // const sedeDestObj       = (sedes ?? []).find(s => String(s.id) === String(form.sede_destino_id));
  const ubicacionesDest   = (ubicaciones ?? []).filter(m => m.is_active !== false);
  const modulosActivos    = (modulos ?? []).filter(m => m.is_active !== false);
  const toggleBien = id => set('bien_ids', form.bien_ids.includes(id) ? form.bien_ids.filter(x => x !== id) : [...form.bien_ids, id]);

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
      ...(form.motivo_transferencia_id            && { motivo_transferencia_id:            Number(form.motivo_transferencia_id)            }),
      ...(form.descripcion.trim()   && { descripcion:          form.descripcion.trim()           }),
    };
    try {
      let result;
      if (isEditar) {
        result =await reenviarTransferencia(item.id, payload);
      } else if (isTraslado) {
        result=await crearTraslado(payload);
      } else {
        result =await crearAsignacion(payload);
      }
      toast.success(result?.message  );
      onGuardado();
    } catch (err) {
      toast.error( err?.response.data );
    } finally { setGuardando(false); }
  };

  const handleSolicitar = () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    setConfirm(true);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="xl">
        <ModalHeader
          icon={isTraslado ? 'local_shipping' : 'person_add'}
          title={isEditar ? `Reenviar ${item.numero_orden}` : (isTraslado ? 'Nuevo traslado entre sedes' : 'Nueva asignación interna')}
          subtitle={isTraslado
            ? 'Mueve bienes hacia otra sede. Requiere aprobación de ADMINSEDE y V°B° SEGURSEDE.'
            : 'Asigna bienes a un usuario final dentro de tu sede.'}
          onClose={onClose}
        />

        <ModalBody>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-4">
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
                {loadingBienes ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
                ) : bienesFiltradosBuscador.length === 0 ? (
                  <div className="text-center py-8 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                    <Icon name="inventory_2" className="text-[32px]" style={{ color: 'var(--color-text-faint)' }} />
                    <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Sin bienes{buscador ? ' con esa búsqueda' : ' disponibles'}</p>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '45vh' }}>
                    {bienesFiltradosBuscador.map(b => (
                      <TarjetaBien key={b.id} b={b}
                        seleccionado={form.bien_ids.includes(b.id)}
                        onToggle={toggleBien} />
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

            <div className="space-y-4">
              {isTraslado && (
                <div>
                  <FLabel required>Sede destino</FLabel>
                  <FSelect value={form.sede_destino_id}
                    onChange={v => { set('sede_destino_id', v); set('modulo_destino_id', ''); set('ubicacion_destino_id', ''); }}>
                    <option value="">Seleccionar sede...</option>
                    {(sedes ?? []).filter(s => s.is_active !== false).map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </FSelect>
                  {errors.sede_destino_id && <p className="text-[10px] text-red-500 mt-1">{errors.sede_destino_id}</p>}
                </div>
              )}

              <div>
                <FLabel required>Usuario destinatario</FLabel>
                <FSelect value={form.usuario_destino_id} onChange={v => set('usuario_destino_id', v)}>
                  <option value="">Seleccionar usuario...</option>
                  {(usuariosMs ?? []).map(u => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name} — {u.cargo}</option>
                  ))}
                </FSelect>
                {errors.usuario_destino_id && <p className="text-[10px] text-red-500 mt-1">{errors.usuario_destino_id}</p>}
              </div>

              <div>
                <FLabel>Módulo destino</FLabel>
                <FSelect value={form.modulo_destino_id} onChange={v => { set('modulo_destino_id', v); set('ubicacion_destino_id', ''); }}>
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
                      ? 'Solo bienes en estado ACTIVO pueden trasladarse. El flujo requiere: ADMINSEDE → SEGURSEDE salida → SEGURSEDE entrada.'
                      : 'Solo bienes en estado ACTIVO de tu sede pueden asignarse. Requiere aprobación de ADMINSEDE.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter align="right">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSolicitar} disabled={guardando || actualizando}
            className="btn-primary flex items-center gap-2">
            {(guardando || actualizando) ? <span className="btn-loading-spin" /> : <Icon name={isEditar ? 'send' : 'add_circle'} className="text-[16px]" />}
            {isEditar ? 'Reenviar orden' : (isTraslado ? 'Registrar traslado' : 'Registrar asignación')}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog open={confirm}
        title={isEditar ? 'Confirmar reenvío' : (isTraslado ? 'Confirmar traslado' : 'Confirmar asignación')}
        message={`¿${isEditar ? 'Reenviar' : 'Registrar'} con ${form.bien_ids.length} bien(es) seleccionado(s)?`}
        confirmLabel={isEditar ? 'Sí, reenviar' : 'Sí, registrar'}
        variant="primary" loading={guardando}
        onConfirm={handleSubmit} onClose={() => setConfirm(false)} />
    </>
  );
}