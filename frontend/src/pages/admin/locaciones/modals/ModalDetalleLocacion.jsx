import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';


const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const TAB_META = {
  sedes:       { label: 'Sede',      icon: 'location_city', iconBg: '#dbeafe', iconColor: '#2563eb' },
  modulos:     { label: 'Módulo',    icon: 'widgets',       iconBg: '#ede9fe', iconColor: '#7c3aed' },
  ubicaciones: { label: 'Ubicación', icon: 'room',          iconBg: '#d1fae5', iconColor: '#059669' },
};

function InfoRow({ label, value, icon }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
      {icon && (
        <Icon name={icon} className="text-[17px] mt-0.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'long' });
}

export default function ModalDetalleLocacion({ open, onClose, activeTab, item, onEditar }) {
  if (!item) return null;
  const meta = TAB_META[activeTab] ?? TAB_META.sedes;

  return (
    <Modal open={open} onClose={onClose} size="md">
      <ModalHeader
        icon={meta.icon}
        title={item.nombre}
        subtitle={`Detalle de ${meta.label.toLowerCase()}`}
        onClose={onClose}
      />

      <ModalBody>
        {/* Card de identidad */}
        <div
          className="flex items-center gap-4 mb-5 p-4 rounded-xl"
          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
        >
          <div className="p-3 rounded-xl shrink-0" style={{ background: meta.iconBg }}>
            <Icon name={meta.icon} className="text-[26px]" style={{ color: meta.iconColor }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-black" style={{ color: 'var(--color-text-primary)' }}>
              {item.nombre}
            </p>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              ID #{item.id}
            </p>
            <span className={`inline-flex items-center gap-1.5 mt-2 ${item.is_active ? 'badge-activo' : 'badge-inactivo'}`}>
              <span className={`size-1.5 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
              {item.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {/* Campos según tab */}
        <div>
          {activeTab === 'sedes' && (
            <>
              <InfoRow label="Empresa"       value={item.empresa_nombre}      icon="domain"        />
              <InfoRow label="Dirección"     value={item.direccion}           icon="location_on"   />
              <InfoRow label="Distrito"      value={item.distrito_nombre}     icon="map"           />
              <InfoRow label="Provincia"     value={item.provincia_nombre}    icon="map"           />
              <InfoRow label="Departamento"  value={item.departamento_nombre} icon="map"           />
            </>
          )}
          {activeTab === 'modulos' && (
            <InfoRow label="Nombre del Módulo" value={item.nombre} icon="widgets" />
          )}
          {activeTab === 'ubicaciones' && (
            <InfoRow label="Descripción" value={item.descripcion} icon="description" />
          )}
          <InfoRow label="Fecha de registro" value={formatDate(item.created_at)} icon="calendar_today" />
          <InfoRow label="Última actualización" value={formatDate(item.updated_at)} icon="update" />
        </div>
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} className="btn-secondary">Cerrar</button>
        <button onClick={() => { onClose(); onEditar(item); }} className="btn-primary">
          <Icon name="edit" className="text-[16px]" />
          Editar
        </button>
      </ModalFooter>
    </Modal>
  );
}