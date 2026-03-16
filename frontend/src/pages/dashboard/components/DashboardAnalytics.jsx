import { useNavigate } from 'react-router-dom';
import { DonutChart, MantBarChart } from './DashboardCharts';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ChartContainer = ({ title, children }) => (
  <div className="card p-5 flex flex-col h-[380px]">
    <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-50 pb-2">{title}</h3>
    <div className="flex-1 flex items-center justify-center w-full overflow-hidden">{children}</div>
  </div>
);

const ActivityItem = ({ item }) => {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/mantenimientos/${item.id}`)} className="group flex gap-4 pb-6 relative cursor-pointer">
      <div className="absolute left-[9px] top-6 bottom-0 w-[2px] bg-slate-100 group-last:hidden" />
      <div className={`size-[20px] rounded-full border-4 border-white z-10 shadow-sm transition-transform group-hover:scale-125 ${item.estado === 'ATENDIDO' ? 'bg-primary' : 'bg-amber-400'}`} />
      <div className="flex-1 -mt-1">
        <div className="flex justify-between items-start">
          <p className="text-[13px] font-bold text-slate-800 group-hover:text-primary transition-colors">{item.numero_orden}</p>
          <span className="text-[10px] text-slate-400 font-black">{new Date(item.fecha_registro).toLocaleDateString()}</span>
        </div>
        <p className="text-[11px] text-slate-500 line-clamp-1 italic">{item.bien_nombre || 'Mantenimiento de activo'}</p>
      </div>
    </div>
  );
};

export default function DashboardAnalytics({ stats, loadingRecientes }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartContainer title="Distribución de Categorías">
          <DonutChart data={[]} total={stats.totalBienes} />
        </ChartContainer>
        <ChartContainer title="Flujo de Mantenimientos">
          <MantBarChart mantenimientos={stats.recientes} loading={loadingRecientes} />
        </ChartContainer>
      </div>
      <div className="lg:col-span-4 h-[380px] flex flex-col">
        <div className="card flex-1 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-50 bg-slate-50/50">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Actividades Recientes</h3>
          </div>
          <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
            {stats.recientes.length > 0 ? (
              stats.recientes.map(item => <ActivityItem key={item.id} item={item} />)
            ) : (
              <div className="h-full flex flex-center text-faint text-xs italic">No hay actividad reciente</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}