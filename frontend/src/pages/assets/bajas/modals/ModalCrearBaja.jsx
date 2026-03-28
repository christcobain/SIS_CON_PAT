import { useState, useEffect } from 'react';
import Modal from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useBajas } from '../../../../hooks/useBajas';
import { useCatalogos } from '../../../../hooks/useCatalogos';
import { useToast } from '../../../../hooks/useToast';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function ModalCrearBaja({ open, onClose, onGuardado }) {
  const toast = useToast();
  const { bienesParaBaja, crear } = useBajas();
  const { fetchCatalogos, motivosBaja = [] } = useCatalogos();

  const [loading, setLoading] = useState(false);
  const [bienesDisponibles, setBienesDisponibles] = useState([]);
  const [bienSeleccionado, setBienSeleccionado] = useState(null);
  const [confirm, setConfirm] = useState(false);

  const [form, setForm] = useState({
    bien_id: '',
    mantenimiento_id: '',
    motivo_baja_id: '',
    antecedentes: '',
    analisis: '',
    conclusiones: '',
    recomendaciones: ''
  });

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchCatalogos(['motivosBaja']);
      bienesParaBaja()
        .then(res => setBienesDisponibles(res || []))
        .finally(() => setLoading(false));
    } else {
      // Limpiar formulario al cerrar
      setBienSeleccionado(null);
      setForm({ bien_id: '', mantenimiento_id: '', motivo_baja_id: '', antecedentes: '', analisis: '', conclusiones: '', recomendaciones: '' });
    }
  }, [open]);

  const handleSelectBien = (e) => {
    const id = e.target.value;
    const bien = bienesDisponibles.find(b => String(b.bien_id) === String(id));
    setBienSeleccionado(bien);
    setForm(prev => ({ 
      ...prev, 
      bien_id: id, 
      mantenimiento_id: '',
      antecedentes: bien ? `El bien ${bien.tipo_bien_nombre} (${bien.codigo_patrimonial}) presenta fallas técnicas según reporte.` : ''
    }));
  };

  const handleSelectMant = (e) => {
    const id = e.target.value;
    const mant = bienSeleccionado?.mantenimientos_disponibles.find(m => String(m.mantenimiento_id) === String(id));
    if (mant) {
      // Usamos la información técnica del mantenimiento para llenar el análisis
      const sustento = `DIAGNÓSTICO FINAL: ${mant.diagnostico_final}\nDETALLE: ${mant.observacion_detalle}\nESTADO: ${mant.estado_funcionamiento_final_nombre}`;
      setForm(prev => ({ 
        ...prev, 
        mantenimiento_id: id,
        analisis: sustento,
        recomendaciones: `Proceder con la baja definitiva según Orden N° ${mant.numero_orden}.`
      }));
    }
  };

  const handleGuardar = async () => {
    setConfirm(false);
    setLoading(true);
    try {
      await crear(form);
      toast.success("Baja registrada exitosamente");
      onGuardado();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.error||"Error al registrar la baja");
    } finally {
      setLoading(false);
    }
  };

  const isFormValido = form.bien_id && form.motivo_baja_id && form.analisis.length > 5;

  // Estilos básicos en línea para no depender de archivos CSS externos
  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    fontSize: '0.875rem',
    outline: 'none'
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="900px">
      <ModalHeader title="Crear Informe de Baja" icon="gavel" onClose={onClose} />
      
      <ModalBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SECCIÓN DE SELECCIÓN */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-faint mb-1 ml-1">Bien Inoperativo</label>
              <select style={inputStyle} value={form.bien_id} onChange={handleSelectBien}>
                <option value="">-- Seleccionar Bien --</option>
                {bienesDisponibles.map(b => (
                  <option key={b.bien_id} value={b.bien_id}>
                    {b.codigo_patrimonial} - {b.tipo_bien_nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-faint mb-1 ml-1">Mantenimiento de Referencia</label>
              <select 
                style={inputStyle} 
                value={form.mantenimiento_id} 
                onChange={handleSelectMant}
                disabled={!bienSeleccionado}
              >
                <option value="">-- Seleccione una Orden --</option>
                {bienSeleccionado?.mantenimientos_disponibles.map(m => (
                  <option key={m.mantenimiento_id} value={m.mantenimiento_id}>
                    {m.numero_orden} ({m.estado_funcionamiento_final_nombre})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-faint mb-1 ml-1">Motivo de Baja</label>
              <select 
                style={inputStyle} 
                value={form.motivo_baja_id} 
                onChange={e => setForm({...form, motivo_baja_id: e.target.value})}
              >
                <option value="">-- Seleccione Motivo --</option>
                {motivosBaja.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SECCIÓN DE TEXTOS (INFORME) */}
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-surface-alt border">
            {[
              { id: 'antecedentes', label: 'Antecedentes', rows: 2 },
              { id: 'analisis', label: 'Sustento Técnico (Autocompletado)', rows: 4 },
              { id: 'conclusiones', label: 'Conclusiones', rows: 2 },
              { id: 'recomendaciones', label: 'Recomendaciones', rows: 2 }
            ].map(campo => (
              <div key={campo.id}>
                <label className="block text-[10px] font-bold uppercase text-faint mb-1 ml-1">{campo.label}</label>
                <textarea
                  style={{...inputStyle, resize: 'none'}}
                  rows={campo.rows}
                  value={form[campo.id]}
                  onChange={e => setForm({...form, [campo.id]: e.target.value})}
                />
              </div>
            ))}
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} className="btn-secondary">Cerrar</button>
        <button 
          disabled={!isFormValido || loading} 
          onClick={() => setConfirm(true)} 
          className="btn-primary flex items-center gap-2"
        >
          {loading ? <span className="btn-loading-spin" /> : <Icon name="save" />}
          Registrar Baja
        </button>
      </ModalFooter>

      <ConfirmDialog
        open={confirm}
        title="Confirmar Registro"
        message="¿Está seguro de generar este informe técnico de baja?"
        onConfirm={handleGuardar}
        onCancel={() => setConfirm(false)}
      />
    </Modal>
  );
}