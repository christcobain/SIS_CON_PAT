import { useState, useEffect, useMemo } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useBienes }     from '../../../../hooks/useBienes';
import { useLocaciones } from '../../../../hooks/useLocaciones';
import { useCatalogos }  from '../../../../hooks/useCatalogos';
import { useAuthStore }  from '../../../../store/authStore';
import { useToast }      from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const S = {
  input:    { background: 'var(--color-surface)',     border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' },
  disabled: { background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)',   outline: 'none' },
};
const onF  = e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; };
const offF = e => { e.currentTarget.style.border = '1px solid var(--color-border)'; };

function FLabel({ children, required }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </p>
  );
}

function FError({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
      <Icon name="error" className="text-[11px]" />{msg}
    </p>
  );
}

function FInput({ value, onChange, placeholder, type = 'text', disabled = false, mono = false }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full text-sm rounded-xl px-3 py-2.5 transition-all ${mono ? 'font-mono' : ''}`}
      style={disabled ? S.disabled : S.input}
      onFocus={disabled ? undefined : onF}
      onBlur={offF}
    />
  );
}

function FSelect({ value, onChange, children, disabled = false }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full text-sm rounded-xl px-3 py-2.5 transition-all cursor-pointer"
      style={disabled ? S.disabled : S.input}
      onFocus={disabled ? undefined : onF}
      onBlur={offF}
    >
      {children}
    </select>
  );
}

// Toggle booleano tipo switch
function FToggle({ label, value, onChange, disabled = false }) {
  const checked = value === true || value === 'true';
  return (
    <div
      className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
      style={{
        background: checked ? 'rgb(127 29 29 / 0.06)' : 'var(--color-surface-alt)',
        border: `1px solid ${checked ? 'rgb(127 29 29 / 0.25)' : 'var(--color-border)'}`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-body)' }}>{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={checked ? 'toggle-on' : 'toggle-off'}
      >
        <span className={checked ? 'toggle-thumb-on' : 'toggle-thumb-off'} />
      </button>
    </div>
  );
}

// Divisor de subsección dentro del bloque técnico
function SubSeccion({ title, color = 'var(--color-primary)' }) {
  return (
    <div className="col-span-full flex items-center gap-2 pt-2">
      <div className="h-px w-3 rounded-full" style={{ background: color }} />
      <p className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap" style={{ color }}>
        {title}
      </p>
      <div className="h-px flex-1 rounded-full" style={{ background: `${color}30` }} />
    </div>
  );
}

// Sección principal con título e ícono
function Seccion({ title, icon, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <Icon name={icon} className="text-[16px]" style={{ color: 'var(--color-primary)' }} />
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

const TIPOS_TECNICOS = ['CPU', 'MONITOR', 'IMPRESORA', 'SCANNER', 'SWITCH'];

function detectarTipoTecnico(nombre = '') {
  const n = nombre.toUpperCase();
  return TIPOS_TECNICOS.find(t => n.includes(t)) ?? null;
}

// ── Bloque de detalle técnico completo ────────────────────────────────────────
function SeccionDetalle({ tipoTecnico, detalle, setDetalle, catalogos }) {
  if (!tipoTecnico) return null;
  const setD = (k, v) => setDetalle(p => ({ ...p, [k]: v }));

  const META = {
    CPU:       { label: 'Especificaciones CPU / Computadora', color: '#1d4ed8', icon: 'computer'         },
    MONITOR:   { label: 'Especificaciones Monitor',           color: '#7c3aed', icon: 'desktop_windows'  },
    IMPRESORA: { label: 'Especificaciones Impresora',         color: '#b45309', icon: 'print'            },
    SCANNER:   { label: 'Especificaciones Escáner',           color: '#0f766e', icon: 'document_scanner' },
    SWITCH:    { label: 'Especificaciones Switch / Hub',      color: '#be185d', icon: 'device_hub'       },
  };
  const meta = META[tipoTecnico];

  return (
    <div className="space-y-3">
      {/* Cabecera de sección técnica */}
      <div className="flex items-center gap-2 pb-2" style={{ borderBottom: `2px solid ${meta.color}30` }}>
        <div className="size-7 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}15` }}>
          <Icon name={meta.icon} className="text-[16px]" style={{ color: meta.color }} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</p>
        <span className="ml-1 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${meta.color}15`, color: meta.color }}>
          Detalle técnico
        </span>
      </div>

      {/* ── CPU ──────────────────────────────────────────────────────────── */}
      {tipoTecnico === 'CPU' && (
        <div className="grid grid-cols-3 gap-3">

          <SubSeccion title="Identificación y Red" color="#1d4ed8" />
          <div>
            <FLabel>Tipo de computadora</FLabel>
            <FSelect value={detalle.tipo_computadora_id} onChange={v => setD('tipo_computadora_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.tiposComputadora ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div>
            <FLabel>Función / Uso</FLabel>
            <FInput value={detalle.funcion_cpu} onChange={v => setD('funcion_cpu', v)} placeholder="Ej: Escritorio, Servidor" />
          </div>
          <div>
            <FLabel>Hostname</FLabel>
            <FInput value={detalle.hostname} onChange={v => setD('hostname', v)} placeholder="Ej: PC-JUZ01" mono />
          </div>
          <div>
            <FLabel>Dirección IP</FLabel>
            <FInput value={detalle.direccion_ip} onChange={v => setD('direccion_ip', v)} placeholder="192.168.1.100" mono />
          </div>
          <div>
            <FLabel>Dirección MAC</FLabel>
            <FInput value={detalle.direccion_mac} onChange={v => setD('direccion_mac', v)} placeholder="AA:BB:CC:DD:EE:FF" mono />
          </div>
          <div>
            <FLabel>Dominio del equipo</FLabel>
            <FInput value={detalle.dominio_equipo} onChange={v => setD('dominio_equipo', v)} placeholder="Ej: CSJLN.gob.pe" />
          </div>

          <SubSeccion title="Procesador" color="#1d4ed8" />
          <div>
            <FLabel>Tipo / Modelo</FLabel>
            <FInput value={detalle.procesador_tipo} onChange={v => setD('procesador_tipo', v)} placeholder="Ej: Intel Core i7-12700" />
          </div>
          <div>
            <FLabel>Velocidad</FLabel>
            <FInput value={detalle.procesador_velocidad} onChange={v => setD('procesador_velocidad', v)} placeholder="Ej: 3.6 GHz" />
          </div>
          <div>
            <FLabel>Cantidad de procesadores</FLabel>
            <FInput type="number" value={detalle.procesador_cantidad} onChange={v => setD('procesador_cantidad', v)} placeholder="Ej: 1" />
          </div>
          <div>
            <FLabel>Núcleos por procesador</FLabel>
            <FInput type="number" value={detalle.procesador_nucleos} onChange={v => setD('procesador_nucleos', v)} placeholder="Ej: 8" />
          </div>

          <SubSeccion title="Memoria RAM" color="#1d4ed8" />
          <div>
            <FLabel>Capacidad RAM</FLabel>
            <FInput value={detalle.capacidad_ram_gb} onChange={v => setD('capacidad_ram_gb', v)} placeholder="Ej: 16 GB" />
          </div>
          <div>
            <FLabel>Cantidad de módulos</FLabel>
            <FInput type="number" value={detalle.cantidad_modulos_ram} onChange={v => setD('cantidad_modulos_ram', v)} placeholder="Ej: 2" />
          </div>

          <SubSeccion title="Almacenamiento" color="#1d4ed8" />
          <div>
            <FLabel>Tipo de disco</FLabel>
            <FSelect value={detalle.tipo_disco_id} onChange={v => setD('tipo_disco_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.tiposDisco ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div>
            <FLabel>Capacidad del disco</FLabel>
            <FInput value={detalle.capacidad_disco} onChange={v => setD('capacidad_disco', v)} placeholder="Ej: 512 GB" />
          </div>
          <div>
            <FLabel>Cantidad de discos</FLabel>
            <FInput type="number" value={detalle.cantidad_discos} onChange={v => setD('cantidad_discos', v)} placeholder="Ej: 1" />
          </div>

          <SubSeccion title="Sistema Operativo" color="#1d4ed8" />
          <div>
            <FLabel>Arquitectura</FLabel>
            <FSelect value={detalle.arquitectura_bits_id} onChange={v => setD('arquitectura_bits_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.arquitecturasBits ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div>
            <FLabel>Sistema operativo</FLabel>
            <FInput value={detalle.sistema_operativo} onChange={v => setD('sistema_operativo', v)} placeholder="Ej: Windows 11 Pro" />
          </div>
          <div>
            <FLabel>Licencia SO</FLabel>
            <FInput value={detalle.licencia_so} onChange={v => setD('licencia_so', v)} placeholder="Ej: MAK-XXXXX" mono />
          </div>
          <div>
            <FLabel>Office versión</FLabel>
            <FInput value={detalle.version_office} onChange={v => setD('version_office', v)} placeholder="Ej: Microsoft 365" />
          </div>
          <div>
            <FLabel>Licencia Office</FLabel>
            <FInput value={detalle.licencia_office} onChange={v => setD('licencia_office', v)} placeholder="Ej: PKY-XXXXX" mono />
          </div>

          <SubSeccion title="Adicionales" color="#1d4ed8" />
          <div>
            <FLabel>Tipo tarjeta de video</FLabel>
            <FSelect value={detalle.tipo_tarjeta_video_id} onChange={v => setD('tipo_tarjeta_video_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.tiposTarjetaVideo ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div>
            <FLabel>Multimedia</FLabel>
            <FInput value={detalle.multimedia} onChange={v => setD('multimedia', v)} placeholder="Ej: DVD-RW, Webcam" />
          </div>

          <div className="col-span-full">
            <div className="grid grid-cols-2 gap-2">
              <FToggle label="Conectado a red" value={detalle.conectado_red} onChange={v => setD('conectado_red', v)} />
            </div>
          </div>
        </div>
      )}

      {/* ── MONITOR ──────────────────────────────────────────────────────── */}
      {tipoTecnico === 'MONITOR' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FLabel>Tipo de monitor</FLabel>
            <FSelect value={detalle.tipo_monitor_id} onChange={v => setD('tipo_monitor_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.tiposMonitor ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div>
            <FLabel>Tamaño (pulgadas)</FLabel>
            <FInput type="number" value={detalle.tamano_pulgadas} onChange={v => setD('tamano_pulgadas', v)} placeholder="Ej: 24" />
          </div>
        </div>
      )}

      {/* ── IMPRESORA ────────────────────────────────────────────────────── */}
      {tipoTecnico === 'IMPRESORA' && (
        <div className="grid grid-cols-3 gap-3">

          <SubSeccion title="Tipo e Interfaz" color="#b45309" />
          <div>
            <FLabel>Tipo de impresión</FLabel>
            <FSelect value={detalle.tipo_impresion_id} onChange={v => setD('tipo_impresion_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.tiposImpresion ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div>
            <FLabel>Interfaz de conexión</FLabel>
            <FSelect value={detalle.interfaz_conexion_id} onChange={v => setD('interfaz_conexion_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.interfacesConexion ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div>
            <FLabel>Tamaño de carro</FLabel>
            <FSelect value={detalle.tamano_carro_id} onChange={v => setD('tamano_carro_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.tamanosCarro ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>

          <SubSeccion title="Capacidades y Rendimiento" color="#b45309" />
          <div>
            <FLabel>Velocidad impresión (ppm)</FLabel>
            <FInput type="number" value={detalle.velocidad_impresion_ppm} onChange={v => setD('velocidad_impresion_ppm', v)} placeholder="Ej: 40" />
          </div>
          <div>
            <FLabel>Memoria RAM (MB)</FLabel>
            <FInput type="number" value={detalle.memoria_ram_mb} onChange={v => setD('memoria_ram_mb', v)} placeholder="Ej: 256" />
          </div>
          <div>
            <FLabel>Resolución máxima (ppp)</FLabel>
            <FInput value={detalle.resolucion_maxima_ppp} onChange={v => setD('resolucion_maxima_ppp', v)} placeholder="Ej: 1200x1200" />
          </div>
          <div>
            <FLabel>Tamaño hojas soportadas</FLabel>
            <FInput value={detalle.tamano_hojas_soportadas} onChange={v => setD('tamano_hojas_soportadas', v)} placeholder="Ej: A4, Oficio" />
          </div>
          <div>
            <FLabel>Alimentación AC</FLabel>
            <FInput value={detalle.alimentacion_ac} onChange={v => setD('alimentacion_ac', v)} placeholder="Ej: 220V" />
          </div>

          <SubSeccion title="Red" color="#b45309" />
          <div>
            <FLabel>Dirección IP</FLabel>
            <FInput value={detalle.direccion_ip} onChange={v => setD('direccion_ip', v)} placeholder="192.168.1.100" mono />
          </div>

          <div className="col-span-full">
            <div className="grid grid-cols-3 gap-2">
              <FToggle label="Impresión a color" value={detalle.impresion_color} onChange={v => setD('impresion_color', v)} />
              <FToggle label="Unidad dúplex"     value={detalle.unidad_duplex}   onChange={v => setD('unidad_duplex', v)} />
              <FToggle label="Conexión a red"    value={detalle.conexion_red}    onChange={v => setD('conexion_red', v)} />
            </div>
          </div>
        </div>
      )}

      {/* ── SCANNER ──────────────────────────────────────────────────────── */}
      {tipoTecnico === 'SCANNER' && (
        <div className="grid grid-cols-3 gap-3">

          <SubSeccion title="Tipo e Interfaz" color="#0f766e" />
          <div>
            <FLabel>Tipo de escáner</FLabel>
            <FSelect value={detalle.tipo_escaner_id} onChange={v => setD('tipo_escaner_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.tiposEscaner ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div>
            <FLabel>Interfaz de conexión</FLabel>
            <FSelect value={detalle.interfaz_conexion_id} onChange={v => setD('interfaz_conexion_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.interfacesConexion ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div>
            <FLabel>Tamaño documentos</FLabel>
            <FInput value={detalle.tamano_documentos} onChange={v => setD('tamano_documentos', v)} placeholder="Ej: A4, Oficio" />
          </div>

          <SubSeccion title="Resolución y Alimentación" color="#0f766e" />
          <div>
            <FLabel>Resolución exploración</FLabel>
            <FInput value={detalle.resolucion_exploracion} onChange={v => setD('resolucion_exploracion', v)} placeholder="Ej: 600 dpi" />
          </div>
          <div>
            <FLabel>Resolución salida</FLabel>
            <FInput value={detalle.resolucion_salida} onChange={v => setD('resolucion_salida', v)} placeholder="Ej: 1200 dpi" />
          </div>
          <div>
            <FLabel>Alimentación AC</FLabel>
            <FInput value={detalle.alimentacion_ac} onChange={v => setD('alimentacion_ac', v)} placeholder="Ej: 220V" />
          </div>

          <div className="col-span-full">
            <div className="grid grid-cols-2 gap-2">
              <FToggle label="Alimentador automático (ADF)" value={detalle.alimentador_automatico} onChange={v => setD('alimentador_automatico', v)} />
              <FToggle label="Soporte de metadata"          value={detalle.metadata}               onChange={v => setD('metadata', v)} />
            </div>
          </div>
        </div>
      )}

      {/* ── SWITCH / HUB ─────────────────────────────────────────────────── */}
      {tipoTecnico === 'SWITCH' && (
        <div className="grid grid-cols-3 gap-3">

          <SubSeccion title="Identificación de Red" color="#be185d" />
          <div>
            <FLabel>Dirección IP</FLabel>
            <FInput value={detalle.direccion_ip} onChange={v => setD('direccion_ip', v)} placeholder="192.168.1.1" mono />
          </div>
          <div>
            <FLabel>Dirección MAC</FLabel>
            <FInput value={detalle.direccion_mac} onChange={v => setD('direccion_mac', v)} placeholder="AA:BB:CC:DD:EE:FF" mono />
          </div>
          <div>
            <FLabel>Velocidad (Mbps)</FLabel>
            <FInput type="number" value={detalle.velocidad_mbps} onChange={v => setD('velocidad_mbps', v)} placeholder="Ej: 1000" />
          </div>

          <SubSeccion title="Puertos" color="#be185d" />
          <div>
            <FLabel>Puertos UTP</FLabel>
            <FInput type="number" value={detalle.cantidad_puertos_utp} onChange={v => setD('cantidad_puertos_utp', v)} placeholder="Ej: 24" />
          </div>
          <div>
            <FLabel>Puertos FTP</FLabel>
            <FInput type="number" value={detalle.cantidad_puertos_ftp} onChange={v => setD('cantidad_puertos_ftp', v)} placeholder="Ej: 0" />
          </div>
          <div>
            <FLabel>Puertos FO (Fibra)</FLabel>
            <FInput type="number" value={detalle.cantidad_puertos_fo} onChange={v => setD('cantidad_puertos_fo', v)} placeholder="Ej: 2" />
          </div>
          <div>
            <FLabel>Puertos WAN</FLabel>
            <FInput type="number" value={detalle.cantidad_puertos_wan} onChange={v => setD('cantidad_puertos_wan', v)} placeholder="Ej: 1" />
          </div>

          <SubSeccion title="Hardware" color="#be185d" />
          <div>
            <FLabel>Chasis / Slots</FLabel>
            <FInput type="number" value={detalle.chasis_slots} onChange={v => setD('chasis_slots', v)} placeholder="Ej: 1" />
          </div>
          <div>
            <FLabel>Fuente de poder</FLabel>
            <FInput value={detalle.fuente_poder} onChange={v => setD('fuente_poder', v)} placeholder="Ej: 60W, Redundante" />
          </div>
          <div>
            <FLabel>Alimentación AC</FLabel>
            <FInput value={detalle.alimentacion_ac} onChange={v => setD('alimentacion_ac', v)} placeholder="Ej: 220V" />
          </div>

          <div className="col-span-full">
            <div className="grid grid-cols-2 gap-2">
              <FToggle label="Administrable por software" value={detalle.admin_software}  onChange={v => setD('admin_software', v)} />
              <FToggle label="Soporta VLAN"              value={detalle.soporta_vlan}    onChange={v => setD('soporta_vlan', v)} />
              <FToggle label="Migración ATM"             value={detalle.migracion_atm}   onChange={v => setD('migracion_atm', v)} />
              <FToggle label="Manual incluido"           value={detalle.manual_incluido} onChange={v => setD('manual_incluido', v)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Formulario vacío inicial ──────────────────────────────────────────────────
const FORM_VACIO = {
  tipo_bien_id: '', categoria_bien_id: '', marca_id: '', modelo: '',
  numero_serie: '', codigo_patrimonial: '', regimen_tenencia_id: '',
  estado_bien_id: '', estado_funcionamiento_id: '',
  observacion: '', anio_adquisicion: '', fecha_compra: '',
  numero_orden_compra: '', fecha_vencimiento_garantia: '',
  ubicacion_id: '', piso: '',
};

export default function ModalBienForm({ open, onClose, item = null, onGuardado }) {
  const toast      = useToast();
  const modoEditar = !!item;

  const { crear, actualizar }              = useBienes();
  const { ubicaciones }                    = useLocaciones();
  const { fetchCatalogos, ...catalogos }   = useCatalogos();

  const empresaId          = useAuthStore(s => s.empresaId);

  const sedes_auth         = useAuthStore(s => s.sedes);
  const modulo_id_auth     = useAuthStore(s => s.modulo_id);

  const sedeDefault        = sedes_auth?.[0];

  const [form,      setForm]      = useState({ ...FORM_VACIO });
  const [detalle,   setDetalle]   = useState({});
  const [errors,    setErrors]    = useState({});
  const [confirm,   setConfirm]   = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Cargar catálogos — incluye tiposTarjetaVideo que faltaba antes
  useEffect(() => {
    if (!open) return;
    fetchCatalogos([
      'categoriasBien', 'tiposBien', 'marcas', 'regimenTenencia',
      'estadosBien', 'estadosFuncionamiento',
      'tiposComputadora', 'tiposDisco', 'arquitecturasBits', 'tiposTarjetaVideo',
      'tiposMonitor', 'tiposEscaner', 'tiposImpresion',
      'interfacesConexion', 'tamanosCarro',
    ]);
  }, [open, fetchCatalogos]);

  // Inicializar al abrir
  useEffect(() => {
    if (!open) return;
    if (modoEditar && item) {
      setForm({
        tipo_bien_id:             String(item.tipo_bien_id ?? item.tipo_bien?.id ?? ''),
        categoria_bien_id:        String(item.categoria_bien_id ?? item.categoria_bien?.id ?? ''),
        marca_id:                 String(item.marca_id ?? item.marca?.id ?? ''),
        modelo:                   item.modelo ?? '',
        numero_serie:             item.numero_serie ?? '',
        codigo_patrimonial:       item.codigo_patrimonial ?? '',
        regimen_tenencia_id:      String(item.regimen_tenencia_id ?? item.regimen_tenencia?.id ?? ''),
        estado_bien_id:           String(item.estado_bien_id ?? item.estado_bien?.id ?? ''),
        estado_funcionamiento_id: String(item.estado_funcionamiento_id ?? item.estado_funcionamiento?.id ?? ''),
        observacion:              item.observacion ?? '',
        anio_adquisicion:         item.anio_adquisicion ?? '',
        fecha_compra:             item.fecha_compra ?? '',
        numero_orden_compra:      item.numero_orden_compra ?? '',
        fecha_vencimiento_garantia: item.fecha_vencimiento_garantia ?? '',
        ubicacion_id:             String(item.ubicacion_id ?? ''),
        piso:                     item.piso ?? '',
      });
      const d = item.detalle_cpu
        ?? item.detalle_monitor
        ?? item.detalle_impresora
        ?? item.detalle_scanner
        ?? item.detalle_switch
        ?? {};
      setDetalle(d);
    } else {
      setForm({ ...FORM_VACIO });
      setDetalle({});
    }
    setErrors({});
  }, [modoEditar, open]);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const categorias     = catalogos.categoriasBien ?? [];
  const tiposBien      = catalogos.tiposBien ?? [];
  const marcas         = catalogos.marcas ?? [];
  const regimenes      = catalogos.regimenTenencia ?? [];
  const estadosBien    = catalogos.estadosBien ?? [];
  const estadosFuncion = catalogos.estadosFuncionamiento ?? [];

  // Normalización sin tildes para comparación robusta
  const norm = (str = '') => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

  const categoriaSel  = categorias.find(c => String(c.id) === String(form.categoria_bien_id));
  const esInformatico = norm(categoriaSel?.nombre ?? '').includes('INFORMATICA');

  const tipoSel     = tiposBien.find(t => String(t.id) === String(form.tipo_bien_id));
  const tipoTecnico = esInformatico ? detectarTipoTecnico(tipoSel?.nombre ?? '') : null;

  // CatTipoBien no tiene FK a CatCategoriaBien — se muestran todos al elegir cualquier categoría
  const tiposFiltrados = useMemo(
    () => form.categoria_bien_id ? tiposBien.filter(t => t.is_active !== false) : [],
    [tiposBien, form.categoria_bien_id]
  );

  const ubicacionesActivos = (ubicaciones ?? []).filter(m => m.is_active !== false);

  // Auto-asignar estados al crear nuevo bien
  const idBueno     = estadosBien.find(e => norm(e.nombre).includes('BUENO') || norm(e.nombre).includes('ACTIVO'))?.id;
  const idOperativo = estadosFuncion.find(e => norm(e.nombre).includes('OPERATIVO'))?.id;

  useEffect(() => {
    if (!modoEditar && idBueno)     setF('estado_bien_id',           String(idBueno));
    if (!modoEditar && idOperativo) setF('estado_funcionamiento_id', String(idOperativo));
  }, [idBueno, idOperativo, modoEditar]);

  const validar = () => {
    const e = {};
    if (!form.tipo_bien_id)        e.tipo_bien_id        = 'Obligatorio.';
    if (!form.marca_id)            e.marca_id            = 'Obligatorio.';
    if (!form.modelo.trim())       e.modelo              = 'Obligatorio.';
    if (!form.regimen_tenencia_id) e.regimen_tenencia_id = 'Obligatorio.';
    return e;
  };

  const handleGuardar = async () => {
    setConfirm(false);
    setGuardando(true);
    try {
      const detallePayload = tipoTecnico
        ? Object.fromEntries(Object.entries(detalle).filter(([, v]) => v !== '' && v != null))
        : {};

      const payload = {
        empresa_id:               Number(empresaId),
        sede_id:                  sedeDefault?.id ? Number(sedeDefault.id) : undefined,
        tipo_bien_id:             Number(form.tipo_bien_id) || undefined,
        categoria_bien_id:        form.categoria_bien_id ? Number(form.categoria_bien_id) : null,
        marca_id:                 Number(form.marca_id) || undefined,
        modelo:                   form.modelo,
        numero_serie:             form.numero_serie || null,
        codigo_patrimonial:       form.codigo_patrimonial || null,
        regimen_tenencia_id:      Number(form.regimen_tenencia_id) || undefined,
        estado_bien_id:           Number(form.estado_bien_id) || undefined,
        estado_funcionamiento_id: Number(form.estado_funcionamiento_id) || undefined,
        observacion:              form.observacion || null,
        anio_adquisicion:         form.anio_adquisicion || null,
        fecha_compra:             form.fecha_compra || null,
        numero_orden_compra:      form.numero_orden_compra || null,
        fecha_vencimiento_garantia: form.fecha_vencimiento_garantia || null,
        modulo_id:                Number(modulo_id_auth),
        ubicacion_id:             form.ubicacion_id ? Number(form.ubicacion_id) : null,
        piso:                     form.piso ? Number(form.piso) : null,
        fecha_instalacion:        null,
        detalle:                  detallePayload,
      };

      if (modoEditar) {
        await actualizar(item.id, payload);
        toast.success('Bien actualizado correctamente.');
      } else {
        await crear(payload);
        toast.success('Bien registrado correctamente.');
      }
      onGuardado?.();
      onClose();
    } catch (e) {
      const msg = e?.response?.data?.error
        ?? Object.values(e?.response?.data ?? {})?.[0]?.[0]
        ?? 'Error al guardar.';
      toast.error(msg);
    } finally {
      setGuardando(false);
      setConfirm(false);
    }
  };

  const handleValidar = () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); toast.error('Completa los campos obligatorios.'); return; }
    setConfirm(true);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="xl" closeOnOverlay={!guardando && !confirm}>
        <ModalHeader
          icon="inventory_2"
          title={modoEditar ? `Editar bien #${item?.id}` : 'Registrar nuevo bien patrimonial'}
          subtitle={modoEditar
            ? `${item?.tipo_bien_nombre ?? ''} — ${item?.modelo ?? ''}`
            : 'Completa los datos del activo patrimonial'}
          onClose={onClose}
        />

        <ModalBody>
          <div className="space-y-6">

            {/* ── 1. Identificación ──────────────────────────────────────── */}
            <Seccion title="Identificación del bien" icon="label">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FLabel required>Categoría</FLabel>
                  <FSelect
                    value={form.categoria_bien_id}
                    onChange={v => { setF('categoria_bien_id', v); setF('tipo_bien_id', ''); setDetalle({}); }}
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </FSelect>
                  <FError msg={errors.categoria_bien_id} />
                </div>

                <div>
                  <FLabel required>Tipo de bien</FLabel>
                  <FSelect
                    value={form.tipo_bien_id}
                    onChange={v => { setF('tipo_bien_id', v); setDetalle({}); }}
                    disabled={!form.categoria_bien_id || !esInformatico}
                  >
                    <option value="">
                      {!form.categoria_bien_id
                        ? '← Selecciona primero la categoría'
                        : tiposFiltrados.length === 0
                          ? 'Sin tipos disponibles'
                          : 'Seleccionar tipo...'}
                    </option>
                    {tiposFiltrados.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </FSelect>
                  <FError msg={errors.tipo_bien_id} />
                </div>

                <div>
                  <FLabel required>Marca</FLabel>
                  <FSelect value={form.marca_id} onChange={v => setF('marca_id', v)}>
                    <option value="">Seleccionar marca...</option>
                    {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </FSelect>
                  <FError msg={errors.marca_id} />
                </div>

                <div>
                  <FLabel required>Modelo</FLabel>
                  <FInput value={form.modelo} onChange={v => setF('modelo', v)} placeholder="Ej: Latitude 5420" />
                  <FError msg={errors.modelo} />
                </div>
                <div>
                  <FLabel>N° de serie</FLabel>
                  <FInput value={form.numero_serie} onChange={v => setF('numero_serie', v)} placeholder="S/N si no aplica" mono />
                </div>
                <div>
                  <FLabel>Código patrimonial</FLabel>
                  <FInput value={form.codigo_patrimonial} onChange={v => setF('codigo_patrimonial', v)} placeholder="S/C si no aplica" mono />
                </div>
              </div>
            </Seccion>

            {/* Aviso para categorías no informáticas */}
            {form.categoria_bien_id && !esInformatico && (
              <div
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgb(180 83 9 / 0.06)', border: '1px solid rgb(180 83 9 / 0.2)' }}
              >
                <Icon name="construction" className="text-[20px] shrink-0 mt-0.5" style={{ color: '#b45309' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: '#b45309' }}>Módulo en desarrollo</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-body)' }}>
                    El registro detallado de bienes muebles, inmuebles y otras categorías estará disponible
                    próximamente. Puedes registrar el bien con los datos básicos por ahora.
                  </p>
                </div>
              </div>
            )}

            {/* ── 2. Adquisición ─────────────────────────────────────────── */}
            <Seccion title="Adquisición" icon="receipt_long">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <FLabel required>Régimen tenencia</FLabel>
                  <FSelect value={form.regimen_tenencia_id} onChange={v => setF('regimen_tenencia_id', v)}>
                    <option value="">Seleccionar...</option>
                    {regimenes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </FSelect>
                  <FError msg={errors.regimen_tenencia_id} />
                </div>
                <div>
                  <FLabel>Año adquisición</FLabel>
                  <FInput type="number" value={form.anio_adquisicion} onChange={v => setF('anio_adquisicion', v)} placeholder="Ej: 2023" />
                </div>
                <div>
                  <FLabel>Fecha de compra</FLabel>
                  <FInput type="date" value={form.fecha_compra} onChange={v => setF('fecha_compra', v)} />
                </div>
                <div>
                  <FLabel>N° orden de compra</FLabel>
                  <FInput value={form.numero_orden_compra} onChange={v => setF('numero_orden_compra', v)} placeholder="Ej: OC-2024-001" mono />
                </div>
                <div>
                  <FLabel>Garantía vence</FLabel>
                  <FInput type="date" value={form.fecha_vencimiento_garantia} onChange={v => setF('fecha_vencimiento_garantia', v)} />
                </div>
                <div className="col-span-3">
                  <FLabel>Observación</FLabel>
                  <FInput value={form.observacion} onChange={v => setF('observacion', v)} placeholder="Observaciones adicionales..." />
                </div>
              </div>
            </Seccion>

            

            {/* ── 4. Ubicación ───────────────────────────────────────────── */}
            <Seccion title="Ubicación física" icon="location_on">
             

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FLabel>Ubicación / Área</FLabel>
                  <FSelect value={form.ubicacion_id} onChange={v => setF('ubicacion_id', v)}>
                    <option value="">Sin ubicación específica</option>
                    {ubicacionesActivos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </FSelect>
                </div>
                <div>
                  <FLabel>Piso</FLabel>
                  <FInput type="number" value={form.piso} onChange={v => setF('piso', v)} placeholder="Ej: 2" />
                </div>
              </div>
            </Seccion>

            {/* ── 5. Detalle técnico (condicional por tipo) ──────────────── */}
            {tipoTecnico && (
              <SeccionDetalle
                tipoTecnico={tipoTecnico}
                detalle={detalle}
                setDetalle={setDetalle}
                catalogos={{
                  tiposComputadora:   catalogos.tiposComputadora   ?? [],
                  tiposDisco:         catalogos.tiposDisco         ?? [],
                  arquitecturasBits:  catalogos.arquitecturasBits  ?? [],
                  tiposTarjetaVideo:  catalogos.tiposTarjetaVideo  ?? [],
                  tiposMonitor:       catalogos.tiposMonitor       ?? [],
                  tiposEscaner:       catalogos.tiposEscaner       ?? [],
                  tiposImpresion:     catalogos.tiposImpresion     ?? [],
                  interfacesConexion: catalogos.interfacesConexion ?? [],
                  tamanosCarro:       catalogos.tamanosCarro       ?? [],
                }}
              />
            )}

          </div>
        </ModalBody>

        <ModalFooter align="right">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleValidar} disabled={guardando} className="btn-primary flex items-center gap-2">
            {guardando
              ? <span className="btn-loading-spin" />
              : <Icon name={modoEditar ? 'save' : 'add_circle'} className="text-[16px]" />
            }
            {modoEditar ? 'Guardar cambios' : 'Registrar bien'}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={confirm}
        title={modoEditar ? 'Confirmar edición' : 'Confirmar registro'}
        message={`¿${modoEditar ? 'Guardar cambios en' : 'Registrar'} el bien "${tipoSel?.nombre ?? ''} — ${form.modelo}"?`}
        confirmLabel={modoEditar ? 'Sí, guardar' : 'Sí, registrar'}
        variant="primary"
        loading={guardando}
        onConfirm={handleGuardar}
        onClose={() => setConfirm(false)}
      />
    </>
  );
}