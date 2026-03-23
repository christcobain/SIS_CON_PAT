import { useState, useEffect, useMemo } from 'react';
import Modal from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';
import { useBienes } from '../../../../hooks/useBienes';
import { useAuthStore } from '../../../../store/authStore';
import { useLocaciones } from '../../../../hooks/useLocaciones'; 
import { useUsuarios } from '../../../../hooks/useUsuarios';     

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const fmtF = iso => !iso ? null : new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtT = iso => !iso ? null : new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

const TABS = [
  { id: 'general',     label: 'General',     icon: 'info'           },
  { id: 'ubicacion',   label: 'Ubicación',   icon: 'location_on'    },
  { id: 'adquisicion', label: 'Adquisición',  icon: 'receipt_long'   },
  { id: 'tecnico',     label: 'Det. Técnico',  icon: 'settings'       },
];

const FUNC_BADGE = (n = '') => {
  const u = n.toUpperCase();
  if (u === 'OPERATIVO')   return { u, bg: 'rgb(34 197 94 / 0.1)',   color: '#16a34a' };
  if (u === 'AVERIADO')    return { u, bg: 'rgb(180 83 9 / 0.1)',    color: '#b45309' };
  if (u === 'INOPERATIVO') return { u, bg: 'rgb(220 38 38 / 0.1)',   color: '#dc2626' };
  return { u: n || '—', bg: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' };
};

/* --- COMPONENTES ATÓMICOS --- */

function Fila({ label, value, icon, mono = false }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border-light bg-surface-alt/30 transition-colors hover:bg-surface-alt/60">
      <div className="size-8 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-border-light shadow-sm">
        <Icon name={icon ?? 'label'} className="text-[16px]" style={{ color: 'var(--color-text-faint)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.15em] leading-none mb-1.5 text-faint">{label}</p>
        <p className={`text-[11px] font-bold truncate ${mono ? 'font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded' : ''}`} style={{ color: 'var(--color-text-primary)' }}>{String(value)}</p>
      </div>
    </div>
  );
}

function Bool({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border-light bg-surface-alt/30">
      <p className="text-[10px] font-black uppercase tracking-wider text-body">{label}</p>
      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border ${value ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
        {value ? 'SÍ' : 'NO'}
      </span>
    </div>
  );
}

function SectionTitle({ icon, title, color = 'var(--color-text-muted)' }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-2">
      <Icon name={icon} className="text-[16px]" style={{ color }} />
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color }}>{title}</h4>
      <div className="flex-1 h-[1px] bg-border-light" />
    </div>
  );
}

/* --- VISTAS DE TABS --- */

function TabGeneral({ b }) {
  const fb = FUNC_BADGE(b.estado_funcionamiento_nombre ?? '');
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <SectionTitle icon="fingerprint" title="Identificación de Activo" />
          <Fila label="Tipo de bien"        value={b.tipo_bien_nombre}             icon="devices"         />
          <Fila label="Categoría"           value={b.categoria_bien_nombre}        icon="folder"          />
          <Fila label="Marca"               value={b.marca_nombre}                 icon="sell"            />
          <Fila label="Modelo"               value={b.modelo}                       icon="tag"             />
          <Fila label="N° de serie"         value={b.numero_serie ?? 'S/N'}        icon="pin" mono />
          <Fila label="Código patrimonial"  value={b.codigo_patrimonial ?? 'S/C'}  icon="qr_code" mono />
        </div>
        <div className="space-y-3">
          <SectionTitle icon="assignment_ind" title="Estado Operativo" />
          <div className="p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-2 mb-4 transition-all" style={{ borderColor: fb.bg, background: fb.bg }}>
            <div className="size-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: fb.color, color: '#fff' }}>
                <Icon name="verified_user" className="text-[20px]" />
            </div>
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Funcionamiento</p>
                <p className="text-sm font-black uppercase tracking-tight" style={{ color: fb.color }}>{fb.u}</p>
            </div>
          </div>
          <Fila label="Estado del bien"      value={b.estado_bien_nombre}           icon="verified"        />
          <Fila label="Custodio actual"      value={b.usuario_asignado_nombre}      icon="person"          />
          <Fila label="Régimen de tenencia" value={b.regimen_tenencia_nombre}      icon="gavel"           />
        </div>
      </div>
    </div>
  );
}

function TabUbicacion({ b }) {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-3">
        <SectionTitle icon="map" title="Localización Física" color="var(--color-primary)" />
        <Fila label="Empresa / Institución" value={b.empresa_nombre}   icon="business"    />
        <Fila label="Sede"                  value={b.sede_nombre}       icon="domain"      />
        <Fila label="Módulo"                value={b.modulo_nombre}     icon="grid_view"   />
        <Fila label="Ubicación / Área"      value={b.ubicacion_nombre} icon="place"       />
        <Fila label="Piso"                  value={b.piso != null ? `Nivel ${b.piso}` : null} icon="stairs" />
      </div>
      <div className="space-y-3">
        <SectionTitle icon="history" title="Auditoría de Registro" />
        <Fila label="Registrado por"  value={b.usuario_registra_nombre} icon="manage_accounts" />
        <Fila label="Fecha registro"  value={fmtT(b.fecha_registro)}     icon="calendar_today"   />
        <Fila label="Última actualiz." value={fmtT(b.fecha_actualizacion)} icon="update"           />
        {b.observacion && (
           <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 mt-4">
             <p className="text-[9px] font-black uppercase text-amber-600 mb-1">Observación</p>
             <p className="text-xs italic text-amber-800 dark:text-amber-200 leading-relaxed">{b.observacion}</p>
           </div>
        )}
      </div>
    </div>
  );
}

function TabAdquisicion({ b }) {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-3">
        <SectionTitle icon="payments" title="Detalles de Compra" />
        <Fila label="Año de adquisición"   value={b.anio_adquisicion}         icon="calendar_month" />
        <Fila label="Fecha de compra"      value={fmtF(b.fecha_compra)}       icon="shopping_cart"  />
        <Fila label="N° orden de compra"   value={b.numero_orden_compra}      icon="receipt" mono   />
        <Fila label="Garantía vence"       value={fmtF(b.fecha_vencimiento_garantia)} icon="shield_with_heart" />
      </div>
      <div className="space-y-3">
        <SectionTitle icon="inventory_2" title="Logística e Instalación" />
        <Fila label="Fecha instalación"       value={fmtF(b.fecha_instalacion)}       icon="install_desktop" />
        <Fila label="Último inventario"       value={fmtF(b.fecha_ultimo_inventario)} icon="inventory"       />
        <Fila label="Régimen de tenencia"     value={b.regimen_tenencia_nombre}       icon="gavel"           />
      </div>
    </div>
  );
}

function TabTecnico({ b }) {
  const cpu = b.detalle_cpu;
  const mon = b.detalle_monitor;
  const imp = b.detalle_impresora;
  const sw  = b.detalle_switch;

  return (
    <div className="space-y-8 pb-4">
      {cpu && (
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-border-light">
          <SectionTitle icon="computer" title="Especificaciones CPU / Computadora" color="#1d4ed8" />
          <div className="grid grid-cols-3 gap-3">
            <Fila label="Tipo"              value={cpu.tipo_computadora_nombre}  icon="computer"    />
            <Fila label="Hostname"          value={cpu.hostname}                 icon="dns" mono    />
            <Fila label="IP"                value={cpu.direccion_ip}             icon="wifi" mono   />
            <Fila label="MAC"               value={cpu.direccion_mac}            icon="router" mono />
            <Fila label="Procesador"        value={cpu.procesador_tipo}           icon="memory"      />
            <Fila label="RAM (GB)"          value={cpu.capacidad_ram_gb}         icon="memory_alt"  />
            <Fila label="Disco"             value={cpu.capacidad_disco}          icon="hard_drive"  />
            <Fila label="S.O."              value={cpu.sistema_operativo}        icon="laptop"      />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {mon && (
          <div className="p-4 rounded-xl border border-border-light">
            <SectionTitle icon="desktop_windows" title="Monitor" color="#7c3aed" />
            <div className="grid grid-cols-1 gap-2">
              <Fila label="Tipo" value={mon.tipo_monitor_nombre} icon="monitor" />
              <Fila label="Tamaño" value={mon.tamano_pulgadas != null ? `${mon.tamano_pulgadas}"` : null} icon="fullscreen" />
            </div>
          </div>
        )}
        {imp && (
          <div className="p-4 rounded-xl border border-border-light">
            <SectionTitle icon="print" title="Impresora" color="#b45309" />
            <div className="grid grid-cols-1 gap-2">
              <Fila label="Tipo" value={imp.tipo_impresion_nombre} icon="print" />
              <Bool label="Impresión color" value={imp.impresion_color} />
              <Bool label="Conexión red" value={imp.conexion_red} />
            </div>
          </div>
        )}
      </div>
      
      {sw && (
        <div className="p-4 rounded-xl border border-border-light bg-pink-50/10">
          <SectionTitle icon="device_hub" title="Switch / Hub Infraestructura" color="#be185d" />
          <div className="grid grid-cols-3 gap-3">
            <Fila label="Puertos UTP" value={sw.cantidad_puertos_utp} icon="hub" />
            <Fila label="Velocidad" value={sw.velocidad_mbps} icon="speed" />
            <Bool label="Administrable" value={sw.admin_software} />
          </div>
        </div>
      )}
    </div>
  );
}

/* --- COMPONENTE PRINCIPAL --- */

export default function ModalDetalleBien({ open, onClose, item, onEditar }) {
  const { obtener } = useBienes();
  const { role } = useAuthStore();
  const puedeEditar = role === 'SYSADMIN';

  const { sedes, modulos, ubicaciones } = useLocaciones();
  const { usuarios } = useUsuarios({ is_active: true });

  const [dataFull, setDataFull] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('general');

  const maps = useMemo(() => ({
    sedes: Object.fromEntries((sedes ?? []).map(s => [s.id, s.nombre])),
    modulos: Object.fromEntries((modulos ?? []).map(m => [m.id, m.nombre])),
    ubicaciones: Object.fromEntries((ubicaciones ?? []).map(u => [u.id, u.nombre])),
    usuarios: Object.fromEntries((usuarios ?? []).map(u => [u.id, `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()]))
  }), [sedes, modulos, ubicaciones, usuarios]);

  useEffect(() => {
    if (!open || !item?.id) return;
    let cancelled = false;
    setLoading(true);
    setTab('general');
    obtener(item.id)
      .then(res => {
        if (cancelled) return;
        const enriched = {
          ...res,
          sede_nombre: res.sede_nombre ?? maps.sedes[res.sede_id] ?? '—',
          modulo_nombre: res.modulo_nombre ?? maps.modulos[res.modulo_id] ?? '—',
          ubicacion_nombre: res.ubicacion_nombre ?? maps.ubicaciones[res.ubicacion_id] ?? '—',
          usuario_asignado_nombre: res.usuario_asignado_nombre ?? maps.usuarios[res.usuario_asignado_id] ?? '—',
          usuario_registra_nombre: res.usuario_registra_nombre ?? maps.usuarios[res.usuario_registra_id] ?? '—',
        };
        setDataFull(enriched);
      })
      .catch(() => {
        if (!cancelled) setDataFull(item);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [open, item?.id, maps]);

  if (!item) return null;
  const b = dataFull ?? item;
  const fb = FUNC_BADGE(b.estado_funcionamiento_nombre ?? '');
  const tieneTecnico = !!(b.detalle_cpu || b.detalle_monitor || b.detalle_impresora || b.detalle_scanner || b.detalle_switch || b.detalle_tecnico);
  const tabsVisibles = tieneTecnico ? TABS : TABS.filter(t => t.id !== 'tecnico');

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
          <div className="p-6 space-y-4">
            <div className="skeleton h-20 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="skeleton h-40 rounded-2xl" />
              <div className="skeleton h-40 rounded-2xl" />
            </div>
          </div>
        ) : (
          <div className="flex h-[70vh] overflow-hidden">
            {/* 1. SIDEBAR IZQUIERDO: NAVEGACIÓN (TABS) */}
            <nav className="w-56 shrink-0 bg-slate-50 dark:bg-slate-900/50 border-r border-border-light flex flex-col p-4 gap-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-faint mb-4 px-2">Detalles del Bien</p>
              {tabsVisibles.map(({ id, label, icon }) => (
                <button 
                  key={id} 
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group ${
                    tab === id 
                      ? 'bg-white dark:bg-slate-800 shadow-sm text-primary font-black border border-border-light' 
                      : 'text-muted hover:bg-white/50 hover:text-body'
                  }`}
                >
                  <Icon name={icon} className={`text-[20px] transition-colors ${tab === id ? 'text-primary' : 'text-faint group-hover:text-primary/60'}`} />
                  <span className="text-[10px] uppercase tracking-widest">{label}</span>
                </button>
              ))}

              <div className="mt-auto pt-4 border-t border-border-light/50">
                 <p className="text-[8px] font-black uppercase text-faint mb-2 px-2">Estado</p>
                 <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-light bg-white dark:bg-slate-800 shadow-sm">
                    <span className="size-2 rounded-full animate-pulse" style={{ background: fb.color }} />
                    <span className="text-[9px] font-black uppercase truncate" style={{ color: fb.color }}>{b.estado_funcionamiento_nombre || 'S/E'}</span>
                 </div>
              </div>
            </nav>

            {/* 2. CONTENIDO CENTRAL: VISTAS DINÁMICAS */}
            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white dark:bg-transparent">
              <div className="animate-in fade-in slide-in-from-right-4 duration-400">
                {tab === 'general'    && <TabGeneral    b={b} />}
                {tab === 'ubicacion'  && <TabUbicacion  b={b} />}
                {tab === 'adquisicion' && <TabAdquisicion b={b} />}
                {tab === 'tecnico'    && <TabTecnico    b={b} />}
              </div>
            </main>

            {/* 3. SIDEBAR DERECHO: RESUMEN DE ASIGNACIÓN */}
            <aside className="w-64 shrink-0 bg-slate-50/30 dark:bg-slate-900/20 border-l border-border-light p-5 space-y-6 overflow-y-auto">
               <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-faint mb-4">Ubicación y Custodio</p>
                  <div className="space-y-4">
                    {[
                      { label: 'Sede Principal', value: b.sede_nombre,      icon: 'domain' },
                      { label: 'Módulo / Piso',  value: b.modulo_nombre,    icon: 'grid_view' },
                      { label: 'Custodio',      value: b.usuario_asignado_nombre, icon: 'person' },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon name={s.icon} className="text-[14px] text-faint" />
                          <p className="text-[8px] font-black uppercase tracking-widest text-faint">{s.label}</p>
                        </div>
                        <p className="text-[10px] font-bold text-main border-l-2 border-primary/20 pl-3 ml-1.5">{s.value ?? '—'}</p>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="pt-6 border-t border-border-light">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary mb-3">IDs Inventario</p>
                  <div className="space-y-2">
                    <div className="bg-primary/5 p-2.5 rounded-xl border border-primary/10">
                      <p className="text-[7px] uppercase font-black text-primary/60 mb-0.5">Patrimonial</p>
                      <p className="text-[11px] font-mono font-bold text-primary">{b.codigo_patrimonial ?? 'S/C'}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-border-light shadow-sm">
                      <p className="text-[7px] uppercase font-black text-faint mb-0.5">Serie</p> 
                      <p className="text-[11px] font-mono font-bold text-main">{b.numero_serie ?? 'S/N'}</p>
                    </div>
                  </div>
               </div>
            </aside>
          </div>
        )}
      </ModalBody>

      <ModalFooter align="right" className="bg-slate-50 dark:bg-slate-900/80">
        <button onClick={onClose} className="px-6 py-2 text-[11px] font-black uppercase tracking-widest text-muted hover:text-body transition-colors">
            Cerrar Ficha
        </button>
        {puedeEditar && (
          <button onClick={() => { onClose(); onEditar(b); }}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-primary/20 transition-transform active:scale-95">
            <Icon name="edit" className="text-[18px]" />
            <span className="font-black uppercase tracking-widest text-[11px]">Editar Registro</span>
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}