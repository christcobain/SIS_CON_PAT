const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ROLE_CFG = {
  SYSADMIN:     { icon: 'shield_person',   iconBg: 'bg-primary/10',   iconColor: 'text-primary'    },
  COORDSISTEMA: { icon: 'hub',             iconBg: 'bg-blue-100',     iconColor: 'text-blue-600'   },
  ADMINSEDE:    { icon: 'corporate_fare',  iconBg: 'bg-purple-100',   iconColor: 'text-purple-600' },
  ASISTSISTEMA: { icon: 'person_edit',     iconBg: 'bg-amber-100',    iconColor: 'text-amber-600'  },
  SEGURSEDE:    { icon: 'security',        iconBg: 'bg-orange-100',   iconColor: 'text-orange-600' },
  USUARIOFINAL: { icon: 'person',          iconBg: 'bg-slate-100',    iconColor: 'text-slate-500'  },
};
const DEFAULT_CFG = { icon: 'manage_accounts', iconBg: 'bg-slate-100', iconColor: 'text-slate-500' };

export default function RoleCard({ role, isSelected, onClick }) {
  const cfg = ROLE_CFG[role.name] ?? DEFAULT_CFG;
  const permCount = role.permissions?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full flex items-center gap-3 px-4 py-4 text-left transition-all duration-200 group
        border-b border-border/40 last:border-0
        ${isSelected 
          ? 'bg-primary/[0.03] shadow-[inset_4px_0_0_0_#7f1d1d]' // Rojo institucional como borde izquierdo interno
          : 'hover:bg-surface-alt bg-transparent active:scale-[0.98]'
        }
        ${!role.is_active ? 'opacity-70' : 'opacity-100'}
      `}
    >
      {/* Indicador Flotante (Opcional, si no usas el inset shadow anterior) */}
      {isSelected && (
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full animate-in slide-in-from-left-1 duration-300" />
      )}

      {/* Contenedor de Ícono */}
      <div className={`
        size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300
        ${cfg.iconBg} ${isSelected ? 'scale-110 shadow-sm' : 'group-hover:scale-105'}
      `}>
        <Icon name={cfg.icon} className={`text-[20px] ${cfg.iconColor}`} />
      </div>

      {/* Cuerpo de Información */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`
            text-[13px] font-black tracking-tight truncate transition-colors
            ${isSelected ? 'text-primary' : 'text-main'}
          `}>
            {role.name}
          </span>
          
          {role.name === 'SYSADMIN' && (
            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/10">
              System
            </span>
          )}
          
          {!role.is_active && (
            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
              Off
            </span>
          )}
        </div>

        <p className="text-[10px] text-muted truncate leading-relaxed">
          {role.description || 'Sin descripción asignada'}
        </p>
      </div>

      {/* Badge de Conteo y Acción */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {permCount > 0 && (
          <div className={`
            px-2 py-0.5 rounded-full text-[9px] font-black transition-colors
            ${isSelected ? 'bg-primary text-white' : 'bg-surface-alt text-faint border border-border'}
          `}>
            {permCount}
          </div>
        )}
        
        <Icon 
          name={isSelected ? 'arrow_right_alt' : 'chevron_right'} 
          className={`text-[18px] transition-all duration-300 ${
            isSelected ? 'text-primary translate-x-1' : 'text-faint group-hover:translate-x-1'
          }`} 
        />
      </div>
    </button>
  );
}