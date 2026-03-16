import { useState, useEffect } from 'react';
import Modal        from '../../../../components/modal/Modal';
import ModalHeader  from '../../../../components/modal/ModalHeader';
import ModalBody    from '../../../../components/modal/ModalBody';
import ModalFooter  from '../../../../components/modal/ModalFooter';
import { useBienes } from '../../../../hooks/useBienes';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <svg className="animate-spin h-5 w-5" style={{ color: 'var(--color-primary)' }}
           fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

function Dato({ icon, label, value, mono = false, span2 = false }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={`flex items-start gap-2.5 py-2 ${span2 ? 'col-span-2' : ''}`}
         style={{ borderBottom: '1px solid var(--color-border-light)' }}>
      <Icon name={icon} className="text-[13px] mt-0.5 shrink-0"
            style={{ color: 'var(--color-text-faint)' }} />
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest"
           style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className={`text-sm font-semibold mt-0.5 break-words ${mono ? 'font-mono' : ''}`}
           style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

function SeccionTitulo({ icon, label }) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-0.5"
         style={{ borderBottom: '1px solid var(--color-border)' }}>
      <Icon name={icon} className="text-[14px] text-primary" />
      <p className="text-[9px] font-black uppercase tracking-widest"
         style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    </div>
  );
}

const ESTADO_BIEN_CLS = (nombre) => ({
  'BUENO': 'badge-activo', 'REGULAR': 'badge-pendiente',
  'MALO': 'badge-cancelado', 'DADO DE BAJA': 'badge-cancelado',
}[nombre?.toUpperCase()] ?? 'badge-inactivo');

function formatFecha(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Renderiza el bloque de detalle técnico según el tipo presente ─────────────
function DetalleTecnico({ bien }) {
  const cpu       = bien.detalle_cpu;
  const monitor   = bien.detalle_monitor;
  const impresora = bien.detalle_impresora;
  const scanner   = bien.detalle_scanner;
  const sw        = bien.detalle_switch;

  if (!cpu && !monitor && !impresora && !scanner && !sw) return null;

  return (
    <div className="space-y-3">
      <SeccionTitulo icon="settings" label="Detalle técnico" />
      <div className="grid grid-cols-2 gap-x-6">
        {/* CPU */}
        {cpu && (
          <>
            <Dato icon="computer"   label="Tipo de computadora" value={cpu.tipo_computadora_nombre} />
            <Dato icon="memory"     label="Procesador"          value={cpu.procesador} />
            <Dato icon="storage"    label="RAM (GB)"            value={cpu.ram_gb} />
            <Dato icon="hard_drive" label="Disco (GB)"          value={cpu.capacidad_disco_gb} />
            <Dato icon="storage"    label="Tipo de disco"       value={cpu.tipo_disco_nombre} />
            <Dato icon="memory"     label="Arquitectura"        value={cpu.arquitectura_bits_nombre} />
            <Dato icon="dns"        label="Sistema operativo"   value={cpu.sistema_operativo} />
            <Dato icon="router"     label="MAC address"         value={cpu.mac_address} mono />
          </>
        )}
        {/* Monitor */}
        {monitor && (
          <>
            <Dato icon="monitor"    label="Tipo de monitor"    value={monitor.tipo_monitor_nombre} />
            <Dato icon="fullscreen" label="Tamaño (pulgadas)"  value={monitor.tamano_pulgadas} />
            <Dato icon="display_settings" label="Resolución"   value={monitor.resolucion} />
            <Dato icon="cable"      label="Interfaz conexión"  value={monitor.interfaz_conexion_nombre} />
          </>
        )}
        {/* Impresora */}
        {impresora && (
          <>
            <Dato icon="print"       label="Tipo de impresión"  value={impresora.tipo_impresion_nombre} />
            <Dato icon="cable"       label="Interfaz conexión"  value={impresora.interfaz_conexion_nombre} />
            <Dato icon="straighten"  label="Tamaño de carro"    value={impresora.tamano_carro_nombre} />
            <Dato icon="speed"       label="Velocidad (ppm)"    value={impresora.velocidad_ppm} />
          </>
        )}
        {/* Scanner */}
        {scanner && (
          <>
            <Dato icon="document_scanner" label="Tipo de escáner"    value={scanner.tipo_escaner_nombre} />
            <Dato icon="cable"            label="Interfaz conexión"  value={scanner.interfaz_conexion_nombre} />
            <Dato icon="image"            label="Resolución (DPI)"   value={scanner.resolucion_dpi} />
            <Dato icon="straighten"       label="Tamaño máx. doc."   value={scanner.tamano_max_documento} />
          </>
        )}
        {/* Switch */}
        {sw && (
          <>
            <Dato icon="hub"    label="N° de puertos"  value={sw.numero_puertos} />
            <Dato icon="speed"  label="Velocidad Mbps" value={sw.velocidad_mbps} />
            <Dato icon="toggle_on" label="Administrable" value={sw.es_administrable ? 'Sí (Managed)' : 'No (Unmanaged)'} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ModalDetalleBien({ open, onClose, item, onEditar }) {
  const { obtener } = useBienes();

  const [bien,     setBien]     = useState(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!open || !item?.id) return;
    let cancelled = false;
    setLoading(true);
    setBien(null);
    obtener(item.id)
      .then((d)  => { if (!cancelled) setBien(d); })
      .catch(()  => { if (!cancelled) setBien(item); }) // fallback a item parcial
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, item?.id]);

  if (!item) return null;

  const data = bien ?? item;

  return (
    <Modal open={open} onClose={onClose} size="lg" closeOnOverlay>
      <ModalHeader
        title="Detalle de Bien"
        icon="inventory_2"
        onClose={onClose}
      />

      {/* Nombre del bien */}
      <div className="px-6 py-2.5 shrink-0"
           style={{ borderBottom: '1px solid var(--color-border-light)' }}>
        <p className="text-[15px] font-black leading-tight"
           style={{ color: 'var(--color-text-primary)' }}>
          {[data.marca_nombre ?? data.marca?.nombre, data.modelo].filter(Boolean).join(' — ') || `Bien ID #${data.id}`}
        </p>
        {data.tipo_bien_nombre && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {data.tipo_bien_nombre}
            {data.categoria_bien_nombre ? ` · ${data.categoria_bien_nombre}` : ''}
          </p>
        )}
      </div>

      <ModalBody padding={false}>
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-12 gap-0" style={{ minHeight: 400 }}>

            {/* Contenido principal */}
            <div className="col-span-9 overflow-y-auto px-6 py-4 space-y-4"
                 style={{ borderRight: '1px solid var(--color-border-light)' }}>

              {/* Identificación */}
              <div>
                <SeccionTitulo icon="label" label="Identificación" />
                <div className="grid grid-cols-2 gap-x-6">
                  <Dato icon="qr_code"    label="Código patrimonial" value={data.codigo_patrimonial} mono />
                  <Dato icon="tag"        label="N° de serie"        value={data.numero_serie}       mono />
                  <Dato icon="category"   label="Régimen tenencia"   value={data.regimen_tenencia?.nombre} />
                  <Dato icon="calendar_today" label="Fecha registro" value={formatFecha(data.fecha_registro)} />
                </div>
              </div>

              {/* Estado */}
              <div>
                <SeccionTitulo icon="toggle_on" label="Estado" />
                <div className="grid grid-cols-2 gap-x-6">
                  <Dato icon="inventory"         label="Estado del bien"        value={data.estado_bien?.nombre ?? data.estado_bien_nombre} />
                  <Dato icon="power_settings_new" label="Funcionamiento"         value={data.estado_funcionamiento?.nombre ?? data.estado_funcionamiento_nombre} />
                </div>
              </div>

              {/* Adquisición */}
              <div>
                <SeccionTitulo icon="receipt_long" label="Adquisición" />
                <div className="grid grid-cols-2 gap-x-6">
                  <Dato icon="event"       label="Año adquisición"   value={data.anio_adquisicion} />
                  <Dato icon="event"       label="Fecha de compra"   value={formatFecha(data.fecha_compra)} />
                  <Dato icon="receipt"     label="N° orden compra"   value={data.numero_orden_compra} mono />
                  <Dato icon="event_busy"  label="Venc. garantía"    value={formatFecha(data.fecha_vencimiento_garantia)} />
                  <Dato icon="build"       label="Fecha instalación" value={formatFecha(data.fecha_instalacion)} />
                  <Dato icon="fact_check"  label="Último inventario" value={formatFecha(data.fecha_ultimo_inventario)} />
                </div>
              </div>

              {/* Detalle técnico condicional */}
              {bien && <DetalleTecnico bien={bien} />}

              {/* Observación */}
              {data.observacion && (
                <div>
                  <SeccionTitulo icon="notes" label="Observaciones" />
                  <p className="text-sm mt-2" style={{ color: 'var(--color-text-body)' }}>
                    {data.observacion}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar — ubicación y estado rápido */}
            <div className="col-span-3 overflow-y-auto p-4 space-y-4"
                 style={{ background: 'var(--color-surface-alt)' }}>

              {/* Estado rápido */}
              <section className="card p-4 space-y-2">
                <h3 className="text-[9px] font-black uppercase tracking-widest"
                    style={{ color: 'var(--color-text-muted)' }}>Estado</h3>
                <span className={`badge ${ESTADO_BIEN_CLS(data.estado_bien_nombre ?? data.estado_bien?.nombre)}`}>
                  {data.estado_bien_nombre ?? data.estado_bien?.nombre ?? '—'}
                </span>
                <div className="pt-1">
                  <span className="badge badge-inactivo text-[9px]">
                    {data.estado_funcionamiento_nombre ?? data.estado_funcionamiento?.nombre ?? '—'}
                  </span>
                </div>
                <div className="pt-1">
                  <span className={data.is_active ? 'badge-activo' : 'badge-inactivo'}>
                    <span className={`size-1.5 rounded-full ${data.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                    {data.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </section>

              {/* Ubicación */}
              <section className="card p-4 space-y-3">
                <h3 className="text-[9px] font-black uppercase tracking-widest"
                    style={{ color: 'var(--color-text-muted)' }}>Ubicación</h3>
                {[
                  { icon: 'business',    label: 'Sede',      value: data.sede_id     ? `ID #${data.sede_id}`      : '—' },
                  { icon: 'widgets',     label: 'Módulo',    value: data.modulo_id   ? `ID #${data.modulo_id}`   : '—' },
                  { icon: 'room',        label: 'Ubicación', value: data.ubicacion_id ? `ID #${data.ubicacion_id}`: '—' },
                  { icon: 'stairs',      label: 'Piso',      value: data.piso        ? `Piso ${data.piso}`       : '—' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Icon name={icon} className="text-[13px]"
                            style={{ color: 'var(--color-text-faint)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                    </div>
                    <span className="text-xs font-black font-mono"
                          style={{ color: 'var(--color-text-primary)' }}>{value}</span>
                  </div>
                ))}
              </section>

              {/* Custodio */}
              {data.usuario_asignado_id && (
                <section className="card p-4">
                  <h3 className="text-[9px] font-black uppercase tracking-widest mb-2"
                      style={{ color: 'var(--color-text-muted)' }}>Custodio</h3>
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full flex items-center justify-center shrink-0"
                         style={{ background: 'rgba(127,29,29,0.1)' }}>
                      <Icon name="person" className="text-[15px] text-primary" />
                    </div>
                    <span className="text-xs font-black font-mono"
                          style={{ color: 'var(--color-text-primary)' }}>
                      ID #{data.usuario_asignado_id}
                    </span>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter align="between">
        <span className="text-[9px] font-bold" style={{ color: 'var(--color-text-faint)' }}>
          ID: {data.id}
          {data.codigo_patrimonial ? ` · Cód: ${data.codigo_patrimonial}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="btn-secondary">Cerrar</button>
          {onEditar && (
            <button onClick={() => { onClose(); onEditar(data); }} className="btn-primary">
              <Icon name="edit" className="text-[16px]" /> Editar
            </button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}