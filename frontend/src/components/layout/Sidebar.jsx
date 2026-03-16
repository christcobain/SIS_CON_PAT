import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const MENU = [
  {
    id: 'administrativa',
    grupo: 'Gestión Administrativa',
    icon: 'manage_accounts',
    items: [
      { label: 'Usuarios', icon: 'group', to: '/admin/usuarios', perm: 'ms-usuarios:users:add_user' },
      { label: 'Historial de Sesiones', icon: 'history', to: '/admin/sesiones', perm: 'ms-usuarios:authentication:view_loginattempt' },
      { label: 'Políticas de Password', icon: 'policy', to: '/admin/politicas', perm: 'ms-usuarios:authentication:view_passwordpolicy' },
      { label: 'Locaciones', icon: 'account_balance', to: '/admin/locaciones', perm: 'ms-usuarios:locations:view_sede' },
      { label: 'Roles y Permisos', icon: 'admin_panel_settings', to: '/admin/roles', perm: 'ms-usuarios:roles:view_role' },
    ],
  },
  {
    id: 'bienes',
    grupo: 'Gestión de Bienes',
    icon: 'inventory_2',
    items: [
      { label: 'Catálogos', icon: 'category', to: '/catalogos', perm: 'ms-bienes:catalogos:add_catcategoriabien' },
      { label: 'Inventario', icon: 'warehouse', to: '/bienes', perm: 'ms-bienes:bienes:view_bien' },
      { label: 'Mantenimiento', icon: 'engineering', to: '/mantenimientos', perm: 'ms-bienes:mantenimientos:view_mantenimiento' },
      { label: 'Transferencias', icon: 'swap_horiz', to: '/transferencias', perm: 'ms-bienes:transferencias:view_transferencia' },
      { label: 'Bajas de Activos', icon: 'delete_sweep', to: '/bajas', perm: 'ms-bienes:bienes:delete_bien' },
    ],
  },
  {
    id: 'reportes',
    grupo: 'Reportes',
    icon: 'bar_chart',
    items: [
      { label: 'Reportes Generales', icon: 'description', to: '/reportes', perm: null },
      { label: 'Datos de Procesos', icon: 'analytics', to: '/reportes/procesos', perm: null },
    ],
  },
];

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function Sidebar({ collapsed }) {
  const role = useAuthStore((s) => s.role);
  const permissionsFlat = useAuthStore((s) => s.permissionsFlat);
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState(null);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const canView = (perm) => {
    if (!perm) return true;
    if (role === 'SYSADMIN') return true;
    return permissionsFlat.includes(perm);
  };

  const toggleGroup = (id) => {
    if (collapsed) return;
    setOpenGroup((prev) => (prev === id ? null : id));
  };

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('sisconpat_theme', next ? 'dark' : 'light');
  };

  return (
    <aside
      className="flex flex-col shrink-0 select-none transition-all duration-300 ease-in-out border-r border-white/5"
      style={{
        width: collapsed ? '70px' : '260px',
        background: '#0f172a',
      }}
    >
      <div className="h-20 flex items-center px-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="size-10 shrink-0 bg-gradient-to-br from-primary to-blue-600 rounded-xl p-2 shadow-lg shadow-primary/20 flex items-center justify-center">
            <img src="/src/assets/images/ICONO.png" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-white font-black text-sm tracking-tight">SISCONPAT</span>
              <span className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.15em]">Sist. Patrimonial</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar overflow-x-hidden">
        
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `
            group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
            ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}
          `}
        >
          <Icon name="grid_view" className="text-xl" />
          {!collapsed && <span className="text-[13px] font-bold">Resumen General</span>}
        </NavLink>

        <NavLink
          to="/alertas"
          className={({ isActive }) => `
            group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
            ${isActive ? 'bg-red-500/10 text-red-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}
          `}
        >
          <div className="relative">
            <Icon name="notifications" className="text-xl" />
            <span className="absolute -top-1 -right-1 size-2 bg-red-500 rounded-full border-2 border-slate-900" />
          </div>
          {!collapsed && <span className="text-[13px] font-bold">Notificaciones</span>}
        </NavLink>

        <div className="pt-6 pb-2 px-3">
          {!collapsed ? (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Módulos de Sistema</p>
          ) : (
            <div className="h-px bg-white/5 w-full" />
          )}
        </div>

        {MENU.map(({ id, grupo, icon, items }) => {
          const visibles = items.filter((i) => canView(i.perm));
          if (!visibles.length) return null;

          const isGroupOpen = openGroup === id && !collapsed;
          const isGroupActive = visibles.some(i => location.pathname.startsWith(i.to));

          return (
            <div key={id} className="group/item">
              <button
                onClick={() => toggleGroup(id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300
                  ${isGroupOpen || isGroupActive ? 'text-slate-100 bg-white/5' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                `}
              >
                <Icon 
                  name={icon} 
                  className={`text-xl transition-all duration-300 ${isGroupActive ? 'text-primary scale-110' : 'group-hover/item:text-slate-200'}`} 
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-[13px] font-bold tracking-wide">{grupo}</span>
                    <Icon 
                      name="expand_more" 
                      className={`text-lg transition-transform duration-500 ease-in-out ${isGroupOpen ? 'rotate-180 text-primary' : 'opacity-40'}`} 
                    />
                  </>
                )}
              </button>

              <div
                className="overflow-hidden transition-all duration-500 ease-in-out"
                style={{
                  maxHeight: isGroupOpen ? `${visibles.length * 45}px` : '0px',
                  opacity: isGroupOpen ? 1 : 0,
                  transform: isGroupOpen ? 'translateY(0)' : 'translateY(-10px)'
                }}
              >
                <div className="ml-5 mt-1 pl-4 border-l border-white/10 flex flex-col gap-1 py-1">
                  {visibles.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => `
                        relative flex items-center gap-3 px-3 py-2 rounded-lg text-[12.5px] transition-all duration-200
                        ${isActive 
                          ? 'text-primary font-black bg-primary/5' 
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-[-17px] w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                          )}
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 bg-slate-900/30">
        <button
          onClick={toggleDark}
          className="group w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 transition-all border border-white/5"
        >
          <div className={`size-8 rounded-xl flex items-center justify-center transition-all ${dark ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'}`}>
            <Icon name={dark ? 'light_mode' : 'dark_mode'} className="text-lg" />
          </div>
          {!collapsed && (
            <div className="flex flex-col items-start leading-none">
              <span className="text-[11px] font-black text-slate-200">{dark ? 'MODO CLARO' : 'MODO OSCURO'}</span>
              <span className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">Cambiar Interfaz</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}