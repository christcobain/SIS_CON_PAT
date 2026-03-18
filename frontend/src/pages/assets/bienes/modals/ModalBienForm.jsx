import { useState, useEffect, useMemo } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useBienes }      from '../../../../hooks/useBienes';
import { useLocaciones }  from '../../../../hooks/useLocaciones';
import { useCatalogos }   from '../../../../hooks/useCatalogos';
import { useAuthStore }   from '../../../../store/authStore';
import { useToast }       from '../../../../hooks/useToast';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const S = {
  input: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' },
  disabled: { background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', outline: 'none' },
};
const onF = e => { e.currentTarget.style.border = '1px solid var(--color-primary)'; };
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
  return <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1"><Icon name="error" className="text-[11px]" />{msg}</p>;
}
function FInput({ value, onChange, placeholder, type = 'text', disabled = false, mono = false }) {
  return (
    <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      disabled={disabled}
      className={`w-full text-sm rounded-xl px-3 py-2.5 transition-all ${mono ? 'font-mono' : ''}`}
      style={disabled ? S.disabled : S.input}
      onFocus={disabled ? undefined : onF} onBlur={offF} />
  );
}
function FSelect({ value, onChange, children, disabled = false }) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled}
      className="w-full text-sm rounded-xl px-3 py-2.5 transition-all cursor-pointer"
      style={disabled ? S.disabled : S.input}
      onFocus={disabled ? undefined : onF} onBlur={offF}>
      {children}
    </select>
  );
}
function FTextarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full text-sm rounded-xl px-3 py-2.5 transition-all resize-none"
      style={S.input} onFocus={onF} onBlur={offF} />
  );
}
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

function SeccionDetalle({ tipoTecnico, detalle, setDetalle, catalogos }) {
  if (!tipoTecnico) return null;
  const setD = (k, v) => setDetalle(p => ({ ...p, [k]: v }));

  const TITULOS = {
    CPU: 'Especificaciones CPU / Computadora',
    MONITOR: 'Especificaciones Monitor',
    IMPRESORA: 'Especificaciones Impresora',
    SCANNER: 'Especificaciones Escáner',
    SWITCH: 'Especificaciones Switch / Hub',
  };

  return (
    <Seccion title={TITULOS[tipoTecnico]} icon="settings">
      {tipoTecnico === 'CPU' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FLabel>Tipo de computadora</FLabel>
            <FSelect value={detalle.tipo_computadora_id} onChange={v => setD('tipo_computadora_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.tiposComputadora ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div><FLabel>Hostname</FLabel><FInput value={detalle.hostname} onChange={v => setD('hostname', v)} placeholder="Ej: PC-JUZGADO01" mono /></div>
          <div><FLabel>IP</FLabel><FInput value={detalle.direccion_ip} onChange={v => setD('direccion_ip', v)} placeholder="192.168.1.100" mono /></div>
          <div><FLabel>MAC</FLabel><FInput value={detalle.direccion_mac} onChange={v => setD('direccion_mac', v)} placeholder="AA:BB:CC:DD:EE:FF" mono /></div>
          <div><FLabel>Procesador</FLabel><FInput value={detalle.procesador_tipo} onChange={v => setD('procesador_tipo', v)} placeholder="Ej: Intel Core i7-12700" /></div>
          <div><FLabel>Velocidad procesador</FLabel><FInput value={detalle.procesador_velocidad} onChange={v => setD('procesador_velocidad', v)} placeholder="Ej: 3.6 GHz" /></div>
          <div>
            <FLabel>Tipo de disco</FLabel>
            <FSelect value={detalle.tipo_disco_id} onChange={v => setD('tipo_disco_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.tiposDisco ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div><FLabel>Capacidad disco</FLabel><FInput value={detalle.capacidad_disco} onChange={v => setD('capacidad_disco', v)} placeholder="Ej: 512 GB" /></div>
          <div><FLabel>RAM (GB)</FLabel><FInput value={detalle.capacidad_ram_gb} onChange={v => setD('capacidad_ram_gb', v)} placeholder="Ej: 16 GB" /></div>
          <div>
            <FLabel>Arquitectura</FLabel>
            <FSelect value={detalle.arquitectura_bits_id} onChange={v => setD('arquitectura_bits_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.arquitecturasBits ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div><FLabel>Sistema operativo</FLabel><FInput value={detalle.sistema_operativo} onChange={v => setD('sistema_operativo', v)} placeholder="Ej: Windows 11 Pro" /></div>
          <div><FLabel>Licencia SO</FLabel><FInput value={detalle.licencia_so} onChange={v => setD('licencia_so', v)} placeholder="Ej: MAK-XXXXX" mono /></div>
          <div><FLabel>Office versión</FLabel><FInput value={detalle.version_office} onChange={v => setD('version_office', v)} placeholder="Ej: Microsoft 365" /></div>
          <div><FLabel>Licencia Office</FLabel><FInput value={detalle.licencia_office} onChange={v => setD('licencia_office', v)} placeholder="Ej: PKY-XXXXX" mono /></div>
        </div>
      )}
      {tipoTecnico === 'MONITOR' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FLabel>Tipo de monitor</FLabel>
            <FSelect value={detalle.tipo_monitor_id} onChange={v => setD('tipo_monitor_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.tiposMonitor ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div><FLabel>Tamaño (pulgadas)</FLabel><FInput type="number" value={detalle.tamano_pulgadas} onChange={v => setD('tamano_pulgadas', v)} placeholder="Ej: 24" /></div>
        </div>
      )}
      {tipoTecnico === 'IMPRESORA' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FLabel>Tipo de impresión</FLabel>
            <FSelect value={detalle.tipo_impresion_id} onChange={v => setD('tipo_impresion_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.tiposImpresion ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div>
            <FLabel>Interfaz conexión</FLabel>
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
          <div><FLabel>Velocidad (ppm)</FLabel><FInput type="number" value={detalle.velocidad_impresion_ppm} onChange={v => setD('velocidad_impresion_ppm', v)} placeholder="Ej: 40" /></div>
        </div>
      )}
      {tipoTecnico === 'SCANNER' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FLabel>Tipo de escáner</FLabel>
            <FSelect value={detalle.tipo_escaner_id} onChange={v => setD('tipo_escaner_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.tiposEscaner ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div>
            <FLabel>Interfaz conexión</FLabel>
            <FSelect value={detalle.interfaz_conexion_id} onChange={v => setD('interfaz_conexion_id', v)}>
              <option value="">Seleccionar...</option>
              {(catalogos.interfacesConexion ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </FSelect>
          </div>
          <div><FLabel>Tamaño documentos</FLabel><FInput value={detalle.tamano_documentos} onChange={v => setD('tamano_documentos', v)} placeholder="Ej: A4" /></div>
          <div><FLabel>Resolución exploración</FLabel><FInput value={detalle.resolucion_exploracion} onChange={v => setD('resolucion_exploracion', v)} placeholder="Ej: 600 dpi" /></div>
        </div>
      )}
      {tipoTecnico === 'SWITCH' && (
        <div className="grid grid-cols-2 gap-3">
          <div><FLabel>IP</FLabel><FInput value={detalle.direccion_ip} onChange={v => setD('direccion_ip', v)} placeholder="192.168.1.1" mono /></div>
          <div><FLabel>MAC</FLabel><FInput value={detalle.direccion_mac} onChange={v => setD('direccion_mac', v)} placeholder="AA:BB:CC:DD:EE:FF" mono /></div>
          <div><FLabel>Puertos UTP</FLabel><FInput type="number" value={detalle.cantidad_puertos_utp} onChange={v => setD('cantidad_puertos_utp', v)} placeholder="Ej: 24" /></div>
          <div><FLabel>Velocidad (Mbps)</FLabel><FInput type="number" value={detalle.velocidad_mbps} onChange={v => setD('velocidad_mbps', v)} placeholder="Ej: 1000" /></div>
        </div>
      )}
    </Seccion>
  );
}

const FORM_VACIO = {
  tipo_bien_id: '', categoria_bien_id: '', marca_id: '', modelo: '',
  numero_serie: '', codigo_patrimonial: '', regimen_tenencia_id: '',
  estado_bien_id: '', estado_funcionamiento_id: '',
  observacion: '', anio_adquisicion: '', fecha_compra: '',
  numero_orden_compra: '', fecha_vencimiento_garantia: '',
  empresa_id: '', sede_id: '', modulo_id: '', ubicacion_id: '', piso: '',
};

export default function ModalBienForm({ open, onClose, item = null, onGuardado }) {
  const toast      = useToast();
  const modoEditar = !!item;
  const { crear, actualizar }                 = useBienes();
  const { sedes, modulos, empresas }          = useLocaciones();
  const { fetchCatalogos, ...catData }        = useCatalogos();
  const empresaId                             = useAuthStore(s => s.empresaId);
  const sedes_auth                            = useAuthStore(s => s.sedes);
  const [form,     setForm]     = useState({ ...FORM_VACIO });
  const [detalle,  setDetalle]  = useState({});
  const [errors,   setErrors]   = useState({});
  const [confirm,  setConfirm]  = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchCatalogos([
      'categoriasBien', 'tiposBien', 'marcas', 'regimenTenencia',
      'estadosBien', 'estadosFuncionamiento',
      'tiposComputadora', 'tiposDisco', 'arquitecturasBits',
      'tiposMonitor', 'tiposEscaner', 'tiposImpresion',
      'interfacesConexion', 'tamanosCarro',
    ]);
  }, [open]);

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
        empresa_id:               String(item.empresa_id ?? ''),
        sede_id:                  String(item.sede_id ?? ''),
        modulo_id:                String(item.modulo_id ?? ''),
        ubicacion_id:             String(item.ubicacion_id ?? ''),
        piso:                     item.piso ?? '',
      });
      const d = item.detalle_cpu ?? item.detalle_monitor ?? item.detalle_impresora ?? item.detalle_scanner ?? item.detalle_switch ?? {};
      setDetalle(d);
    } else {
      const sedePorDefecto = sedes_auth?.[0]?.id ?? '';
      setForm({ ...FORM_VACIO, empresa_id: String(empresaId ?? ''), sede_id: String(sedePorDefecto) });
      setDetalle({});
    }
    setErrors({});
  }, [open, item?.id]);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const categorias       = catData.categoriasBien ?? [];
  const tiposBien        = catData.tiposBien ;
  const marcas           = catData.marcas ?? [];
  const regimenes        = catData.regimenTenencia ?? [];
  const estadosBien      = catData.estadosBien ?? [];
  const estadosFuncion   = catData.estadosFuncionamiento ?? [];
  const categoriaSel     = categorias.find(c => String(c.id) === String(form.categoria_bien_id));
  const esInformatico    = categoriaSel?.nombre?.toUpperCase().includes('INFORM');
  const tipoSel          = tiposBien.find(t => String(t.id) === String(form.tipo_bien_id));
  const tipoTecnico      = esInformatico ? detectarTipoTecnico(tipoSel?.nombre ?? '') : null;
  const tiposFiltrados   = useMemo(() => {
    if (!form.categoria_bien_id) return tiposBien;
    return tiposBien.filter(t => String(t.categoria_bien_id ?? '') === String(form.categoria_bien_id));
  }, [tiposBien, form.categoria_bien_id]);
  const sedeSelObj       = sedes.find(s => String(s.id) === String(form.sede_id));
  const ubicaciones      = sedeSelObj?.ubicaciones ?? [];
  const modulosActivos   = (modulos ?? []).filter(m => m.is_active !== false);
  const idBueno          = estadosBien.find(e => e.nombre?.toUpperCase().includes('BUENO') || e.nombre?.toUpperCase().includes('ACTIVO'))?.id;
  const idOperativo      = estadosFuncion.find(e => e.nombre?.toUpperCase().includes('OPERATIVO'))?.id;

  useEffect(() => {
    if (!modoEditar && idBueno)    setF('estado_bien_id',           String(idBueno));
    if (!modoEditar && idOperativo) setF('estado_funcionamiento_id', String(idOperativo));
  }, [idBueno, idOperativo, modoEditar]);

  const validar = () => {
    const e = {};
    if (!form.tipo_bien_id)        e.tipo_bien_id        = 'Obligatorio.';
    if (!form.marca_id)            e.marca_id            = 'Obligatorio.';
    if (!form.modelo.trim())       e.modelo              = 'Obligatorio.';
    if (!form.regimen_tenencia_id) e.regimen_tenencia_id = 'Obligatorio.';
    if (!form.empresa_id)          e.empresa_id          = 'Obligatorio.';
    if (!form.sede_id)             e.sede_id             = 'Obligatorio.';
    return e;
  };

  const handleGuardar = async () => {
    setConfirm(false);
    setGuardando(true);
    try {
      const detallePayload = tipoTecnico ? Object.fromEntries(Object.entries(detalle).filter(([, v]) => v !== '' && v != null)) : {};
      const payload = {
        ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : (isNaN(v) || v === null ? v : Number(v) === v || typeof v === 'string' ? v : Number(v))])),
        estado_bien_id:           Number(form.estado_bien_id)           || undefined,
        estado_funcionamiento_id: Number(form.estado_funcionamiento_id) || undefined,
        empresa_id:               Number(form.empresa_id)               || undefined,
        sede_id:                  Number(form.sede_id)                  || undefined,
        modulo_id:                form.modulo_id    ? Number(form.modulo_id)    : null,
        ubicacion_id:             form.ubicacion_id ? Number(form.ubicacion_id) : null,
        tipo_bien_id:             Number(form.tipo_bien_id)             || undefined,
        marca_id:                 Number(form.marca_id)                 || undefined,
        regimen_tenencia_id:      Number(form.regimen_tenencia_id)      || undefined,
        categoria_bien_id:        form.categoria_bien_id ? Number(form.categoria_bien_id) : null,
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
      const msg = e?.response?.data?.error ?? Object.values(e?.response?.data ?? {})?.[0]?.[0] ?? 'Error al guardar.';
      toast.error(msg);
    } finally { setGuardando(false); setConfirm(false); }
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
          subtitle={modoEditar ? `${item?.tipo_bien_nombre ?? ''} — ${item?.modelo ?? ''}` : 'Completa los datos del activo patrimonial'}
          onClose={onClose}
        />

        <ModalBody>
          <div className="space-y-6">

            <Seccion title="Identificación del bien" icon="label">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FLabel required>Categoría</FLabel>
                  <FSelect value={form.categoria_bien_id}
                    onChange={v => { setF('categoria_bien_id', v); setF('tipo_bien_id', ''); setDetalle({}); }}>
                    <option value="">Seleccionar categoría...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    
                  </FSelect>
                  <FError msg={errors.categoria_bien_id} />
                </div>
                <div>
                  <FLabel required>Tipo de bien</FLabel>
                  <FSelect value={form.tipo_bien_id}  onChange={v => { setF('tipo_bien_id', v); setDetalle({}); }}
                    disabled={!form.categoria_bien_id}>
                    <option value="">Seleccionar tipo...</option>
                    {tiposFiltrados.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    {console.log(tiposFiltrados)} 
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

            {form.categoria_bien_id && !esInformatico && (
              <div className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgb(180 83 9 / 0.06)', border: '1px solid rgb(180 83 9 / 0.2)' }}>
                <Icon name="construction" className="text-[20px] shrink-0 mt-0.5" style={{ color: '#b45309' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: '#b45309' }}>Módulo en desarrollo</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-body)' }}>
                    El registro de bienes muebles, inmuebles y otras categorías estará disponible próximamente.
                    Por ahora el sistema soporta el registro completo de bienes <strong>Informáticos</strong>.
                    Puedes registrar el bien con los datos básicos sin detalle técnico.
                  </p>
                </div>
              </div>
            )}

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

            <Seccion title="Estado del bien" icon="verified">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgb(22 163 74 / 0.06)', border: '1px solid rgb(22 163 74 / 0.2)' }}>
                  <Icon name="check_circle" className="text-[22px]" style={{ color: '#16a34a' }} />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Estado del bien</p>
                    <p className="text-sm font-bold" style={{ color: '#16a34a' }}>
                      {estadosBien.find(e => String(e.id) === String(form.estado_bien_id))?.nombre ?? 'Bueno / Activo'}
                    </p>
                  </div>
                  {modoEditar && (
                    <FSelect value={form.estado_bien_id} onChange={v => setF('estado_bien_id', v)}>
                      <option value="">Seleccionar...</option>
                      {estadosBien.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </FSelect>
                  )}
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgb(37 99 235 / 0.06)', border: '1px solid rgb(37 99 235 / 0.2)' }}>
                  <Icon name="power_settings_new" className="text-[22px]" style={{ color: '#1d4ed8' }} />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Estado funcionamiento</p>
                    <p className="text-sm font-bold" style={{ color: '#1d4ed8' }}>
                      {estadosFuncion.find(e => String(e.id) === String(form.estado_funcionamiento_id))?.nombre ?? 'Operativo'}
                    </p>
                  </div>
                  {modoEditar && (
                    <FSelect value={form.estado_funcionamiento_id} onChange={v => setF('estado_funcionamiento_id', v)}>
                      <option value="">Seleccionar...</option>
                      {estadosFuncion.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </FSelect>
                  )}
                </div>
              </div>
              {!modoEditar && (
                <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                  * El estado se asigna automáticamente como <strong>Activo / Operativo</strong>. Cambia al registrar mantenimientos o bajas.
                </p>
              )}
            </Seccion>

            <Seccion title="Ubicación física" icon="location_on">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FLabel required>Empresa / Corte</FLabel>
                  <FSelect value={form.empresa_id} onChange={v => { setF('empresa_id', v); setF('sede_id', ''); setF('modulo_id', ''); setF('ubicacion_id', ''); }}>
                    <option value="">Seleccionar...</option>
                    {(empresas ?? []).map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </FSelect>
                  <FError msg={errors.empresa_id} />
                </div>
                <div>
                  <FLabel required>Sede</FLabel>
                  <FSelect value={form.sede_id} onChange={v => { setF('sede_id', v); setF('modulo_id', ''); setF('ubicacion_id', ''); }}
                    disabled={!form.empresa_id}>
                    <option value="">Seleccionar sede...</option>
                    {sedes.filter(s => !form.empresa_id || String(s.empresa_id) === String(form.empresa_id)).map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </FSelect>
                  <FError msg={errors.sede_id} />
                </div>
                <div>
                  <FLabel>Módulo</FLabel>
                  <FSelect value={form.modulo_id} onChange={v => { setF('modulo_id', v); setF('ubicacion_id', ''); }}>
                    <option value="">Sin módulo</option>
                    {modulosActivos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </FSelect>
                </div>
                <div>
                  <FLabel>Ubicación / Área</FLabel>
                  <FSelect value={form.ubicacion_id} onChange={v => setF('ubicacion_id', v)} disabled={!form.sede_id}>
                    <option value="">Sin ubicación</option>
                    {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                  </FSelect>
                </div>
                <div>
                  <FLabel>Piso</FLabel>
                  <FInput type="number" value={form.piso} onChange={v => setF('piso', v)} placeholder="Ej: 2" />
                </div>
              </div>
              <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                <Icon name="info" className="text-[14px] shrink-0 mt-0.5" style={{ color: 'var(--color-text-faint)' }} />
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  La ubicación inicial es la del registrador. Cambia mediante <strong>Traslado</strong> o <strong>Asignación interna</strong>.
                </p>
              </div>
            </Seccion>

            <SeccionDetalle tipoTecnico={tipoTecnico} detalle={detalle} setDetalle={setDetalle}
              catalogos={{
                tiposComputadora:  catData.tiposComputadora  ?? [],
                tiposDisco:        catData.tiposDisco        ?? [],
                arquitecturasBits: catData.arquitecturasBits ?? [],
                tiposMonitor:      catData.tiposMonitor      ?? [],
                tiposEscaner:      catData.tiposEscaner      ?? [],
                tiposImpresion:    catData.tiposImpresion    ?? [],
                interfacesConexion:catData.interfacesConexion ?? [],
                tamanosCarro:      catData.tamanosCarro      ?? [],
              }} />
          </div>
        </ModalBody>

        <ModalFooter align="right">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleValidar} disabled={guardando}
            className="btn-primary flex items-center gap-2">
            {guardando ? <span className="btn-loading-spin" /> : <Icon name={modoEditar ? 'save' : 'add_circle'} className="text-[16px]" />}
            {modoEditar ? 'Guardar cambios' : 'Registrar bien'}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog open={confirm}
        title={modoEditar ? 'Confirmar edición' : 'Confirmar registro'}
        message={`¿${modoEditar ? 'Guardar cambios en' : 'Registrar'} el bien "${tipoSel?.nombre ?? ''} — ${form.modelo}"?`}
        confirmLabel={modoEditar ? 'Sí, guardar' : 'Sí, registrar'}
        variant="primary" loading={guardando}
        onConfirm={handleGuardar} onClose={() => setConfirm(false)} />
    </>
  );
}