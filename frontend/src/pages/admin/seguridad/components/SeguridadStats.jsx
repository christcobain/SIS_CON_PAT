import { useMemo } from 'react';

const Icon = ({ name, style = {} }) => (
  <span className="material-symbols-outlined leading-none select-none text-[22px]" style={style}>{name}</span>
);

function KpiCard({ icon, label, value, loading, accentColor }) {
  return (
    <div className="card p-4 flex items-center gap-4 relative overflow-hidden group cursor-default">
      <div className="size-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accentColor}18` }}>
        <Icon name={icon} style={{ color: accentColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
        {loading
          ? <div className="skeleton h-7 w-12 mt-1 rounded-md" />
          : <p className="text-2xl font-black mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
              {value ?? 0}
            </p>
        }
      </div>
      <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700"
        style={{ background: `${accentColor}35` }} />
    </div>
  );
}

export default function SeguridadStats({ sesiones = [], intentos = [], credenciales = [], loading = false }) {
  const stats = useMemo(() => ({
    sesionesActivas:   sesiones.filter(s => s.status === 'active').length,
    intentosFallidos:  intentos.filter(i => !i.success).length,
    cuentasBloqueadas: credenciales.filter(c => c.is_locked).length,
    totalCredenciales: credenciales.length,
  }), [sesiones, intentos, credenciales]);

  const CARDS = [
    { icon: 'wifi',          label: 'Sesiones activas',   value: stats.sesionesActivas,   accentColor: 'var(--color-primary)' },
    { icon: 'login',         label: 'Intentos fallidos',  value: stats.intentosFallidos,  accentColor: '#dc2626' },
    { icon: 'lock',          label: 'Cuentas bloqueadas', value: stats.cuentasBloqueadas, accentColor: '#b45309' },
    { icon: 'key',           label: 'Credenciales total', value: stats.totalCredenciales, accentColor: '#1d4ed8' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(c => <KpiCard key={c.label} loading={loading} {...c} />)}
    </div>
  );
}