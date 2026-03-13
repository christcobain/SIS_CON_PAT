import { useState, useEffect } from 'react';
import Modal       from '../../../components/modal/Modal';
import ModalHeader from '../../../components/modal/ModalHeader';
import ModalBody   from '../../../components/modal/ModalBody';
import ModalFooter from '../../../components/modal/ModalFooter';
import { useToast } from '../../../components/feedback/useToast';
import { useBienes } from '../../../hooks/useBienes';


function Seccion({ icon, titulo, children, tinted = false }) {
  return (
    <section className={`rounded-xl p-5 border ${
      tinted ? 'bg-primary/5 dark:bg-primary/10 border-primary/10'
             : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {titulo}
        </h3>
      </div>
      {children}
    </section>
  );
}

function Campo({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</label>
      {children}
    </div>
  );
}
const INPUT_CLS = `w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700
  bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm
  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`;
const SELECT_CLS = INPUT_CLS;
const DISABLED_CLS = `w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700
  bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed text-sm`;

export default function BienFormModal({ open, onClose, bien = null }) {
  const toast = useToast();
  const { crear, actualizar, actualizando } = useBienes({});
  const esEdicion = !!bien;

  const [form, setForm] = useState({
    codigo_patrimonial: '', categoria: '', estado_conservacion: '',
    marca: '', modelo: '', numero_serie: '', sede: '', modulo: '',
    procesador: '', ram: '16 GB', sistema_operativo: '', tipo_disco: 'SSD NVMe',
    capacidad_disco: '', observaciones: '',
  });

  useEffect(() => {
    if (bien) {
      setForm({
        codigo_patrimonial: bien.codigo_patrimonial || '',
        categoria: bien.categoria?.id || '',
        estado_conservacion: bien.estado_conservacion?.id || '',
        marca: bien.marca?.id || '',
        modelo: bien.modelo || '',
        numero_serie: bien.numero_serie || '',
        sede: bien.sede_id || '',
        modulo: bien.modulo_id || '',
        procesador: bien.detalle_cpu?.procesador || '',
        ram: bien.detalle_cpu?.ram || '16 GB',
        sistema_operativo: bien.detalle_cpu?.sistema_operativo || '',
        tipo_disco: bien.detalle_cpu?.tipo_disco || 'SSD NVMe',
        capacidad_disco: bien.detalle_cpu?.capacidad_disco || '',
        observaciones: bien.observaciones || '',
      });
    }
  }, [bien]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleGuardar = async () => {
    if (!form.codigo_patrimonial || !form.modelo) {
      toast.warning('Complete los campos obligatorios.');
      return;
    }
    try {
      if (esEdicion) {
        await actualizar(bien.id, form);
        toast.success('Bien actualizado correctamente.');
      } else {
        await crear(form);
        toast.success('Bien registrado correctamente.');
      }
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al guardar el bien.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader
        title={esEdicion ? 'Edición de Bien Patrimonial' : 'Registro de Nuevo Bien Patrimonial'}
        subtitle={esEdicion
          ? 'Actualice la información del activo seleccionado'
          : 'Ingrese los datos para el alta de activo en el sistema institucional'}
        icon={esEdicion ? 'edit_square' : 'inventory_2'}
        onClose={onClose}
      />

      <ModalBody>
        <div className="space-y-5">

          {/* Información General */}
          <Seccion icon="info" titulo="Información General del Activo">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Campo label="Código Patrimonial *">
                {esEdicion
                  ? <input value={form.codigo_patrimonial} disabled className={DISABLED_CLS} />
                  : <input value={form.codigo_patrimonial} onChange={set('codigo_patrimonial')}
                      placeholder="Ej. 740805000001" className={INPUT_CLS} />}
              </Campo>
              <Campo label="Categoría">
                <select value={form.categoria} onChange={set('categoria')} className={SELECT_CLS}>
                  <option value="">Seleccione...</option>
                  <option value="cpu">Equipo de Cómputo (CPU)</option>
                  <option value="monitor">Monitor</option>
                  <option value="mobiliario">Mobiliario</option>
                  <option value="vehiculo">Vehículo</option>
                </select>
              </Campo>
              <Campo label="Estado de Conservación">
                <select value={form.estado_conservacion} onChange={set('estado_conservacion')}
                  className={SELECT_CLS}>
                  <option value="">Seleccione...</option>
                  <option>Bueno</option>
                  <option>Regular</option>
                  <option>Malo</option>
                </select>
              </Campo>
              <Campo label="Marca">
                <select value={form.marca} onChange={set('marca')} className={SELECT_CLS}>
                  <option value="">Seleccione...</option>
                  <option>DELL</option><option>HP</option>
                  <option>LENOVO</option><option>APPLE</option>
                </select>
              </Campo>
              <Campo label="Modelo *">
                <input value={form.modelo} onChange={set('modelo')}
                  placeholder="Ej. ThinkCentre M70q" className={INPUT_CLS} />
              </Campo>
              <Campo label="Número de Serie">
                <input value={form.numero_serie} onChange={set('numero_serie')}
                  placeholder="S/N" className={INPUT_CLS} />
              </Campo>
            </div>
          </Seccion>

          {/* Ubicación */}
          <Seccion icon="location_on" titulo="Ubicación del Bien">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Sede">
                <select value={form.sede} onChange={set('sede')} className={SELECT_CLS}>
                  <option value="">Seleccione sede...</option>
                  <option>Sede Central</option>
                  <option>Sede Norte</option>
                </select>
              </Campo>
              <Campo label="Módulo / Oficina">
                <select value={form.modulo} onChange={set('modulo')} className={SELECT_CLS}>
                  <option value="">Seleccione módulo...</option>
                  <option>Administración</option>
                  <option>Tecnologías de Información</option>
                </select>
              </Campo>
            </div>
          </Seccion>

          {/* Especificaciones Técnicas CPU */}
          <Seccion icon="memory" titulo="Especificaciones Técnicas (CPU)" tinted>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Campo label="Procesador">
                <input value={form.procesador} onChange={set('procesador')}
                  placeholder="Ej. Intel Core i7 12va Gen" className={INPUT_CLS} />
              </Campo>
              <Campo label="Memoria RAM">
                <select value={form.ram} onChange={set('ram')} className={SELECT_CLS}>
                  <option>8 GB</option><option>16 GB</option>
                  <option>32 GB</option><option>64 GB</option>
                </select>
              </Campo>
              <Campo label="Sistema Operativo">
                <input value={form.sistema_operativo} onChange={set('sistema_operativo')}
                  placeholder="Ej. Windows 11 Pro" className={INPUT_CLS} />
              </Campo>
              <Campo label="Tipo de Disco">
                <select value={form.tipo_disco} onChange={set('tipo_disco')} className={SELECT_CLS}>
                  <option>SSD NVMe</option><option>SSD</option><option>HDD</option>
                </select>
              </Campo>
              <Campo label="Capacidad">
                <input value={form.capacidad_disco} onChange={set('capacidad_disco')}
                  placeholder="Ej. 512 GB" className={INPUT_CLS} />
              </Campo>
            </div>
          </Seccion>

          {/* Observaciones */}
          <Seccion icon="history_edu" titulo="Observaciones">
            <textarea value={form.observaciones} onChange={set('observaciones')} rows={3}
              placeholder={esEdicion
                ? 'Justifique el motivo del cambio realizado...'
                : 'Ingrese cualquier detalle relevante del bien...'}
              className={`w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700
                          bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm
                          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                          resize-none`} />
          </Seccion>

        </div>
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} disabled={actualizando}
          className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700
                     text-slate-700 dark:text-slate-300 font-semibold text-sm
                     hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button onClick={handleGuardar} disabled={actualizando}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white
                     font-semibold text-sm hover:bg-red-900 shadow-md shadow-primary/20
                     transition-all disabled:opacity-60">
          {actualizando ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <span className="material-symbols-outlined text-[18px]">save</span>
          )}
          {esEdicion ? 'Actualizar Cambios' : 'Guardar Bien'}
        </button>
      </ModalFooter>
    </Modal>
  );
}