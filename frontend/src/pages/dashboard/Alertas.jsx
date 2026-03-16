import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast'; 

import AlertasStats from './components/AlertasStats';
import AlertasTablaMovimientos from './components/AlertasTablaMovimientos';
import AlertasMantenimientos from './components/AlertasMantenimientos';
import AlertasHistorial from './components/AlertasHistorial';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const TABS = [
  { id: 'pendientes',    label: 'Pendientes',    icon: 'bolt' },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: 'build' },
  { id: 'historial',     label: 'Historial',     icon: 'history' },
];

export default function Alertas() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('pendientes');
  
  // Estados para simular carga (conectar con tus hooks reales luego)
  const [loading, setLoading] = useState(false);

  const handleRefetch = async () => {
    setLoading(true);
    // Simulación de carga de datos
    setTimeout(() => {
      setLoading(false);
      toast.info("Datos actualizados correctamente");
    }, 800);
  };

  return (
    <div className="gap-1 p-4 max-w-[1600px] animate-in fade-in duration-500 h-auto pb-20">
      
      {/* ── CABECERA ESTILO USUARIOS ────────────────────────────────────────── */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon name="notifications_active" className="text-[24px]" />
            </div>
            <div>
              <h1 className="page-title">Centro de Notificaciones</h1>
              <p className="page-subtitle">Gestión de aprobaciones, movimientos y alertas preventivas.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefetch} 
              disabled={loading}
              className="btn-icon bg-surface border border-border"
              title="Sincronizar"
            >
              <Icon name="sync" className={`text-[18px] ${loading ? 'animate-spin text-primary' : 'text-faint'}`} />
            </button>
            
            <button 
              onClick={() => navigate('/bienes')} 
              className="btn-primary flex items-center gap-2 px-4 py-2 shadow-sm"
            >
              <Icon name="inventory_2" className="text-[18px]" />
              <span className="font-black uppercase tracking-widest text-[10px]">Ver Inventario</span>
            </button>
          </div>
        </div>

        {/* ── TABS NAVEGACIÓN ────────────────────────────────────────── */}
        <div className="flex gap-6 mt-4 border-t border-border pt-3">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${
                activeTab === id 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-faint hover:text-main'
              }`}
            >
              <Icon name={icon} className="text-[16px]" />
              {label}
              {id === 'pendientes' && (
                <span className="ml-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px]">
                  5
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content custom-scrollbar mt-6">
        
        {/* ── KPI STATS ────────────────────────────────────────────── */}
        <AlertasStats loading={loading} />

        {/* ── CONTENIDO DINÁMICO POR TAB ───────────────────────────── */}
        <div className="mt-8">
          {activeTab === 'pendientes' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2 text-faint">
                <Icon name="potted_plant" className="text-xl" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Movimientos que requieren su aprobación</h2>
              </div>
              <AlertasTablaMovimientos role={user?.role?.name} loading={loading} />
            </div>
          )}

          {activeTab === 'mantenimiento' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2 text-faint">
                <Icon name="event_upcoming" className="text-xl" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Programación de Mantenimiento Preventivo</h2>
              </div>
              <AlertasMantenimientos loading={loading} />
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2 text-faint">
                <Icon name="history" className="text-xl" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Registro de Actividad Reciente</h2>
              </div>
              <AlertasHistorial loading={loading} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}