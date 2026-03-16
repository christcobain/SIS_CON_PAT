import Modal from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const SectionTitle = ({ title, icon }) => (
  <div className="flex items-center gap-2 mb-4 border-b border-border-light pb-2">
    <Icon name={icon} className="text-primary text-[18px]" />
    <h3 className="text-[11px] font-black uppercase text-body tracking-wider">{title}</h3>
  </div>
);

const InfoCard = ({ label, value, subValue, icon, variant = 'default' }) => (
  <div className={`p-3 rounded-xl border ${variant === 'primary' ? 'bg-primary/5 border-primary/10' : 'bg-surface border-border-light'}`}>
    <div className="flex items-start gap-3">
      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${variant === 'primary' ? 'bg-primary text-white' : 'bg-surface-alt text-muted'}`}>
        <Icon name={icon} className="text-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-faint font-bold uppercase leading-none mb-1">{label}</p>
        <p className="text-xs font-bold text-body truncate">{value || '---'}</p>
        {subValue && <p className="text-[10px] text-muted truncate mt-0.5">{subValue}</p>}
      </div>
    </div>
  </div>
);

export default function ModalDetalleTransferencia({ open, onClose, item, actualizando, acciones }) {
  if (!item) return null;

  const {
    numero_orden, estado, bienes = [], tipo, descripcion, motivo_nombre,
    sede_origen_nombre, modulo_origen_nombre, ubicacion_origen_nombre, piso_origen, usuario_origen_nombre,
    sede_destino_nombre, modulo_destino_nombre, ubicacion_destino_nombre, piso_destino, usuario_destino_nombre,
    fecha_registro, cancelacion_nombre, motivo_devolucion
  } = item;

  const isCancelado = estado === 'CANCELADO';
  const isDevuelto = estado === 'DEVUELTO';

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader 
        icon="sync_alt"
        title={`Orden de Transferencia: ${numero_orden}`}
        subtitle={`Gestión de movimiento de activos patrimoniales`}
        onClose={onClose}
      />

      <ModalBody padding={false} className="bg-surface-alt/30">
        <div className="flex flex-col md:flex-row h-full max-h-[75vh]">
          
          {/* COLUMNA IZQUIERDA: DETALLES TÉCNICOS */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            
            {/* 1. RUTA DEL MOVIMIENTO */}
            <SectionTitle title="Ruta del Movimiento" icon="route" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative">
              {/* Icono Conector en Desktop */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 size-8 bg-white rounded-full border border-border-light items-center justify-center shadow-sm">
                <Icon name="arrow_forward" className="text-primary text-[18px]" />
              </div>

              <InfoCard 
                label="Origen / Remitente"
                value={sede_origen_nombre}
                subValue={`${modulo_origen_nombre} - ${ubicacion_origen_nombre} (Piso ${piso_origen})`}
                icon="location_on"
              />
              <InfoCard 
                label="Destino / Receptor"
                value={sede_destino_nombre}
                subValue={`${modulo_destino_nombre} - ${ubicacion_destino_nombre} (Piso ${piso_destino})`}
                icon="distance"
                variant="primary"
              />
            </div>

            {/* 2. RESPONSABLES */}
            <SectionTitle title="Responsables Directos" icon="group" />
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-alt/50">
                <div className="size-8 rounded-full bg-white border border-border-light flex items-center justify-center font-bold text-[10px] text-primary">OR</div>
                <div className="min-w-0">
                  <p className="text-[9px] text-faint font-bold uppercase">Entrega</p>
                  <p className="text-xs font-medium truncate">{usuario_origen_nombre}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-alt/50">
                <div className="size-8 rounded-full bg-white border border-border-light flex items-center justify-center font-bold text-[10px] text-primary">DE</div>
                <div className="min-w-0">
                  <p className="text-[9px] text-faint font-bold uppercase">Recibe</p>
                  <p className="text-xs font-medium truncate">{usuario_destino_nombre}</p>
                </div>
              </div>
            </div>

            {/* 3. MOTIVO Y DESCRIPCIÓN */}
            <SectionTitle title="Justificación" icon="description" />
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-black uppercase">{motivo_nombre}</span>
              </div>
              <p className="text-sm text-body leading-relaxed italic">"{descripcion || 'Sin descripción detallada'}"</p>
            </div>

            {/* 4. BIENES */}
            <SectionTitle title={`Bienes Identificados (${bienes.length})`} icon="inventory_2" />
            <div className="border border-border-light rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-alt border-b border-border-light">
                  <tr>
                    <th className="p-3 text-[10px] font-black uppercase text-muted">Código</th>
                    <th className="p-3 text-[10px] font-black uppercase text-muted">Descripción del Bien</th>
                    <th className="p-3 text-[10px] font-black uppercase text-muted">Serie / Modelo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {bienes.map(b => (
                    <tr key={b.id} className="hover:bg-surface-alt/30 transition-colors">
                      <td className="p-3 text-xs font-black text-primary font-mono">{b.codigo_patrimonial}</td>
                      <td className="p-3 text-xs text-body font-medium">{b.tipo_bien_nombre} <br/><span className="text-[10px] text-muted uppercase font-bold">{b.marca_nombre}</span></td>
                      <td className="p-3 text-xs text-muted">
                         <span className="block">{b.numero_serie || 'S/N'}</span>
                         <span className="text-[10px] italic">{b.modelo}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COLUMNA DERECHA: TIMELINE & STATUS */}
          <div className="w-full md:w-[320px] p-6 border-l border-border-light bg-surface-alt/40 overflow-y-auto">
            <SectionTitle title="Estado Actual" icon="verified_user" />
            
            {/* Badge de Estado */}
            <div className="mb-8 p-4 rounded-2xl bg-white border border-border-light shadow-sm text-center">
              <p className="text-[10px] text-faint font-bold uppercase mb-2">Estado de la Orden</p>
              <span className={`px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase inline-block
                ${isCancelado ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
                {estado.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Alerta de Cancelación o Devolución */}
            {(isCancelado || isDevuelto) && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="error" className="text-[16px]" />
                  <p className="text-[10px] font-black uppercase">Motivo {isCancelado ? 'Cancelación' : 'Devolución'}</p>
                </div>
                <p className="text-xs italic">"{isCancelado ? cancelacion_nombre : motivo_devolucion}"</p>
              </div>
            )}

            <SectionTitle title="Seguimiento" icon="history" />
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-border-light">
              
              {/* Evento: Registro (Siempre existe) */}
              <div className="relative flex items-start gap-4 pl-8">
                <div className="absolute left-0 mt-1 size-6 rounded-full bg-white border-2 border-primary flex items-center justify-center z-10">
                  <Icon name="add_circle" className="text-primary text-[14px]" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-body">REGISTRO DE ORDEN</p>
                  <p className="text-[10px] text-muted">{new Date(fecha_registro).toLocaleString()}</p>
                </div>
              </div>

              {/* Aquí podrías mapear un historial real si el backend tuviera una tabla de logs */}
              {item.ultima_aprobacion && (
                <div className="relative flex items-start gap-4 pl-8">
                  <div className="absolute left-0 mt-1 size-6 rounded-full bg-white border-2 border-green-500 flex items-center justify-center z-10">
                    <Icon name="check_circle" className="text-primary text-[14px]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-body">ÚLTIMA ACCIÓN</p>
                    <p className="text-[10px] text-muted">
            {typeof item.ultima_aprobacion === 'object' 
              ? `${item.ultima_aprobacion.rol_aprobador}: ${item.ultima_aprobacion.accion}`
              : item.ultima_aprobacion}
          </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter align="between">
        <div className="flex items-center gap-4">
          <button className="btn-secondary h-9 px-4 gap-2" onClick={onClose}>
             Cerrar Ventana
          </button>
          {item.pdf_path && (
            <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
              <Icon name="picture_as_pdf" /> Descargar Orden
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          {estado === 'PENDIENTE_APROBACION' && (  
            <button 
              className="btn-primary h-9 px-6 font-black tracking-tighter shadow-lg shadow-primary/20" 
              onClick={() => acciones.aprobarAdminSede(item.id)}
              disabled={actualizando}
            >
              <Icon name="verified" className="text-[18px]" /> APROBAR TRANSFERENCIA
            </button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}