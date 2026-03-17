import { useState, useEffect } from 'react';
import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import { useBienes } from '../../../../hooks/useBienes';


const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function ModalTransferencia({ 
  open, onClose, activeTab, item, actualizando, 
  crearTraslado, crearAsignacion, reenviarTransferencia, onGuardado 
}) {
  const isTraslado = activeTab === 'TRASLADO_SEDE';
  const isEdit = !!item;
  const { bienes, loading: loadingBienes } = useBienes({ estado: 'ACTIVO' });
  const [formData, setFormData] = useState({
    bien_ids: [],
    motivo_id: '',
    descripcion: '',
    sede_destino_id: '',
    usuario_destino_id: '',
    modulo_destino_id: '',
    piso_destino: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        bien_ids: item.detalles?.map(d => d.bien_id) || [],
        motivo_id: item.motivo || '',
        descripcion: item.descripcion || '',
        sede_destino_id: item.sede_destino_id || '',
        usuario_destino_id: item.usuario_destino_id || '',
        modulo_destino_id: item.modulo_destino_id || '',
        piso_destino: item.piso_destino || ''
      });
    } else {
      setFormData({ bien_ids: [], motivo_id: '', descripcion: '', sede_destino_id: '', usuario_destino_id: '', modulo_destino_id: '', piso_destino: '' });
    }
  }, [item, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await reenviarTransferencia(item.id, formData);
      } else {
        isTraslado ? await crearTraslado(formData) : await crearAsignacion(formData);
      }
      onGuardado();
    } catch (error) {
      console.error("Error al procesar:", error);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader 
        icon={isTraslado ? 'local_shipping' : 'person_add'}
        title={isEdit ? `Reenviar Orden ${item.numero_orden}` : (isTraslado ? 'Nuevo Traslado entre Sedes' : 'Nueva Asignación Interna')}
        subtitle={isEdit ? 'Modifique los campos observados para el reenvío.' : 'Complete los datos para iniciar el flujo de movimiento.'}
        onClose={onClose}
      />

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Selección de Bienes (Multi-select simple por ahora) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="form-label flex justify-between">
                Activos a Transferir 
                {loadingBienes && <span className="text-[10px] animate-pulse">Cargando catálogo...</span>}
              </label>
              <select 
                multiple
                className="form-select min-h-[100px]"
                value={formData.bien_ids}
                onChange={(e) => setFormData({...formData, bien_ids: Array.from(e.target.selectedOptions, o => o.value)})}
                required
              >
                {bienes.map(b => (
                  <option key={b.id} value={b.id}>[{b.codigo_patrimonial}] {b.tipo_bien_nombre} - {b.marca_nombre}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted italic">Mantenga presionado Ctrl para seleccionar varios bienes.</p>
            </div>

            {/* Campos dinámicos según tipo */}
            <div className="space-y-1.5">
              <label className="form-label">{isTraslado ? 'Sede Destino' : 'Módulo Destino'}</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="ID de destino..."
                value={isTraslado ? formData.sede_destino_id : formData.modulo_destino_id}
                onChange={(e) => setFormData({...formData, [isTraslado ? 'sede_destino_id' : 'modulo_destino_id']: e.target.value})}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">{isTraslado ? 'Coordinador Receptor (ID)' : 'Usuario Final (ID)'}</label>
              <input 
                type="number" 
                className="form-input"
                value={formData.usuario_destino_id}
                onChange={(e) => setFormData({...formData, usuario_destino_id: e.target.value})}
                required
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="form-label">Descripción / Justificación</label>
              <textarea 
                className="form-input min-h-[80px] py-3" 
                placeholder="Especifique el motivo del movimiento..."
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={actualizando}>Cancelar</button>
          <button type="submit" className="btn-primary px-8" disabled={actualizando || loadingBienes}>
            {actualizando ? 'Procesando...' : (isEdit ? 'Reenviar Orden' : 'Registrar Movimiento')}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}