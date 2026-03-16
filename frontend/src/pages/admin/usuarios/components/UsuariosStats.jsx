const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

function StatCard({ icon, iconBg, iconColor, label, value, loading }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${iconBg}`}>
        <Icon name={icon} className={`text-[20px] ${iconColor}`} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest"
           >
          {label}
        </p>
        {loading
          ? <div className="h-6 w-12 rounded animate-pulse mt-0.5"
                 style={{ background: 'var(--color-border-light)' }} />
          : <p className="text-xl font-black mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
              {value ?? 0}
            </p>
        }
      </div>
    </div>
  );
}

export default function UsuariosStats({ usuarios, dependencias, loading }) {
  const totalUsuarios    = usuarios.length;
  const activos          = usuarios.filter((u) => u.is_active).length;
  const inactivos        = totalUsuarios - activos;
  const totalDeps        = dependencias?.length ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <StatCard icon="group"          iconBg="bg-primary/10"    iconColor="text-primary"
                label="Total Usuarios" value={totalUsuarios} loading={loading} />
      <StatCard icon="person_check"   iconBg="bg-emerald-100"   iconColor="text-emerald-600"
                label="Activos"        value={activos}       loading={loading} />
      <StatCard icon="person_off"     iconBg="bg-slate-100"     iconColor="text-slate-500"
                label="Inactivos"      value={inactivos}     loading={loading} />
      <StatCard icon="account_tree"   iconBg="bg-amber-100"     iconColor="text-amber-600"
                label="Dependencias"   value={totalDeps}     loading={loading} />
    </div>
  );
}