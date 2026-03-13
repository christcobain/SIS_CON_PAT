import { useEffect, useMemo, useState } from 'react';
import { useNavigate }                  from 'react-router-dom';
import { useAuthStore }                 from '../../store/authStore';
import { useBienes }                    from '../../hooks/useBienes';
import { useMantenimientos }            from '../../hooks/useMantenimientos';
import { useLocaciones }                from '../../hooks/useLocaciones';
import bienesService                    from '../../services/bienes.service';
import mantenimientosService            from '../../services/mantenimientos.service';
import KpiCard                          from './KpiCard';
import SedeRow                          from './SedeRow';
import DashboardSpinner                 from './DashboardSpinner';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const ESTADO_MANT = {
  EN_PROCESO:            { label: 'En Proceso',       cls: 'badge-atendido'  },
  PENDIENTE_APROBACION:  { label: 'Pend. Aprobación', cls: 'badge-pendiente' },
  EN_ESPERA_CONFORMIDAD: { label: 'Esp. Conformidad', cls: 'badge-inactivo'  },
  ATENDIDO:              { label: 'Atendido',          cls: 'badge-activo'   },
  DEVUELTO:              { label: 'Devuelto',          cls: 'badge-devuelto' },
  CANCELADO:             { label: 'Cancelado',         cls: 'badge-cancelado'},
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const role     = useAuthStore((s) => s.role);

  const { bienes: todosBienes,       loading: loadingBienes    } = useBienes({});
  const { mantenimientos: mantPend,  loading: loadingMantPend  } = useMantenimientos({ estado: 'PENDIENTE_APROBACION' });
  const { mantenimientos: mantProc,  loading: loadingMantProc  } = useMantenimientos({ estado: 'EN_PROCESO' });
  const { mantenimientos: recientes, loading: loadingRecientes } = useMantenimientos({});
  const { mantenimientos: transf,    loading: loadingTransf    } = useMantenimientos({ estado: 'PENDIENTE_APROBACION', tipo: 'TRASLADO_SEDE' });
  const { sedes, loading: loadingSedes } = useLocaciones();

  const [sedeStats,    setSedeStats]    = useState({});
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!sedes || sedes.length === 0) return;
    let cancelado = false;
    setLoadingStats(true);
    const fetchStats = async () => {
      const resultados = await Promise.all(
        sedes.map(async (sede) => {
          try {
            const [bRes, mRes] = await Promise.all([
              bienesService.listar({ sede_id: sede.id }),
              mantenimientosService.listar({ sede_id: sede.id, estado: 'EN_PROCESO' }),
            ]);
            const lb      = Array.isArray(bRes) ? bRes : (bRes?.results ?? []);
            const lm      = Array.isArray(mRes) ? mRes : (mRes?.results ?? []);
            const activos = lb.filter((b) => b.estado_bien?.nombre?.toUpperCase() === 'ACTIVO').length;
            return { sedeId: sede.id, total: lb.length, activos, enMant: lm.length };
          } catch {
            return { sedeId: sede.id, total: 0, activos: 0, enMant: 0 };
          }
        })
      );
      if (!cancelado) {
        const mapa = {};
        resultados.forEach((r) => { mapa[r.sedeId] = r; });
        setSedeStats(mapa);
        setLoadingStats(false);
      }
    };
    fetchStats();
    return () => { cancelado = true; };
  }, [sedes]);

  const loadingKpi  = loadingBienes || loadingMantPend || loadingMantProc;
  const totalBienes = todosBienes.length;
  const totalPend   = mantPend.length;
  const totalProc   = mantProc.length;
  const totalTransf = transf.length;
  const ultimosMants = useMemo(() => recientes.slice(0, 6), [recientes]);

  const topSedes = useMemo(() => (
    [...(sedes ?? [])]
      .map((s) => ({ s, st: sedeStats[s.id] ?? { total: 0, activos: 0, enMant: 0 } }))
      .sort((a, b) => b.st.total - a.st.total)
      .slice(0, 5)
  ), [sedes, sedeStats]);

  const categDist = useMemo(() => {
    const mapa = {};
    todosBienes.forEach((b) => {
      const cat = b.categoria?.nombre ?? b.tipo_bien?.nombre ?? 'Otros';
      mapa[cat] = (mapa[cat] || 0) + 1;
    });
    return Object.entries(mapa).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [todosBienes]);

  return (
    <div className="space-y-6">

      {/* ── Bienvenida ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black" style={{ color: 'var(--color-text-primary)' }}>
            Bienvenido, {user?.nombres || 'Usuario'} 👋
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Panel de control —{' '}
            <span className="font-black" style={{ color: 'var(--color-primary)' }}>{role}</span>
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-2"
        >
          <Icon name="refresh" className="text-[16px]" /> Actualizar
        </button>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="inventory"
          iconBg="bg-primary/10" iconColor="text-primary"
          label="Total de Bienes" sub="inventario"
          value={totalBienes.toLocaleString()}
          barColor="bg-primary" barPct={75}
          loading={loadingKpi}
          onClick={() => navigate('/bienes')} />
        <KpiCard icon="engineering"
          iconBg="bg-primary/10" iconColor="text-primary"
          label="Mant. Pendientes" sub="por aprobar"
          value={totalPend.toLocaleString()}
          barColor="bg-primary"
          barPct={totalBienes ? Math.min(Math.round((totalPend / totalBienes) * 100), 100) : 0}
          loading={loadingKpi}
          onClick={() => navigate('/mantenimientos')} />
        <KpiCard icon="local_shipping"
          iconBg="bg-primary/10" iconColor="text-primary"
          label="Transferencias" sub="activas"
          value={totalTransf.toLocaleString()}
          barColor="bg-primary"
          barPct={totalBienes ? Math.min(Math.round((totalTransf / totalBienes) * 100), 100) : 0}
          loading={loadingKpi}
          onClick={() => navigate('/transferencias')} />
        <KpiCard icon="person_pin_circle"
          iconBg="bg-amber-500/10" iconColor="text-amber-500"
          label="Mant. En Proceso" sub="en campo"
          value={totalProc.toLocaleString()}
          barColor="bg-amber-500"
          barPct={totalBienes ? Math.min(Math.round((totalProc / totalBienes) * 100), 100) : 0}
          loading={loadingKpi}
          onClick={() => navigate('/mantenimientos')} />
      </div>

      {/* ── Gráficas ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Donut */}
        <div className="card p-6">
          <h4 className="text-sm font-black mb-5" style={{ color: 'var(--color-text-primary)' }}>
            Distribución por Categoría
          </h4>
          {loadingBienes
            ? <DashboardSpinner />
            : <DonutChart data={categDist} total={totalBienes} />
          }
        </div>

        {/* Barras */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-5">
            <h4 className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>
              Estado de Mantenimientos
            </h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                <span className="text-[10px] font-black uppercase tracking-wide"
                      style={{ color: 'var(--color-text-muted)' }}>Atendido</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-red-400" />
                <span className="text-[10px] font-black uppercase tracking-wide"
                      style={{ color: 'var(--color-text-muted)' }}>Pendiente</span>
              </div>
            </div>
          </div>
          <MantBarChart mantenimientos={recientes} loading={loadingRecientes} />
        </div>
      </div>

      {/* ── Tabla sedes + Actividad reciente ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top 5 sedes */}
        <div className="lg:col-span-2 table-wrapper overflow-hidden">
          <div className="card-header flex justify-between items-center">
            <div>
              <h4 className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>
                Distribución por Sede
              </h4>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Top 5 · ordenado por total de bienes
              </p>
            </div>
            <button onClick={() => navigate('/admin/locaciones')}
              className="text-xs font-black transition-colors"
              style={{ color: 'var(--color-primary)' }}>
              Ver todas
            </button>
          </div>

          {loadingSedes
            ? <DashboardSpinner />
            : topSedes.length === 0
              ? <p className="text-center text-sm py-10" style={{ color: 'var(--color-text-muted)' }}>
                  Sin sedes registradas.
                </p>
              : <div className="overflow-x-auto">
                  <table className="table w-full text-left">
                    <thead>
                      <tr>
                        {['Sede', 'Distrito', 'Total', 'En Mant.', 'Activos %'].map((h) => (
                          <th key={h} className="px-5 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                              style={{ color: 'var(--color-text-muted)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topSedes.map(({ s, st }, idx) => (
                        <SedeRow key={s.id} rank={idx + 1}
                          nombre={s.nombre}
                          distrito={s.distrito_nombre ?? '—'}
                          total={st.total} activos={st.activos} enMant={st.enMant}
                          loadingBienes={loadingStats} />
                      ))}
                    </tbody>
                  </table>
                </div>
          }
        </div>

        {/* Actividad reciente */}
        <div className="card flex flex-col overflow-hidden">
          <div className="card-header flex justify-between items-center">
            <h4 className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>
              Actividad Reciente
            </h4>
            <button onClick={() => navigate('/mantenimientos')}
              className="text-xs font-black transition-colors"
              style={{ color: 'var(--color-primary)' }}>
              Ver todos
            </button>
          </div>

          {loadingRecientes
            ? <DashboardSpinner small />
            : ultimosMants.length === 0
              ? <p className="text-center text-sm py-8" style={{ color: 'var(--color-text-muted)' }}>
                  Sin actividad reciente.
                </p>
              : <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                  {ultimosMants.map((m, idx) => {
                    const est = ESTADO_MANT[m.estado] ?? { label: m.estado, cls: 'badge-inactivo' };
                    const dotBg =
                      m.estado === 'ATENDIDO'            ? '#22c55e' :
                      m.estado === 'EN_PROCESO'           ? 'var(--color-primary)' :
                      m.estado === 'PENDIENTE_APROBACION' ? '#f59e0b' :
                      m.estado === 'DEVUELTO'             ? '#f87171' : 'var(--color-text-faint)';
                    const isLast = idx === ultimosMants.length - 1;
                    return (
                      <div key={m.id} className="flex gap-3 relative">
                        {!isLast && (
                          <div className="absolute left-[10px] top-6 bottom-[-16px] w-px"
                               style={{ background: 'var(--color-border-light)' }} />
                        )}
                        <div className="size-5 rounded-full border-2 z-[1] shrink-0 mt-0.5"
                             style={{ background: dotBg, borderColor: 'var(--color-surface)' }} />
                        <div className="flex flex-col gap-1 cursor-pointer flex-1 min-w-0"
                             onClick={() => navigate(`/mantenimientos/${m.id}`)}>
                          <p className="text-sm font-black leading-none"
                             style={{ color: 'var(--color-text-primary)' }}>
                            {m.numero_orden}
                          </p>
                          <p className="text-xs truncate"
                             style={{ color: 'var(--color-text-muted)' }}>
                            {m.bien_descripcion ?? m.bien?.descripcion ?? 'Sin descripción'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`badge ${est.cls}`}>{est.label}</span>
                            <span className="text-[10px] font-bold uppercase"
                                  style={{ color: 'var(--color-text-faint)' }}>
                              {m.fecha_registro
                                ? new Date(m.fecha_registro).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
                                : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Donut SVG ────────────────────────────────────────────────────────────────
const DONUT_COLORS = ['#7F1D1D', '#B91C1C', '#f59e0b', '#64748b'];

function DonutChart({ data, total }) {
  if (!data || data.length === 0 || total === 0) {
    return <p className="text-center text-sm py-8" style={{ color: 'var(--color-text-muted)' }}>
      Sin datos de categorías.
    </p>;
  }
  const R = 16, circ = 2 * Math.PI * R;
  let offset = 0;
  const arcs = data.map(([cat, count], i) => {
    const pct  = (count / total) * 100;
    const dash = (pct / 100) * circ;
    const arc  = { cat, count, pct, dash: dash.toFixed(2), offset: offset.toFixed(2), color: DONUT_COLORS[i] };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex items-center justify-around">
      <div className="relative size-40">
        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={R} fill="none" strokeWidth="3.5"
                  style={{ stroke: 'var(--color-border)' }} />
          {arcs.map((a) => (
            <circle key={a.cat} cx="18" cy="18" r={R} fill="none"
                    stroke={a.color} strokeWidth="3.5"
                    strokeDasharray={`${a.dash} ${circ.toFixed(2)}`}
                    strokeDashoffset={`-${a.offset}`}
                    strokeLinecap="butt" />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>
            {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
          </span>
          <span className="text-[10px] font-black uppercase tracking-wide"
                style={{ color: 'var(--color-text-muted)' }}>Total</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {arcs.map((a) => (
          <div key={a.cat} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full shrink-0" style={{ background: a.color }} />
            <span className="text-xs" style={{ color: 'var(--color-text-body)' }}>
              {a.cat}{' '}
              <span className="font-black" style={{ color: 'var(--color-text-primary)' }}>
                ({a.pct.toFixed(0)}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Barchart mantenimientos ───────────────────────────────────────────────────
const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

function MantBarChart({ mantenimientos, loading }) {
  if (loading) return <DashboardSpinner />;
  const hoy    = new Date();
  const meses6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MESES[d.getMonth()], atendido: 0, pendiente: 0 };
  });
  mantenimientos.forEach((m) => {
    if (!m.fecha_registro) return;
    const d   = new Date(m.fecha_registro);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const mes = meses6.find((x) => x.key === key);
    if (!mes) return;
    if (m.estado === 'ATENDIDO') mes.atendido++;
    else mes.pendiente++;
  });
  const maxVal = Math.max(...meses6.map((m) => m.atendido + m.pendiente), 1);
  const H = 130;

  return (
    <div className="flex items-end justify-between px-2" style={{ height: `${H + 28}px` }}>
      {meses6.map((mes) => {
        const hAt  = Math.round((mes.atendido  / maxVal) * H);
        const hPen = Math.round((mes.pendiente / maxVal) * H);
        return (
          <div key={mes.key} className="flex flex-col items-center gap-1 flex-1">
            <div className="flex flex-col-reverse items-center w-full px-1.5">
              {hPen > 0 && (
                <div className="w-full rounded-t-sm bg-red-400 transition-all duration-700"
                     style={{ height: `${hPen}px` }} />
              )}
              {hAt > 0 && (
                <div className={`w-full transition-all duration-700 ${hPen > 0 ? '' : 'rounded-t-sm'}`}
                     style={{ height: `${hAt}px`, background: 'var(--color-primary)' }} />
              )}
              {hAt === 0 && hPen === 0 && (
                <div className="w-full rounded-t-sm" style={{ height: '4px', background: 'var(--color-border)' }} />
              )}
            </div>
            <span className="text-[10px] font-black mt-1"
                  style={{ color: 'var(--color-text-faint)' }}>
              {mes.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}