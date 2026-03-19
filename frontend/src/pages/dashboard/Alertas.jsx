import { useState } from 'react';
import { useAuthStore }       from '../../store/authStore';
import { useToast }           from '../../hooks/useToast';
import { useTransferencias }  from '../../hooks/useTransferencias';
import { useAuth }            from '../../hooks/useAuth';

import AlertasStats                      from './components/AlertasStats';
import AlertasMantenimientos             from './components/AlertasMantenimientos';
import AlertasHistorial                  from './components/AlertasHistorial';
import AlertasPendientesTransferencias   from './components/AlertasPendientesTransferencias';
import ModalDetalleTransferencia         from '../assets/transferencias/modals/ModalDetalleTransferencia';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const TABS = [
  { id: 'pendientes',    label: 'Pendientes',    icon: 'bolt'    },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: 'build'   },
  { id: 'historial',     label: 'Historial',     icon: 'history' },
];

export default function Alertas() {
  const toast = useToast();
  const { user } = useAuth();
  const role = useAuthStore(s => s.role);

  const [activeTab,    setActiveTab]    = useState('pendientes');
  const [modalDetalle, setModalDetalle] = useState(false);
  const [itemDetalle,  setItemDetalle]  = useState(null);
  const [loading,      setLoading]      = useState(false);

  const {
    actualizando, aprobarAdminSede, devolverAprobacion,
    aprobarSalidaSeguridad, aprobarEntradaSeguridad,
    retornoSalida, retornoEntrada, refetch,
  } = useTransferencias('TRASLADO_SEDE', { misTransferencias: false, usuarioId: user?.id });

  const handleVerDetalle = (item) => { setItemDetalle(item); setModalDetalle(true); };

  const handleRefetch = async () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); }, 600);
  };

  return (
    <div className="p-4 max-w-[1600px] animate-in fade-in duration-500 pb-20">

      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon name="notifications_active" className="text-[24px]" />
            </div>
            <div>
              <h1 className="page-title">Centro de Notificaciones</h1>
              <p className="page-subtitle">Aprobaciones pendientes, mantenimientos y actividad reciente.</p>
            </div>
          </div>
          <button onClick={handleRefetch} disabled={loading}
            className="btn-icon bg-surface border border-border" title="Sincronizar">
            <Icon name="sync" className={`text-[18px] ${loading ? 'animate-spin text-primary' : 'text-faint'}`} />
          </button>
        </div>

        <div className="flex gap-6 mt-4 pt-3 border-t border-border">
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all border-b-2 ${
                activeTab === id ? 'text-primary border-primary' : 'text-faint border-transparent hover:text-main'
              }`}>
              <Icon name={icon} className="text-[16px]" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content mt-6">
        <AlertasStats loading={loading} />

        <div className="mt-6">
          {activeTab === 'pendientes' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1" style={{ color: 'var(--color-text-faint)' }}>
                <Icon name="bolt" className="text-[18px]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Transferencias que requieren tu acción</p>
              </div>
              <AlertasPendientesTransferencias onVerDetalle={handleVerDetalle} />
            </div>
          )}

          {activeTab === 'mantenimiento' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1" style={{ color: 'var(--color-text-faint)' }}>
                <Icon name="event_upcoming" className="text-[18px]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Programación de Mantenimiento Preventivo</p>
              </div>
              <AlertasMantenimientos loading={loading} />
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1" style={{ color: 'var(--color-text-faint)' }}>
                <Icon name="history" className="text-[18px]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Registro de Actividad Reciente</p>
              </div>
              <AlertasHistorial loading={loading} />
            </div>
          )}
        </div>
      </div>

      <ModalDetalleTransferencia
        open={modalDetalle}
        onClose={() => setModalDetalle(false)}
        item={itemDetalle}
        actualizando={actualizando}
        acciones={{ aprobarAdminSede, aprobarSalidaSeguridad, aprobarEntradaSeguridad, retornoSalida, retornoEntrada, devolverAprobacion }}
        onAccionExitosa={() => { setModalDetalle(false); toast.success('Proceso actualizado'); refetch(); }}
      />
    </div>
  );
}