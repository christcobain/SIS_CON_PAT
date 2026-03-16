import { useState } from 'react';
import Modal from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);


const InfoField = ({ label, value, icon, variant = 'default' }) => (
  <div className={`flex gap-3 p-3 rounded-xl border transition-all `}>
    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
      variant === 'primary' ? 'bg-primary text-white' : 'bg-faint/10 text-faint'
    }`}>
      <Icon name={icon} className="text-[18px]" />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] text-faint font-black uppercase tracking-tighter mb-0.5">{label}</p>
      <p className="text-[11px] font-bold text-main truncate leading-tight">{value || '---'}</p>
    </div>
  </div>
);

export default function ModalDetalleTransferencia({ open, onClose, item, actualizando, acciones }) {
  const [tab, setTab] = useState('ruta');

  if (!item) return null;

  const {
    numero_orden, estado, bienes = [], tipo, descripcion, motivo_nombre,
    sede_origen_nombre, modulo_origen_nombre, ubicacion_origen_nombre, piso_origen, usuario_origen_nombre,
    sede_destino_nombre, modulo_destino_nombre, ubicacion_destino_nombre, piso_destino, usuario_destino_nombre,
    fecha_registro, cancelacion_nombre, motivo_devolucion, aprobaciones = [],
    pdf_path, tiene_pdf_firmado, fecha_pdf
  } = item;

  const isCancelado = estado === 'CANCELADO' || !!cancelacion_nombre;
  const isDevuelto = estado === 'DEVUELTO' || !!motivo_devolucion;

  const TABS = [
    { id: 'ruta', label: 'Ruta y Logística', icon: 'alt_route' },
    { id: 'bienes', label: 'Bienes Transferidos', icon: 'inventory_2' },
    { id: 'seguimiento', label: 'Seguimiento', icon: 'analytics' },
  ];

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader 
        icon="sync_alt"
        title={`Detalle de Transferencia`}
        subtitle={`Orden de movimiento de activos patrimoniales`}
        onClose={onClose}
      />

      <ModalBody padding={false}>
        {/* Nav de Tabs Estilo Premium */}
        <div className="flex gap-8 px-8 ">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 py-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 
                ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-faint hover:text-muted'}`}
            >
              <Icon name={t.icon} className="text-[18px]" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 h-[550px]">
          {/* COLUMNA PRINCIPAL (9) */}
          <div className="col-span-9 overflow-y-auto p-8  border-r  custom-scrollbar">
            
            {tab === 'ruta' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Visualización de Ruta Origen -> Destino */}
                <div className="relative grid grid-cols-2 gap-12">
                  {/* Conector Visual */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center size-10 rounded-full bg-white border border-border-light shadow-sm text-primary">
                    <Icon name="arrow_forward" className="text-xl animate-pulse" />
                  </div>

                  {/* Origen */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="size-2 rounded-full bg-primary" />
                      <h4 >Punto de Origen</h4>
                    </div>
                    <InfoField label="Sede Remitente" value={sede_origen_nombre} icon="location_on" />
                    <InfoField label="Módulo / Ubicación" value={`${modulo_origen_nombre} - ${ubicacion_origen_nombre}`} icon="layers" />
                    <div className="grid grid-cols-2 gap-3">
                      <InfoField label="Nivel / Piso" value={`Piso ${piso_origen}`} icon="stairs" />
                      <InfoField label="Responsable" value={usuario_origen_nombre} icon="person" />
                    </div>
                  </div>

                  {/* Destino */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="size-2 rounded-full bg-blue-500" />
                      <h4 >Punto de Destino</h4>
                    </div>
                    <InfoField label="Sede Receptora" value={sede_destino_nombre} icon="distance" />
                    <InfoField label="Módulo / Ubicación" value={`${modulo_destino_nombre} - ${ubicacion_destino_nombre}`} icon="meeting_room" />
                    <div className="grid grid-cols-2 gap-3">
                      <InfoField label="Nivel / Piso" value={`Piso ${piso_destino}`} icon="stairs" />
                      <InfoField label="Responsable" value={usuario_destino_nombre} icon="person_check" />
                    </div>
                  </div>
                </div>

                {/* Justificación */}
                <div className="bg-surface p-5 rounded-2xl border border-border-light relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:rotate-12 transition-transform">
                    <Icon name="format_quote" className="text-4xl text-primary" />
                  </div>
                  <p className="text-[10px] text-faint font-black uppercase mb-3 tracking-widest flex items-center gap-2">
                    <Icon name="subject" className="text-sm" />
                    Motivo y Justificación
                  </p>
                  <p className="text-xs font-bold text-primary mb-1">{motivo_nombre}</p>
                  <p className="text-sm italic text-body leading-relaxed  bg-white/50 p-3 rounded-lg border border-dashed border-border-light">
                    "{descripcion || 'Sin descripción detallada.'}"
                  </p>
                </div>
              </div>
            )}

            {tab === 'bienes' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-4 px-1">
                   <h3 className="text-xs font-black uppercase tracking-widest text-faint">Listado de Activos ({bienes.length})</h3>
                   <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md font-black uppercase">Inventariados</span>
                </div>
                <div className="table-premium overflow-hidden border border-border-light rounded-2xl shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-surface-alt border-b border-border-light">
                      <tr>
                        <th className="p-4 font-black uppercase tracking-tighter text-faint">Cód. Patrimonial</th>
                        <th className="p-4 font-black uppercase tracking-tighter text-faint">Descripción del Bien</th>
                        <th className="p-4 font-black uppercase tracking-tighter text-faint text-right">Serie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light bg-white">
                      {bienes.map(b => (
                        <tr key={b.id} className="hover:bg-surface transition-colors">
                          <td className="p-4 font-bold text-primary font-mono tracking-tight">{b.codigo_patrimonial}</td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-black text-main uppercase text-[11px]">{b.tipo_bien_nombre}</span>
                              <span className="text-[10px] text-faint">{b.marca_nombre} • {b.modelo}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right text-faint font-mono font-bold">{b.numero_serie || 'S/N'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'seguimiento' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                {(isCancelado || isDevuelto) && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex gap-4 items-start shadow-sm shadow-red-100">
                    <div className="size-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
                       <Icon name="gpp_bad" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">
                        {isCancelado ? 'Operación Anulada' : 'Devolución de Activos'}
                      </p>
                      <p className="text-sm text-red-600 italic font-medium mt-1">
                        "{isCancelado ? cancelacion_nombre : motivo_devolucion}"
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="relative pl-10 space-y-10 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-primary before:to-border-light">
                  {/* Inicio */}
                  <div className="relative">
                    <div className="absolute -left-[35px] size-8 rounded-full bg-primary flex items-center justify-center border-4 border-white shadow-md text-white">
                      <Icon name="history_edu" className="text-[16px]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-main uppercase tracking-tighter">Registro de Orden</p>
                      <p className="text-[10px] text-faint font-bold">{new Date(fecha_registro).toLocaleString()}</p>
                    </div>
                  </div>

                  {aprobaciones.map((aprob) => (
                    <div key={aprob.id} className="relative group">
                      <div className="absolute -left-[35px] size-8 rounded-full bg-green-500 flex items-center justify-center border-4 border-white shadow-md text-white transition-transform group-hover:scale-110">
                        <Icon name="verified" className="text-[16px]" />
                      </div>
                      <div className="bg-surface-alt/50 p-4 rounded-xl border border-border-light group-hover:bg-white transition-all">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-black text-main uppercase">
                            {aprob.accion.replace(/_/g, ' ')}
                          </p>
                          <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase">
                            {aprob.rol_aprobador.split('_')[0]}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted font-medium mt-2 border-l-2 border-border-light pl-3 italic">
                          "{aprob.detalle}"
                        </p>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border-light">
                          <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Icon name="person" className="text-sm" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-main uppercase leading-none">{aprob.rol_aprobador_nombre}</span>
                             <span className="text-[9px] text-faint font-bold mt-1">{new Date(aprob.fecha).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR DERECHO (3) */}
          <div className="col-span-3 bg-surface-alt/30 p-6 flex flex-col">
            <div className="text-center pb-6 border-b border-border-light">
              <p className="text-[9px] text-faint font-black uppercase tracking-widest mb-2">Orden de Transferencia</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-border-light rounded-full mb-3">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-black text-primary font-mono">{numero_orden}</span>
              </div>
            </div>

            <div className="flex-1 py-8 space-y-8">
              {/* Documentación */}
              <div>
                <p className="text-[9px] text-faint font-black uppercase mb-4 tracking-widest">Documentación</p>
                {tiene_pdf_firmado ? (
                  <div className="p-4 rounded-2xl border border-green-200 bg-white flex items-center gap-3 shadow-sm">
                    <div className="size-9 rounded-xl bg-green-500 text-white flex items-center justify-center">
                      <Icon name="check_circle" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-main uppercase">PDF Firmado</p>
                      <p className="text-[9px] text-green-600 font-bold truncate italic">{fecha_pdf}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed border-border-light bg-surface flex items-center gap-3 opacity-60">
                    <div className="size-9 rounded-xl bg-faint text-white flex items-center justify-center">
                      <Icon name="timer" />
                    </div>
                    <p className="text-[10px] font-black text-faint uppercase leading-tight">Pendiente de Firma Digital</p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="space-y-4">
                 <p className="text-[9px] text-faint font-black uppercase tracking-widest">Resumen de Operación</p>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-border-light">
                      <span className="text-[10px] text-faint font-black uppercase">Estado</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        estado === 'ATENDIDO' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                      }`}>
                        {estado.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-border-light">
                      <span className="text-[10px] text-faint font-black uppercase">Bienes</span>
                      <span className="text-xs font-black text-main">{bienes.length} Items</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Micro-brand o Logo */}
            <div className="pt-6 border-t border-border-light text-center">
               <p className="text-[8px] font-black text-faint uppercase tracking-[0.3em]">Sistema de Gestión de Activos</p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter align="between">
        <div className="flex gap-4 items-center">
          <button onClick={onClose} className="btn-secondary px-6 font-black text-[11px] uppercase tracking-widest border border-border-light">
            Cerrar Ventana
          </button>
          {pdf_path && (
            <button className="flex items-center gap-2 text-[11px] font-black text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors uppercase tracking-tighter">
              <Icon name="picture_as_pdf" /> 
              Ver Orden PDF
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {estado === 'PENDIENTE_APROBACION' && (
            <button 
              className="btn-primary flex items-center gap-2 px-8 py-3 shadow-xl shadow-primary/25"
              onClick={() => acciones.aprobarAdminSede(item.id)}
              disabled={actualizando}
            >
              <Icon name="verified" className={actualizando ? 'animate-spin' : ''} />
              <span className="font-black uppercase tracking-widest text-xs">Aprobar Transferencia</span>
            </button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}