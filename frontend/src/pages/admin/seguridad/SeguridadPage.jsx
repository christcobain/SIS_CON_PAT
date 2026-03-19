import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog';
import Can from '../../../components/auth/Can';
import SeguridadStats from './components/SeguridadStats';
import SeguridadFiltros from './components/SeguridadFiltros';
import SeguridadTabla from './components/SeguridadTabla';
import PoliticasTabla from './components/PoliticasTabla';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);


const TABS = [
  { id: 'sesiones', label: 'Sesiones activas', icon: 'wifi', permission: 'ms-usuarios:authentication:view_loginsession' },
  { id: 'historial', label: 'Historial Sesiones', icon: 'manage_history', permission: 'ms-usuarios:authentication:view_loginsession' },
  { id: 'intentos', label: 'Registro de Intentos', icon: 'login', permission: 'ms-usuarios:authentication:view_loginattempt' },
  { id: 'credenciales', label: 'Credenciales', icon: 'key', permission: 'ms-usuarios:authentication:view_credential' },
  { id: 'politicas', label: 'Políticas', icon: 'policy', permission: 'ms-usuarios:authentication:view_passwordpolicy' },
];

const FILTROS_INICIALES = { dni: '', status: '', exitoso: '', tipo: '', bloqueado: '' };

export default function SeguridadPage() {
  const toast = useToast();
  const {
    obtenerSesiones,
    obtenerHistorialSesiones,
    obtenerIntentos,
    obtenerCredenciales,
    desbloquearCredencial,
    resetearPasswordPorDni,
    listarPoliticas,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('sesiones');
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [politicas, setPoliticas] = useState([]);

  const [sesionesStats, setSesionesStats] = useState([]);
  const [intentosStats, setIntentosStats] = useState([]);
  const [credencialesStats, setCredencialesStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [itemUnlock, setItemUnlock] = useState(null);
  const [unlocking, setUnlocking] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [itemReset, setItemReset] = useState(null);
  const [resetting, setResetting] = useState(false);

  const onFiltroChange = (key, val) => setFiltros(f => ({ ...f, [key]: val }));

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

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (filtros.dni) params.dni = filtros.dni;

    let promesa;
    if (activeTab === 'sesiones') {
      promesa = obtenerSesiones(filtros.dni || null);
    } else if (activeTab === 'historial') {
      if (filtros.status) params.status = filtros.status;
      promesa = obtenerHistorialSesiones(params);
    } else if (activeTab === 'intentos') {
      if (filtros.exitoso !== '') params.success = filtros.exitoso;
      if (filtros.tipo) params.attempt_type = filtros.tipo;
      promesa = obtenerIntentos(params);
    } else if (activeTab === 'credenciales') {
      if (filtros.bloqueado !== '') params.is_locked = filtros.bloqueado;
      promesa = obtenerCredenciales(params);
    } else if (activeTab === 'politicas') {
      promesa = listarPoliticas();
    }

    if (!promesa) {
        setLoading(false);
        return;
    }

    promesa
      .then(d => {
        const lista = Array.isArray(d) ? d : [];
        setItems(lista);
        if (activeTab === 'politicas') setPoliticas(lista);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setFiltros(FILTROS_INICIALES);
    setItems([]);
    cargar();
  }, [activeTab]);

  useEffect(() => { cargarStats(); }, []);

  const handleUnlock = item => { setItemUnlock(item); setConfirmUnlock(true); };
  const handleReset = item => { setItemReset(item); setConfirmReset(true); };

  const confirmarUnlock = async () => {
    setConfirmUnlock(false);
    setUnlocking(true);
    try {
      await desbloquearCredencial(itemUnlock.user?.username ?? itemUnlock.user?.dni);
      toast.success(`Cuenta de ${itemUnlock.user?.nombre_completo || itemUnlock.user?.dni} desbloqueada.`);
      cargar();
      cargarStats();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al desbloquear.');
    } finally { setUnlocking(false); setItemUnlock(null); }
  };

  const confirmarReset = async () => {
    setConfirmReset(false);
    setResetting(true);
    try {
      await resetearPasswordPorDni(itemReset.user?.username ?? itemReset.user?.dni);
      toast.success(`Contraseña de ${itemReset.user?.nombre_completo || itemReset.user?.dni} restablecida al DNI.`);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al resetear contraseña.');
    } finally { setResetting(false); setItemReset(null); }
  };

  const handleReloadPoliticas = () => {
    setLoading(true);
    listarPoliticas()
      .then(d => { const l = Array.isArray(d) ? d : []; setItems(l); setPoliticas(l); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-4 max-w-[1600px] animate-in fade-in duration-500 pb-20 space-y-5">

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
              <button onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-2 transition-all whitespace-nowrap shrink-0"
                style={{
                  color: activeTab === id ? 'var(--color-primary)' : 'var(--color-text-faint)',
                  borderBottom: activeTab === id ? '2px solid var(--color-primary)' : '2px solid transparent',
                }}>
                <Icon name={icon} className="text-[16px]" />{label}
              </button>
            </Can>
          ))}
        </div>
      </div>

      <SeguridadStats
        sesiones={sesionesStats}
        intentos={intentosStats}
        credenciales={credencialesStats}
        loading={loadingStats}
      />

      {/* Solo mostrar filtros si el tab activo no es politicas y se tiene permiso para ver lo que se está filtrando */}
      {activeTab !== 'politicas' && (
        <SeguridadFiltros
          activeTab={activeTab}
          filtros={filtros}
          onChange={onFiltroChange}
          onBuscar={cargar}
          loading={loading}
        />
      )}

      <div className="card p-5">
        {activeTab === 'politicas' ? (
          <Can perform="ms-usuarios:authentication:view_passwordpolicy">
            <PoliticasTabla items={politicas} loading={loading} onReload={handleReloadPoliticas} />
          </Can>
        ) : (
          <Can perform={TABS.find(t => t.id === activeTab)?.permission}>
            <SeguridadTabla
              activeTab={activeTab}
              items={items}
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
        variant="primary"
        loading={unlocking}
        onConfirm={confirmarUnlock}
        onClose={() => { setConfirmUnlock(false); setItemUnlock(null); }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Confirmar reseteo de contraseña"
        message={`¿Resetear la contraseña de "${itemReset?.user?.nombre_completo || itemReset?.user?.dni}"? La nueva clave será su DNI: ${itemReset?.user?.dni}.`}
        confirmLabel="Sí, resetear"
        variant="danger"
        loading={resetting}
        onConfirm={confirmarReset}
        onClose={() => { setConfirmReset(false); setItemReset(null); }}
      />
    </div>
  );
}