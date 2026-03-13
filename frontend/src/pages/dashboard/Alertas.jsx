import { useState }            from 'react';
import { useNavigate }         from 'react-router-dom';
import AlertasStats            from './components/AlertasStats';
import AlertasTablaMovimientos from './components/AlertasTablaMovimientos';
import AlertasAsignaciones     from './components/AlertasAsignaciones';
import AlertasMantenimientos   from './components/AlertasMantenimientos';
import AlertasHistorial        from './components/AlertasHistorial';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

// ── Mock data (se reemplaza con hooks reales cuando estén disponibles) ────────
const MOCK_SALIDAS_ENTRADAS = [
  { id: 1, tipo: 'SALIDA',        origen: 'Almacén Central', destino: 'Sede Norte',   solicitante: 'Carlos Mendoza', fecha: 'Hoy, 09:30 AM',    estado: 'PENDIENTE_APROBACION', prioridad: 'ALTA'  },
  { id: 2, tipo: 'ENTRADA',       origen: 'Proveedor Ext.',  destino: 'Logística',    solicitante: 'Marta Ramos',    fecha: 'Ayer, 04:45 PM',   estado: 'PENDIENTE_APROBACION', prioridad: 'MEDIA' },
  { id: 3, tipo: 'TRASLADO_SEDE', origen: 'Sede Rímac',      destino: 'Sede Central', solicitante: 'Luis Torres',    fecha: '06/03/2026 11:00', estado: 'EN_ESPERA_CONFORMIDAD',prioridad: 'MEDIA' },
  { id: 4, tipo: 'TRASLADO_SEDE', origen: 'Sede Norte',      destino: 'Sede Este',    solicitante: 'Rosa Quispe',    fecha: '05/03/2026 09:00', estado: 'DEVUELTO',             prioridad: 'BAJA'  },
];
const MOCK_ASIGNACIONES = [
  { id: 1, bien: 'MacBook Pro M2',          codigo: 'ID: 4509', icono: 'laptop_mac',     destinatario: 'Ing. Luis Torrico', tiempo: 'Hace 2 horas',   estado: 'PENDIENTE_APROBACION', prioridad: 'ALTA'  },
  { id: 2, bien: 'Toyota Hilux',            codigo: 'ABC-123',  icono: 'directions_car', destinatario: 'Dpto. Ventas',      tiempo: 'Hace 1 día',     estado: 'PENDIENTE_APROBACION', prioridad: 'MEDIA' },
  { id: 3, bien: 'Impresora Canon LBP6030', codigo: 'ID: 7821', icono: 'print',          destinatario: 'Dpto. Logística',   tiempo: 'Hace 5 horas',   estado: 'PENDIENTE_APROBACION', prioridad: 'MEDIA' },
  { id: 4, bien: 'Monitor LG 27"',          codigo: 'ID: 3302', icono: 'monitor',        destinatario: 'Juez Pedro Salas',  tiempo: 'Ayer, 03:30 PM', estado: 'DEVUELTO',             prioridad: 'BAJA'  },
];
const MOCK_MANTENIMIENTOS = [
  { id: 1, titulo: 'Mant. Correctivo: Servidor Principal',     mes: 'MAR', dia: '10', urgente: true,  descripcion: 'Vence en 2 días — Requiere aprobación técnica' },
  { id: 2, titulo: 'Revisión Preventiva: Planta Eléctrica 02', mes: 'MAR', dia: '15', urgente: false, descripcion: 'Mantenimiento semestral rutinario'              },
  { id: 3, titulo: 'Mant. Preventivo: Impresoras Canon',       mes: 'MAR', dia: '20', urgente: false, descripcion: 'Revisión de consumibles y limpieza interna'    },
];
const MOCK_HISTORIAL = [
  { accion: 'Traslado aprobado',       detalle: 'TRASLADO-2026-041 — Sede Central → Sede Norte',           tiempo: 'Hace 30 min',  icono: 'check_circle', color: 'text-emerald-500' },
  { accion: 'Asignación devuelta',     detalle: 'ASIG-2026-018 — Devolución por documentación incompleta', tiempo: 'Hace 2 horas', icono: 'reply',        color: 'text-amber-500'   },
  { accion: 'Mant. completado',        detalle: 'MNT-2026-009 — Servidor HP ProLiant — Atendido',          tiempo: 'Hace 4 horas', icono: 'build_circle', color: 'text-blue-500'    },
  { accion: 'Salida física aprobada',  detalle: 'TRASLADO-2026-038 — Seguridad Sede Rímac',                tiempo: 'Ayer',         icono: 'security',     color: 'text-primary'     },
  { accion: 'Nueva asignación creada', detalle: 'ASIG-2026-022 — Laptop HP EliteBook, Juzgado N°5',       tiempo: 'Ayer',         icono: 'add_circle',   color: 'text-slate-400'   },
];

const TABS = [
  { id: 'entradas',       label: 'Entradas / Salidas',      icon: 'swap_horiz', badge: () => MOCK_SALIDAS_ENTRADAS.filter(i => i.estado === 'PENDIENTE_APROBACION').length },
  { id: 'asignaciones',   label: 'Asignaciones Pendientes', icon: 'person_add', badge: () => MOCK_ASIGNACIONES.filter(i => i.estado === 'PENDIENTE_APROBACION').length    },
  { id: 'mantenimientos', label: 'Mantenimientos',          icon: 'build',      badge: () => MOCK_MANTENIMIENTOS.filter(i => i.urgente).length                           },
  { id: 'historial',      label: 'Historial',               icon: 'history',    badge: () => 0                                                                            },
];

const FILTROS_PRIORIDAD = [
  { id: 'TODAS', label: 'Todas' },
  { id: 'ALTA',  label: 'Alta'  },
  { id: 'MEDIA', label: 'Media' },
  { id: 'BAJA',  label: 'Baja'  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function Alertas() {
  const navigate = useNavigate();
  const [tab,    setTab]    = useState('entradas');
  const [filtro, setFiltro] = useState('TODAS');

  const filtrar = (lista) =>
    filtro === 'TODAS' ? lista : lista.filter(i => i.prioridad === filtro);

  const handleVer = (item) => {
    if (item.mes) navigate(`/mantenimientos/${item.id}`);
    else          navigate(`/transferencias/${item.id}`);
  };

  // Stats derivados del mock (serán props de hooks en producción)
  const totalPendientes = [...MOCK_SALIDAS_ENTRADAS, ...MOCK_ASIGNACIONES]
    .filter(i => i.estado === 'PENDIENTE_APROBACION').length;
  const pendientesAlta  = [...MOCK_SALIDAS_ENTRADAS, ...MOCK_ASIGNACIONES]
    .filter(i => i.prioridad === 'ALTA').length;
  const mantenUrgentes  = MOCK_MANTENIMIENTOS.filter(i => i.urgente).length;
  const historialHoy    = MOCK_HISTORIAL.filter(i => i.tiempo.startsWith('Hace')).length;

  return (
    <div className="page-wrapper">

      {/* ── Cabecera — mismo patrón que Usuarios / Locaciones / Roles ─────── */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Centro de Alertas</h1>
            <p className="page-subtitle">
              Gestión de aprobaciones pendientes y seguimiento patrimonial.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              title="Actualizar datos"
              className="btn-icon"
            >
              <Icon name="refresh" className="text-[18px]" />
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">
              <Icon name="arrow_back" className="text-[17px]" />
              Dashboard
            </button>
          </div>
        </div>

        {/* Tabs dentro del page-header */}
        <div className="tab-bar">
          {TABS.map((t) => {
            const count  = t.badge();
            const activo = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={activo ? 'tab-btn-active' : 'tab-btn-inactive'}
              >
                <Icon name={t.icon} className="text-[17px]" />
                {t.label}
                {count > 0 && (
                  <span className={activo ? 'tab-count-active' : 'tab-count-inactive'}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Contenido scrollable ──────────────────────────────────────────── */}
      <div className="page-content">

        {/* KPIs */}
        <AlertasStats
          totalPendientes={totalPendientes}
          pendientesAlta={pendientesAlta}
          mantenUrgentes={mantenUrgentes}
          historialHoy={historialHoy}
        />

        {/* Filtro de prioridad — solo tabs con datos filtrables */}
        {tab !== 'historial' && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Icon name="filter_list" className="text-[17px]"
                    style={{ color: 'var(--color-text-muted)' }} />
              <span className="text-sm font-black" style={{ color: 'var(--color-text-body)' }}>
                Prioridad:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTROS_PRIORIDAD.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-black transition-all"
                  style={
                    filtro === f.id
                      ? { background: 'var(--color-primary)', color: '#fff' }
                      : {
                          background: 'var(--color-surface)',
                          color: 'var(--color-text-body)',
                          border: '1px solid var(--color-border)',
                        }
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Entradas / Salidas ───────────────────────────────────── */}
        {tab === 'entradas' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black flex items-center gap-2"
                  style={{ color: 'var(--color-text-primary)' }}>
                <Icon name="swap_horiz" className="text-[20px] text-primary" />
                Aprobaciones de Salida / Entrada
              </h2>
              <span className="badge badge-pendiente">
                {filtrar(MOCK_SALIDAS_ENTRADAS).length} registros
              </span>
            </div>
            <AlertasTablaMovimientos
              items={filtrar(MOCK_SALIDAS_ENTRADAS)}
              onVer={handleVer}
            />
          </section>
        )}

        {/* ── Tab: Asignaciones ────────────────────────────────────────── */}
        {tab === 'asignaciones' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black flex items-center gap-2"
                  style={{ color: 'var(--color-text-primary)' }}>
                <Icon name="person_add" className="text-[20px] text-primary" />
                Asignaciones Pendientes
              </h2>
              <span className="badge badge-pendiente">
                {filtrar(MOCK_ASIGNACIONES).length} registros
              </span>
            </div>
            <AlertasAsignaciones
              items={filtrar(MOCK_ASIGNACIONES)}
              onVer={handleVer}
            />
          </section>
        )}

        {/* ── Tab: Mantenimientos ──────────────────────────────────────── */}
        {tab === 'mantenimientos' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black flex items-center gap-2"
                  style={{ color: 'var(--color-text-primary)' }}>
                <Icon name="build" className="text-[20px] text-primary" />
                Mantenimientos Próximos
              </h2>
              <button
                onClick={() => navigate('/mantenimientos')}
                className="text-xs font-black transition-opacity"
                style={{ color: 'var(--color-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Ver Calendario →
              </button>
            </div>
            <AlertasMantenimientos items={MOCK_MANTENIMIENTOS} onVer={handleVer} />
          </section>
        )}

        {/* ── Tab: Historial ───────────────────────────────────────────── */}
        {tab === 'historial' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black flex items-center gap-2"
                  style={{ color: 'var(--color-text-primary)' }}>
                <Icon name="history" className="text-[20px] text-primary" />
                Actividad Reciente
              </h2>
            </div>
            <AlertasHistorial items={MOCK_HISTORIAL} />
          </section>
        )}

      </div>
    </div>
  );
}