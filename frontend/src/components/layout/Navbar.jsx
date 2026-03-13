import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import authService     from '../../services/auth.service';

// ── Breadcrumb map ────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
export default function Navbar({ onToggleSidebar }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user      = useAuthStore((s) => s.user);
  const role      = useAuthStore((s) => s.role);
  const [seccion, pagina] = BREADCRUMB_MAP[location.pathname] ?? ['Sistema', 'Página'];
  const roleName  = getRoleName(user?.role ?? role);
  const initials  = getInitials(user?.nombres, user?.apellidos);
  const fullName  = user
    ? `${user.nombres ?? ''} ${user.apellidos ?? ''}`.trim()
    : '—';
  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* falla silenciosa */ }
    finally { clearAuth(); navigate('/login', { replace: true }); }
  };

  return (
    <header className="shrink-0 z-10 sticky top-0" style={{ boxShadow: '0 1px 0 0 var(--color-border)' }}>

      {/* ── Franja superior — borgoña institucional ───────────────────────── */}
      <div
        className="flex items-center gap-3 px-4"
        style={{ background: '#7F1D1D', height: '36px' }}
      >
        {/* Botón colapsar sidebar */}
        <button
          onClick={onToggleSidebar}
          title="Colapsar menú"
          className="flex items-center justify-center rounded-md transition-colors shrink-0"
          style={{
            width: '26px', height: '26px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <Icon name="menu" className="text-[17px]" />
        </button>

        {/* Identidad institucional */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon name="gavel" className="text-[14px] shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }} />
          <span className="text-white font-black text-[11px] tracking-wide shrink-0">CSJLN</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>·</span>
          <span
            className="font-medium text-[10px] truncate hidden sm:block"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            Corte Superior de Justicia de Lima Norte
          </span>
        </div>

        {/* Derecha: estado + usuario */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Indicador en línea */}
          <div className="items-center gap-1.5 hidden md:flex">
            <span
              className="block rounded-full shrink-0"
              style={{
                width: '6px', height: '6px',
                background: '#4ade80',
                boxShadow: '0 0 0 2px rgba(74,222,128,0.3)',
              }}
            />
            <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
              En línea
            </span>
          </div>

          <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.18)' }} />

          {/* Chip usuario */}
          <div
            className="flex items-center gap-2 rounded-full cursor-default"
            style={{
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.18)',
              padding: '2px 10px 2px 3px',
            }}
          >
            {/* Avatar */}
            <div
              className="flex items-center justify-center rounded-full shrink-0 font-black"
              style={{
                width: '22px', height: '22px', fontSize: '9px', color: '#fff',
                background: 'rgba(255,255,255,0.22)',
                border: '1px solid rgba(255,255,255,0.28)',
              }}
            >
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-bold leading-none" style={{ fontSize: '10px' }}>
                {fullName}
              </p>
              <p className="font-semibold leading-none mt-0.5" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.55)' }}>
                {roleName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Franja inferior — breadcrumb + acciones ───────────────────────── */}
      <div
        className="flex items-center gap-3 px-4"
        style={{
          height: '42px',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
            {seccion}
          </span>
          <Icon
            name="chevron_right"
            className="text-[15px] shrink-0"
            style={{ color: 'var(--color-border)' }}
          />
          <span className="text-[13px] font-black truncate" style={{ color: 'var(--color-text-primary)' }}>
            {pagina}
          </span>
        </div>

        {/* Notificaciones */}
        <button
          title="Notificaciones"
          className="relative flex items-center justify-center rounded-lg transition-colors shrink-0"
          style={{
            width: '32px', height: '32px',
            border: '1px solid var(--color-border-light)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-muted)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-surface-alt)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-surface)';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          <Icon name="notifications" className="text-[18px]" />
          <span
            className="absolute flex items-center justify-center rounded-full font-black"
            style={{
              top: '-4px', right: '-4px',
              width: '14px', height: '14px',
              fontSize: '8px', color: '#fff',
              background: '#7F1D1D',
              border: '2px solid var(--color-surface)',
            }}
          >
            3
          </span>
        </button>

        {/* Botón salir */}
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="flex items-center gap-1.5 rounded-lg font-bold transition-colors shrink-0"
          style={{
            padding: '5px 11px',
            fontSize: '11px',
            border: '1px solid #fee2e2',
            background: 'var(--color-surface)',
            color: '#ef4444',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
        >
          <Icon name="logout" className="text-[15px]" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}