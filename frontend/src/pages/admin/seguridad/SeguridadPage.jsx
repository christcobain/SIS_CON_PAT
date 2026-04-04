import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog';
import Can from '../../../components/auth/Can';
import { usePermission }                 from '../../../hooks/usePermission';
import SeguridadStats from './components/SeguridadStats';
import SeguridadFiltros from './components/SeguridadFiltros';
import SeguridadTabla from './components/SeguridadTabla';
import PoliticasTabla from './components/PoliticasTabla';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const FILTROS_INICIALES = {
  dni: '', status: '', exitoso: '', tipo: '',
  estadoCred: '', multisesion: '', estadoPol: '',
};

// ── Filtrado LOCAL reactivo ───────────────────────────────────────────────────
function aplicarFiltros(items, filtros, activeTab) {
  let res = [...items];
  const q = filtros.dni?.trim().toLowerCase();

  switch (activeTab) {

    case 'sesiones':
      if (q) res = res.filter(s =>
        s.dni?.toLowerCase().includes(q) ||
        s.username?.toLowerCase().includes(q) ||
        s.ip_address?.toLowerCase().includes(q) ||
        s.nombre_completo?.toLowerCase().includes(q)
      );
      if (filtros.status) res = res.filter(s => s.status === filtros.status);
      break;

    case 'historial':
      if (q) res = res.filter(s =>
        s.dni?.toLowerCase().includes(q) ||
        s.username?.toLowerCase().includes(q) ||
        s.nombre_completo?.toLowerCase().includes(q) ||
        s.ip_address?.toLowerCase().includes(q) ||
        `${s.first_name ?? ''} ${s.last_name ?? ''}`.toLowerCase().includes(q)
      );
      if (filtros.status) res = res.filter(s => s.status === filtros.status);
      break;

    case 'intentos':
      if (q) res = res.filter(a =>
        a.username?.toLowerCase().includes(q) ||
        a.ip_address?.toLowerCase().includes(q)
      );
      if (filtros.exitoso !== '') res = res.filter(a => String(a.success) === filtros.exitoso);
      if (filtros.tipo)           res = res.filter(a => a.attempt_type === filtros.tipo);
      break;

    case 'credenciales':
      if (q) res = res.filter(c =>
        c.user?.dni?.toLowerCase().includes(q) ||
        c.user?.username?.toLowerCase().includes(q) ||
        c.user?.nombre_completo?.toLowerCase().includes(q) ||
        `${c.user?.first_name ?? ''} ${c.user?.last_name ?? ''}`.toLowerCase().includes(q)
      );
      if (filtros.estadoCred === 'active') res = res.filter(c => c.is_active && !c.is_locked);
      if (filtros.estadoCred === 'locked') res = res.filter(c => c.is_locked);
      if (filtros.multisesion !== '')      res = res.filter(c => String(c.allow_multiple_sessions) === filtros.multisesion);
      break;

    case 'politicas':
      if (q)                  res = res.filter(p => p.name?.toLowerCase().includes(q));
      if (filtros.estadoPol !== '') res = res.filter(p => String(p.is_active) === filtros.estadoPol);
      break;

    default:
      break;
  }

  return res;
}

export default function SeguridadPage() {
  const toast = useToast();
  const {
    obtenerSesiones, obtenerHistorialSesiones, obtenerIntentos,
    obtenerCredenciales, desbloquearCredencial, resetearPasswordPorDni, listarPoliticas,
  } = useAuth();

  const {  can } = usePermission();

  const [activeTab, setActiveTab] = useState('sesiones');
  const [filtros,   setFiltros]   = useState(FILTROS_INICIALES);

  // Datos crudos del API (sin filtrar)
  const [rawItems,  setRawItems]  = useState([]);
  const [loading,   setLoading]   = useState(false);

  // Stats
  const [sesionesStats,     setSesionesStats]     = useState([]);
  const [intentosStats,     setIntentosStats]     = useState([]);
  const [credencialesStats, setCredencialesStats] = useState([]);
  const [loadingStats,      setLoadingStats]      = useState(false);

  // Confirmaciones
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [itemUnlock,    setItemUnlock]    = useState(null);
  const [unlocking,     setUnlocking]     = useState(false);
  const [confirmReset,  setConfirmReset]  = useState(false);
  const [itemReset,     setItemReset]     = useState(null);
  const [resetting,     setResetting]     = useState(false);

  // ── Filtrado reactivo: se recalcula cada vez que cambian filtros o rawItems ──
  const itemsFiltrados = useMemo(
    () => aplicarFiltros(rawItems, filtros, activeTab),
    [rawItems, filtros, activeTab]
  );
  const TABS = [
  { id: 'sesiones',     label: 'Sesiones activas',    icon: 'wifi',          
     permission: can('ms-usuarios:authentication:view_loginsession'  ),},
  { id: 'historial',    label: 'Historial Sesiones',  icon: 'manage_history', 
    permission: can('ms-usuarios:authentication:view_loginsession'  ),},
  { id: 'intentos',     label: 'Registro de Intentos', icon: 'login',         
    permission: can('ms-usuarios:authentication:view_loginattempt'  ),},
  { id: 'credenciales', label: 'Credenciales',         icon: 'key',           
    permission: can('ms-usuarios:authentication:view_credential'    ),},
  { id: 'politicas',    label: 'Políticas',            icon: 'policy',        
    permission: can('ms-usuarios:authentication:view_passwordpolicy' ),},
];

  const onFiltroChange = (key, val) => setFiltros(f => ({ ...f, [key]: val }));

  // ── Carga inicial de stats ────────────────────────────────────────────────
  const cargarStats = () => {
    setLoadingStats(true);
    Promise.allSettled([
      obtenerSesiones(),
      obtenerIntentos({ limit: 500 }),
      obtenerCredenciales(),
    ]).then(([rs, ri, rc]) => {
      setSesionesStats(rs.status === 'fulfilled' && Array.isArray(rs.value) ? rs.value : []);
      setIntentosStats(ri.status === 'fulfilled' && Array.isArray(ri.value) ? ri.value : []);
      setCredencialesStats(rc.status === 'fulfilled' && Array.isArray(rc.value) ? rc.value : []);
    }).finally(() => setLoadingStats(false));
  };

  // ── Carga del tab activo (una sola vez al cambiar de tab) ─────────────────
  const cargar = () => {
    setLoading(true);
    let promesa;
    if      (activeTab === 'sesiones')     promesa = obtenerSesiones(null);
    else if (activeTab === 'historial')    promesa = obtenerHistorialSesiones({});
    else if (activeTab === 'intentos')     promesa = obtenerIntentos({ limit: 500 });
    else if (activeTab === 'credenciales') promesa = obtenerCredenciales({});
    else if (activeTab === 'politicas')    promesa = listarPoliticas();

    if (!promesa) { setLoading(false); return; }

    promesa
      .then(d => setRawItems(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => setRawItems([]))
      .finally(() => setLoading(false));
  };

  // Al cambiar de tab: limpiar filtros y recargar
  useEffect(() => {
    setFiltros(FILTROS_INICIALES);
    setRawItems([]);
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => { cargarStats(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Acciones ──────────────────────────────────────────────────────────────
  const handleUnlock = item => { setItemUnlock(item); setConfirmUnlock(true); };
  const handleReset  = item => { setItemReset(item);  setConfirmReset(true);  };

  const confirmarUnlock = async () => {
    setConfirmUnlock(false); setUnlocking(true);
    try {
      await desbloquearCredencial(itemUnlock.user?.username ?? itemUnlock.user?.dni);
      toast.success(`Cuenta desbloqueada: ${itemUnlock.user?.nombre_completo || itemUnlock.user?.dni}`);
      cargar(); cargarStats();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al desbloquear.');
    } finally { setUnlocking(false); setItemUnlock(null); }
  };

  const confirmarReset = async () => {
    setConfirmReset(false); setResetting(true);
    try {
      await resetearPasswordPorDni(itemReset.user?.username ?? itemReset.user?.dni);
      toast.success(`Contraseña restablecida: ${itemReset.user?.nombre_completo || itemReset.user?.dni}`);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al resetear contraseña.');
    } finally { setResetting(false); setItemReset(null); }
  };

  const handleReloadPoliticas = () => {
    setLoading(true);
    listarPoliticas()
      .then(d => setRawItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-4 max-w-[1600px] animate-in fade-in duration-500 pb-20 space-y-5">

      {/* Cabecera */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgb(127 29 29 / 0.1)' }}>
            <Icon name="security" className="text-[24px]" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="page-title">Seguridad del Sistema</h1>
            <p className="page-subtitle">
              Monitoreo de sesiones, intentos de acceso, credenciales y políticas de contraseña.
            </p>
          </div>
        </div>

        <div className="flex gap-6 border-t overflow-x-auto pt-3" style={{ borderColor: 'var(--color-border)' }}>
          {TABS.map(({ id, label, icon, permission }) => (
            <Can key={id} perform={permission}>
              <button
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all whitespace-nowrap shrink-0"
                style={{
                  color: activeTab === id ? 'var(--color-primary)' : 'var(--color-text-faint)',
                  borderBottom: activeTab === id ? '2px solid var(--color-primary)' : '2px solid transparent',
                }}
              >
                <Icon name={icon} className="text-[16px]" />{label}
              </button>
            </Can>
          ))}
        </div>
      </div>

      {/* Stats */}
      <SeguridadStats
        sesiones={sesionesStats}
        intentos={intentosStats}
        credenciales={credencialesStats}
        loading={loadingStats}
      />

      {/* Filtros reactivos — sin botón Buscar */}
      {activeTab !== 'politicas' ? (
        <SeguridadFiltros
          activeTab={activeTab}
          filtros={filtros}
          onChange={onFiltroChange}
        />
      ) : (
        // Para políticas también mostramos filtros (nombre + estado)
        <SeguridadFiltros
          activeTab={activeTab}
          filtros={filtros}
          onChange={onFiltroChange}
        />
      )}

      {/* Tabla */}
      <div className="card p-5">
        {activeTab === 'politicas' ? (
          <Can perform="ms-usuarios:authentication:view_passwordpolicy">
            <PoliticasTabla
              items={itemsFiltrados}
              loading={loading}
              onReload={handleReloadPoliticas}
            />
          </Can>
        ) : (
          <Can perform={TABS.find(t => t.id === activeTab)?.permission}>
            <SeguridadTabla
              activeTab={activeTab}
              items={itemsFiltrados}
              loading={loading}
              onUnlock={handleUnlock}
              onReset={handleReset}
            />
          </Can>
        )}
      </div>

      <ConfirmDialog
        open={confirmUnlock}
        title="Confirmar desbloqueo"
        message={`¿Desbloquear la cuenta de "${itemUnlock?.user?.nombre_completo || itemUnlock?.user?.dni}"? Los intentos fallidos se reiniciarán a 0.`}
        confirmLabel="Sí, desbloquear"
        variant="primary" loading={unlocking}
        onConfirm={confirmarUnlock}
        onClose={() => { setConfirmUnlock(false); setItemUnlock(null); }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Confirmar reseteo de contraseña"
        message={`¿Resetear la contraseña de "${itemReset?.user?.nombre_completo || itemReset?.user?.dni}"? La nueva clave será su DNI: ${itemReset?.user?.dni}.`}
        confirmLabel="Sí, resetear"
        variant="danger" loading={resetting}
        onConfirm={confirmarReset}
        onClose={() => { setConfirmReset(false); setItemReset(null); }}
      />
    </div>
  );
}