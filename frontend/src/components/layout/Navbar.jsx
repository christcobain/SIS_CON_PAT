import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { useNotificaciones } from '../../hooks/useNotificaciones ';

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

function NotificacionesDropdown({ open, transf, mant, bajas, loading, onIrAlertas }) {
  const total = transf + mant + bajas;

  const categorias = [
    transf > 0 && {
      key:    'transf',
      icon:   'swap_horiz',
      label:  `${transf} Transferencia${transf !== 1 ? 's' : ''}`,
      sub:    `pendiente${transf !== 1 ? 's' : ''} de aprobación`,
      count:  transf,
      color:  '#b45309',
      bg:     'rgb(180 83 9 / 0.07)',
      border: 'rgb(180 83 9 / 0.18)',
      iconBg: 'rgb(180 83 9 / 0.14)',
    },
    mant > 0 && {
      key:    'mant',
      icon:   'build',
      label:  `${mant} Mantenimiento${mant !== 1 ? 's' : ''}`,
      sub:    `pendiente${mant !== 1 ? 's' : ''} de aprobación`,
      count:  mant,
      color:  '#7F1D1D',
      bg:     'rgb(127 29 29 / 0.07)',
      border: 'rgb(127 29 29 / 0.18)',
      iconBg: 'rgb(127 29 29 / 0.14)',
    },
    bajas > 0 && {
      key:    'bajas',
      icon:   'delete_sweep',
      label:  `${bajas} Baja${bajas !== 1 ? 's' : ''}`,
      sub:    `pendiente${bajas !== 1 ? 's' : ''} de aprobación`,
      count:  bajas,
      color:  '#0f766e',
      bg:     'rgb(15 118 110 / 0.07)',
      border: 'rgb(15 118 110 / 0.18)',
      iconBg: 'rgb(15 118 110 / 0.14)',
    },
  ].filter(Boolean);

  return (
    <div
      className={`absolute right-0 top-[calc(100%+8px)] w-80 rounded-2xl shadow-2xl z-[100] transition-all duration-200 overflow-hidden ${
        open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* ── Cabecera ── */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--color-border-light)', background: 'var(--color-surface-alt)' }}
      >
        <div className="flex items-center gap-2">
          <Icon name="notifications_active" className="text-[16px] text-primary" />
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-primary)' }}>
            Pendientes
          </span>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="size-3 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }} />
          )}
          {total > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgb(127 29 29 / 0.12)', color: '#7F1D1D' }}>
              {total}
            </span>
          )}
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="p-3 space-y-2">
        {total === 0 ? (
          <div className="py-6 text-center">
            <Icon name="task_alt" className="text-[32px] block mb-2" style={{ color: 'var(--color-border)' }} />
            <p className="text-[11px] font-semibold" style={{ color: 'var(--color-text-faint)' }}>
              Sin pendientes por ahora
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
              Se actualiza automáticamente cada minuto
            </p>
          </div>
        ) : (
          categorias.map(cat => (
            <div
              key={cat.key}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: cat.bg, border: `1px solid ${cat.border}` }}
            >
              <div className="size-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: cat.iconBg }}>
                <Icon name={cat.icon} className="text-[16px]" style={{ color: cat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black" style={{ color: cat.color }}>{cat.label}</p>
                <p className="text-[9px] font-semibold" style={{ color: 'var(--color-text-faint)' }}>{cat.sub}</p>
              </div>
              <span className="size-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                style={{ background: cat.color, color: '#fff' }}>
                {cat.count}
              </span>
            </div>
          ))
        )}
      </div>

      {/* ── Pie ── */}
      <div style={{ borderTop: '1px solid var(--color-border-light)' }}>
        <button
          onClick={onIrAlertas}
          className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-80"
          style={{ color: 'var(--color-primary)' }}
        >
          <Icon name="open_in_new" className="text-[13px]" />
          Ver todas las alertas
        </button>
      </div>
    </div>
  );
}

export default function Navbar({ onToggleSidebar }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { logout } = useAuth();
  const clearAuth  = useAuthStore((s) => s.clearAuth);
  const user       = useAuthStore((s) => s.user);
  const role       = useAuthStore((s) => s.role);
  const sedes      = useAuthStore((s) => s.sedes?.[0]?.nombre);
 
  const [seccion, pagina] = BREADCRUMB_MAP[location.pathname] ?? ['Sistema', 'Página'];
  const roleName  = getRoleName(user?.role ?? role);
  const initials  = getInitials(user?.nombres, user?.apellidos);
  const fullName  = user ? `${user.nombres ?? ''} ${user.apellidos ?? ''}`.trim() : 'Usuario';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    transferenciasPendientes,
    mantenimientosPendientes,
    bajasPendientes,
    totalPendientes,
    loading: loadingNotif,
  } = useNotificaciones();

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      clearAuth();
      navigate('/login', { replace: true });
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  const handleIrAlertas = () => {
    setDropdownOpen(false);
    navigate('/alertas');
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
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="relative size-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all group"
              title="Notificaciones"
            >
              <Icon
                name="notifications"
                className={`text-xl group-hover:scale-110 transition-transform ${dropdownOpen ? 'text-primary' : ''}`}
              />
              {totalPendientes > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#7F1D1D] text-white text-[9px] font-black ring-2 ring-white dark:ring-[#0f172a] animate-in zoom-in duration-300">
                  {totalPendientes > 99 ? '99+' : totalPendientes}
                </span>
              )}
            </button>

            <NotificacionesDropdown
              open={dropdownOpen}
              onClose={() => setDropdownOpen(false)}
              transf={transferenciasPendientes.length}
              mant={mantenimientosPendientes.length}
              bajas={bajasPendientes.length}
              loading={loadingNotif}
              onIrAlertas={handleIrAlertas}
            />
          </div>

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