import { useState, useRef } from 'react';
import { usePermission } from '../../../../hooks/usePermission';
import ErrorState from '../../../../components/feedback/ErrorState';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const COLS = [
  { label: 'Tipo / Categoría',    width: 'w-[20%]' },
  { label: 'Marca / Modelo',      width: 'w-[15%]' },
  { label: 'N° Serie / Cód. Pat', width: 'w-[15%]' },
  { label: 'Sede / Módulo',       width: 'w-[15%]' },
  { label: 'Custodio',            width: 'w-[13%]' },
  { label: 'Estado / Func.',      width: 'w-[12%]' },
  { label: 'Acciones',            width: '',        right: true },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ── Helpers de ícono y color dinámicos ────────────────────────────────────────
const getDynamicIcon = (nombre = '') => {
  const n = nombre.toUpperCase();
  if (n.includes('CPU') || n.includes('LAPTOP') || n.includes('COMPU')) return 'computer';
  if (n.includes('MONITOR') || n.includes('PANTALLA')) return 'desktop_windows';
  if (n.includes('IMPRESORA') || n.includes('COPIADORA')) return 'print';
  if (n.includes('SCANNER')) return 'scanner';
  if (n.includes('SWITCH') || n.includes('ROUTER') || n.includes('RED')) return 'device_hub';
  if (n.includes('TECLADO')) return 'keyboard';
  if (n.includes('MOUSE')) return 'mouse';
  if (n.includes('UPS') || n.includes('BATERIA') || n.includes('VOLTAJE')) return 'battery_charging_full';
  if (n.includes('CELULAR') || n.includes('MOVIL') || n.includes('TELEFONO')) return 'smartphone';
  if (n.includes('CAMARA') || n.includes('SEGURIDAD')) return 'videocam';
  if (n.includes('PROYECTOR')) return 'videogame_asset';
  if (n.includes('SILLA') || n.includes('MUEBLE') || n.includes('ESCRITORIO')) return 'chair';
  return 'inventory_2';
};

const getDynamicColor = (text) => {
  if (!text) return '#64748b';
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash % 360)}, 65%, 45%)`;
};

// ── Exportadores ──────────────────────────────────────────────────────────────
function exportCSV(items) {
  const headers = ['ID', 'Tipo', 'Categoría', 'Marca', 'Modelo', 'N° Serie', 'Cód. Patrimonial', 'Sede', 'Módulo', 'Custodio', 'Estado Bien', 'Funcionamiento'];
  const rows = items.map(b => [
    b.id ?? '',
    b.tipo_bien_nombre ?? '',
    b.categoria_bien_nombre ?? '',
    b.marca_nombre ?? '',
    b.modelo ?? '',
    b.numero_serie ?? '',
    b.codigo_patrimonial ?? '',
    b.sede_nombre ?? '',
    b.modulo_nombre ?? '',
    b.usuario_asignado_nombre ?? '',
    b.estado_bien_nombre ?? '',
    b.estado_funcionamiento_nombre ?? '',
  ]);
  const csvContent = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `inventario_bienes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(items) {
  const headers = ['ID', 'Tipo', 'Categoría', 'Marca', 'Modelo', 'N° Serie', 'Cód. Patrimonial', 'Sede', 'Módulo', 'Custodio', 'Estado Bien', 'Funcionamiento'];
  const rows = items.map(b => [
    b.id ?? '',
    b.tipo_bien_nombre ?? '',
    b.categoria_bien_nombre ?? '',
    b.marca_nombre ?? '',
    b.modelo ?? '',
    b.numero_serie ?? '',
    b.codigo_patrimonial ?? '',
    b.sede_nombre ?? '',
    b.modulo_nombre ?? '',
    b.usuario_asignado_nombre ?? '',
    b.estado_bien_nombre ?? '',
    b.estado_funcionamiento_nombre ?? '',
  ]);
  const thStyle = 'background:#7F1D1D;color:white;font-weight:bold;padding:6px 10px;border:1px solid #ccc;font-size:11px;';
  const tdStyle = 'padding:5px 10px;border:1px solid #ddd;font-size:11px;';
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8"></head>
    <body>
      <table>
        <thead><tr>${headers.map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r => `<tr>${r.map(v => `<td style="${tdStyle}">${v}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `inventario_bienes_${new Date().toISOString().slice(0, 10)}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(items) {
  const fecha = new Date().toLocaleDateString('es-PE', { dateStyle: 'long' });
  const rows  = items.map((b, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f8f8f8'}">
      <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:10px;">${i + 1}</td>
      <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:10px;font-weight:bold;">${b.codigo_patrimonial ?? '—'}</td>
      <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:10px;">${b.tipo_bien_nombre ?? '—'}</td>
      <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:10px;">${b.marca_nombre ?? '—'} ${b.modelo ?? ''}</td>
      <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:10px;">${b.numero_serie ?? 'S/N'}</td>
      <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:10px;">${b.sede_nombre ?? '—'}</td>
      <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:10px;">${b.usuario_asignado_nombre ?? '—'}</td>
      <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:10px;">${b.estado_bien_nombre ?? '—'}</td>
      <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:10px;">${b.estado_funcionamiento_nombre ?? '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>Inventario de Bienes</title>
    <style>
      @page { size: A4 landscape; margin: 15mm; }
      body { font-family: Arial, sans-serif; margin: 0; }
      h1 { color: #7F1D1D; font-size: 16px; margin-bottom: 4px; }
      p { font-size: 11px; color: #64748b; margin: 0 0 12px; }
      table { width: 100%; border-collapse: collapse; }
      thead tr { background: #7F1D1D; }
      thead th { color: white; padding: 7px 8px; font-size: 10px; text-align: left; border: 1px solid #991B1B; }
      tfoot td { background: #f1f5f9; font-size: 10px; padding: 6px 8px; font-weight: bold; }
    </style>
  </head><body>
    <h1>Inventario de Bienes Patrimoniales — CSJLN</h1>
    <p>Generado el ${fecha} &nbsp;|&nbsp; Total: ${items.length} registro(s)</p>
    <table>
      <thead><tr>
        <th>#</th><th>Cód. Patrimonial</th><th>Tipo</th><th>Marca / Modelo</th>
        <th>N° Serie</th><th>Sede</th><th>Custodio</th><th>Estado</th><th>Funcionamiento</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="9">Total de registros exportados: ${items.length}</td></tr></tfoot>
    </table>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

// ── Menú de exportación ───────────────────────────────────────────────────────
function ExportMenu({ items, totalFiltrados }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);


  useState(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  });

  const opciones = [
    { label: 'Exportar CSV',   icon: 'table_view',     color: '#16a34a', fn: () => { exportCSV(items);   setOpen(false); } },
    { label: 'Exportar Excel', icon: 'grid_on',        color: '#1d4ed8', fn: () => { exportExcel(items); setOpen(false); } },
    { label: 'Exportar PDF',   icon: 'picture_as_pdf', color: '#dc2626', fn: () => { exportPDF(items);   setOpen(false); } },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
        style={{
          background: open ? 'rgb(127 29 29 / 0.08)' : 'var(--color-surface)',
          border: `1px solid ${open ? 'var(--color-primary)' : 'var(--color-border)'}`,
          color: open ? 'var(--color-primary)' : 'var(--color-text-muted)',
          height: 36,
        }}
        title={`Exportar ${totalFiltrados} registro(s)`}
      >
        <Icon name="download" className="text-[16px]" />
        <span>Exportar</span>
        <Icon name="arrow_drop_down" className="text-[18px]"
          style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform .2s' }} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden shadow-xl z-50"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            minWidth: 180,
          }}>
          <div className="px-3 pt-2.5 pb-1.5" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-faint)' }}>
              {totalFiltrados} registro(s)
            </p>
          </div>
          {opciones.map(o => (
            <button key={o.label} onClick={o.fn}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all text-left"
              style={{ color: o.color }}
              onMouseEnter={e => { e.currentTarget.style.background = `${o.color}10`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              <Icon name={o.icon} className="text-[18px]" />
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Fila de bien ──────────────────────────────────────────────────────────────
function FilaBien({ b, onVerDetalle, onEditar, puedeEditar }) {
  const colorTipo   = getDynamicColor(b.tipo_bien_nombre);
  const colorEstado = getDynamicColor(b.estado_bien_nombre);
  const colorFunc   = getDynamicColor(b.estado_funcionamiento_nombre);

  return (
    <tr className="hover:bg-surface-alt/70 transition-colors border-b border-border group">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${colorTipo}15` }}>
            <Icon name={getDynamicIcon(b.tipo_bien_nombre)} className="text-[20px]"
              style={{ color: colorTipo }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {b.tipo_bien_nombre ?? '—'}
            </p>
            {b.categoria_bien_nombre && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md mt-0.5 inline-block"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                {b.categoria_bien_nombre}
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="px-5 py-3.5">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{b.marca_nombre ?? '—'}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{b.modelo ?? 'S/M'}</p>
      </td>

      <td className="px-5 py-3.5">
        <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>S/N: {b.numero_serie ?? 'S/N'}</p>
        <p className="text-xs font-black font-mono mt-0.5" style={{ color: 'var(--color-primary)' }}>
          {b.codigo_patrimonial ?? '—'}
        </p>
      </td>

      <td className="px-5 py-3.5">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{b.sede_nombre ?? '—'}</p>
        {b.modulo_nombre && (
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{b.modulo_nombre}</p>
        )}
      </td>

      <td className="px-5 py-3.5">
        <p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{b.usuario_asignado_nombre ?? '—'}</p>
        {b.piso != null && (
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>Piso {b.piso}</p>
        )}
      </td>

      <td className="px-5 py-3.5">
        <div className="flex flex-col gap-1">
          <span className="px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wide w-fit"
            style={{ background: `${colorEstado}10`, color: colorEstado, borderColor: `${colorEstado}30` }}>
            {b.estado_bien_nombre ?? '—'}
          </span>
          <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase w-fit text-white"
            style={{ background: colorFunc }}>
            {b.estado_funcionamiento_nombre ?? '—'}
          </span>
        </div>
      </td>

      <td className="px-5 py-3.5 text-right">
        <div className="flex justify-end items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onVerDetalle(b)}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors"
            title="Ver detalle">
            <Icon name="visibility" className="text-[19px]" />
          </button>
          {puedeEditar && (
            <button onClick={() => onEditar(b)}
              className="size-8 flex items-center justify-center rounded-lg hover:bg-amber-500/10 text-amber-600 transition-colors"
              title="Editar">
              <Icon name="edit" className="text-[19px]" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function BienesTabla({ items = [], loading, error, refetch, onVerDetalle, onEditar }) {
  const { can } = usePermission();
  const puedeEditar = can('ms-bienes:bienes:change_bien');
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagActual  = Math.min(page, totalPages);
  const slice      = items.slice((pagActual - 1) * pageSize, pagActual * pageSize);
  const prevTotal = useRef(totalItems);
  if (prevTotal.current !== totalItems) { prevTotal.current = totalItems; if (page !== 1) setPage(1); }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="table-wrapper rounded-2xl overflow-hidden shadow-sm border bg-surface">
      <table className="table w-full">
        <thead>
          <tr>{COLS.map(c => <th key={c.label} className="px-5 py-4">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="border-b border-border">
              {COLS.map((_, j) => (
                <td key={j} className="px-5 py-4"><div className="skeleton h-4 w-full rounded" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (error) return <div className="card p-8"><ErrorState message={error} onRetry={refetch} /></div>;

  if (!items.length) return (
    <div className="text-center py-16 card rounded-xl shadow-sm border bg-surface">
      <Icon name="inventory_2" className="text-[48px] text-faint" />
      <p className="text-sm font-semibold mt-3 text-muted">No se encontraron registros</p>
      <p className="text-xs mt-1 text-faint">Ajusta los filtros para ver resultados</p>
    </div>
  );

  return (
    <div className="table-wrapper border border-border rounded-2xl overflow-hidden bg-surface shadow-sm">
      <div className="table-container overflow-x-auto">
        <table className="table w-full border-collapse border-spacing-0">
          <thead>
            <tr className="bg-surface-alt border-b border-border">
              {COLS.map((c) => (
                <th key={c.label}
                  className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest text-faint ${c.width ?? ''} ${c.right ? 'text-right' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map(b => (
              <FilaBien key={b.id} b={b}
                onVerDetalle={onVerDetalle}
                onEditar={onEditar}
                puedeEditar={puedeEditar}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer con paginación ── */}
      <div className="table-footer px-6 py-4 bg-surface-alt/50 border-t border-border flex flex-wrap items-center justify-between gap-4">

        {/* Izquierda: total + selector de filas + exportar */}
        <div className="flex items-center gap-5">
          <p className="text-xs text-faint">
            Total: <b className="text-main font-black">{totalItems}</b> registro{totalItems !== 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Filas:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="text-xs font-bold border border-border rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            >
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <ExportMenu items={items} totalFiltrados={totalItems} />
        </div>

        {/* Derecha: paginación */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-faint mr-2">
            Pág. <b className="text-main">{pagActual}</b> de <b className="text-main">{totalPages}</b>
          </span>

          {/* Botón anterior */}
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={pagActual === 1}
            className="size-8 flex items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-alt disabled:opacity-30 transition-colors"
          >
            <Icon name="chevron_left" className="text-[18px]" />
          </button>

          {/* Números de página */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - pagActual) <= 1)
              .map((pg, i, arr) => (
                <div key={pg} className="flex items-center gap-1">
                  {i > 0 && arr[i - 1] !== pg - 1 && (
                    <span className="text-muted text-xs mx-0.5">...</span>
                  )}
                  <button
                    onClick={() => setPage(pg)}
                    className={`min-w-[32px] h-8 px-2.5 flex items-center justify-center rounded-lg font-black text-xs transition-all
                      ${pagActual === pg
                        ? 'bg-primary text-white shadow-md shadow-primary/20 border border-primary'
                        : 'bg-surface border border-border text-body hover:border-muted'}`}
                  >
                    {pg}
                  </button>
                </div>
              ))}
          </div>

          {/* Botón siguiente */}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={pagActual === totalPages}
            className="size-8 flex items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-surface-alt disabled:opacity-30 transition-colors"
          >
            <Icon name="chevron_right" className="text-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}