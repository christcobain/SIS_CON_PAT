import { useState, useEffect, useMemo } from 'react';
import Modal           from '../../../../components/modal/Modal';
import ModalHeader     from '../../../../components/modal/ModalHeader';
import ModalBody       from '../../../../components/modal/ModalBody';
import ModalFooter     from '../../../../components/modal/ModalFooter';
import ConfirmDialog   from '../../../../components/feedback/ConfirmDialog';
import { useBienes }   from '../../../..//hooks/useBienes';
import { useLocaciones } from '../../../../hooks/useLocaciones';
import { useCatalogos }  from '../../../../hooks/useCatalogos';
import { useAuthStore }  from '../../../../store/authStore';
import { useToast }    from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

// ── Detecta la categoría técnica según el nombre del tipo_bien ────────────────
// El backend almacena los nombres en mayúsculas (CPU, MONITOR, IMPRESORA, SCANNER, SWITCH)
const TIPO_TECNICO = {
  CPU:       (nombre) => /CPU|COMPUTAD|PC\b|DESKTOP|LAPTOP|NOTEBOOK/i.test(nombre),
  MONITOR:   (nombre) => /MONITOR/i.test(nombre),
  IMPRESORA: (nombre) => /IMPRESORA|PRINTER/i.test(nombre),
  SCANNER:   (nombre) => /SCANNER|ESCANER|ESCÁNER/i.test(nombre),
  SWITCH:    (nombre) => /SWITCH|HUB|ROUTER/i.test(nombre),
};

function detectarTipoTecnico(tipoNombre) {
  if (!tipoNombre) return null;
  for (const [tipo, fn] of Object.entries(TIPO_TECNICO)) {
    if (fn(tipoNombre)) return tipo;
  }
  return null;
}

// ── Primitivos de formulario ──────────────────────────────────────────────────
function FormSection({ title, icon, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2"
           style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '6px' }}>
        <Icon name={icon} className="text-[16px] text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest"
           style={{ color: 'var(--color-text-muted)' }}>
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function Label({ children, required }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-widest mb-1"
       style={{ color: 'var(--color-text-muted)' }}>
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </p>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-[10px] text-red-500 mt-1 font-semibold">{msg}</p>;
}

function StyledInput({ value, onChange, placeholder, disabled, mono, type = 'text' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full text-sm rounded-xl px-3 py-2 transition-all ${mono ? 'font-mono' : ''}`}
      style={{
        background: disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)',
        border:     '1px solid var(--color-border)',
        color:      disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
        outline:    'none',
      }}
      onFocus={(e)  => { if (!disabled) e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={(e)   => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    />
  );
}

function StyledSelect({ value, onChange, options, placeholder, disabled }) {
  return (
    <select
      value={value ?? ''}
      onChange={onChange}
      disabled={disabled}
      className="w-full text-sm rounded-xl px-3 py-2 transition-all"
      style={{
        background: disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)',
        border:     '1px solid var(--color-border)',
        color:      value ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        outline:    'none',
        cursor:     disabled ? 'not-allowed' : 'pointer',
      }}
      onFocus={(e)  => { if (!disabled) e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={(e)   => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function StyledTextarea({ value, onChange, placeholder, disabled, rows = 2 }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className="w-full text-sm rounded-xl px-3 py-2 transition-all resize-none"
      style={{
        background: disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)',
        border:     '1px solid var(--color-border)',
        color:      disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
        outline:    'none',
      }}
      onFocus={(e)  => { if (!disabled) e.currentTarget.style.border = '1px solid var(--color-primary)'; }}
      onBlur={(e)   => { e.currentTarget.style.border = '1px solid var(--color-border)'; }}
    />
  );
}

// ── Sección de detalle técnico condicional ────────────────────────────────────
function SeccionDetalleTecnico({ tipoTecnico, detalle, setDetalle, catalogos }) {
  if (!tipoTecnico) return null;

  const setD = (key, val) => setDetalle((prev) => ({ ...prev, [key]: val }));

  const LABEL_MAP = {
    CPU:       'Detalle de CPU / Computadora',
    MONITOR:   'Detalle de Monitor',
    IMPRESORA: 'Detalle de Impresora',
    SCANNER:   'Detalle de Escáner',
    SWITCH:    'Detalle de Switch / Hub',
  };

  return (
    <FormSection title={LABEL_MAP[tipoTecnico] ?? 'Detalle técnico'} icon="settings">

      {/* ── CPU ────────────────────────────────────────────────────────────── */}
      {tipoTecnico === 'CPU' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tipo de computadora</Label>
            <StyledSelect
              value={detalle.tipo_computadora_id ?? ''}
              onChange={(e) => setD('tipo_computadora_id', e.target.value)}
              placeholder="Seleccionar..."
              options={(catalogos.tiposComputadora ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </div>
          <div>
            <Label>Procesador</Label>
            <StyledInput
              value={detalle.procesador}
              onChange={(e) => setD('procesador', e.target.value)}
              placeholder="Ej: Intel Core i7-1165G7"
            />
          </div>
          <div>
            <Label>RAM (GB)</Label>
            <StyledInput
              value={detalle.ram_gb}
              onChange={(e) => setD('ram_gb', e.target.value)}
              placeholder="Ej: 16"
              type="number"
            />
          </div>
          <div>
            <Label>Capacidad disco (GB)</Label>
            <StyledInput
              value={detalle.capacidad_disco_gb}
              onChange={(e) => setD('capacidad_disco_gb', e.target.value)}
              placeholder="Ej: 512"
              type="number"
            />
          </div>
          <div>
            <Label>Tipo de disco</Label>
            <StyledSelect
              value={detalle.tipo_disco_id ?? ''}
              onChange={(e) => setD('tipo_disco_id', e.target.value)}
              placeholder="Seleccionar..."
              options={(catalogos.tiposDisco ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </div>
          <div>
            <Label>Arquitectura bits</Label>
            <StyledSelect
              value={detalle.arquitectura_bits_id ?? ''}
              onChange={(e) => setD('arquitectura_bits_id', e.target.value)}
              placeholder="Seleccionar..."
              options={(catalogos.arquitecturasBits ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </div>
          <div>
            <Label>Sistema operativo</Label>
            <StyledInput
              value={detalle.sistema_operativo}
              onChange={(e) => setD('sistema_operativo', e.target.value)}
              placeholder="Ej: Windows 11 Pro"
            />
          </div>
          <div>
            <Label>MAC address</Label>
            <StyledInput
              value={detalle.mac_address}
              onChange={(e) => setD('mac_address', e.target.value)}
              placeholder="Ej: AA:BB:CC:DD:EE:FF"
              mono
            />
          </div>
        </div>
      )}

      {/* ── MONITOR ────────────────────────────────────────────────────────── */}
      {tipoTecnico === 'MONITOR' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tipo de monitor</Label>
            <StyledSelect
              value={detalle.tipo_monitor_id ?? ''}
              onChange={(e) => setD('tipo_monitor_id', e.target.value)}
              placeholder="Seleccionar..."
              options={(catalogos.tiposMonitor ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </div>
          <div>
            <Label>Tamaño pulgadas</Label>
            <StyledInput
              value={detalle.tamano_pulgadas}
              onChange={(e) => setD('tamano_pulgadas', e.target.value)}
              placeholder="Ej: 24"
              type="number"
            />
          </div>
          <div>
            <Label>Resolución</Label>
            <StyledInput
              value={detalle.resolucion}
              onChange={(e) => setD('resolucion', e.target.value)}
              placeholder="Ej: 1920x1080"
            />
          </div>
          <div>
            <Label>Interfaz de conexión</Label>
            <StyledSelect
              value={detalle.interfaz_conexion_id ?? ''}
              onChange={(e) => setD('interfaz_conexion_id', e.target.value)}
              placeholder="Seleccionar..."
              options={(catalogos.interfacesConexion ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </div>
        </div>
      )}

      {/* ── IMPRESORA ──────────────────────────────────────────────────────── */}
      {tipoTecnico === 'IMPRESORA' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tipo de impresión</Label>
            <StyledSelect
              value={detalle.tipo_impresion_id ?? ''}
              onChange={(e) => setD('tipo_impresion_id', e.target.value)}
              placeholder="Seleccionar..."
              options={(catalogos.tiposImpresion ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </div>
          <div>
            <Label>Interfaz de conexión</Label>
            <StyledSelect
              value={detalle.interfaz_conexion_id ?? ''}
              onChange={(e) => setD('interfaz_conexion_id', e.target.value)}
              placeholder="Seleccionar..."
              options={(catalogos.interfacesConexion ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </div>
          <div>
            <Label>Tamaño de carro</Label>
            <StyledSelect
              value={detalle.tamano_carro_id ?? ''}
              onChange={(e) => setD('tamano_carro_id', e.target.value)}
              placeholder="Seleccionar..."
              options={(catalogos.tamanosCarro ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </div>
          <div>
            <Label>Velocidad ppm</Label>
            <StyledInput
              value={detalle.velocidad_ppm}
              onChange={(e) => setD('velocidad_ppm', e.target.value)}
              placeholder="Ej: 30"
              type="number"
            />
          </div>
        </div>
      )}

      {/* ── SCANNER ────────────────────────────────────────────────────────── */}
      {tipoTecnico === 'SCANNER' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tipo de escáner</Label>
            <StyledSelect
              value={detalle.tipo_escaner_id ?? ''}
              onChange={(e) => setD('tipo_escaner_id', e.target.value)}
              placeholder="Seleccionar..."
              options={(catalogos.tiposEscaner ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </div>
          <div>
            <Label>Interfaz de conexión</Label>
            <StyledSelect
              value={detalle.interfaz_conexion_id ?? ''}
              onChange={(e) => setD('interfaz_conexion_id', e.target.value)}
              placeholder="Seleccionar..."
              options={(catalogos.interfacesConexion ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </div>
          <div>
            <Label>Resolución DPI</Label>
            <StyledInput
              value={detalle.resolucion_dpi}
              onChange={(e) => setD('resolucion_dpi', e.target.value)}
              placeholder="Ej: 1200"
              type="number"
            />
          </div>
          <div>
            <Label>Tamaño máx. documento</Label>
            <StyledInput
              value={detalle.tamano_max_documento}
              onChange={(e) => setD('tamano_max_documento', e.target.value)}
              placeholder="Ej: A4"
            />
          </div>
        </div>
      )}

      {/* ── SWITCH ─────────────────────────────────────────────────────────── */}
      {tipoTecnico === 'SWITCH' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>N° de puertos</Label>
            <StyledInput
              value={detalle.numero_puertos}
              onChange={(e) => setD('numero_puertos', e.target.value)}
              placeholder="Ej: 24"
              type="number"
            />
          </div>
          <div>
            <Label>Velocidad (Mbps)</Label>
            <StyledInput
              value={detalle.velocidad_mbps}
              onChange={(e) => setD('velocidad_mbps', e.target.value)}
              placeholder="Ej: 1000"
              type="number"
            />
          </div>
          <div>
            <Label>Managed</Label>
            <StyledSelect
              value={String(detalle.es_administrable ?? '')}
              onChange={(e) => setD('es_administrable', e.target.value === 'true')}
              options={[
                { value: 'true',  label: 'Administrable (Managed)' },
                { value: 'false', label: 'No administrable (Unmanaged)' },
              ]}
              placeholder="Seleccionar..."
            />
          </div>
        </div>
      )}
    </FormSection>
  );
}

// ── Estado inicial del formulario ─────────────────────────────────────────────
const FORM_INICIAL = {
  // Básico
  tipo_bien_id:             '',
  categoria_bien_id:        '',
  marca_id:                 '',
  modelo:                   '',
  numero_serie:             '',
  codigo_patrimonial:       '',
  regimen_tenencia_id:      '',
  estado_bien_id:           '',
  estado_funcionamiento_id: '',
  observacion:              '',
  // Adquisición
  anio_adquisicion:             '',
  fecha_compra:                 '',
  numero_orden_compra:          '',
  fecha_vencimiento_garantia:   '',
  fecha_instalacion:            '',
  fecha_ultimo_inventario:      '',
  // Ubicación
  empresa_id:   '',
  sede_id:      '',
  modulo_id:    '',
  ubicacion_id: '',
  piso:         '',
};

const DETALLE_INICIAL = {};

// ── Componente principal ──────────────────────────────────────────────────────
export default function ModalBienForm({ open, onClose, item = null, onGuardado }) {
  const toast      = useToast();
  const modoEditar = Boolean(item);

  // Hooks
  const { crear, actualizar } = useBienes();
  const { sedes, modulos, ubicaciones, empresas } = useLocaciones();
  const { fetchCatalogos, ...catData } = useCatalogos();

  // authStore — para empresa_id del usuario autenticado
  const empresaId = useAuthStore((s) => s.empresaId);

  // Estado formulario
  const [form,           setForm]           = useState(FORM_INICIAL);
  const [detalle,        setDetalle]        = useState(DETALLE_INICIAL);
  const [errors,         setErrors]         = useState({});
  const [confirmGuardar, setConfirmGuardar] = useState(false);
  const [guardando,      setGuardando]      = useState(false);

  // Catálogos necesarios
  const catalogosNecesarios = [
    'categoriasBien', 'tiposBien', 'marcas', 'regimenTenencia',
    'estadosBien', 'estadosFuncionamiento',
    'tiposComputadora', 'tiposDisco', 'arquitecturasBits',
    'tiposMonitor', 'tiposEscaner', 'tiposImpresion',
    'interfacesConexion', 'tamanosCarro',
  ];

  useEffect(() => {
    if (!open) return;
    fetchCatalogos(catalogosNecesarios);
  }, [open]);

  // Pre-llena en modo editar
  useEffect(() => {
    if (!open) return;
    if (modoEditar && item) {
      setForm({
        tipo_bien_id:             item.tipo_bien_id           ?? item.tipo_bien?.id        ?? '',
        categoria_bien_id:        item.categoria_bien_id      ?? item.categoria_bien?.id   ?? '',
        marca_id:                 item.marca_id               ?? item.marca?.id            ?? '',
        modelo:                   item.modelo                 ?? '',
        numero_serie:             item.numero_serie            ?? '',
        codigo_patrimonial:       item.codigo_patrimonial     ?? '',
        regimen_tenencia_id:      item.regimen_tenencia_id    ?? item.regimen_tenencia?.id ?? '',
        estado_bien_id:           item.estado_bien_id         ?? item.estado_bien?.id      ?? '',
        estado_funcionamiento_id: item.estado_funcionamiento_id ?? item.estado_funcionamiento?.id ?? '',
        observacion:              item.observacion            ?? '',
        anio_adquisicion:         item.anio_adquisicion       ?? '',
        fecha_compra:             item.fecha_compra            ?? '',
        numero_orden_compra:      item.numero_orden_compra    ?? '',
        fecha_vencimiento_garantia: item.fecha_vencimiento_garantia ?? '',
        fecha_instalacion:        item.fecha_instalacion      ?? '',
        fecha_ultimo_inventario:  item.fecha_ultimo_inventario ?? '',
        empresa_id:               item.empresa_id             ?? empresaId ?? '',
        sede_id:                  item.sede_id                ?? '',
        modulo_id:                item.modulo_id              ?? '',
        ubicacion_id:             item.ubicacion_id           ?? '',
        piso:                     item.piso                   ?? '',
      });
      // Detalle técnico pre-llenado (viene de BienDetailSerializer)
      const d = item.detalle_cpu || item.detalle_monitor ||
                item.detalle_impresora || item.detalle_scanner ||
                item.detalle_switch || {};
      setDetalle(d);
    } else {
      setForm({ ...FORM_INICIAL, empresa_id: empresaId ?? '' });
      setDetalle(DETALLE_INICIAL);
    }
    setErrors({});
  }, [open, item?.id]);

  // Detecta tipo técnico según el nombre del tipo seleccionado
  const tiposBienCat  = catData.tiposBien ?? [];
  const tipoSeleccionado = tiposBienCat.find((t) => String(t.id) === String(form.tipo_bien_id));
  const tipoTecnico   = detectarTipoTecnico(tipoSeleccionado?.nombre);

  // Módulos y ubicaciones filtrados según sede seleccionada
  const modulosFiltrados    = modulos.filter((m) =>
    !form.sede_id || String(m.sede_id) === String(form.sede_id)
  );
  const ubicacionesFiltradas = ubicaciones.filter((u) =>
    !form.modulo_id || String(u.modulo_id) === String(form.modulo_id)
  );

  const setF = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const validar = () => {
    const e = {};
    if (!form.tipo_bien_id)             e.tipo_bien_id             = 'Campo obligatorio.';
    if (!form.marca_id)                 e.marca_id                 = 'Campo obligatorio.';
    if (!form.modelo.trim())            e.modelo                   = 'Campo obligatorio.';
    if (!form.regimen_tenencia_id)      e.regimen_tenencia_id      = 'Campo obligatorio.';
    if (!form.estado_bien_id)           e.estado_bien_id           = 'Campo obligatorio.';
    if (!form.estado_funcionamiento_id) e.estado_funcionamiento_id = 'Campo obligatorio.';
    if (!form.empresa_id)               e.empresa_id               = 'Campo obligatorio.';
    if (!form.sede_id)                  e.sede_id                  = 'Campo obligatorio.';
    return e;
  };

  const handleSolicitarGuardar = () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    setConfirmGuardar(true);
  };

  const handleGuardarConfirmado = async () => {
    setGuardando(true);

    // Construye payload según BienWriteSerializer
    const payload = {
      tipo_bien_id:             Number(form.tipo_bien_id)             || undefined,
      categoria_bien_id:        Number(form.categoria_bien_id)        || undefined,
      marca_id:                 Number(form.marca_id)                 || undefined,
      modelo:                   form.modelo.trim(),
      numero_serie:             form.numero_serie.trim()              || undefined,
      codigo_patrimonial:       form.codigo_patrimonial.trim()        || undefined,
      regimen_tenencia_id:      Number(form.regimen_tenencia_id)      || undefined,
      estado_bien_id:           Number(form.estado_bien_id)           || undefined,
      estado_funcionamiento_id: Number(form.estado_funcionamiento_id) || undefined,
      observacion:              form.observacion.trim()               || undefined,
      anio_adquisicion:         form.anio_adquisicion                 || undefined,
      fecha_compra:             form.fecha_compra                     || undefined,
      numero_orden_compra:      form.numero_orden_compra.trim()       || undefined,
      fecha_vencimiento_garantia: form.fecha_vencimiento_garantia     || undefined,
      fecha_instalacion:        form.fecha_instalacion                || undefined,
      fecha_ultimo_inventario:  form.fecha_ultimo_inventario          || undefined,
      empresa_id:               Number(form.empresa_id)               || undefined,
      sede_id:                  Number(form.sede_id)                  || undefined,
      modulo_id:                Number(form.modulo_id)                || undefined,
      ubicacion_id:             Number(form.ubicacion_id)             || undefined,
      piso:                     Number(form.piso)                     || undefined,
      // Detalle técnico — se envía solo si hay tipo técnico detectado
      detalle:                  tipoTecnico ? detalle : {},
    };

    // Limpia undefined
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    try {
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
        ?? 'Error al guardar el bien.';
      toast.error(msg);
    } finally {
      setGuardando(false);
      setConfirmGuardar(false);
    }
  };

  const catalogos = {
    tiposComputadora:  catData.tiposComputadora  ?? [],
    tiposDisco:        catData.tiposDisco        ?? [],
    arquitecturasBits: catData.arquitecturasBits ?? [],
    tiposMonitor:      catData.tiposMonitor      ?? [],
    tiposEscaner:      catData.tiposEscaner      ?? [],
    tiposImpresion:    catData.tiposImpresion    ?? [],
    interfacesConexion:catData.interfacesConexion ?? [],
    tamanosCarro:      catData.tamanosCarro      ?? [],
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="xl" closeOnOverlay={!guardando && !confirmGuardar}>
        <ModalHeader
          title={modoEditar ? 'Editar Bien' : 'Registrar Nuevo Bien'}
          subtitle={modoEditar ? `ID #${item?.id} · ${item?.modelo ?? ''}` : 'Completa los datos del bien patrimonial'}
          icon="inventory_2"
          onClose={onClose}
        />

        <ModalBody>
          <div className="space-y-6">

            {/* ── Sección 1: Identificación básica ─────────────────────────── */}
            <FormSection title="Identificación del bien" icon="label">
              <div className="grid grid-cols-2 gap-3">

                <div>
                  <Label required>Tipo de bien</Label>
                  <StyledSelect
                    value={form.tipo_bien_id}
                    onChange={(e) => {
                      setF('tipo_bien_id', e.target.value);
                      setDetalle(DETALLE_INICIAL); // limpia detalle al cambiar tipo
                    }}
                    placeholder="Seleccionar tipo..."
                    options={(catData.tiposBien ?? []).map((t) => ({ value: t.id, label: t.nombre }))}
                  />
                  <FieldError msg={errors.tipo_bien_id} />
                </div>

                <div>
                  <Label>Categoría</Label>
                  <StyledSelect
                    value={form.categoria_bien_id}
                    onChange={(e) => setF('categoria_bien_id', e.target.value)}
                    placeholder="Seleccionar categoría..."
                    options={(catData.categoriasBien ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
                  />
                </div>

                <div>
                  <Label required>Marca</Label>
                  <StyledSelect
                    value={form.marca_id}
                    onChange={(e) => setF('marca_id', e.target.value)}
                    placeholder="Seleccionar marca..."
                    options={(catData.marcas ?? []).map((m) => ({ value: m.id, label: m.nombre }))}
                  />
                  <FieldError msg={errors.marca_id} />
                </div>

                <div>
                  <Label required>Modelo</Label>
                  <StyledInput
                    value={form.modelo}
                    onChange={(e) => setF('modelo', e.target.value)}
                    placeholder="Ej: EliteBook 840 G9"
                  />
                  <FieldError msg={errors.modelo} />
                </div>

                <div>
                  <Label>N° de serie</Label>
                  <StyledInput
                    value={form.numero_serie}
                    onChange={(e) => setF('numero_serie', e.target.value)}
                    placeholder="Ej: 5CD1234XYZ"
                    mono
                  />
                </div>

                <div>
                  <Label>Código patrimonial</Label>
                  <StyledInput
                    value={form.codigo_patrimonial}
                    onChange={(e) => setF('codigo_patrimonial', e.target.value)}
                    placeholder="Ej: 000012345"
                    mono
                  />
                </div>

                <div>
                  <Label required>Régimen de tenencia</Label>
                  <StyledSelect
                    value={form.regimen_tenencia_id}
                    onChange={(e) => setF('regimen_tenencia_id', e.target.value)}
                    placeholder="Seleccionar..."
                    options={(catData.regimenTenencia ?? []).map((r) => ({ value: r.id, label: r.nombre }))}
                  />
                  <FieldError msg={errors.regimen_tenencia_id} />
                </div>

                <div>
                  <Label required>Estado del bien</Label>
                  <StyledSelect
                    value={form.estado_bien_id}
                    onChange={(e) => setF('estado_bien_id', e.target.value)}
                    placeholder="Seleccionar..."
                    options={(catData.estadosBien ?? []).map((e) => ({ value: e.id, label: e.nombre }))}
                  />
                  <FieldError msg={errors.estado_bien_id} />
                </div>

                <div>
                  <Label required>Estado de funcionamiento</Label>
                  <StyledSelect
                    value={form.estado_funcionamiento_id}
                    onChange={(e) => setF('estado_funcionamiento_id', e.target.value)}
                    placeholder="Seleccionar..."
                    options={(catData.estadosFuncionamiento ?? []).map((e) => ({ value: e.id, label: e.nombre }))}
                  />
                  <FieldError msg={errors.estado_funcionamiento_id} />
                </div>

                <div className="col-span-2">
                  <Label>Observación</Label>
                  <StyledTextarea
                    value={form.observacion}
                    onChange={(e) => setF('observacion', e.target.value)}
                    placeholder="Observaciones adicionales sobre el bien..."
                  />
                </div>
              </div>
            </FormSection>

            {/* ── Sección 2: Adquisición ────────────────────────────────────── */}
            <FormSection title="Datos de adquisición" icon="receipt_long">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Año de adquisición</Label>
                  <StyledInput
                    value={form.anio_adquisicion}
                    onChange={(e) => setF('anio_adquisicion', e.target.value)}
                    placeholder="Ej: 2023"
                    type="number"
                  />
                </div>
                <div>
                  <Label>Fecha de compra</Label>
                  <StyledInput
                    value={form.fecha_compra}
                    onChange={(e) => setF('fecha_compra', e.target.value)}
                    type="date"
                  />
                </div>
                <div>
                  <Label>N° orden de compra</Label>
                  <StyledInput
                    value={form.numero_orden_compra}
                    onChange={(e) => setF('numero_orden_compra', e.target.value)}
                    placeholder="Ej: OC-2023-0045"
                    mono
                  />
                </div>
                <div>
                  <Label>Venc. garantía</Label>
                  <StyledInput
                    value={form.fecha_vencimiento_garantia}
                    onChange={(e) => setF('fecha_vencimiento_garantia', e.target.value)}
                    type="date"
                  />
                </div>
                <div>
                  <Label>Fecha de instalación</Label>
                  <StyledInput
                    value={form.fecha_instalacion}
                    onChange={(e) => setF('fecha_instalacion', e.target.value)}
                    type="date"
                  />
                </div>
                <div>
                  <Label>Último inventario</Label>
                  <StyledInput
                    value={form.fecha_ultimo_inventario}
                    onChange={(e) => setF('fecha_ultimo_inventario', e.target.value)}
                    type="date"
                  />
                </div>
              </div>
            </FormSection>

            {/* ── Sección 3: Ubicación ──────────────────────────────────────── */}
            <FormSection title="Ubicación física" icon="location_on">
              <div className="grid grid-cols-2 gap-3">

                <div>
                  <Label required>Empresa / Corte</Label>
                  <StyledSelect
                    value={form.empresa_id}
                    onChange={(e) => setF('empresa_id', e.target.value)}
                    placeholder="Seleccionar empresa..."
                    options={(empresas ?? []).map((e) => ({
                      value: e.id,
                      label: e.nombre_corto ? `${e.nombre_corto} — ${e.nombre}` : e.nombre,
                    }))}
                  />
                  <FieldError msg={errors.empresa_id} />
                </div>

                <div>
                  <Label required>Sede</Label>
                  <StyledSelect
                    value={form.sede_id}
                    onChange={(e) => {
                      setF('sede_id', e.target.value);
                      setF('modulo_id', '');
                      setF('ubicacion_id', '');
                    }}
                    placeholder="Seleccionar sede..."
                    options={(sedes ?? []).filter((s) =>
                      !form.empresa_id || String(s.empresa_id) === String(form.empresa_id)
                    ).map((s) => ({ value: s.id, label: s.nombre }))}
                  />
                  <FieldError msg={errors.sede_id} />
                </div>

                <div>
                  <Label>Módulo</Label>
                  <StyledSelect
                    value={form.modulo_id}
                    onChange={(e) => {
                      setF('modulo_id', e.target.value);
                      setF('ubicacion_id', '');
                    }}
                    placeholder="Seleccionar módulo..."
                    disabled={!form.sede_id}
                    options={modulosFiltrados.map((m) => ({ value: m.id, label: m.nombre }))}
                  />
                </div>

                <div>
                  <Label>Ubicación / Área</Label>
                  <StyledSelect
                    value={form.ubicacion_id}
                    onChange={(e) => setF('ubicacion_id', e.target.value)}
                    placeholder="Seleccionar ubicación..."
                    disabled={!form.modulo_id}
                    options={ubicacionesFiltradas.map((u) => ({ value: u.id, label: u.nombre }))}
                  />
                </div>

                <div>
                  <Label>Piso</Label>
                  <StyledInput
                    value={form.piso}
                    onChange={(e) => setF('piso', e.target.value)}
                    placeholder="Ej: 3"
                    type="number"
                  />
                </div>
              </div>
            </FormSection>

            {/* ── Sección 4: Detalle técnico (condicional) ─────────────────── */}
            {tipoTecnico && (
              <div className="rounded-2xl p-1"
                   style={{ background: 'rgba(127,29,29,0.04)', border: '1px dashed rgba(127,29,29,0.2)' }}>
                <div className="p-4">
                  {/* Badge indicador del tipo detectado */}
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="sensors" className="text-[15px] text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                      Tipo detectado: {tipoTecnico}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(127,29,29,0.1)', color: 'var(--color-primary)' }}>
                      Detalle técnico requerido
                    </span>
                  </div>
                  <SeccionDetalleTecnico
                    tipoTecnico={tipoTecnico}
                    detalle={detalle}
                    setDetalle={setDetalle}
                    catalogos={catalogos}
                  />
                </div>
              </div>
            )}

          </div>
        </ModalBody>

        <ModalFooter align="between">
          <span className="text-[9px] font-bold" style={{ color: 'var(--color-text-faint)' }}>
            {tipoTecnico
              ? `Tipo técnico detectado: ${tipoTecnico}`
              : 'Sin detalle técnico adicional'}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={guardando} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleSolicitarGuardar}
              disabled={guardando}
              className="btn-primary flex items-center gap-2"
              style={{ opacity: guardando ? 0.6 : 1 }}>
              <Icon name="save" className="text-[16px]" />
              {modoEditar ? 'Actualizar bien' : 'Registrar bien'}
            </button>
          </div>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={confirmGuardar}
        title={modoEditar ? 'Confirmar actualización' : 'Confirmar registro'}
        message={
          modoEditar
            ? `¿Guardar los cambios del bien ID #${item?.id}?`
            : `¿Registrar el bien "${tipoSeleccionado?.nombre ?? ''} — ${form.modelo}"?`
        }
        confirmLabel={modoEditar ? 'Sí, actualizar' : 'Sí, registrar'}
        variant="primary"
        loading={guardando}
        onConfirm={handleGuardarConfirmado}
        onClose={() => setConfirmGuardar(false)}
      />
    </>
  );
}