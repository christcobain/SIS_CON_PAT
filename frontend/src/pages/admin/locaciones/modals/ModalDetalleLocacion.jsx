import { useState } from 'react';
import Can from '../../../../components/auth/Can';
import Modal from '../../../../components/modal/Modal';
import ModalHeader from '../../../../components/modal/ModalHeader';
import ModalBody from '../../../../components/modal/ModalBody';
import ModalFooter from '../../../../components/modal/ModalFooter';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const TAB_META = {
  sedes:       { label: 'Sede',      icon: 'location_city', accentBg: 'rgb(127 29 29 / 0.04)', accentBorder: 'rgb(127 29 29 / 0.1)', accentColor: 'var(--color-primary)', permission: 'ms-usuarios:locations:change_sede' },
  modulos:     { label: 'Módulo',    icon: 'widgets',       accentBg: 'rgb(124 58 237 / 0.04)', accentBorder: 'rgb(124 58 237 / 0.1)', accentColor: '#7c3aed', permission: 'ms-usuarios:locations:change_modulo' },
  ubicaciones: { label: 'Ubicación', icon: 'room',          accentBg: 'rgb(5 150 105 / 0.04)',  accentBorder: 'rgb(5 150 105 / 0.1)',  accentColor: '#059669', permission: 'ms-usuarios:locations:change_ubicacion' },
};

function fmt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'long' });
}

const InfoField = ({ label, value, icon, variant = 'default', accentColor }) => (
  <div className="flex gap-3 p-2.5 rounded-xl border border-border/40 bg-surface-alt/20 transition-all hover:bg-surface-alt">
    <div 
      className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${variant === 'primary' ? '' : 'bg-white border border-border/50'}`}
      style={variant === 'primary' ? { background: accentColor, color: '#fff' } : { color: 'var(--color-text-muted)' }}
    >
      <Icon name={icon} className="text-[16px]" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] text-faint font-black uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-[11px] font-bold text-main truncate">{value || '---'}</p>
    </div>
  </div>
);

export default function ModalDetalleLocacion({ open, onClose, activeTab, item, onEditar }) {
  if (!item) return null;
  
  const meta = TAB_META[activeTab] ?? TAB_META.sedes;

  return (
    <Modal open={open} onClose={onClose} size={activeTab === 'sedes' ? 'lg' : 'sm'}>
      <ModalHeader 
        icon={meta.icon} 
        title={`Detalle de ${meta.label}`} 
        subtitle="Consulta de información y trazabilidad de registro" 
        onClose={onClose} 
      />

      <ModalBody>
        <div className="space-y-6">
          {/* Banner de Identidad y Estado */}
          <div className="flex items-center justify-between px-5 py-4 rounded-2xl border"
            style={{ background: meta.accentBg, borderColor: meta.accentBorder }}>
            
            <div className="flex items-center gap-4">
              <div className="size-11 rounded-xl flex items-center justify-center shadow-sm border border-white"
                   style={{ background: 'var(--color-surface)', color: meta.accentColor }}>
                <Icon name={meta.icon} className="text-[24px]" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight leading-none mb-1" 
                    style={{ color: meta.accentColor }}>
                  {item.nombre}
                </h3>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-[8px] font-black text-faint uppercase mb-1.5 tracking-tighter">Estado Actual</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase border shadow-sm ${
                item.is_active 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                <span className={`size-1.5 rounded-full ${item.is_active ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                {item.is_active ? 'Activo' : 'Inactivo'} 
              </span>
            </div>
            
          </div>

          {/* Grid de Datos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 px-1">
            {activeTab === 'sedes' ? (
              <>
                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase text-faint px-1 tracking-[0.2em]">Estructura</p>
                  <InfoField label="Empresa Vinculada" value={item.empresa_nombre} icon="business" variant="primary" accentColor={meta.accentColor} />
                  <InfoField label="Dirección Física" value={item.direccion} icon="near_me" />
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase text-faint px-1 tracking-[0.2em]">Localización</p>
                  <InfoField label="Región / Provincia" value={`${item.departamento_nombre}, ${item.provincia_nombre}`} icon="public" />
                  <InfoField label="Fecha Alta" value={fmt(item.created_at)} icon="event" />
                </div>

                {item.ubicaciones?.length > 0 && (
                  <div className="col-span-1 md:col-span-2 p-4 rounded-xl border border-dashed border-border/60 bg-surface-alt/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-faint mb-3 flex items-center gap-2">
                      <Icon name="layers" className="text-[14px]" /> 
                      Áreas / Ubicaciones vinculadas ({item.ubicaciones.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.ubicaciones.map(u => (
                        <span key={u.id} className="px-2.5 py-1 rounded-lg bg-white border border-border/80 text-[10px] font-bold text-body shadow-sm">
                          {u.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase text-faint px-1 tracking-[0.2em]">Trazabilidad</p>
                  <InfoField label="Fecha de Registro" value={fmt(item.created_at)} icon="history_edu" variant="primary" accentColor={meta.accentColor} />
                  <InfoField label="Última Actualización" value={fmt(item.updated_at)} icon="sync" />
                </div>
                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase text-faint px-1 tracking-[0.2em]">Administración</p>
                  <InfoField label="ID Sistema" value={item.id.toString().padStart(5, '0')} icon="fingerprint" />
                  <InfoField label="Código Interno" value={`LOC-${item.id}`} icon="qr_code" />
                </div>

                {activeTab === 'ubicaciones' && (
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-[9px] font-black uppercase text-faint px-1 mb-2 tracking-[0.2em]">Observaciones / Descripción</p>
                    <div className="p-3 rounded-xl border border-border/60 bg-white min-h-[60px]">
                      <p className="text-[11px] text-body leading-relaxed italic">
                        {item.descripcion || 'Sin observaciones registradas.'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </ModalBody>

      <ModalFooter align="between">
        <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-faint hover:text-body transition-colors">
          Cerrar Ventana
        </button>
        
        <Can perform={meta.permission}>
          <button 
            onClick={() => { onClose(); onEditar(item); }} 
            className="btn-primary flex items-center gap-2 px-6 py-2 shadow-md transition-all active:scale-95"
          >
            <Icon name="edit" className="text-[16px]" /> 
            <span className="font-black uppercase tracking-tighter text-[10px]">Modificar {meta.label}</span>
          </button>
        </Can>
      </ModalFooter>
    </Modal>
  );
}