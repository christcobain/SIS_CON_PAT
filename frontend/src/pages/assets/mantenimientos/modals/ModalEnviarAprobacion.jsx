import { useState, useEffect } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useToast }     from '../../../../hooks/useToast';
import { useCatalogos } from '../../../../hooks/useCatalogos';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const INPUT_STYLE = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  outline: 'none',
};

export default function ModalEnviarAprobacion({ open, onClose, item, onEnviar }) {
  const toast = useToast();
  const { fetchCatalogos,estadosFuncionamiento } = useCatalogos();
  
  const [detalles, setDetalles] = useState([]);
  const [confirm,  setConfirm]  = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open && item?.detalles) {
      const iniciales = item.detalles.map(d => ({
        bien_id: d.bien_id,
        bien_nombre: d.tipo_bien_nombre  || `Bien #${d.bien_id}`,
        codigo_patrimonial: d.codigo_patrimonial,
        marca_nombre:d.marca_nombre,
        modelo:d.modelo,
        estado_funcionamiento_final_id: d.estado_funcionamiento_final || '',
        diagnostico_inicial: d.diagnostico_inicial|| '', 
        trabajo_realizado:d.trabajo_realizado|| '',
        diagnostico_final: d.diagnostico_final||'',
        observacion_detalle: d.observacion_detalle||''
      }));
      setDetalles(iniciales);
      fetchCatalogos(['estadosFuncionamiento']);
    }
  }, [open, item]);

  const handleUpdateDetalle = (bienId, field, value) => {
    setDetalles(prev => prev.map(d => 
      d.bien_id === bienId ? { ...d, [field]: value } : d
    ));
  };

  const validar = () => {
    const incompleto = detalles.some(d => 
      !String(d.estado_funcionamiento_final_id).trim() || !d.diagnostico_inicial.trim()|| !d.trabajo_realizado.trim() || !d.diagnostico_final.trim()
    );
    if (incompleto) {
      toast.error('Por favor, completa el informe técnico de todos los bienes (Estado, Trabajo y Diagnóstico Final).');
      return false;
    }
    return true;
  };

  const handleConfirmar = () => {
    if (validar()) setConfirm(true);
  };

  const handleEnviar = async () => {
    setConfirm(false);
    setEnviando(true);
    try {
      const payload = {
        detalles_tecnicos: detalles.map(d => ({
          bien_id: d.bien_id,
          estado_funcionamiento_final_id: parseInt(d.estado_funcionamiento_final_id),
          diagnostico_inicial: d.diagnostico_inicial.trim(),
          trabajo_realizado: d.trabajo_realizado.trim(),
          diagnostico_final: d.diagnostico_final.trim(),
          observacion_detalle: d.observacion_detalle.trim()
        }))
      };

      await onEnviar(item.id, payload);
      onClose();
    } catch (e) {
      console.error("Error al enviar aprobación:", e);
      toast.error(e?.response?.data?.error || 'Error al enviar el informe técnico.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="xl">
        <ModalHeader 
          icon="fact_check" 
          title={`Finalizar Mantenimiento: ${item?.numero_orden}`}
          subtitle="Registra el informe técnico final para cada bien"
          onClose={onClose} 
        />
        
        <ModalBody>          
          <div className="space-y-6">
            {detalles.map((d, idx) => (
              <div key={d.bien_id} className="p-4 rounded-2xl border border-border bg-surface-alt/30 space-y-4">
                {/* Cabecera del Bien */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-6 flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-black">{idx + 1}</span>
                    <p className="text-xs font-black uppercase text-primary">{d.bien_nombre} - </p>
                    <p className="text-xs font-black uppercase text-orange-500"> Cód. Pat. {d.codigo_patrimonial}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black text-muted uppercase">Estado Final:</label>
                    <select
                      value={d.estado_funcionamiento_final_id}
                      onChange={e => handleUpdateDetalle(d.bien_id, 'estado_funcionamiento_final_id', e.target.value)}
                      className="text-[11px] font-bold rounded-lg px-2 py-1.5"
                      style={INPUT_STYLE}
                    >
                      <option value="">Seleccionar...</option>
                      {estadosFuncionamiento.map(est => (
                        <option key={est.id} value={est.id}>{est.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Grid de Informe */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Diagnóstico Inicial  */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase text-muted ml-1">Diagnóstico Inicial<span className="text-red-500">*</span></p>
                    <textarea
                      value={d.diagnostico_inicial}
                      onChange={e => handleUpdateDetalle(d.bien_id, 'diagnostico_inicial', e.target.value)}
                      rows={2}
                      placeholder="Ej. Equipo con suciedad total en componentes...."
                      className="w-full text-xs rounded-xl px-3 py-2 transition-all resize-none focus:border-primary"
                      style={INPUT_STYLE}
                    />
                  </div>

                  {/* Trabajo Realizado */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase text-muted ml-1">Trabajo Realizado <span className="text-red-500">*</span></p>
                    <textarea
                      value={d.trabajo_realizado}
                      onChange={e => handleUpdateDetalle(d.bien_id, 'trabajo_realizado', e.target.value)}
                      rows={2}
                      placeholder="Ej. Limpieza de ventiladores, cambio de pasta..."
                      className="w-full text-xs rounded-xl px-3 py-2 transition-all resize-none focus:border-primary"
                      style={INPUT_STYLE}
                    />
                  </div>

                  {/* Diagnóstico Final */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase text-muted ml-1">Diagnóstico Final <span className="text-red-500">*</span></p>
                    <textarea
                      value={d.diagnostico_final}
                      onChange={e => handleUpdateDetalle(d.bien_id, 'diagnostico_final', e.target.value)}
                      rows={2}
                      placeholder="Ej. Equipo operativo sin recalentamiento..."
                      className="w-full text-xs rounded-xl px-3 py-2 transition-all resize-none focus:border-primary"
                      style={INPUT_STYLE}
                    />
                  </div>
                </div>

                {/* Observación Detalle */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-muted ml-1">Observación adicional (Opcional)</p>
                  <input
                    type="text"
                    value={d.observacion_detalle}
                    onChange={e => handleUpdateDetalle(d.bien_id, 'observacion_detalle', e.target.value)}
                    placeholder="Algún comentario extra sobre el equipo..."
                    className="w-full text-xs rounded-xl px-3 py-2.5 transition-all focus:border-primary"
                    style={INPUT_STYLE}
                  />
                </div>
              </div>
            ))}
          </div>
        </ModalBody>

        <ModalFooter align="right">
          <button onClick={onClose} className="btn-secondary" disabled={enviando}>Cancelar</button>
          <button 
            onClick={handleConfirmar} 
            disabled={enviando || detalles.length === 0} 
            className="btn-primary flex items-center gap-2"
          >
            {enviando ? <span className="btn-loading-spin" /> : <Icon name="send" className="text-[16px]" />}
            Enviar Informe Técnico
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog 
        open={confirm}
        title="¿Enviar a Aprobación?"
        message={`Se generará el informe técnico de ${detalles.length} equipo(s). El Administrador de Sede deberá dar el visto bueno final.`}
        confirmLabel="Sí, enviar ahora" 
        variant="primary" 
        loading={enviando}
        onConfirm={handleEnviar} 
        onClose={() => setConfirm(false)} 
      />
    </>
  );
}