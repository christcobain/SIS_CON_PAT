import React from 'react';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

function FiltroChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface-alt/50 text-[11px] font-bold text-body animate-in fade-in zoom-in duration-200">
      <span className="text-faint text-[10px] uppercase tracking-wider font-black">Filtro:</span>
      <span className="text-main">{label}</span>
      <button
        onClick={onRemove}
        className="ml-1 size-4 flex items-center justify-center rounded-full hover:bg-red-500 hover:text-white transition-all"
      >
        <Icon name="close" className="text-[12px]" />
      </button>
    </span>
  );
}

// ── Opciones por tab ──────────────────────────────────────────────────────────

const ESTADO_SESION_OPTS = [
  { value: '',        label: 'TODOS'    },
  { value: 'active',  label: 'ACTIVA'   },
  { value: 'logout',  label: 'CERRADA'  },
  { value: 'expired', label: 'EXPIRADA' },
];

const RESULTADO_OPTS = [
  { value: '',      label: 'TODOS'    },
  { value: 'true',  label: 'EXITOSOS' },
  { value: 'false', label: 'FALLIDOS' },
];

const ATTEMPT_TYPE_OPTS = [
  { value: '',                      label: 'TODOS LOS TIPOS'      },
  { value: 'success',               label: 'EXITOSO'              },
  { value: 'invalid_password',      label: 'CLAVE INVÁLIDA'       },
  { value: 'user_not_found',        label: 'USUARIO NO ENCONTRADO'},
  { value: 'user_inactive',         label: 'USUARIO INACTIVO'     },
  { value: 'password_expired',      label: 'CLAVE EXPIRADA'       },
  { value: 'locked',                label: 'CUENTA BLOQUEADA'     },
  { value: 'force_password_change', label: 'CAMBIO REQUERIDO'     },
  { value: 'other',                 label: 'OTRO ERROR'           },
];

const ESTADO_CRED_OPTS = [
  { value: '',       label: 'TODOS'      },
  { value: 'active', label: 'ACTIVAS'    },
  { value: 'locked', label: 'BLOQUEADAS' },
];

const MULTISESION_OPTS = [
  { value: '',      label: 'MULTI-SESIÓN'  },
  { value: 'true',  label: 'HABILITADO'    },
  { value: 'false', label: 'DESHABILITADO' },
];

const ESTADO_POL_OPTS = [
  { value: '',      label: 'TODAS'     },
  { value: 'true',  label: 'ACTIVAS'   },
  { value: 'false', label: 'INACTIVAS' },
];

// ── Labels para chips ─────────────────────────────────────────────────────────
const CHIP_LABELS = {
  status:      { active: 'Sesión activa', logout: 'Sesión cerrada', expired: 'Sesión expirada' },
  exitoso:     { true: 'Solo exitosos', false: 'Solo fallidos' },
  tipo: {
    success: 'Exitoso', invalid_password: 'Clave inválida', user_not_found: 'No encontrado',
    user_inactive: 'Inactivo', password_expired: 'Clave expirada',
    locked: 'Cuenta bloqueada', force_password_change: 'Cambio req.', other: 'Otro error',
  },
  estadoCred:  { active: 'Cred. activas', locked: 'Cred. bloqueadas' },
  multisesion: { true: 'Multi-sesión ON', false: 'Multi-sesión OFF' },
  estadoPol:   { true: 'Políticas activas', false: 'Políticas inactivas' },
};

// ── Select reutilizable (mismo estilo original) ───────────────────────────────
function FSelect({ value, onChange, label, opts }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-faint uppercase tracking-tighter ml-1">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-3 rounded-xl border border-border bg-surface-alt/50 text-[11px] font-black uppercase tracking-tighter text-main outline-none focus:border-primary transition-all cursor-pointer"
      >
        {opts.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function SeguridadFiltros({ filtros, onChange, activeTab }) {
  const {
    dni = '', status = '', exitoso = '', tipo = '',
    estadoCred = '', multisesion = '', estadoPol = '',
  } = filtros;

  const limpiarFiltros = () =>
    ['dni', 'status', 'exitoso', 'tipo', 'estadoCred', 'multisesion', 'estadoPol']
      .forEach(k => onChange(k, ''));

  const hayFiltros = dni || status || exitoso || tipo || estadoCred || multisesion || estadoPol;

  // ── Metadatos del input por tab ───────────────────────────────────────────
  const inputMeta = {
    sesiones:     { label: 'DNI / Dirección IP',        placeholder: 'Buscar por número de documento o IP...',           icon: 'badge'         },
    historial:    { label: 'DNI / Nombres / IP',        placeholder: 'Buscar por DNI, nombres, apellidos o IP...',       icon: 'badge'         },
    intentos:     { label: 'DNI / Dirección IP',        placeholder: 'Buscar por número de documento o IP...',           icon: 'badge'         },
    credenciales: { label: 'DNI / Nombre del usuario',  placeholder: 'Buscar por número de documento o nombre...',       icon: 'badge'         },
    politicas:    { label: 'Nombre de la política',     placeholder: 'Buscar política por nombre...',                    icon: 'policy'        },
  }[activeTab] ?? { label: 'Identificación', placeholder: 'Buscar...', icon: 'badge' };

  // ── Selectores según tab ──────────────────────────────────────────────────
  const renderSelectores = () => {
    switch (activeTab) {
      case 'sesiones':
        return (
          <FSelect value={status} onChange={v => onChange('status', v)}
            label="Estado Sesión" opts={ESTADO_SESION_OPTS} />
        );

      case 'historial':
        return (
          <FSelect value={status} onChange={v => onChange('status', v)}
            label="Estado Sesión" opts={ESTADO_SESION_OPTS} />
        );

      case 'intentos':
        return (
          <>
            <FSelect value={exitoso} onChange={v => onChange('exitoso', v)}
              label="Resultado" opts={RESULTADO_OPTS} />
            <FSelect value={tipo} onChange={v => onChange('tipo', v)}
              label="Operación" opts={ATTEMPT_TYPE_OPTS} />
          </>
        );

      case 'credenciales':
        return (
          <>
            <FSelect value={estadoCred} onChange={v => onChange('estadoCred', v)}
              label="Restricción" opts={ESTADO_CRED_OPTS} />
            <FSelect value={multisesion} onChange={v => onChange('multisesion', v)}
              label="Multi-Sesión" opts={MULTISESION_OPTS} />
          </>
        );

      case 'politicas':
        return (
          <FSelect value={estadoPol} onChange={v => onChange('estadoPol', v)}
            label="Estado Política" opts={ESTADO_POL_OPTS} />
        );

      default:
        return null;
    }
  };

  // Cuántos selectores se renderizan (para el hueco de relleno)
  const numSelectores = { sesiones: 1, historial: 1, intentos: 2, credenciales: 2, politicas: 1 }[activeTab] ?? 0;

  return (
    <div className="card p-6 mb-6 border-none shadow-sm bg-surface dark:bg-slate-900">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">

        {/* Input principal — 4 columnas */}
        <div className="md:col-span-4 space-y-2">
          <label className="text-[10px] font-black text-faint uppercase tracking-[0.2em] ml-1">
            {inputMeta.label}
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none transition-colors">
              <Icon name={inputMeta.icon} className={`text-[18px] ${dni ? 'text-primary' : 'text-faint'}`} />
            </div>
            <input
              type="text"
              value={dni}
              onChange={e => onChange('dni', e.target.value)}
              placeholder={inputMeta.placeholder}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-surface-alt/50 text-xs font-bold text-main placeholder:text-faint/60 focus:bg-surface focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
            />
            {dni && (
              <button
                onClick={() => onChange('dni', '')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-faint hover:text-red-500 transition-colors"
              >
                <Icon name="backspace" className="text-[16px]" />
              </button>
            )}
          </div>
        </div>

        {/* Selectores + botón limpiar — 8 columnas, grid de 4 */}
        <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-3">

          {renderSelectores()}

          {/* Hueco de relleno cuando hay menos de 2 selectores */}
          {numSelectores < 2 && <div className="hidden md:block" />}

          {/* Hueco extra para politicas (1 selector → 2 huecos → limpiar al final) */}
          {numSelectores < 1 && <div className="hidden md:block" />}

          {/* Botón Limpiar */}
          <div className="flex items-end pb-0.5">
            <button
              onClick={limpiarFiltros}
              disabled={!hayFiltros}
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest
                ${hayFiltros
                  ? 'bg-red-500/5 border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20'
                  : 'bg-surface border-border text-faint cursor-not-allowed opacity-40'}`}
            >
              <Icon name="filter_alt_off" className="text-[18px]" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Chips de filtros activos */}
      {hayFiltros && (
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-border/60">
          <span className="text-[9px] font-black text-faint uppercase tracking-widest mr-2">Filtrando por:</span>

          {dni && (
            <FiltroChip label={`"${dni}"`} onRemove={() => onChange('dni', '')} />
          )}
          {status && (
            <FiltroChip label={CHIP_LABELS.status[status] ?? status} onRemove={() => onChange('status', '')} />
          )}
          {exitoso && (
            <FiltroChip label={CHIP_LABELS.exitoso[exitoso] ?? exitoso} onRemove={() => onChange('exitoso', '')} />
          )}
          {tipo && (
            <FiltroChip label={CHIP_LABELS.tipo[tipo] ?? tipo} onRemove={() => onChange('tipo', '')} />
          )}
          {estadoCred && (
            <FiltroChip label={CHIP_LABELS.estadoCred[estadoCred] ?? estadoCred} onRemove={() => onChange('estadoCred', '')} />
          )}
          {multisesion && (
            <FiltroChip label={CHIP_LABELS.multisesion[multisesion] ?? multisesion} onRemove={() => onChange('multisesion', '')} />
          )}
          {estadoPol && (
            <FiltroChip label={CHIP_LABELS.estadoPol[estadoPol] ?? estadoPol} onRemove={() => onChange('estadoPol', '')} />
          )}
        </div>
      )}
    </div>
  );
}