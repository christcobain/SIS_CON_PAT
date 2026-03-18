import { useState, useEffect } from 'react';
import Modal       from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody   from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import { useBienes } from '../../../../hooks/useBienes';
import { useAuthStore } from '../../../../store/authStore';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const fmtF = iso => !iso ? null : new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtT = iso => !iso ? null : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

const TABS = [
  { id: 'general',    label: 'General',        icon: 'info'           },
  { id: 'ubicacion',  label: 'Ubicación',      icon: 'location_on'    },
  { id: 'adquisicion', label: 'Adquisición',   icon: 'receipt_long'   },
  { id: 'tecnico',    label: 'Det. Técnico',   icon: 'settings'       },
];

const FUNC_BADGE = (n = '') => {
  const u = n.toUpperCase();
  if (u === 'OPERATIVO')   return { bg: 'rgb(37 99 235 / 0.1)',   color: '#1d4ed8' };
  if (u === 'AVERIADO')    return { bg: 'rgb(180 83 9 / 0.1)',    color: '#b45309' };
  if (u === 'INOPERATIVO') return { bg: 'rgb(220 38 38 / 0.1)',   color: '#dc2626' };
  return { bg: 'var(--color-border-light)', color: 'var(--color-text-muted)' };
};

function Fila({ label, value, icon, mono = false }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
      <Icon name={icon ?? 'label'} className="text-[15px] mt-0.5 shrink-0"
        style={{ color: 'var(--color-text-faint)' }} />
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className={`text-xs font-semibold mt-0.5 ${mono ? 'font-mono' : ''}`}
          style={{ color: 'var(--color-text-primary)' }}>{String(value)}</p>
      </div>
    </div>
  );
}

function Bool({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
      <p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{label}</p>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
        style={{ background: value ? 'rgb(22 163 74 / 0.1)' : 'var(--color-border-light)', color: value ? '#16a34a' : 'var(--color-text-muted)' }}>
        {value ? 'Sí' : 'No'}
      </span>
    </div>
  );
}

function TabGeneral({ b }) {
  const fb = FUNC_BADGE(b.estado_funcionamiento_nombre ?? '');
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Identificación</p>
        <Fila label="Tipo de bien"        value={b.tipo_bien_nombre}             icon="devices"         />
        <Fila label="Categoría"           value={b.categoria_bien_nombre}        icon="folder"          />
        <Fila label="Marca"               value={b.marca_nombre}                 icon="sell"            />
        <Fila label="Modelo"              value={b.modelo}                       icon="tag"             />
        <Fila label="N° de serie"         value={b.numero_serie ?? 'S/N'}        icon="pin" mono />
        <Fila label="Código patrimonial"  value={b.codigo_patrimonial ?? 'S/C'}  icon="qr_code" mono />
        <Fila label="Régimen de tenencia" value={b.regimen_tenencia_nombre}      icon="gavel"           />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Estado</p>
        <div className="flex items-center gap-2 mb-3 p-3 rounded-xl"
          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
          <div className="size-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: fb.bg }}>
            <Icon name="device_unknown" className="text-[16px]" style={{ color: fb.color }} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Funcionamiento</p>
            <p className="text-xs font-bold" style={{ color: fb.color }}>{b.estado_funcionamiento.nombre ?? '—'}</p>
          </div>
        </div>
        <Fila label="Estado del bien"       value={b.estado_bien_nombre}           icon="verified"        />
        <Fila label="Custodio actual"        value={b.usuario_asignado_nombre}      icon="person"          />
        <Fila label="Registrado por"         value={b.usuario_registra_nombre}      icon="manage_accounts" />
        <Fila label="Ult. mantenimiento"     value={fmtF(b.fecha_ultimo_mantenimiento)} icon="build"       />
        {b.detalle_tecnico && <Fila label="Descripción técnica" value={b.detalle_tecnico} icon="notes" />}
        {b.observacion && <Fila label="Observación" value={b.observacion} icon="comment" />}
      </div>
    </div>
  );
}

function TabUbicacion({ b }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Localización actual</p>
        <Fila label="Empresa / Corte"  value={b.empresa_nombre}    icon="business"    />
        <Fila label="Sede"             value={b.sede_nombre}       icon="domain"      />
        <Fila label="Módulo"           value={b.modulo_nombre}     icon="grid_view"   />
        <Fila label="Ubicación / Área" value={b.ubicacion_nombre}  icon="place"       />
        <Fila label="Piso"             value={b.piso != null ? `Piso ${b.piso}` : null} icon="stairs" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Custodio y fechas</p>
        <Fila label="Custodio actual"  value={b.usuario_asignado_nombre} icon="person"           />
        <Fila label="Corte"            value={b.corte}                   icon="account_balance"  />
        <Fila label="Fecha registro"   value={fmtT(b.fecha_registro)}    icon="calendar_today"   />
        <Fila label="Última actualiz." value={fmtT(b.fecha_actualizacion)} icon="update"         />
        {!b.is_active && <Fila label="Fecha de baja" value={fmtF(b.fecha_baja)} icon="event_busy" />}
        {!b.is_active && <Fila label="Motivo de baja" value={b.motivo_baja_nombre} icon="do_not_disturb_on" />}
      </div>
    </div>
  );
}

function TabAdquisicion({ b }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Compra</p>
        <Fila label="Año de adquisición"   value={b.anio_adquisicion}         icon="calendar_month" />
        <Fila label="Fecha de compra"      value={fmtF(b.fecha_compra)}       icon="shopping_cart"  />
        <Fila label="N° orden de compra"   value={b.numero_orden_compra}      icon="receipt" mono   />
        <Fila label="Garantía vence"       value={fmtF(b.fecha_vencimiento_garantia)} icon="shield" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Instalación e inventario</p>
        <Fila label="Fecha instalación"       value={fmtF(b.fecha_instalacion)}       icon="install_desktop" />
        <Fila label="Último inventario"       value={fmtF(b.fecha_ultimo_inventario)} icon="inventory"       />
        <Fila label="Régimen de tenencia"     value={b.regimen_tenencia.nombre}       icon="gavel"           />
      </div>
    </div>
  );
}

function TabTecnico({ b }) {
  const { tipo_bien_nombre: tt } = b;
  const cpu = b.detalle_cpu;
  const mon = b.detalle_monitor;
  const imp = b.detalle_impresora;
  const sc  = b.detalle_scanner;
  const sw  = b.detalle_switch;

  if (!tt && !cpu && !mon && !imp && !sc && !sw) return (
    <div className="text-center py-10">
      <Icon name="settings" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
      <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Sin detalle técnico especializado</p>
      {b.detalle_tecnico && (
        <p className="text-xs mt-2 italic" style={{ color: 'var(--color-text-body)' }}>{b.detalle_tecnico}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {cpu && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Icon name="computer" className="text-[14px]" style={{ color: '#1d4ed8' }} />CPU / Computadora
          </p>
          <div className="grid grid-cols-2 gap-x-6">
            <Fila label="Tipo"              value={cpu.tipo_computadora_nombre}  icon="computer"    />
            <Fila label="Hostname"          value={cpu.hostname}                 icon="dns" mono    />
            <Fila label="Dominio"           value={cpu.dominio_equipo}           icon="hub"         />
            <Fila label="IP"                value={cpu.direccion_ip}             icon="wifi" mono   />
            <Fila label="MAC"               value={cpu.direccion_mac}            icon="router" mono />
            <Fila label="Función"           value={cpu.funcion_cpu}              icon="work"        />
            <Fila label="Procesador"        value={cpu.procesador_tipo}          icon="memory"      />
            <Fila label="Velocidad"         value={cpu.procesador_velocidad}     icon="speed"       />
            <Fila label="RAM (GB)"          value={cpu.capacidad_ram_gb}         icon="memory_alt"  />
            <Fila label="Módulos RAM"       value={cpu.cantidad_modulos_ram}     icon="storage"     />
            <Fila label="Disco"             value={cpu.capacidad_disco}          icon="hard_drive"  />
            <Fila label="Tipo de disco"     value={cpu.tipo_disco_nombre}        icon="disc_full"   />
            <Fila label="Arquitectura"      value={cpu.arquitectura_bits_nombre} icon="layers"      />
            <Fila label="Sistema Operativo" value={cpu.sistema_operativo}        icon="laptop"      />
            <Fila label="Licencia SO"       value={cpu.licencia_so}              icon="key"         />
            <Fila label="Office"            value={cpu.version_office}           icon="article"     />
            <Fila label="Licencia Office"   value={cpu.licencia_office}          icon="key"         />
            <Fila label="Multimedia"        value={cpu.multimedia}               icon="play_circle" />
          </div>
        </div>
      )}

      {mon && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Icon name="desktop_windows" className="text-[14px]" style={{ color: '#7c3aed' }} />Monitor
          </p>
          <div className="grid grid-cols-2 gap-x-6">
            <Fila label="Tipo de monitor"   value={mon.tipo_monitor_nombre}   icon="monitor"      />
            <Fila label="Tamaño (pulg.)"    value={mon.tamano_pulgadas != null ? `${mon.tamano_pulgadas}"` : null} icon="fullscreen" />
          </div>
        </div>
      )}

      {imp && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Icon name="print" className="text-[14px]" style={{ color: '#b45309' }} />Impresora
          </p>
          <div className="grid grid-cols-2 gap-x-6">
            <Fila label="Tipo de impresión"  value={imp.tipo_impresion_nombre}    icon="print"        />
            <Fila label="Interfaz conexión"  value={imp.interfaz_conexion_nombre} icon="cable"        />
            <Fila label="Tamaño de carro"    value={imp.tamano_carro_nombre}      icon="straighten"   />
            <Fila label="Velocidad (ppm)"    value={imp.velocidad_impresion_ppm}  icon="speed"        />
            <Fila label="RAM (MB)"           value={imp.memoria_ram_mb}           icon="memory"       />
            <Fila label="Resolución máx."    value={imp.resolucion_maxima_ppp}    icon="hd"           />
            <Fila label="Hojas soportadas"   value={imp.tamano_hojas_soportadas}  icon="description"  />
            <Fila label="Alimentación AC"    value={imp.alimentacion_ac}          icon="electrical_services" />
            <Bool label="Impresión color"    value={imp.impresion_color} />
            <Bool label="Dúplex"             value={imp.unidad_duplex} />
            <Bool label="Conexión red"       value={imp.conexion_red} />
          </div>
        </div>
      )}

      {sc && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Icon name="scanner" className="text-[14px]" style={{ color: '#0f766e' }} />Scanner
          </p>
          <div className="grid grid-cols-2 gap-x-6">
            <Fila label="Tipo de escáner"        value={sc.tipo_escaner_nombre}       icon="document_scanner" />
            <Fila label="Interfaz conexión"       value={sc.interfaz_conexion_nombre}  icon="cable"           />
            <Fila label="Tamaño de documentos"    value={sc.tamano_documentos}         icon="straighten"      />
            <Fila label="Resolución exploración"  value={sc.resolucion_exploracion}    icon="hd"              />
            <Fila label="Resolución salida"       value={sc.resolucion_salida}         icon="hd"              />
            <Fila label="Alimentación AC"         value={sc.alimentacion_ac}           icon="electrical_services" />
            <Bool label="Alimentador automático"  value={sc.alimentador_automatico} />
            <Bool label="Metadata"                value={sc.metadata} />
          </div>
        </div>
      )}

      {sw && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Icon name="device_hub" className="text-[14px]" style={{ color: '#be185d' }} />Switch / Hub
          </p>
          <div className="grid grid-cols-2 gap-x-6">
            <Fila label="Puertos UTP"        value={sw.cantidad_puertos_utp}  icon="hub"     />
            <Fila label="Puertos FTP"        value={sw.cantidad_puertos_ftp}  icon="hub"     />
            <Fila label="Puertos FO"         value={sw.cantidad_puertos_fo}   icon="hub"     />
            <Fila label="Puertos WAN"        value={sw.cantidad_puertos_wan}  icon="router"  />
            <Fila label="Velocidad (Mbps)"   value={sw.velocidad_mbps}        icon="speed"   />
            <Fila label="IP"                 value={sw.direccion_ip}          icon="wifi" mono />
            <Fila label="MAC"                value={sw.direccion_mac}         icon="router" mono />
            <Fila label="Chasis slots"       value={sw.chasis_slots}          icon="view_module" />
            <Fila label="Fuente de poder"    value={sw.fuente_poder}          icon="power"   />
            <Fila label="Alimentación AC"    value={sw.alimentacion_ac}       icon="electrical_services" />
            <Bool label="Administrable"      value={sw.admin_software} />
            <Bool label="Soporta VLAN"       value={sw.soporta_vlan} />
            <Bool label="Migración ATM"      value={sw.migracion_atm} />
            <Bool label="Manual incluido"    value={sw.manual_incluido} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModalDetalleBien({ open, onClose, item, onEditar }) {
  const { obtener } = useBienes();
  const role = useAuthStore(s => s.role);
  const puedeEditar = role === 'SYSADMIN';
  const [bien,    setBien]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState('general');

  useEffect(() => {
    if (!open || !item?.id) return;
    let cancelled = false;
    setLoading(true);
    setBien(null);
    setTab('general');
    obtener(item.id)
      .then(d  => { if (!cancelled) setBien(d); })
      .catch(() => { if (!cancelled) setBien(item); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, item?.id]);

  if (!item) return null;
  const b = bien ?? item;
  const tieneTecnico = !!(b.detalle_cpu || b.detalle_monitor || b.detalle_impresora || b.detalle_scanner || b.detalle_switch || b.detalle_tecnico);
  const tabsVisibles = tieneTecnico ? TABS : TABS.filter(t => t.id !== 'tecnico');
  const FUNC_B = FUNC_BADGE(b.estado_funcionamiento_nombre);
  return (
    <Modal open={open} onClose={onClose} size="xl" closeOnOverlay>
      <ModalHeader
        icon="inventory_2"
        title={`${b.tipo_bien_nombre ?? 'Bien'} — ${b.marca_nombre ?? ''}`.trim()}
        subtitle={`${b.codigo_patrimonial ?? 'Sin código'} · ${b.numero_serie ?? 'S/N'}`}
        onClose={onClose}
      />

      <ModalBody padding={false}>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
        ) : (
          <div className="flex" style={{ minHeight: '55vh' }}>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex gap-5 px-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                {tabsVisibles.map(({ id, label, icon }) => (
                  <button key={id} onClick={() => setTab(id)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pb-3 pt-4 transition-all border-b-2"
                    style={{ borderBottomColor: tab === id ? 'var(--color-primary)' : 'transparent', color: tab === id ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    <Icon name={icon} className="text-[15px]" />{label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {tab === 'general'    && <TabGeneral    b={b} />}
                {tab === 'ubicacion'  && <TabUbicacion  b={b} />}
                {tab === 'adquisicion' && <TabAdquisicion b={b} />}
                {tab === 'tecnico'    && <TabTecnico    b={b} />}
              </div>
            </div>
            <aside className="w-52 shrink-0 p-4 space-y-3 overflow-y-auto" style={{ borderLeft: '1px solid var(--color-border)' }}>
              <div className="card p-3 text-center space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Estado</p>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl"
                  style={{ background: FUNC_B.bg, color: FUNC_B.color }}>
                  {b.estado_funcionamiento.nombre?? '—'}
                </span>
                <p className="text-[9px] font-black font-mono" style={{ color: 'var(--color-primary)' }}>
                  {b.codigo_patrimonial ?? 'Sin código'}
                </p>
              </div>

              <div className="card p-3 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Resumen</p>
                {[
                  { label: 'Tipo',     value: b.tipo_bien_nombre ?? '—',       icon: 'devices'      },
                  { label: 'Marca',    value: b.marca_nombre ?? '—',           icon: 'sell'         },
                  { label: 'Sede',     value: b.sede_nombre ?? '—',            icon: 'domain'       },
                  { label: 'Custodio', value: b.usuario_asignado_nombre ?? '—', icon: 'person'      },
                ].map(s => (
                  <div key={s.label} className="flex items-start gap-1.5">
                    <Icon name={s.icon} className="text-[13px] mt-0.5 shrink-0"
                      style={{ color: 'var(--color-text-faint)' }} />
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest"
                        style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                      <p className="text-[11px] font-semibold truncate"
                        style={{ color: 'var(--color-text-primary)' }}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {b.tipo_bien_nombre && (
                <div className="card p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--color-text-muted)' }}>Tipo técnico</p>
                  <span className="inline-block text-[10px] font-black px-2 py-1 rounded-lg"
                    style={{ background: 'rgb(127 29 29 / 0.08)', color: 'var(--color-primary)' }}>
                    {b.tipo_bien_nombre}
                  </span>
                </div>
              )}

              <div className="card p-3 space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest mb-1"
                  style={{ color: 'var(--color-text-muted)' }}>Fechas</p>
                {b.fecha_registro && (
                  <div>
                    <p className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>Registro</p>
                    <p className="text-[10px] font-semibold" style={{ color: 'var(--color-text-body)' }}>{fmtF(b.fecha_registro)}</p>
                  </div>
                )}
                {b.fecha_ultimo_mantenimiento && (
                  <div>
                    <p className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>Ult. Mant.</p>
                    <p className="text-[10px] font-semibold" style={{ color: 'var(--color-text-body)' }}>{fmtF(b.fecha_ultimo_mantenimiento)}</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </ModalBody>

      <ModalFooter align="right">
        <button onClick={onClose} className="btn-secondary">Cerrar</button>
        {puedeEditar && (
          <button onClick={() => { onClose(); onEditar(item); }}
            className="btn-primary flex items-center gap-2">
            <Icon name="edit" className="text-[16px]" />Editar bien
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}