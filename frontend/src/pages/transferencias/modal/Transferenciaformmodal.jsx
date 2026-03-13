import { useState } from 'react';
import Modal       from '../../../components/modal/Modal';
import ModalHeader from '../../../components/modal/ModalHeader';
import ModalBody   from '../../../components/modal/ModalBody';
import ModalFooter from '../../../components/modal/ModalFooter';
import { useToast }          from '../../../components/feedback/useToast';
import { useTransferencias } from '../../../hooks/useTransferencias';

const INPUT_CLS = `w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700
  bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm
  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`;


export default function TransferenciaFormModal({ open, onClose }) {
  const toast = useToast();
  const { crearAsignacion, actualizando } = useTransferencias();
  const PASO_MAX = 3;
  const [paso, setPaso] = useState(1);
  const [busqueda,   setBusqueda]   = useState('');
  const [activos,    setActivos]    = useState([
    { id: 1, codigo: 'CP-098234', descripcion: 'Laptop Dell Latitude 5420 - i7 16GB' },
    { id: 2, codigo: 'CP-098551', descripcion: 'Monitor LG 27" 4K Ergo Stand' },
  ]);
  const [oficina,    setOficina]    = useState('');
  const [custodio,   setCustodio]   = useState('');
  const [motivo,     setMotivo]     = useState('');
  const quitarActivo = (id) => setActivos((p) => p.filter((a) => a.id !== id));
  const handleEnviar = async () => {
    if (!activos.length)  { toast.warning('Seleccione al menos un activo.'); return; }
    if (!oficina)         { toast.warning('Seleccione la oficina destino.'); return; }
    if (!custodio)        { toast.warning('Seleccione el custodio destino.'); return; }
    try {
      await crearAsignacion({ activos, oficina, custodio, motivo });
      toast.success('Asignación enviada para aprobación.');
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al crear la asignación.');
    }
  };

  const pctPaso = Math.round((paso / PASO_MAX) * 100);

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader
        title="Nueva Asignación Interna"
        subtitle="Gestión de activos institucionales"
        icon="assignment_add"
        onClose={onClose}
      />

      {/* Barra de progreso */}
      <div className="px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Paso {paso} de {PASO_MAX}:{' '}
            {paso === 1 ? 'Selección de Activos'
              : paso === 2 ? 'Detalles del Destinatario'
              : 'Justificación'}
          </span>
          <span className="text-xs font-bold text-slate-500">{pctPaso}% Completado</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div className="bg-primary h-full rounded-full transition-all duration-500"
               style={{ width: `${pctPaso}%` }} />
        </div>
      </div>
      <ModalBody>
        <div className="space-y-8">
          {/* Paso 1: Activos */}
          {paso === 1 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">inventory_2</span>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Activos a Asignar
                </h3>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2
                                 material-symbols-outlined text-slate-400 text-xl
                                 pointer-events-none">search</span>
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por código patrimonial (ej: PAT-2024-001)..."
                  className={INPUT_CLS + ' pl-10'} />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200
                              dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      {['Código','Descripción','Estado','Acción'].map((h, i) => (
                        <th key={h} className={`px-4 py-3 text-xs font-bold text-slate-500 uppercase
                                               ${i === 3 ? 'text-right' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {activos.map((a) => (
                      <tr key={a.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {a.codigo}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {a.descripcion}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30
                                           text-green-700 font-medium">
                            Disponible
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => quitarActivo(a.id)}
                            className="text-red-400 hover:text-red-600 transition-colors">
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700
                                bg-slate-50/50 dark:bg-slate-900/20">
                  <p className="text-xs text-slate-500 italic">
                    {activos.length} activos seleccionados.
                  </p>
                </div>
              </div>
            </section>
          )}
          {/* Paso 2: Destinatario */}
          {paso === 2 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">person_add</span>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Detalles del Destinatario
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Oficina / Unidad
                  </label>
                  <select value={oficina} onChange={(e) => setOficina(e.target.value)}
                    className={INPUT_CLS}>
                    <option value="">Seleccione oficina...</option>
                    <option value="ti">Tecnologías de Información</option>
                    <option value="rrhh">Recursos Humanos</option>
                    <option value="fin">Finanzas y Contabilidad</option>
                    <option value="log">Logística</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Usuario / Custodio Destino
                  </label>
                  <select value={custodio} onChange={(e) => setCustodio(e.target.value)}
                    className={INPUT_CLS}>
                    <option value="">Seleccione usuario...</option>
                    <option value="1">García, Juan - Especialista TI</option>
                    <option value="2">Martínez, Ana - Analista Contable</option>
                    <option value="3">Ramírez, Luis - Jefe de Logística</option>
                  </select>
                </div>
              </div>
            </section>
          )}
          {/* Paso 3: Justificación */}
          {paso === 3 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">description</span>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Justificación y Notas
                </h3>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Motivo de la asignación
                </label>
                <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={4}
                  placeholder="Describa brevemente la razón de este movimiento interno..."
                  className={`block w-full border border-slate-200 dark:border-slate-700 rounded-xl
                              bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100
                              text-sm p-4 focus:outline-none focus:ring-2 focus:ring-primary/20
                              focus:border-primary transition-all resize-none`} />
              </div>
            </section>
          )}

        </div>
      </ModalBody>
      <ModalFooter align="between">
        <div className="flex items-center gap-2 text-slate-400 text-xs italic">
          <span className="material-symbols-outlined text-base">info</span>
          Se generará un acta de asignación digital para firma.
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={actualizando}
            className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700
                       text-slate-700 dark:text-slate-300 font-semibold text-sm
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          {paso < PASO_MAX ? (
            <button onClick={() => setPaso(p => p + 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white
                         font-semibold text-sm hover:bg-red-900 shadow-md shadow-primary/20 transition-all">
              Siguiente
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          ) : (
            <button onClick={handleEnviar} disabled={actualizando}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white
                         font-semibold text-sm hover:bg-red-900 shadow-lg shadow-primary/20
                         transition-all disabled:opacity-60">
              {actualizando ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : null}
              Enviar para Aprobación
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}