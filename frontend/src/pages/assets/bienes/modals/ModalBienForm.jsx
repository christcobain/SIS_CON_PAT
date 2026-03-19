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
  ubicacion_id: '', piso: '',
};

export default function ModalBienForm({ open, onClose, item = null, onGuardado }) {
  const toast      = useToast();
  const modoEditar = !!item;
  const { crear, actualizar }          = useBienes();
  const { ubicaciones }   = useLocaciones();
  const { fetchCatalogos, ...catalogos } = useCatalogos();
  
  const empresaId    = useAuthStore(s => s.empresaId);
  const empresaNombre = useAuthStore(s => s.empresaNombre);
  const sedes_auth   = useAuthStore(s => s.sedes);
  const modulo_id_auth = useAuthStore(s => s.modulo_id);
  const modulo_nombre_auth = useAuthStore(s => s.modulo_nombre);
  const sedeDefault  = sedes_auth?.[0];
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
  }, [open, fetchCatalogos]);
  

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
        modulo_id:                String(item.modulo_id ?? ''),
        ubicacion_id:             String(item.ubicacion_id ?? ''),
        piso:                     item.piso ?? '',
      });
      const d = item.detalle_cpu ?? item.detalle_monitor ?? item.detalle_impresora ?? item.detalle_scanner ?? item.detalle_switch ?? {};
      setDetalle(d);
    } else {
      setForm({ ...FORM_VACIO });
      setDetalle({});
    }
    setErrors({});
  }, [modoEditar,open]);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const categorias     = catalogos.categoriasBien ?? [];
  const tiposBien      = catalogos.tiposBien ?? [];
  const marcas         = catalogos.marcas ?? [];
  const regimenes      = catalogos.regimenTenencia ?? [];
  const estadosBien    = catalogos.estadosBien ?? [];
  const estadosFuncion = catalogos.estadosFuncionamiento ?? [];
  {console.log(categorias)}

  const categoriaSel = categorias.find(c => String(c.id) === String(form.categoria_bien_id));
  const esInformatico = categoriaSel?.nombre?.toUpperCase().includes('INFORM');

  const tipoSel    = tiposBien.find(t => String(t.id) === String(form.tipo_bien_id));
  const tipoTecnico = esInformatico ? detectarTipoTecnico(tipoSel?.nombre ?? '') : null;
  const tiposFiltrados = useMemo(() => {
    if (!form.categoria_bien_id) return [];
    const apiIncluyeCategoria = tiposBien.some(
      t => t.categoria_bien_id != null || t.categoria_id != null
    );
    if (apiIncluyeCategoria) {
      return tiposBien.filter(t =>
        String(t.categoria_bien_id ?? t.categoria_id ?? '') === String(form.categoria_bien_id)
      );
    }
    return tiposBien.filter(t => t.is_active !== false);
  }, [tiposBien, form.categoria_bien_id]);

  const ubicacionesActivos = (ubicaciones ?? []).filter(m => m.is_active !== false);

  const idBueno     = estadosBien.find(e => e.nombre?.toUpperCase().includes('BUENO') || e.nombre?.toUpperCase().includes('ACTIVO'))?.id;
  const idOperativo = estadosFuncion.find(e => e.nombre?.toUpperCase().includes('OPERATIVO'))?.id;

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
      let result;
      if (modoEditar) {
        result=await actualizar(item.id, payload);
        toast.success(result.response?.data?.mensaje  ||'Bien actualizado correctamente.');
      } else {
        result=await crear(payload);
        toast.success(result.response?.data?.mensaje  ||'Bien registrado correctamente.');
      }
      onGuardado?.();
      onClose();
    } catch (e) {
      const msg = e?.response?.data?.error
        ?? Object.values(e?.response?.data ?? {})?.[0]?.[0]
        ?? 'Error al guardar.';
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
            {/* Sección: Identificación del bien */}
            <Seccion title="Identificación del bien" icon="label">
              <div className="grid grid-cols-3 gap-3">
                {/* Categoría */}
                <div>
                  <FLabel required>Categoría</FLabel>
                  <FSelect
                    value={form.categoria_bien_id} onChange={v => {
                      setF('categoria_bien_id', v);
                      setF('tipo_bien_id', '');
                      setDetalle({});
                    }}
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categorias?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </FSelect>
                  <FError msg={errors.categoria_bien_id} />
                </div>

                {/* Tipo de bien — se habilita SOLO cuando hay categoría */}
                <div>
                  <FLabel required>Tipo de bien</FLabel>
                  <FSelect
                    value={form.tipo_bien_id}
                    onChange={v => { setF('tipo_bien_id', v); setDetalle({}); }}
                    disabled={!form.categoria_bien_id}
                  >
                    <option value="">
                      {!form.categoria_bien_id
                        ? '← Selecciona primero la categoría'
                        : tiposFiltrados.length === 0
                          ? 'Sin tipos para esta categoría'
                          : 'Seleccionar tipo...'}
                    </option>
                    {tiposFiltrados.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </FSelect>
                  <FError msg={errors.tipo_bien_id} />
                </div>

                {/* Marca */}
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

            {/* Aviso para no-informáticos */}
            {form.categoria_bien_id && !esInformatico && (
              <div className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgb(180 83 9 / 0.06)', border: '1px solid rgb(180 83 9 / 0.2)' }}>
                <Icon name="construction" className="text-[20px] shrink-0 mt-0.5" style={{ color: '#b45309' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: '#b45309' }}>Módulo en desarrollo</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-body)' }}>
                    El registro de bienes muebles, inmuebles y otras categorías estará disponible próximamente.
                    Puedes registrar el bien con los datos básicos sin detalle técnico.
                  </p>
                </div>
              </div>
            )}

            {/* Sección: Adquisición */}
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

            {/* Sección: Estado del bien */}
            <Seccion title="Estado del bien" icon="verified">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgb(22 163 74 / 0.06)', border: '1px solid rgb(22 163 74 / 0.2)' }}>
                  <Icon name="check_circle" className="text-[22px]" style={{ color: '#16a34a' }} />
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Estado del bien</p>
                    {modoEditar ? (
                      <FSelect value={form.estado_bien_id} onChange={v => setF('estado_bien_id', v)}>
                        <option value="">Seleccionar...</option>
                        {estadosBien.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </FSelect>
                    ) : (
                      <p className="text-sm font-bold" style={{ color: '#16a34a' }}>
                        {estadosBien.find(e => String(e.id) === String(form.estado_bien_id))?.nombre ?? 'Bueno / Activo (automático)'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgb(37 99 235 / 0.06)', border: '1px solid rgb(37 99 235 / 0.2)' }}>
                  <Icon name="power_settings_new" className="text-[22px]" style={{ color: '#1d4ed8' }} />
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Estado funcionamiento</p>
                    {modoEditar ? (
                      <FSelect value={form.estado_funcionamiento_id} onChange={v => setF('estado_funcionamiento_id', v)}>
                        <option value="">Seleccionar...</option>
                        {estadosFuncion.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </FSelect>
                    ) : (
                      <p className="text-sm font-bold" style={{ color: '#1d4ed8' }}>
                        {estadosFuncion.find(e => String(e.id) === String(form.estado_funcionamiento_id))?.nombre ?? 'Operativo (automático)'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {!modoEditar && (
                <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                  * El estado se asigna automáticamente como <strong>Activo / Operativo</strong>. Cambia al registrar mantenimientos o bajas.
                </p>
              )}
            </Seccion>

            {/* Sección: Ubicación — Empresa y Sede fijas del login, solo módulo/piso editables */}
            <Seccion title="Ubicación física" icon="location_on">
              {/* Info de la empresa y sede del usuario logueado */}

              <div className="grid grid-cols-4 gap-1 mb-1">
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                  <Icon name="business" className="text-[18px]" style={{ color: 'var(--color-primary)' }} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Empresa / Corte</p>
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {empresaNombre ?? `ID ${empresaId}`}
                    </p>
                  </div>
                  <Icon name="lock" className="text-[14px] shrink-0" style={{ color: 'var(--color-text-faint)' }} />
                </div>

                <div className="flex items-center gap-1 p-3 rounded-xl"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                  <Icon name="domain" className="text-[18px]" style={{ color: 'var(--color-primary)' }} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Sede asignada</p>
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {sedeDefault?.nombre ?? 'Sin sede asignada'}
                    </p>
                  </div>
                  <Icon name="lock" className="text-[14px] shrink-0" style={{ color: 'var(--color-text-faint)' }} />
                </div>
              

              <div className="flex items-center gap-1 p-3 rounded-xl"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                  <Icon name="domain" className="text-[18px]" style={{ color: 'var(--color-primary)' }} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Modulo asignado</p>
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {modulo_nombre_auth?? 'Sin módulo asignad'}
                    </p>
                  </div>
                  <Icon name="lock" className="text-[14px] shrink-0" style={{ color: 'var(--color-text-faint)' }} />
                </div>             

              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-xl mb-3"
                style={{ background: 'rgb(127 29 29 / 0.04)', border: '1px solid rgb(127 29 29 / 0.15)' }}>
                <Icon name="info" className="text-[14px] shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  La empresa, sede y módulo se asignan automáticamente según tu usuario de sesión. Solo puedes especificar el piso.
                </p>
              </div>
              {/* Ubicacion — configurables */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FLabel>Ubicación Funcional</FLabel>
                  <FSelect value={form.ubicacion_id} onChange={v => setF('ubicacion_id', v)}>
                    <option value="">Seleccionar ubicación...</option>
                    {ubicacionesActivos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)} 
                  </FSelect>
                </div>
               <div>
                  <FLabel>Piso</FLabel>
                  <FInput type="number" value={form.piso} onChange={v => setF('piso', v)} placeholder="Ej: 2" />
                </div>
              </div>
            
            </Seccion>

            {/* Detalle técnico si aplica */}
            <SeccionDetalle
              tipoTecnico={tipoTecnico}
              detalle={detalle}
              setDetalle={setDetalle}
              catalogos={{
                tiposComputadora:  catalogos.tiposComputadora  ?? [],
                tiposDisco:        catalogos.tiposDisco        ?? [],
                arquitecturasBits: catalogos.arquitecturasBits ?? [],
                tiposMonitor:      catalogos.tiposMonitor      ?? [],
                tiposEscaner:      catalogos.tiposEscaner      ?? [],
                tiposImpresion:    catalogos.tiposImpresion    ?? [],
                interfacesConexion: catalogos.interfacesConexion ?? [],
                tamanosCarro:      catalogos.tamanosCarro      ?? [],
              }}
            />
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

      <ConfirmDialog
        open={confirm}
        title={modoEditar ? 'Confirmar edición' : 'Confirmar registro'}
        message={`¿${modoEditar ? 'Guardar cambios en' : 'Registrar'} el bien "${tipoSel?.nombre ?? form.tipo_bien_id} — ${form.modelo}"?`}
        confirmLabel={modoEditar ? 'Sí, guardar' : 'Sí, registrar'}
        variant="primary"
        loading={guardando}
        onConfirm={handleGuardar}
        onClose={() => setConfirm(false)}
      />
    </>
  );
}