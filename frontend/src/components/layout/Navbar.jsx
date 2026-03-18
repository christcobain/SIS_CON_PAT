import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';

const BREADCRUMB_MAP = {
  '/dashboard':           ['Panel de Control',   'Vista General'],
  '/alertas':             ['Panel de Control',   'Alertas'],
  '/bienes':              ['Gestión de Bienes',  'Inventario de Activos'],
  '/bienes/nuevo':        ['Gestión de Bienes',  'Nuevo Bien'],
  '/transferencias':      ['Gestión de Bienes',  'Transferencias'],
  '/asignaciones':        ['Gestión de Bienes',  'Asignaciones'],
  '/mantenimientos':      ['Gestión de Bienes',  'Mantenimiento'],
  '/bajas':               ['Gestión de Bienes',  'Bajas de Activos'],
  '/catalogos':           ['Gestión de Bienes',  'Catálogos'],
  '/reportes':            ['Reportes',           'Reportes Generales'],
  '/reportes/procesos':   ['Reportes',           'Datos de Procesos'],
  '/admin/usuarios':      ['Administración',     'Usuarios'],
  '/admin/roles':         ['Administración',     'Roles y Permisos'],
  '/admin/locaciones':    ['Administración',     'Sedes y Ubicaciones'],
  '/admin/sesiones':      ['Administración',     'Historial de Sesiones'],
  '/admin/politicas':     ['Administración',     'Políticas de Password'],
  '/admin/reseteo':       ['Administración',     'Reseteo de Claves'],
};

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const getInitials = (first_name = '', last_name = '') => {
  const n = (first_name.trim()[0] || '').toUpperCase();
  const a = (last_name.trim()[0]  || '').toUpperCase();
  return (n + a) || '?';
};

const getRoleName = (roleVal) => {
  if (!roleVal) return '—';
  if (typeof roleVal === 'object') return roleVal.name ?? '—';
  return roleVal;
};

export default function Navbar({ onToggleSidebar }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const {logout} =useAuth();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user      = useAuthStore((s) => s.user);
  const role      = useAuthStore((s) => s.role);
  const sedes      = useAuthStore((s) => s.sedes[0].nombre);
  const [seccion, pagina] = BREADCRUMB_MAP[location.pathname] ?? ['Sistema', 'Página'];
  const roleName  = getRoleName(user?.role ?? role);
  const initials  = getInitials(user?.nombres, user?.apellidos);
  const fullName  = user ? `${user.nombres ?? ''} ${user.apellidos ?? ''}`.trim() : 'Usuario';
  const handleLogout = async () => {
    try { 
      await logout(); 
    } catch { 
      clearAuth(); 
      navigate('/login', { replace: true }); 
         }
    finally { clearAuth(); navigate('/login', { replace: true }); }
  };

  return (
    <header className="shrink-0 z-[40] sticky top-0 flex flex-col">
      
      <div className="bg-[#7F1D1D] h-10 flex items-center px-4 shadow-md relative z-20">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onToggleSidebar}
            className="group flex items-center justify-center size-7 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-all active:scale-95"
          >
            <Icon name="menu" className="text-white text-lg group-hover:rotate-180 transition-transform duration-500" />
          </button>

          <div className="flex items-center gap-2">
            <div className="bg-white/10 p-1 rounded-md">
              <Icon name="gavel" className="text-white/60 text-[14px]" />
            </div>
            <span className="text-white font-black text-xs tracking-widest uppercase">CSJLN</span>
            <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-tight hidden lg:block">
              Corte Superior de Justicia de Lima Norte
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-black text-white/80 uppercase tracking-tighter">Sede: {sedes}</span>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-white/10"> 
            <div className="text-right hidden sm:block">
              <p className="text-white font-black text-[11px] leading-none uppercase tracking-wide">{fullName}</p>
              <p className="text-white/50 font-bold text-[9px] mt-1 uppercase tracking-tighter">Rol: {roleName}</p>
            </div>
            <div className="size-8 rounded-xl bg-gradient-to-tr from-white/10 to-white/30 border border-white/30 flex items-center justify-center text-white text-[10px] font-black shadow-inner">
              {initials}
            </div>
          </div> 
        </div>
      </div>

      <div className="bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md h-12 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <Icon name="folder_open" className="text-lg" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em]">{seccion}</span>
          </div>
          <Icon name="chevron_right" className="text-slate-300 dark:text-slate-700 text-sm" />
          <h1 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
            {pagina}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button className="relative size-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all group">
            <Icon name="notifications" className="text-xl group-hover:scale-110 transition-transform" />
            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full ring-2 ring-white dark:ring-[#0f172a]" />
          </button>

          <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-500/5 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all duration-300 group"
          >
            <Icon name="logout" className="text-lg group-hover:-translate-x-1 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-widest">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}