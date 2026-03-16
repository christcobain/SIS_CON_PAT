import { useMemo } from 'react';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

// ─── GRÁFICO DE DONA (CATEGORÍAS) ──────────────────────────────────────────
export function DonutChart({ data = [], total = 0 }) {
  // Colores con mejor contraste y elegancia
  const DONUT_COLORS = ['#0F172A', '#2563EB', '#F59E0B', '#94A3B8'];

  const arcs = useMemo(() => {
    if (!data.length || total === 0) return [];
    const R = 16;
    const circ = 2 * Math.PI * R;
    let offset = 0;

    return data.map(([cat, count], i) => {
      const pct = (count / total) * 100;
      const dash = (pct / 100) * circ;
      const currentOffset = offset;
      offset += dash;
      return {
        cat,
        count,
        pct: pct.toFixed(0),
        dash: dash.toFixed(2),
        offset: currentOffset.toFixed(2),
        color: DONUT_COLORS[i % DONUT_COLORS.length],
        circ: circ.toFixed(2)
      };
    });
  }, [data, total]);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
        <Icon name="donut_large" className="text-4xl mb-3 text-slate-200" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sin datos registrados</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full gap-6">
      <div className="relative size-40 shrink-0">
        {/* SVG con Drop Shadow para profundidad */}
        <svg className="size-full -rotate-90 drop-shadow-xl" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" 
            className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="3.5" />
          {arcs.map((a, i) => (
            <circle
              key={i} cx="18" cy="18" r="16" fill="none"
              stroke={a.color} strokeWidth="4"
              strokeDasharray={`${a.dash} ${a.circ}`}
              strokeDashoffset={`-${a.offset}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-in-out"
            />
          ))}
        </svg>
        
        {/* Centro del Gráfico */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-900 size-24 m-auto rounded-full shadow-inner border border-slate-50 dark:border-slate-800">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
          </span>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary mt-1">Total</span>
        </div>
      </div>

      {/* Leyenda Refinada */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full px-4">
        {arcs.map((a, i) => (
          <div key={i} className="flex items-center gap-2 group cursor-default">
            <div className="size-1.5 rounded-full shrink-0" style={{ background: a.color }} />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-black uppercase tracking-tight text-slate-400 truncate">
                {a.cat}
              </span>
              <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100">
                {a.count} <span className="text-[9px] font-medium opacity-50">({a.pct}%)</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GRÁFICO DE BARRAS (MANTENIMIENTOS) ────────────────────────────────────
const MESES_ABR = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

export function MantBarChart({ mantenimientos = [], loading = false }) {
  const chartData = useMemo(() => {
    const hoy = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
      return { 
        key: `${d.getFullYear()}-${d.getMonth()}`, 
        label: MESES_ABR[d.getMonth()], 
        atendido: 0, 
        pendiente: 0 
      };
    });

    mantenimientos.forEach((m) => {
      if (!m.fecha_registro) return;
      const d = new Date(m.fecha_registro);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const mesObj = meses.find((x) => x.key === key);
      if (mesObj) {
        if (m.estado === 'ATENDIDO') mesObj.atendido++;
        else mesObj.pendiente++;
      }
    });

    const maxVal = Math.max(...meses.map(m => m.atendido + m.pendiente), 5);
    return { meses, maxVal };
  }, [mantenimientos]);

  if (loading) return (
    <div className="h-48 w-full flex flex-col items-center justify-center gap-3">
      <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analizando Historial</span>
    </div>
  );

  return (
    <div className="w-full pt-4">
      <div className="flex items-end justify-between gap-4 h-40 px-2 relative">
        {/* Líneas de Guía de Fondo */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-2 opacity-50">
           {[...Array(4)].map((_, i) => <div key={i} className="w-full border-t border-slate-100 dark:border-slate-800 border-dashed" />)}
        </div>

        {chartData.meses.map((mes) => {
          const hAt = (mes.atendido / chartData.maxVal) * 100;
          const hPen = (mes.pendiente / chartData.maxVal) * 100;
          
          return (
            <div key={mes.key} className="flex-1 flex flex-col items-center group relative z-10">
              <div className="w-full max-w-[24px] flex flex-col-reverse items-center gap-1 h-32">
                {/* Barra Atendidos */}
                <div 
                  className="w-full bg-gradient-to-t from-primary to-primary-light rounded-sm transition-all duration-700 hover:scale-110 relative"
                  style={{ height: `${hAt}%` }}
                >
                   {mes.atendido > 0 && (
                     <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                       {mes.atendido} OK
                     </span>
                   )}
                </div>
                {/* Barra Otros/Pendientes */}
                <div 
                  className="w-full bg-slate-200 dark:bg-slate-700 rounded-sm transition-all duration-700 delay-100"
                  style={{ height: `${hPen}%` }}
                />
              </div>
              <span className="text-[9px] font-black mt-4 text-slate-400 group-hover:text-primary transition-colors tracking-tighter">
                {mes.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Leyenda Estilizada */}
      <div className="flex justify-center gap-6 mt-8">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-primary shadow-lg shadow-primary/40" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Atendidos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-slate-300 dark:bg-slate-600" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pendientes</span>
        </div>
      </div>
    </div>
  );
}