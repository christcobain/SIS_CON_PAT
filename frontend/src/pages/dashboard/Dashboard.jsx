import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useBienes } from '../../hooks/useBienes';
import { useMantenimientos } from '../../hooks/useMantenimientos';
import { useLocaciones } from '../../hooks/useLocaciones';
import { useUsuarios } from '../../hooks/useUsuarios';
import bienesService from '../../services/bienes.service';
import mantenimientosService from '../../services/mantenimientos.service';
import DashboardSpinner from './components/DashboardSpinner';
import DashboardStats from './components/DashboardStats';
import DashboardAnalytics from './components/DashboardAnalytics';
import DashboardTabla from './components/DashboardTabla';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sedeStats, setSedeStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);

  const { bienes: todosBienes, loading: loadingBienes } = useBienes({});
  const { usuarios } = useUsuarios({ is_active: true });
  const { mantenimientos: todosMant, loading: loadingMant } = useMantenimientos({});
  const { sedes } = useLocaciones();

  const stats = useMemo(() => {
    const enProceso = todosMant.filter(m => m.estado === 'EN_PROCESO').length;
    const realizados = todosMant.filter(m => m.estado === 'ATENDIDO').length;
    const transferencias = todosMant.filter(m => m.tipo === 'TRASLADO_SEDE').length;
    
    return {
      totalBienes: todosBienes.length,
      usuariosActivos: usuarios?.length || 0,
      mantProceso: enProceso,
      mantRealizados: realizados,
      transferencias,
      bajas: 0, 
      recientes: todosMant.slice(0, 8)
    };
  }, [todosBienes, todosMant, usuarios]);

  useEffect(() => {
    if (!sedes?.length) return;
    setLoadingStats(true);
    const fetchStats = async () => {
      const resultados = await Promise.all(sedes.map(async (sede) => {
        try {
          const [bRes, mRes] = await Promise.all([
            bienesService.listar({ sede_id: sede.id }),
            mantenimientosService.listar({ sede_id: sede.id, estado: 'EN_PROCESO' }),
          ]);
          return { 
            sedeId: sede.id, 
            total: bRes.length || bRes.results?.length || 0, 
            enMant: mRes.length || mRes.results?.length || 0 
          };
        } catch { return { sedeId: sede.id, total: 0, enMant: 0 }; }
      }));
      setSedeStats(resultados.reduce((acc, curr) => ({ ...acc, [curr.sedeId]: curr }), {}));
      setLoadingStats(false);
    };
    fetchStats();
  }, [sedes]);

  if (loadingBienes && todosBienes.length === 0) return <DashboardSpinner />;

  return (
    <div className="p-4 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-20">
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/5">
              <Icon name="dashboard" className="text-[28px]" />
            </div>
            <div>
              <h1 className="page-title text-xl md:text-2xl">Panel de Control General</h1>
              <p className="page-subtitle">Bienvenido, <span className="text-primary font-bold">{user?.nombres}</span> • Monitoreo institucional en tiempo real.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.location.reload()} className="btn-icon bg-surface border border-border group" title="Sincronizar">
              <Icon name="sync" className="text-[18px] text-faint group-hover:rotate-180 transition-transform duration-700" />
            </button>
            <button onClick={() => navigate('/bienes')} className="btn-primary flex items-center gap-2 px-5 py-2.5">
              <Icon name="inventory" className="text-[18px]" />
              <span className="font-black uppercase tracking-widest text-[10px]">Ver Inventario</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <DashboardStats stats={stats} />
        <DashboardAnalytics stats={stats} loadingRecientes={loadingMant} />
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Icon name="location_on" className="text-primary text-xl" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Estado de Operatividad por Sede</h2>
          </div>
          <DashboardTabla sedes={sedes} sedeStats={sedeStats} loadingStats={loadingStats} navigate={navigate} />
        </section>
      </div>
    </div>
  );
}