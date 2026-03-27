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

// ── Helpers de exportación: detalle técnico según tipo ───────────────────────
function extraerDetalleTecnico(b) {
  if (b.detalle_cpu) {
    const d = b.detalle_cpu;
    return {
      tipo_tecnico: 'CPU',
      hostname: d.hostname ?? '',
      ip: d.direccion_ip ?? '',
      mac: d.direccion_mac ?? '',
      procesador: d.procesador_tipo ?? '',
      velocidad: d.procesador_velocidad ?? '',
      nucleos: d.procesador_nucleos ?? '',
      ram: d.capacidad_ram_gb ?? '',
      disco: d.capacidad_disco ?? '',
      so: d.sistema_operativo ?? '',
      office: d.version_office ?? '',
      tipo_computadora: d.tipo_computadora_nombre ?? '',
      tipo_disco: d.tipo_disco_nombre ?? '',
      conectado_red: d.conectado_red ? 'SÍ' : 'NO',
      multimedia: d.multimedia ?? '',
    };
  }
  if (b.detalle_monitor) {
    const d = b.detalle_monitor;
    return { tipo_tecnico: 'MONITOR', tipo_monitor: d.tipo_monitor_nombre ?? '', tamano_pulgadas: d.tamano_pulgadas ?? '' };
  }
  if (b.detalle_impresora) {
    const d = b.detalle_impresora;
    return {
      tipo_tecnico: 'IMPRESORA',
      tipo_impresion: d.tipo_impresion_nombre ?? '',
      interfaz: d.interfaz_conexion_nombre ?? '',
      color: d.impresion_color ? 'SÍ' : 'NO',
      duplex: d.unidad_duplex ? 'SÍ' : 'NO',
      red: d.conexion_red ? 'SÍ' : 'NO',
      ip: d.direccion_ip ?? '',
      velocidad_ppm: d.velocidad_impresion_ppm ?? '',
    };
  }
  if (b.detalle_scanner) {
    const d = b.detalle_scanner;
    return {
      tipo_tecnico: 'SCANNER',
      tipo_escaner: d.tipo_escaner_nombre ?? '',
      interfaz: d.interfaz_conexion_nombre ?? '',
      adf: d.alimentador_automatico ? 'SÍ' : 'NO',
      resolucion: d.resolucion_exploracion ?? '',
    };
  }
  if (b.detalle_switch) {
    const d = b.detalle_switch;
    return {
      tipo_tecnico: 'SWITCH',
      ip: d.direccion_ip ?? '',
      mac: d.direccion_mac ?? '',
      puertos_utp: d.cantidad_puertos_utp ?? '',
      velocidad_mbps: d.velocidad_mbps ?? '',
      admin: d.admin_software ? 'SÍ' : 'NO',
      vlan: d.soporta_vlan ? 'SÍ' : 'NO',
    };
  }
  return { tipo_tecnico: '' };
}

// ── Exportar CSV ──────────────────────────────────────────────────────────────
function exportCSV(items) {
  const headers = [
    'ID', 'Tipo', 'Categoría', 'Marca', 'Modelo', 'N° Serie', 'Cód. Patrimonial',
    'Régimen Tenencia', 'Estado Bien', 'Funcionamiento', 'Sede', 'Módulo', 'Ubicación',
    'Piso', 'Custodio', 'Año Adquisición', 'Fecha Compra', 'N° Orden Compra',
    'Garantía Vence', 'Observación', 'Activo',
    // Detalle técnico
    'Tipo Técnico', 'Hostname', 'IP', 'MAC', 'Procesador', 'Velocidad Proc.',
    'Núcleos', 'RAM', 'Disco', 'S.O.', 'Office', 'Tipo Computadora', 'Tipo Disco',
    'Conectado Red', 'Multimedia',
    'Tipo Monitor', 'Pulgadas',
    'Tipo Impresión', 'Interfaz', 'Color', 'Dúplex', 'Red Impresora', 'Vel. PPM',
    'Tipo Escáner', 'ADF', 'Resolución Escáner',
    'Puertos UTP', 'Vel. Mbps', 'Admin SW', 'Soporta VLAN',
  ];

  const rows = items.map(b => {
    const dt = extraerDetalleTecnico(b);
    return [
      b.id ?? '', b.tipo_bien_nombre ?? '', b.categoria_bien_nombre ?? '',
      b.marca_nombre ?? '', b.modelo ?? '', b.numero_serie ?? '', b.codigo_patrimonial ?? '',
      b.regimen_tenencia_nombre ?? '', b.estado_bien_nombre ?? '', b.estado_funcionamiento_nombre ?? '',
      b.sede_nombre ?? '', b.modulo_nombre ?? '', b.ubicacion_nombre ?? '',
      b.piso ?? '', b.usuario_asignado_nombre ?? '',
      b.anio_adquisicion ?? '', b.fecha_compra ?? '', b.numero_orden_compra ?? '',
      b.fecha_vencimiento_garantia ?? '', b.observacion ?? '', b.is_active ? 'SÍ' : 'NO',
      // CPU
      dt.tipo_tecnico ?? '', dt.hostname ?? '', dt.ip ?? '', dt.mac ?? '',
      dt.procesador ?? '', dt.velocidad ?? '', dt.nucleos ?? '', dt.ram ?? '',
      dt.disco ?? '', dt.so ?? '', dt.office ?? '', dt.tipo_computadora ?? '',
      dt.tipo_disco ?? '', dt.conectado_red ?? '', dt.multimedia ?? '',
      // Monitor
      dt.tipo_monitor ?? '', dt.tamano_pulgadas ?? '',
      // Impresora
      dt.tipo_impresion ?? '', dt.interfaz ?? '', dt.color ?? '', dt.duplex ?? '',
      dt.red ?? '', dt.velocidad_ppm ?? '',
      // Scanner
      dt.tipo_escaner ?? '', dt.adf ?? '', dt.resolucion ?? '',
      // Switch
      dt.puertos_utp ?? '', dt.velocidad_mbps ?? '', dt.admin ?? '', dt.vlan ?? '',
    ];
  });

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

// ── Exportar Excel (.xls HTML table) ─────────────────────────────────────────
function exportExcel(items) {
  const thStyle = 'background:#7F1D1D;color:white;font-weight:bold;padding:5px 8px;border:1px solid #991B1B;font-size:10px;white-space:nowrap;';
  const tdStyle = 'padding:4px 8px;border:1px solid #e2e8f0;font-size:10px;';
  const tdMono  = 'padding:4px 8px;border:1px solid #e2e8f0;font-size:10px;font-family:monospace;';

  const headers = [
    'ID','Cód.Patrimonial','Tipo','Categoría','Marca','Modelo','N° Serie',
    'Estado Bien','Funcionamiento','Sede','Módulo','Ubicación','Piso','Custodio',
    'Año Adq.','Fecha Compra','Activo',
    'Tipo Técnico','Hostname/IP/MAC','Procesador','RAM','Disco','S.O.',
    'Tipo Monitor','Pulgadas',
    'Tipo Impresión','Color','Dúplex','Red','Vel.PPM',
    'Tipo Escáner','ADF','Resolución',
    'Puertos UTP','Vel.Mbps','Admin SW',
  ];

  const rows = items.map(b => {
    const dt = extraerDetalleTecnico(b);
    const redInfo = dt.ip ? `IP:${dt.ip} MAC:${dt.mac ?? ''}` : '';
    const cpuInfo = dt.hostname ? `${dt.hostname} ${redInfo}` : redInfo;
    return [
      b.id ?? '', b.codigo_patrimonial ?? '', b.tipo_bien_nombre ?? '',
      b.categoria_bien_nombre ?? '', b.marca_nombre ?? '', b.modelo ?? '', b.numero_serie ?? '',
      b.estado_bien_nombre ?? '', b.estado_funcionamiento_nombre ?? '',
      b.sede_nombre ?? '', b.modulo_nombre ?? '', b.ubicacion_nombre ?? '',
      b.piso ?? '', b.usuario_asignado_nombre ?? '',
      b.anio_adquisicion ?? '', b.fecha_compra ?? '', b.is_active ? 'SÍ' : 'NO',
      dt.tipo_tecnico ?? '', cpuInfo,
      dt.procesador ? `${dt.procesador} ${dt.velocidad ?? ''} x${dt.nucleos ?? ''}` : '',
      dt.ram ?? '', dt.disco ?? '', dt.so ?? '',
      dt.tipo_monitor ?? '', dt.tamano_pulgadas ?? '',
      dt.tipo_impresion ?? '', dt.color ?? '', dt.duplex ?? '', dt.red ?? '', dt.velocidad_ppm ?? '',
      dt.tipo_escaner ?? '', dt.adf ?? '', dt.resolucion ?? '',
      dt.puertos_utp ?? '', dt.velocidad_mbps ?? '', dt.admin ?? '',
    ];
  });

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8"></head>
<body>
<table>
  <thead><tr>${headers.map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r => `<tr>${r.map((v, i) => `<td style="${i === 0 ? tdMono : tdStyle}">${v}</td>`).join('')}</tr>`).join('')}</tbody>
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

// ── Exportar PDF (impresión del navegador) ────────────────────────────────────
function exportPDF(items) {
  const fecha = new Date().toLocaleDateString('es-PE', { dateStyle: 'long' });

  const filas = items.map((b, i) => {
    const dt  = extraerDetalleTecnico(b);
    const det = dt.tipo_tecnico
      ? `<div style="font-size:8px;color:#475569;margin-top:2px">${dt.tipo_tecnico}: ${
          dt.hostname ? `${dt.hostname} · IP ${dt.ip ?? '—'} · ` : ''
        }${dt.procesador ? `${dt.procesador} ${dt.velocidad ?? ''} · RAM ${dt.ram ?? '—'} · Disco ${dt.disco ?? '—'} · ${dt.so ?? '—'}` : ''}${
          dt.tipo_monitor ? `Monitor ${dt.tipo_monitor} ${dt.tamano_pulgadas ?? '—'}"` : ''
        }${dt.tipo_impresion ? `${dt.tipo_impresion} · Color: ${dt.color ?? '—'} · Dúplex: ${dt.duplex ?? '—'}` : ''
        }${dt.tipo_escaner ? `${dt.tipo_escaner} · ADF: ${dt.adf ?? '—'}` : ''
        }${dt.puertos_utp ? `Puertos UTP: ${dt.puertos_utp} · ${dt.velocidad_mbps ?? '—'} Mbps` : ''
        }</div>`
      : '';

    return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
      <td style="padding:4px 6px;border:1px solid #e2e8f0;font-size:9px;text-align:center">${i + 1}</td>
      <td style="padding:4px 6px;border:1px solid #e2e8f0;font-size:9px;font-weight:700;color:#7F1D1D;font-family:monospace">${b.codigo_patrimonial ?? '—'}</td>
      <td style="padding:4px 6px;border:1px solid #e2e8f0;font-size:9px">
        <div style="font-weight:700">${b.tipo_bien_nombre ?? '—'}</div>
        <div style="color:#94a3b8;font-size:8px">${b.categoria_bien_nombre ?? ''}</div>
      </td>
      <td style="padding:4px 6px;border:1px solid #e2e8f0;font-size:9px">${b.marca_nombre ?? '—'}<br><span style="color:#94a3b8;font-size:8px">${b.modelo ?? ''}</span></td>
      <td style="padding:4px 6px;border:1px solid #e2e8f0;font-size:8px;font-family:monospace">${b.numero_serie ?? 'S/N'}</td>
      <td style="padding:4px 6px;border:1px solid #e2e8f0;font-size:9px">${b.sede_nombre ?? '—'}</td>
      <td style="padding:4px 6px;border:1px solid #e2e8f0;font-size:9px">${b.usuario_asignado_nombre ?? '—'}</td>
      <td style="padding:4px 6px;border:1px solid #e2e8f0;font-size:9px">
        <span style="color:${b.estado_bien_nombre?.toUpperCase().includes('ACTIVO') ? '#16a34a' : '#64748b'};font-weight:700">${b.estado_bien_nombre ?? '—'}</span>
        <br><span style="font-size:8px;color:#64748b">${b.estado_funcionamiento_nombre ?? '—'}</span>
        ${det}
      </td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>Inventario de Bienes — SISCONPAT</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      body { font-family: Arial, sans-serif; margin: 0; }
      h1 { color: #7F1D1D; font-size: 14px; margin-bottom: 3px; }
      .sub { font-size: 10px; color: #64748b; margin: 0 0 10px; }
      table { width: 100%; border-collapse: collapse; }
      thead tr { background: #7F1D1D; }
      thead th { color: white; padding: 6px 6px; font-size: 9px; text-align: left; border: 1px solid #991B1B; white-space: nowrap; }
      tfoot td { background: #f1f5f9; font-size: 9px; padding: 5px 6px; font-weight: bold; }
    </style>
  </head><body>
    <h1>Inventario de Bienes Patrimoniales — CSJLN</h1>
    <p class="sub">Generado: ${fecha} &nbsp;|&nbsp; Total: ${items.length} registro(s) &nbsp;|&nbsp; SISCONPAT v1.1</p>
    <table>
      <thead><tr>
        <th>#</th><th>Cód. Patrimonial</th><th>Tipo / Categoría</th><th>Marca / Modelo</th>
        <th>N° Serie</th><th>Sede</th><th>Custodio</th><th>Estado / Detalle Técnico</th>
      </tr></thead>
      <tbody>${filas}</tbody>
      <tfoot><tr><td colspan="8">Total exportado: ${items.length} registro(s) — Sistema de Control Patrimonial · CSJLN</td></tr></tfoot>
    </table>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}

// ── Botones de exportación individuales ──────────────────────────────────────
function ExportButtons({ items, totalFiltrados }) {
  const opciones = [
    {
      label: 'CSV',
      icon: 'table_view',
      title: `Exportar ${totalFiltrados} registros a CSV`,
      color: '#16a34a',
      hoverBg: 'rgb(22 163 74 / 0.1)',
      fn: () => exportCSV(items),
    },
    {
      label: 'Excel',
      icon: 'grid_on',
      title: `Exportar ${totalFiltrados} registros a Excel`,
      color: '#1d4ed8',
      hoverBg: 'rgb(37 99 235 / 0.1)',
      fn: () => exportExcel(items),
    },
    {
      label: 'PDF',
      icon: 'picture_as_pdf',
      title: `Imprimir / exportar ${totalFiltrados} registros a PDF`,
      color: '#dc2626',
      hoverBg: 'rgb(220 38 38 / 0.1)',
      fn: () => exportPDF(items),
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-black uppercase tracking-widest mr-1" style={{ color: 'var(--color-text-faint)' }}>
        Exportar:
      </span>
      {opciones.map(op => (
        <button
          key={op.label}
          onClick={op.fn}
          title={op.title}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase transition-all cursor-pointer"
          style={{
            background: 'var(--color-surface)',
            border: `1px solid ${op.color}30`,
            color: op.color,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = op.hoverBg; e.currentTarget.style.borderColor = op.color; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.borderColor = `${op.color}30`; }}
        >
          <Icon name={op.icon} className="text-[16px]" />
          {op.label}
        </button>
      ))}
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

// ── Componente principal ──────────────────────────────────────────────────────
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

      {/* ── Footer con paginación y exportación ── */}
      <div className="table-footer px-6 py-4 bg-surface-alt/50 border-t border-border flex flex-wrap items-center justify-between gap-4">

        {/* Izquierda: total + selector de filas + exportación */}
        <div className="flex items-center gap-5 flex-wrap">
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

          {/* Íconos individuales de exportación */}
          <ExportButtons items={items} totalFiltrados={totalItems} />
        </div>

        {/* Derecha: paginación */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-faint mr-2">
            Pág. <b className="text-main">{pagActual}</b> de <b className="text-main">{totalPages}</b>
          </span>

          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={pagActual === 1}
            className="size-8 flex items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-alt disabled:opacity-30 transition-colors"
          >
            <Icon name="chevron_left" className="text-[18px]" />
          </button>

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