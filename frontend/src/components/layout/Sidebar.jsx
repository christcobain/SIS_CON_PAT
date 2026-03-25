import { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';

const MENU = [
  {
    id: 'administrativa',
    grupo: 'Gestión Administrativa',
    icon: 'manage_accounts',
    items: [
      { label: 'Usuarios', icon: 'group', to: '/admin/usuarios', perm: 'ms-usuarios:users:view_user' },
      { label: 'Seguridad', icon: 'history', to: '/admin/seguridad', perm: 'ms-usuarios:authentication:view_passwordpolicy' },
      { label: 'Locaciones', icon: 'account_balance', to: '/admin/locaciones', perm: 'ms-usuarios:locations:add_sede' },
      { label: 'Roles y Permisos', icon: 'admin_panel_settings', to: '/admin/roles', perm: 'ms-usuarios:roles:view_role' },
    ],
  },
  {
    id: 'bienes',
    grupo: 'Gestión de Bienes',
    icon: 'inventory_2',
    items: [
      { label: 'Catálogos', icon: 'category', to: '/catalogos', perm: 'ms-bienes:catalogos:add_catcategoriabien' },
      { label: 'Inventario de Bienes', icon: 'warehouse', to: '/bienes', perm: 'ms-bienes:bienes:view_bien' },
      { label: 'Mantenimiento', icon: 'engineering', to: '/mantenimientos', perm: 'ms-bienes:mantenimientos:view_mantenimiento' },
      { 
        label: 'Transferencias', 
        icon: 'swap_horiz', 
        to: '/transferencias', 
        perm: ['ms-bienes:transferencias:view_transferencia', 'ms-bienes:transferencias:view_transferenciadetalle'] 
      },
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
  const { can, canAny } = usePermission();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState(null);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const filteredMenu = useMemo(() => {
    return MENU.map(grupo => ({
      ...grupo,
      visibles: grupo.items.filter(item => {
        if (!item.perm) return true;
        return Array.isArray(item.perm) ? canAny(...item.perm) : can(item.perm);
      })
    })).filter(grupo => grupo.visibles.length > 0);
  }, [can, canAny]);

  const toggleGroup = (id) => !collapsed && setOpenGroup(prev => prev === id ? null : id);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('sisconpat_theme', next ? 'dark' : 'light');
  };

  return (
    <aside
      className="flex flex-col shrink-0 select-none transition-all duration-300 ease-in-out border-r border-white/5"
      style={{ width: collapsed ? '70px' : '260px', background: '#0f172a' }}
    >
      {/* Header / Logo */}
      <div className="h-20 flex items-center px-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="size-10 shrink-0 bg-gradient-to-br from-primary to-blue-600 rounded-xl p-2 shadow-lg flex items-center justify-center">
             <img src="/src/assets/images/ICONO.png" alt="L" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight animate-in fade-in slide-in-from-left-2">
              <span className="text-white font-black text-sm">SISCONPAT</span>
              <span className="text-slate-500 font-bold text-[9px] tracking-widest uppercase">Sist. Patrimonial</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar overflow-x-hidden">
        {/* DASHBOARD DIRECT LINK */}
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
          {!collapsed ? <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Módulos</p> : <div className="h-px bg-white/5 w-full" />}
        </div>

        {filteredMenu.map(({ id, grupo, icon, visibles }) => {
          const isGroupOpen = openGroup === id && !collapsed;
          const isGroupActive = visibles.some(i => location.pathname.startsWith(i.to));
          
          return (
            <div key={id} className="group/item">
              <button onClick={() => toggleGroup(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isGroupOpen || isGroupActive ? 'text-slate-100 bg-white/5' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <Icon name={icon} className={`text-xl ${isGroupActive ? 'text-primary' : ''}`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-[13px] font-bold">{grupo}</span>
                    <Icon name="expand_more" className={`text-lg transition-transform ${isGroupOpen ? 'rotate-180 text-primary' : 'opacity-40'}`} />
                  </>
                )}
              </button>

              <div className="overflow-hidden transition-all duration-500"
                style={{ maxHeight: isGroupOpen ? `${visibles.length * 45}px` : '0px', opacity: isGroupOpen ? 1 : 0 }}
              >
                <div className="ml-5 mt-1 pl-4 border-l border-white/10 flex flex-col gap-1">
                  {visibles.map((item) => (
                    <NavLink key={item.to} to={item.to}
                      className={({ isActive }) => `relative flex items-center gap-3 px-3 py-2 rounded-lg text-[12.5px] transition-all ${isActive ? 'text-primary font-black bg-primary/5' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="absolute left-[-17px] w-1.5 h-1.5 rounded-full bg-primary" />}
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

      {/* Footer Dark Mode */}
      <div className="p-4 border-t border-white/5 bg-slate-900/30">
        <button onClick={toggleDark} className="group w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-white/5">
          <div className={`size-8 rounded-xl flex items-center justify-center ${dark ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'}`}>
            <Icon name={dark ? 'light_mode' : 'dark_mode'} />
          </div>
          {!collapsed && <span className="text-[11px] font-black text-slate-200 uppercase">{dark ? 'Modo Claro' : 'Modo Oscuro'}</span>}
        </button>
      </div>
    </aside>
  );
}