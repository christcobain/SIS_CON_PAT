import { useState, useEffect, useMemo } from 'react';
import Modal         from '../../../components/modal/Modal';
import ModalHeader   from '../../../components/modal/ModalHeader';
import ModalBody     from '../../../components/modal/ModalBody';
import ModalFooter   from '../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog';
import { useBienes }     from '../../../hooks/useBienes';
import { useLocaciones } from '../../../hooks/useLocaciones';
import { useUsuarios }   from '../../../hooks/useUsuarios';
import { useCatalogos }  from '../../../hooks/useCatalogos';
import { useBienesEnriquecidos } from '../../../hooks/useBienesEnriquecidos';
import { useAuthStore }  from '../../../store/authStore';
import { useToast }      from '../../../hooks/useToast';
import usuariosService   from '../../../services/usuarios.service';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

// --- ESTILOS Y COMPONENTES DE DISEÑO PRESERVADOS ---
const FUNC_COLOR = {
  TRASLADO_SEDE:      { bg: 'rgb(37 99 235 / 0.1)',  tx: '#1d4ed8', icon: 'local_shipping' },
  ASIGNACION_INTERNA: { bg: 'rgb(127 29 29 / 0.1)', tx: 'var(--color-primary)', icon: 'person_add' }
};

const ESTADO_BIEN_COLOR = {
  ACTIVO:      { bg: 'rgb(22 163 74 / 0.1)',  tx: '#16a34a' },
  MANTENIMIENTO: { bg: 'rgb(180 83 9 / 0.1)', tx: '#b45309' },
  BAJA:        { bg: 'rgb(220 38 38 / 0.1)', tx: '#dc2626' }
};

const S = {
  input: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
    outline: 'none'
  }
};

const onF  = e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; };
const offF = e => { e.currentTarget.style.border = '1px solid var(--color-border)'; };

const FLabel = ({ children }) => (
  <label className="text-[11px] font-black uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>
    {children}
  </label>
);

const FSelect = ({ children, ...p }) => (
  <select {...p} className="w-full p-2.5 rounded-xl text-sm transition-all cursor-pointer" style={S.input} onFocus={onF} onBlur={offF}>
    {children}
  </select>
);

export default function ModalTransferencia({ 
  open, onClose, item, actualizando, 
  crearTraslado, crearAsignacion, reenviarTransferencia, 
  obtenerTransf, // INTEGRADO
  onGuardado 
}) {
  const toast = useToast();
  const user  = useAuthStore(s => s.user);
  const isEditar   = !!item;
  const isTraslado = isEditar ? item.tipo === 'TRASLADO_SEDE' : true;

  const [form, setForm] = useState({
    tipo: isTraslado ? 'TRASLADO_SEDE' : 'ASIGNACION_INTERNA',
    sede_destino_id: '',
    usuario_destino_id: '',
    descripcion: '',
    bien_ids: []
  });

  const [busqueda, setBusqueda] = useState('');
  const [bienesSelected, setBienesSelected] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false); // PARA MANEJAR LA CARGA DEL JSON

  const { sedes } = useLocaciones();
  const { usuarios: destinatarios } = useUsuarios({ 
    sede_id: isTraslado ? form.sede_destino_id : user?.sede_id, 
    activo: true 
  });

  const { bienes, loading: loadingBienes } = useBienes({
    sede_id: user?.sede_id,
    estado_bien: 'ACTIVO',
    search: busqueda,
    limit: 10
  });

  // INTEGRACIÓN DE obtenerTransf PARA POBLAR EL FORMULARIO
  useEffect(() => {
    if (open && isEditar && item?.id && obtenerTransf) {
      const cargar = async () => {
        setCargandoDetalle(true);
        try {
          const data = await obtenerTransf(item.id);
          setForm({
            tipo: data.tipo,
            sede_destino_id: data.sede_destino_id || '',
            usuario_destino_id: data.usuario_destino_id || '',
            descripcion: data.descripcion || '',
            bien_ids: data.bienes?.map(b => b.bien_id) || []
          });
          
          if (data.bienes) {
            setBienesSelected(data.bienes.map(b => ({
              id: b.bien_id,
              tipo_bien_nombre: b.tipo_bien_nombre,
              marca_nombre: b.marca_nombre,
              modelo: b.modelo,
              numero_serie: b.numero_serie,
              codigo_patrimonial: b.codigo_patrimonial
            })));
          }
        } catch (err) {
          toast.error(err.response?.data?.error || "No se pudo cargar la información completa");
        } finally {
          setCargandoDetalle(false);
        }
      };
      cargar();
    } else if (open && !isEditar) {
      setForm({
        tipo: isTraslado ? 'TRASLADO_SEDE' : 'ASIGNACION_INTERNA',
        sede_destino_id: '',
        usuario_destino_id: '',
        descripcion: '',
        bien_ids: []
      });
      setBienesSelected([]);
    }
  }, [open, item, isEditar]);

  const toggleBien = (b) => {
    const exists = bienesSelected.find(x => x.id === b.id);
    let newBienes;
    if (exists) {
      newBienes = bienesSelected.filter(x => x.id !== b.id);
    } else {
      newBienes = [...bienesSelected, b];
    }
    setBienesSelected(newBienes);
    setForm(prev => ({ ...prev, bien_ids: newBienes.map(x => x.id) }));
  };

  const handleSolicitar = () => {
    if (!form.usuario_destino_id) return toast.error('Seleccione un usuario de destino');
    if (isTraslado && !form.sede_destino_id) return toast.error('Seleccione sede de destino');
    if (form.bien_ids.length === 0) return toast.error('Seleccione al menos un bien');
    setConfirm(true);
  };

  const onConfirmar = async () => {
    setConfirm(false);
    setGuardando(true);
    try {
      if (isEditar) {
        await reenviarTransferencia(item.id, { ...form, usuario_id: user?.id });
      } else {
        if (isTraslado) {
          await crearTraslado({ ...form, sede_origen_id: user?.sede_id, usuario_origen_id: user?.id });
        } else {
          await crearAsignacion({ ...form, sede_origen_id: user?.sede_id, usuario_origen_id: user?.id, sede_destino_id: user?.sede_id });
        }
      }
      onGuardado();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setGuardando(false);
    }
  };

  const cfg = FUNC_COLOR[form.tipo];

  return (
    <Modal open={open} onClose={onClose} width="800px">
      <ModalHeader 
        title={isEditar ? `Editar Orden: ${item?.numero_orden}` : (isTraslado ? 'Nuevo Traslado de Sede' : 'Nueva Asignación Directa')} 
        onClose={onClose} 
      />

      <ModalBody>
        <div className="space-y-6">
          <div className="p-4 rounded-2xl flex items-center gap-4" style={{ background: cfg.bg }}>
            <div className="size-12 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm">
              <Icon name={cfg.icon} className="text-[28px]" style={{ color: cfg.tx }} />
            </div>
            <div>
              <p className="text-sm font-black" style={{ color: cfg.tx }}>
                {isTraslado ? 'TRANSFERENCIA ENTRE SEDES' : 'ASIGNACIÓN INTERNA DE BIENES'}
              </p>
              <p className="text-[11px] font-medium opacity-70" style={{ color: cfg.tx }}>
                {isTraslado 
                  ? 'Mueva bienes de una sede a otra con aprobación de seguridad.' 
                  : 'Asigne bienes a un usuario dentro de su misma sede actual.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isTraslado && (
              <div className="flex flex-col">
                <FLabel>Sede Destino</FLabel>
                <FSelect 
                  value={form.sede_destino_id}
                  onChange={e => setForm({ ...form, sede_destino_id: e.target.value, usuario_destino_id: '' })}
                >
                  <option value="">Seleccione sede...</option>
                  {sedes.filter(s => s.id !== user?.sede_id).map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </FSelect>
              </div>
            )}

            <div className="flex flex-col">
              <FLabel>Usuario Destinatario</FLabel>
              <FSelect 
                value={form.usuario_destino_id}
                onChange={e => setForm({ ...form, usuario_destino_id: e.target.value })}
                disabled={isTraslado && !form.sede_destino_id}
              >
                <option value="">Seleccione usuario...</option>
                {destinatarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre_completo} ({u.username})</option>
                ))}
              </FSelect>
            </div>
          </div>

          <div className="flex flex-col">
            <FLabel>Justificación / Descripción</FLabel>
            <textarea
              className="w-full p-3 rounded-xl text-sm transition-all min-h-[80px] resize-none"
              style={S.input} onFocus={onF} onBlur={offF}
              placeholder="Indique el motivo detallado de la transferencia..."
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>

          <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
            <div className="p-3 bg-[var(--color-surface-alt)] border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--color-text-faint)]" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-[var(--color-surface)] border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="Buscar bienes por código patrimonial o serie..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
              {loadingBienes ? (
                <div className="py-10 text-center"><span className="btn-loading-spin !border-t-primary" /></div>
              ) : (
                bienes.map(b => {
                  const isSel = bienesSelected.some(x => x.id === b.id);
                  return (
                    <div 
                      key={b.id}
                      onClick={() => toggleBien(b)}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-[var(--color-surface-alt)]"
                      style={{ 
                        border: isSel ? '1px solid var(--color-primary)' : '1px solid transparent',
                        background: isSel ? 'rgb(127 29 29 / 0.03)' : 'transparent'
                      }}
                    >
                      <div className={`size-5 rounded-md border flex items-center justify-center transition-all ${isSel ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>
                        {isSel && <Icon name="check" className="text-white text-[14px] font-black" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[var(--color-text-primary)]">{b.tipo_bien_nombre} - {b.marca_nombre} {b.modelo}</p>
                        <p className="text-[10px] text-[var(--color-text-faint)] font-mono">
                          CP: {b.codigo_patrimonial || '—'} · SERIE: {b.numero_serie || '—'}
                        </p>
                      </div>
                      <div className="px-2 py-0.5 rounded text-[9px] font-black" style={ESTADO_BIEN_COLOR[b.estado_bien]}>
                        {b.estado_bien}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-start gap-3">
              <Icon name="info" className="text-[20px] text-[var(--color-primary)] shrink-0" />
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Resumen de selección</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-body)' }}>
                  Has seleccionado <strong>{bienesSelected.length} bien(es)</strong> para esta operación. 
                </p>
                <p className="text-[10px] mt-2 italic" style={{ color: 'var(--color-text-body)' }}>
                  {isTraslado 
                    ? 'Solo bienes en estado ACTIVO pueden trasladarse. El flujo requiere aprobación de ADMINSEDE y Seguridad.'
                    : 'Solo bienes en estado ACTIVO de tu sede pueden asignarse. Requiere aprobación de ADMINSEDE.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter align="right">
        <button onClick={onClose} className="btn-secondary">Cancelar</button>
        <button 
          onClick={handleSolicitar} 
          disabled={guardando || actualizando || cargandoDetalle}
          className="btn-primary flex items-center gap-2"
        >
          {(guardando || actualizando || cargandoDetalle) ? <span className="btn-loading-spin" /> : <Icon name={isEditar ? 'send' : 'add_circle'} className="text-[16px]" />}
          {isEditar ? 'Reenviar orden' : (isTraslado ? 'Registrar traslado' : 'Registrar asignación')}
        </button>
      </ModalFooter>

      <ConfirmDialog
        open={confirm}
        title={isEditar ? 'Confirmar reenvío' : (isTraslado ? 'Confirmar traslado' : 'Confirmar asignación')}
        message={`¿Está seguro de ${isEditar ? 'reenviar' : 'registrar'} esta operación con ${form.bien_ids.length} bien(es) seleccionado(s)?`}
        confirmLabel={isEditar ? 'Sí, reenviar' : 'Sí, registrar'}
        onConfirm={onConfirmar}
        onClose={() => setConfirm(false)}
        loading={guardando}
      />
    </Modal>
  );
}