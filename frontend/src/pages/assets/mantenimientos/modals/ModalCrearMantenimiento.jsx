import { useState, useEffect } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useMantenimientos } from '../../../../hooks/useMantenimientos';
import { useBienes }         from '../../../../hooks/useBienes';
import { useAuthStore }      from '../../../../store/authStore';
import { useToast }          from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const ICON_TIPO = (n = '') => {
  const u = n.toUpperCase();
  if (u.includes('CPU') || u.includes('COMPU')) return 'computer';
  if (u.includes('MONITOR'))   return 'desktop_windows';
  if (u.includes('IMPRESORA')) return 'print';
  if (u.includes('SCANNER'))   return 'scanner';
  return 'devices';
};

const FUNC_COLOR = (n = '') => {
  const u = n.toUpperCase();
  if (u === 'OPERATIVO')   return '#16a34a';
  if (u === 'AVERIADO')    return '#b45309';
  if (u === 'INOPERATIVO') return '#dc2626';
  return 'var(--color-text-faint)';
};

export default function ModalCrearMantenimiento({ open, onClose, onGuardado }) {
  const toast = useToast();
  const { crear } = useMantenimientos();
  const { listarPorUsuario } = useBienes();
  const user = useAuthStore(s => s.user);

  const [bienes,        setBienes]        = useState([]);
  const [loadingBienes, setLoadingBienes] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);
  const [errors,        setErrors]        = useState({});
  const [confirm,       setConfirm]       = useState(false);
  const [guardando,     setGuardando]     = useState(false);

  useEffect(() => {
    if (!open || !user?.id) return;
    setSeleccionados([]); setErrors({});
    setLoadingBienes(true);
    listarPorUsuario(user.id)
      .then(d => setBienes(Array.isArray(d) ? d : d?.results ?? []))
      .catch(() => setBienes([]))
      .finally(() => setLoadingBienes(false));
  }, [open, user?.id]);

  const toggleBien = id =>
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectAll = () => setSeleccionados(bienes.map(b => b.id));
  const clearAll  = () => setSeleccionados([]);

  const handleSolicitar = () => {
    if (!seleccionados.length) { setErrors({ bienes: 'Selecciona al menos un bien.' }); return; }
    setConfirm(true);
  };

  const handleGuardar = async () => {
    setConfirm(false);
    setGuardando(true);
    try {
      await crear({ bien_ids: seleccionados });
      toast.success('Orden de mantenimiento creada exitosamente.');
      onGuardado();
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.response?.data?.detail || 'Error al crear el mantenimiento.');
    } finally { setGuardando(false); }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="md">
        <ModalHeader icon="build_circle"
          title="Nueva orden de mantenimiento"
          subtitle="Selecciona los bienes del mismo custodio que requieren servicio"
          onClose={onClose}
        />

        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Bienes disponibles
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Bienes activos asignados a tu usuario
                </p>
              </div>
              {bienes.length > 0 && (
                <div className="flex items-center gap-2">
                  <button onClick={selectAll}
                    className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    style={{ background: 'rgb(127 29 29 / 0.08)', color: 'var(--color-primary)' }}>
                    Todo
                  </button>
                  <button onClick={clearAll}
                    className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                    Limpiar
                  </button>
                </div>
              )}
            </div>

            {loadingBienes ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
            ) : bienes.length === 0 ? (
              <div className="text-center py-10 rounded-xl"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                <Icon name="inventory_2" className="text-[36px]" style={{ color: 'var(--color-text-faint)' }} />
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Sin bienes asignados</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
                  No tienes bienes activos asignados a tu usuario
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[44vh] overflow-y-auto pr-1">
                {bienes.map(b => {
                  const sel = seleccionados.includes(b.id);
                  const fc  = FUNC_COLOR(b.estado_funcionamiento_nombre ?? '');
                  return (
                    <label key={b.id}
                      className="flex items-center gap-3 p-3.5 rounded-xl transition-all cursor-pointer"
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
                        {sel && <Icon name="check" className="absolute inset-0 flex items-center justify-center text-[11px] pointer-events-none" style={{ color: '#fff' }} />}
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
                        <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                          {b.codigo_patrimonial ?? 'Sin código'} · {b.modelo}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-[9px] font-bold block" style={{ color: fc }}>
                          {b.estado_funcionamiento_nombre ?? '—'}
                        </span>
                        {sel && (
                          <span className="text-[9px] font-black" style={{ color: 'var(--color-primary)' }}>✓</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {errors.bienes && (
              <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                <Icon name="error" className="text-[12px]" />{errors.bienes}
              </p>
            )}

            {seleccionados.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <Icon name="check_circle" className="text-[15px]" style={{ color: 'var(--color-primary)' }} />
                <p className="text-[11px] font-bold" style={{ color: 'var(--color-primary)' }}>
                  {seleccionados.length} de {bienes.length} bien(es) seleccionado(s)
                </p>
              </div>
            )}

            <div className="flex items-start gap-2.5 p-3 rounded-xl"
              style={{ background: 'rgb(37 99 235 / 0.06)', border: '1px solid rgb(37 99 235 / 0.2)' }}>
              <Icon name="info" className="text-[16px] shrink-0 mt-0.5" style={{ color: '#1d4ed8' }} />
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-body)' }}>
                La orden se crea en estado <strong>EN PROCESO</strong>. Todos los bienes seleccionados deben tener el mismo custodio. Desde el detalle podrás agregar imágenes de evidencia y enviar a aprobación.
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