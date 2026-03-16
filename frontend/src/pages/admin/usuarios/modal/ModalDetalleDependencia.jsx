import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'long' });
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
      <Icon name={icon} className="text-[16px] mt-0.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} />
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

export default function ModalDetalleDependencia({ open, onClose, item, onEditar }) {
  if (!item) return null;
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader icon="account_tree" title={item.nombre} subtitle="Detalle de dependencia institucional" onClose={onClose} />
      <ModalBody>
        <div className="flex items-center gap-4 mb-5 p-4 rounded-xl"
          style={{ background: 'rgb(127 29 29 / 0.06)', border: '1px solid rgb(127 29 29 / 0.2)' }}>
          <div className="size-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgb(127 29 29 / 0.1)' }}>
            <Icon name="account_tree" className="text-[26px]" style={{ color: 'var(--color-primary)' }} />
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
        <InfoRow icon="tag"            label="Código"              value={item.codigo}           />
        <InfoRow icon="calendar_today" label="Fecha de registro"   value={fmt(item.created_at)}  />
        <InfoRow icon="update"         label="Última actualización" value={fmt(item.updated_at)} />
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