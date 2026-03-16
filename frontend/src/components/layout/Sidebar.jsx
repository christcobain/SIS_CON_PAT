import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// ── Menú completo ─────────────────────────────────────────────────────────────
const MENU = [
  {
    id: 'administrativa',
    grupo: 'Gestión Administrativa',
    icon: 'manage_accounts',
    items: [
      { label: 'Usuarios',              icon: 'group',                to: '/admin/usuarios',    perm: 'ms-usuarios:users:add_user' },
      // { label: 'Reseteo de Claves',     icon: 'lock_reset',           to: '/admin/reseteo',     perm: 'ms-usuarios:authentication:add_passwordhistory' },
      { label: 'Historial de Sesiones', icon: 'history',              to: '/admin/sesiones',    perm: 'ms-usuarios:authentication:view_loginattempt' },
      { label: 'Políticas de Password', icon: 'policy',               to: '/admin/politicas',   perm: 'ms-usuarios:authentication:view_passwordpolicy' },
      { label: 'Locaciones',            icon: 'account_balance',      to: '/admin/locaciones',  perm: 'ms-usuarios:locations:view_sede' },
      { label: 'Roles y Permisos',      icon: 'admin_panel_settings', to: '/admin/roles',       perm: 'ms-usuarios:roles:view_role' },
    ],
  },
  {
    id: 'bienes',
    grupo: 'Gestión de Bienes',
    icon: 'inventory_2',
    items: [
      { label: 'Catálogos',             icon: 'category',             to: '/catalogos',         perm: 'ms-bienes:catalogos:add_catcategoriabien' },
      { label: 'Inventario de Activos', icon: 'warehouse',            to: '/bienes',            perm: 'ms-bienes:bienes:view_bien' },
      { label: 'Mantenimiento',         icon: 'engineering',          to: '/mantenimientos',    perm: 'ms-bienes:mantenimientos:view_mantenimiento' },
      { label: 'Transferencias',        icon: 'swap_horiz',           to: '/transferencias',    perm: 'ms-bienes:transferencias:view_transferencia' },
      { label: 'Asignaciones',          icon: 'assignment_ind',       to: '/asignaciones',      perm: 'ms-bienes:transferencias:view_transferencia' },
      { label: 'Bajas de Activos',      icon: 'delete_sweep',         to: '/bajas',             perm: 'ms-bienes:bienes:delete_bien' },
    ],
  },
  {
    id: 'reportes',
    grupo: 'Reportes',
    icon: 'bar_chart',
    items: [
      { label: 'Reportes Generales', icon: 'description', to: '/reportes',          perm: null },
      { label: 'Datos de Procesos',  icon: 'analytics',   to: '/reportes/procesos', perm: null },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getActiveGroup(pathname) {
  for (const section of MENU) {
    if (section.items.some((i) => pathname.startsWith(i.to))) return section.id;
  }
  return null;
}

function isDarkActive() {
  return document.documentElement.classList.contains('dark');
}

function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('sisconpat_theme', dark ? 'dark' : 'light');
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function Sidebar({ collapsed, onToggle }) {
  const role            = useAuthStore((s) => s.role);
  const permissionsFlat = useAuthStore((s) => s.permissionsFlat);
  const location        = useLocation();

  const [openGroup, setOpenGroup] = useState(() => getActiveGroup(location.pathname));
  const [dark,      setDark]      = useState(() => isDarkActive());

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
    applyTheme(next);
  };

  const isOpen = (id) => !collapsed && openGroup === id;
  return (
    <aside
      className="flex flex-col shrink-0 select-none overflow-hidden"
      style={{
        width: collapsed ? '60px' : '240px',
        transition: 'width 0.25s ease',
        background: '#1a1f2e',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '2px 0 12px 0 rgba(0,0,0,0.2)',
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-3 shrink-0"
        style={{
          height: '78px',          
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Marca — siempre visible */}
<div
  className="flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300"
  style={{
    width: '36px', 
    height: '36px',
    background: 'rgba(255, 255, 255, 0.03)', 
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '4px'
  }}
>
  <img 
    src="/src/assets/images/ICONO.png" 
    alt="SISCONPAT Logo"
    className="w-full h-full object-contain"
    style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}
  />
</div>

{/* Texto — se oculta al colapsar */}
{!collapsed && (
  <div className="min-w-0 overflow-hidden ml-1">
    <p className="font-black leading-none tracking-tight truncate"
       style={{ color: '#f1f5f9', fontSize: '13.5px', letterSpacing: '0.2px' }}>
      SISCONPAT
    </p>
    <p className="font-bold uppercase tracking-widest truncate mt-1"
       style={{ color: '#64748b', fontSize: '8.5px', letterSpacing: '1.2px' }}>
      Control Patrimonial
    </p>
  </div>
)}
      </div>

      {/* ── Navegación ────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 flex flex-col gap-0.5">

        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          end
          title={collapsed ? 'Dashboard' : undefined}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-semibold
             transition-all duration-150 relative
             ${isActive
               ? 'text-[#fca5a5]'
               : 'text-[#64748b] hover:text-[#cbd5e1]'}`
          }
          style={({ isActive }) => ({
            background: isActive ? 'rgba(127,29,29,0.22)' : undefined,
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 rounded-r"
                  style={{ top: '5px', bottom: '5px', width: '3px', background: '#ef4444' }}
                />
              )}
              <Icon name="dashboard" className="text-[18px] shrink-0" />
              {!collapsed && <span className="truncate">Dashboard</span>}
            </>
          )}
        </NavLink>

        {/* Alertas */}
        <NavLink
          to="/alertas"
          title={collapsed ? 'Alertas' : undefined}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-semibold
             transition-all duration-150 relative
             ${isActive
               ? 'text-[#fca5a5]'
               : 'text-[#64748b] hover:text-[#cbd5e1]'}`
          }
          style={({ isActive }) => ({
            background: isActive ? 'rgba(127,29,29,0.22)' : undefined,
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 rounded-r"
                  style={{ top: '5px', bottom: '5px', width: '3px', background: '#ef4444' }}
                />
              )}
              <Icon name="notifications_active" className="text-[18px] shrink-0" />
              {!collapsed && <span className="truncate">Alertas</span>}
            </>
          )}
        </NavLink>

        {/* Separador módulos */}
        {!collapsed && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '6px 0 2px' }}>
            <p className="px-2 pt-2 font-black uppercase tracking-widest"
               style={{ color: '#334155', fontSize: '9px', letterSpacing: '1.5px' }}>
              Módulos
            </p>
          </div>
        )}
        {collapsed && <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '6px 0' }} />}

        {/* Grupos del menú */}
        {MENU.map(({ id, grupo, icon, items }) => {
          const visibles  = items.filter((i) => canView(i.perm));
          if (!visibles.length) return null;

          const groupOpen = isOpen(id);
          const hasActive = visibles.some((i) => location.pathname.startsWith(i.to));

          return (
            <div key={id}>
              {/* Botón grupo */}
              <button
                onClick={() => toggleGroup(id)}
                title={collapsed ? grupo : undefined}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                           text-[12.5px] font-semibold transition-all duration-150"
                style={{
                  color: groupOpen || hasActive ? '#e2e8f0' : '#64748b',
                  background: groupOpen || hasActive
                    ? 'rgba(255,255,255,0.06)'
                    : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!groupOpen && !hasActive)
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!groupOpen && !hasActive)
                    e.currentTarget.style.background = '';
                }}
              >
                <Icon name={icon} className="text-[18px] shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{grupo}</span>
                    <Icon
                      name="expand_more"
                      className="text-[17px] shrink-0 transition-transform duration-200"
                      style={{ transform: groupOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </>
                )}
              </button>

              {/* Sub-items — animación max-height */}
              <div
                style={{
                  maxHeight: groupOpen ? `${visibles.length * 40}px` : '0px',
                  transition: 'max-height 0.25s ease-in-out',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="ml-3 pl-3 pb-1 flex flex-col gap-0.5"
                  style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', marginTop: '2px' }}
                >
                  {visibles.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px]
                         transition-colors duration-150
                         ${isActive
                           ? 'text-[#fca5a5] font-bold'
                           : 'text-[#475569] hover:text-[#94a3b8]'}`
                      }
                      style={({ isActive }) => ({
                        background: isActive ? 'rgba(127,29,29,0.18)' : undefined,
                      })}
                    >
                      <Icon name={item.icon} className="text-[16px] shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Footer: toggle dark mode ───────────────────────────────────────── */}
      <div
        className="shrink-0 px-2 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={toggleDark}
          title={collapsed ? (dark ? 'Modo Claro' : 'Modo Oscuro') : undefined}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                     text-[12px] font-semibold transition-all duration-150"
          style={{ color: '#475569' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = '#94a3b8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <Icon name={dark ? 'light_mode' : 'dark_mode'} className="text-[18px] shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">
                {dark ? 'Modo Claro' : 'Modo Oscuro'}
              </span>
              {/* Mini toggle pill */}
              <div
                className="relative rounded-full shrink-0 transition-colors duration-300"
                style={{
                  width: '32px', height: '17px',
                  background: dark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                }}
              >
                <span
                  className="absolute top-0.5 rounded-full bg-white shadow-sm
                             transition-all duration-300"
                  style={{
                    width: '13px', height: '13px',
                    left: dark ? '17px' : '2px',
                  }}
                />
              </div>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}