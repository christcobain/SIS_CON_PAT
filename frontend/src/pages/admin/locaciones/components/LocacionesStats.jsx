const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const STATS = [
  { key: 'sedes',       label: 'Sedes Registradas', icon: 'apartment',   bg: 'bg-primary/10', text: 'text-primary'   },
  { key: 'modulos',     label: 'Módulos Activos',   icon: 'widgets',     bg: 'bg-amber-50',   text: 'text-amber-600' },
  { key: 'ubicaciones', label: 'Ubicaciones',       icon: 'location_on', bg: 'bg-blue-50',    text: 'text-blue-600'  },
  { key: 'empresas',    label: 'Empresas',          icon: 'domain',      bg: 'bg-green-50',   text: 'text-green-600' },
];

export default function LocacionesStats({ sedes = [], modulos = [], ubicaciones = [], empresas = [], loading = false }) {
  const counts = {
    sedes:       sedes.length,
    modulos:     modulos.length,
    ubicaciones: ubicaciones.length,
    empresas:    empresas.length,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map(({ key, label, icon, bg, text }) => (
        <div key={key} className="kpi-card">
          <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
            <Icon name={icon} className={`text-[22px] ${text}`} />
          </div>
          <div>
            {loading
              ? <div className="skeleton h-5 w-8 mb-1" />
              : <p className="text-2xl font-black text-slate-900 leading-tight">{counts[key]}</p>
            }
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}