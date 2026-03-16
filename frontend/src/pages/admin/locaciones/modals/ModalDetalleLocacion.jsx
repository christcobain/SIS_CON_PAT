import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const TAB_META = {
  sedes:       { label: 'Sede',      icon: 'location_city', accentBg: 'rgb(127 29 29 / 0.08)', accentBorder: 'rgb(127 29 29 / 0.2)', accentColor: 'var(--color-primary)' },
  modulos:     { label: 'Módulo',    icon: 'widgets',       accentBg: 'rgb(124 58 237 / 0.08)', accentBorder: 'rgb(124 58 237 / 0.2)', accentColor: '#7c3aed' },
  ubicaciones: { label: 'Ubicación', icon: 'room',          accentBg: 'rgb(5 150 105 / 0.08)',  accentBorder: 'rgb(5 150 105 / 0.2)',  accentColor: '#059669' },
};

function fmt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'long' });
}

function InfoRow({ label, value, icon }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
      {icon && <Icon name={icon} className="text-[16px] mt-0.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} />}
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accentColor }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
      <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accentColor}15` }}>
        <Icon name={icon} className="text-[16px]" style={{ color: accentColor }} />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

export default function ModalDetalleLocacion({ open, onClose, activeTab, item, onEditar }) {
  if (!item) return null;
  const meta = TAB_META[activeTab] ?? TAB_META.sedes;

  return (
    <Modal open={open} onClose={onClose} size={activeTab === 'sedes' ? 'lg' : 'sm'}>
      <ModalHeader icon={meta.icon} title={item.nombre} subtitle={`Detalle de ${meta.label.toLowerCase()}`} onClose={onClose} />

      <ModalBody>
        {activeTab === 'sedes' ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-0">
            <div className="col-span-2 flex items-center gap-4 mb-5 p-4 rounded-xl"
              style={{ background: meta.accentBg, border: `1px solid ${meta.accentBorder}` }}>
              <div className="size-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-surface)' }}>
                <Icon name={meta.icon} className="text-[26px]" style={{ color: meta.accentColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-black" style={{ color: 'var(--color-text-primary)' }}>{item.nombre}</p>
                <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>ID #{item.id}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                style={{ background: item.is_active ? 'rgb(22 163 74 / 0.1)' : 'var(--color-border-light)', color: item.is_active ? '#16a34a' : 'var(--color-text-muted)' }}>
                <span className={`size-1.5 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                {item.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div>
              <InfoRow label="Empresa / Institución" value={item.empresa_nombre}      icon="domain"      />
              <InfoRow label="Dirección"              value={item.direccion}           icon="location_on" />
              <InfoRow label="Fecha de registro"      value={fmt(item.created_at)}    icon="calendar_today" />
              <InfoRow label="Última actualización"   value={fmt(item.updated_at)}    icon="update"      />
            </div>

            <div>
              <InfoRow label="Distrito"      value={item.distrito_nombre}     icon="map" />
              <InfoRow label="Provincia"     value={item.provincia_nombre}    icon="map" />
              <InfoRow label="Departamento"  value={item.departamento_nombre} icon="map" />
            </div>

            {(item.ubicaciones?.length > 0) && (
              <div className="col-span-2 pt-3">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <Stat icon="location_on" label="Ubicaciones"    value={item.ubicaciones.length} accentColor={meta.accentColor} />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-2 mt-3" style={{ color: 'var(--color-text-muted)' }}>Listado de ubicaciones</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.ubicaciones.map(u => (
                    <span key={u.id} className="text-[11px] font-bold px-2.5 py-1 rounded-xl"
                      style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}>
                      {u.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 mb-5 p-4 rounded-xl"
              style={{ background: meta.accentBg, border: `1px solid ${meta.accentBorder}` }}>
              <div className="size-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-surface)' }}>
                <Icon name={meta.icon} className="text-[26px]" style={{ color: meta.accentColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-black" style={{ color: 'var(--color-text-primary)' }}>{item.nombre}</p>
                <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>ID #{item.id}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                style={{ background: item.is_active ? 'rgb(22 163 74 / 0.1)' : 'var(--color-border-light)', color: item.is_active ? '#16a34a' : 'var(--color-text-muted)' }}>
                <span className={`size-1.5 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                {item.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            {activeTab === 'ubicaciones' && <InfoRow label="Descripción" value={item.descripcion} icon="description" />}
            <InfoRow label="Fecha de registro"     value={fmt(item.created_at)} icon="calendar_today" />
            <InfoRow label="Última actualización"  value={fmt(item.updated_at)} icon="update"         />
          </div>
        )}
      </ModalBody>

      <ModalFooter align="right">
        <button onClick={onClose} className="btn-secondary">Cerrar</button>
        <button onClick={() => { onClose(); onEditar(item); }} className="btn-primary flex items-center gap-2">
          <Icon name="edit" className="text-[16px]" /> Editar
        </button>
      </ModalFooter>
    </Modal>
  );
}