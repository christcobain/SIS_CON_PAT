import { useState, useEffect } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useMantenimientos } from '../../../../hooks/useMantenimientos';
import { useBienes }         from '../../../../hooks/useBienes';
import { useLocaciones }     from '../../../../hooks/useLocaciones';
import { useAuthStore }      from '../../../../store/authStore';
import { useToast }          from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const TA_BASE = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  outline: 'none',
};

const SEL_BASE = { ...TA_BASE, cursor: 'pointer' };

const ICON_TIPO = (nombre = '') => {
  const n = nombre.toUpperCase();
  if (n.includes('CPU') || n.includes('COMPU') || n.includes('LAPTOP')) return 'computer';
  if (n.includes('MONITOR'))   return 'desktop_windows';
  if (n.includes('IMPRESORA')) return 'print';
  if (n.includes('SCANNER'))   return 'scanner';
  return 'devices';
};

function FLabel({ children, required }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </p>
  );
}

export default function ModalCrearMantenimiento({ open, onClose, onGuardado }) {
  const toast  = useToast();
  const { crear } = useMantenimientos();
  const { listarPorUsuario } = useBienes();
  const { modulos } = useLocaciones();
  const user = useAuthStore(s => s.user);

  const [bienes,        setBienes]        = useState([]);
  const [loadingBienes, setLoadingBienes] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);
  const [datosIniciales, setDatosIniciales] = useState('');
  const [moduloId,      setModuloId]      = useState('');
  const [errors,        setErrors]        = useState({});
  const [confirm,       setConfirm]       = useState(false);
  const [guardando,     setGuardando]     = useState(false);

  useEffect(() => {
    if (!open || !user?.id) return;
    setSeleccionados([]); setDatosIniciales(''); setModuloId(''); setErrors({});
    setLoadingBienes(true);
    listarPorUsuario(user.id)
      .then(d => setBienes(Array.isArray(d) ? d : d?.results ?? []))
      .catch(() => setBienes([]))
      .finally(() => setLoadingBienes(false));
  }, [open, user?.id]);

  const toggleBien = id =>
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const validar = () => {
    const e = {};
    if (!seleccionados.length) e.bienes = 'Selecciona al menos un bien.';
    return e;
  };

  const handleGuardar = async () => {
    setConfirm(false);
    setGuardando(true);
    try {
      const payload = {
        bien_ids: seleccionados,
        ...(datosIniciales.trim() && { datos_iniciales: datosIniciales.trim() }),
        ...(moduloId && { modulo_id: Number(moduloId) }),
      };
      await crear(payload);
      toast.success('Orden de mantenimiento creada exitosamente.');
      onGuardado();
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.response?.data?.detail || 'Error al crear el mantenimiento.');
    } finally { setGuardando(false); }
  };

  const handleSolicitar = () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    setConfirm(true);
  };

  const modulosActivos = (modulos ?? []).filter(m => m.is_active !== false);

  return (
    <>
      <Modal open={open} onClose={onClose} size="lg">
        <ModalHeader icon="build_circle"
          title="Nueva orden de mantenimiento"
          subtitle="Todos los bienes seleccionados deben pertenecer al mismo custodio"
          onClose={onClose}
        />
        <ModalBody>
          <div className="space-y-5">
            <div>
              <FLabel required>Bienes a mantener</FLabel>
              <p className="text-[10px] mb-3" style={{ color: 'var(--color-text-faint)' }}>
                Bienes asignados a tu usuario. Selecciona los que requieren mantenimiento.
              </p>

              {loadingBienes ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
              ) : bienes.length === 0 ? (
                <div className="text-center py-8 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                  <Icon name="inventory_2" className="text-[36px]" style={{ color: 'var(--color-text-faint)' }} />
                  <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Sin bienes asignados a tu usuario</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
                  {bienes.map(b => {
                    const sel = seleccionados.includes(b.id);
                    return (
                      <label key={b.id}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer"
                        style={{
                          background: sel ? 'rgb(127 29 29 / 0.06)' : 'var(--color-surface-alt)',
                          border: `1px solid ${sel ? 'rgb(127 29 29 / 0.3)' : 'var(--color-border)'}`,
                        }}>
                        <div className="relative size-5 shrink-0">
                          <input type="checkbox" checked={sel} onChange={() => toggleBien(b.id)}
                            className="appearance-none size-5 rounded transition-all"
                            style={{
                              border: `2px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`,
                              background: sel ? 'var(--color-primary)' : 'transparent',
                            }} />
                          {sel && <Icon name="check" className="absolute inset-0 text-[12px] pointer-events-none"
                            style={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />}
                        </div>

                        <div className="size-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: sel ? 'rgb(127 29 29 / 0.1)' : 'var(--color-border-light)' }}>
                          <Icon name={ICON_TIPO(b.tipo_bien_nombre)} className="text-[17px]"
                            style={{ color: sel ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {b.tipo_bien_nombre} — {b.marca_nombre}
                          </p>
                          <p className="text-[10px] font-mono truncate" style={{ color: 'var(--color-text-muted)' }}>
                            {b.codigo_patrimonial ?? 'Sin código'} · {b.modelo}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: sel ? 'rgb(127 29 29 / 0.1)' : 'transparent', color: sel ? 'var(--color-primary)' : 'transparent' }}>
                            {sel ? 'Seleccionado' : ''}
                          </span>
                          <p className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
                            {b.estado_funcionamiento_nombre}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {errors.bienes && (
                <p className="text-[10px] text-red-500 mt-1.5 font-semibold flex items-center gap-1">
                  <Icon name="error" className="text-[12px]" />{errors.bienes}
                </p>
              )}

              {seleccionados.length > 0 && (
                <div className="flex items-center gap-2 mt-2 px-1">
                  <Icon name="check_circle" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-[11px] font-bold" style={{ color: 'var(--color-primary)' }}>
                    {seleccionados.length} bien(es) seleccionado(s)
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FLabel>Módulo funcional</FLabel>
                <select value={moduloId} onChange={e => setModuloId(e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2.5 transition-all"
                  style={SEL_BASE}
                  onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
                  onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}>
                  <option value="">Sin módulo específico</option>
                  {modulosActivos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
                <p className="text-[9px] mt-1" style={{ color: 'var(--color-text-faint)' }}>Opcional — módulo donde se realizará el mantenimiento</p>
              </div>

              <div>
                <FLabel>Observación / Datos iniciales</FLabel>
                <textarea value={datosIniciales} onChange={e => setDatosIniciales(e.target.value)} rows={3}
                  placeholder="Describe el problema, síntoma o motivo del mantenimiento..."
                  className="w-full text-sm rounded-xl px-3 py-2.5 transition-all resize-none"
                  style={TA_BASE}
                  onFocus={e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
                  onBlur={e => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgb(37 99 235 / 0.06)', border: '1px solid rgb(37 99 235 / 0.2)' }}>
              <Icon name="info" className="text-[17px] shrink-0 mt-0.5" style={{ color: '#1d4ed8' }} />
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-body)' }}>
                La orden quedará en estado <strong>EN PROCESO</strong>. Luego, desde el detalle podrás agregar imágenes de evidencia y enviar a aprobación de ADMINSEDE cuando estén los trabajos realizados.
              </p>
            </div>
          </div>
        </ModalBody>

        <ModalFooter align="right">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSolicitar} disabled={guardando || !seleccionados.length}
            className="btn-primary flex items-center gap-2">
            {guardando ? <span className="btn-loading-spin" /> : <Icon name="build_circle" className="text-[16px]" />}
            Crear orden
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog open={confirm}
        title="Confirmar creación"
        message={`¿Crear orden de mantenimiento con ${seleccionados.length} bien(es)?`}
        confirmLabel="Sí, crear" variant="primary" loading={guardando}
        onConfirm={handleGuardar} onClose={() => setConfirm(false)} />
    </>
  );
}