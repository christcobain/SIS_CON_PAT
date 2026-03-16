import KpiCard from './KpiCard';

export default function DashboardStats({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <KpiCard 
        variant="primary" icon="inventory_2" label="Bienes Activos" 
        value={stats.totalBienes} sub="Patrimonio"
      />
      <KpiCard 
        variant="info" icon="group" label="Usuarios" 
        value={stats.usuariosActivos} sub="Acceso Activo"
      />
      <KpiCard 
        variant="warning" icon="engineering" label="En Proceso" 
        value={stats.mantProceso} sub="Mantenimiento"
      />
      <KpiCard 
        variant="primary" icon="task_alt" label="Realizados" 
        value={stats.mantRealizados} sub="Atendidos"
      />
      <KpiCard 
        variant="info" icon="local_shipping" label="Traslados" 
        value={stats.transferencias} sub="Movimientos"
      />
      <KpiCard 
        variant="danger" icon="delete_sweep" label="Bajas" 
        value={stats.bajas} sub="En Gestión"
      />
    </div>
  );
}