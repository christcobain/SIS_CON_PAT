import { useState } from 'react';
import EmptyState from '../../../../components/feedback/EmptyState';
import ErrorState  from '../../../../components/feedback/ErrorState';
import Can from '../../../../components/auth/Can'; // Importamos Can

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const getEstadoStyle = (activo) => {
  return activo 
    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
    : 'bg-slate-500/10 text-slate-500 border-slate-500/20';
};

// ── Avatar con iniciales ───────────────────────────────────────────────────────
function Avatar({ nombres, apellidos }) {
  const ini = `${nombres?.[0] ?? ''}${apellidos?.[0] ?? ''}`.toUpperCase() || '?';
  return (
    <div className="size-9 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white bg-primary">
      {ini}
    </div>
  );
}

// ── Fila de usuario ────────────────────────────────────────────────────────────
function FilaUsuario({ usuario, onVerDetalle, onEditar, onToggleEstado }) {
  const activo = usuario.is_active;
  const sedes  = usuario.sedes ?? [];

  return (
    <tr className="hover:bg-surface-alt/70 transition-colors border-b border-border group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar nombres={usuario.first_name} apellidos={usuario.last_name} />
          <div className="min-w-0">
            <p className="text-xs font-bold text-main truncate leading-tight">
              {usuario.first_name} {usuario.last_name}
            </p>
            <p className="text-[10px] font-mono text-muted mt-0.5">DNI: {usuario.dni}</p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <p className="text-[10px] font-medium first-line:text-body uppercase tracking-tight truncate">
          {usuario.cargo || 'No asignado'}
        </p>
      </td>

      <td className="px-6 py-4">
        <RolBadge rol={usuario.role} />
      </td>

      <td className="px-6 py-4">
        {sedes.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {sedes.map((s) => (
              <span key={s.id} className="text-[10px]  font-medium  text-body uppercase ">
                • {s.nombre}
              </span>
            ))}
            {sedes.length > 2 && (
              <span className="text-[9px] font-black text-primary mt-0.5 ml-2">+{sedes.length - 2} MÁS</span>
            )}
          </div>
        ) : (
          <span className="text-faint text-xs">—</span>
        )}
      </td>

      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getEstadoStyle(activo)}`}>
          {activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onVerDetalle(usuario)} className="size-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary" title="Ver detalle">
            <Icon name="visibility" className="text-[18px]" />
          </button>
          
          {/* Solo usuarios con change_user pueden ver Editar y Toggle */}
          <Can perform="ms-usuarios:users:change_user">
            <button onClick={() => onEditar(usuario)} className="size-8 flex items-center justify-center rounded-lg hover:bg-amber-500/10 text-amber-600" title="Editar">
              <Icon name="edit" className="text-[18px]" />
            </button>
            
            <button onClick={() => onToggleEstado(usuario)} className={`size-8 flex items-center justify-center rounded-lg transition-colors ${activo ? 'hover:bg-red-500/10 text-red-500' : 'hover:bg-emerald-500/10 text-emerald-500'}`} title={activo ? 'Desactivar' : 'Activar'}>
              <Icon name={activo ? 'person_off' : 'person_check'} className="text-[18px]" />
            </button>
          </Can>
        </div>
      </td>
    </tr>
  );
}

// ── Fila de dependencia ────────────────────────────────────────────────────────
function FilaDependencia({ dep, onVerDetalle, onEditar, onToggleEstado }) {
  return (
    <tr className="hover:bg-surface-alt/70 transition-colors border-b border-border group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
            <Icon name="account_tree" className="text-[20px] text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-main truncate">{dep.nombre}</p>
            <p className="text-[10px] text-muted font-mono mt-0.5 uppercase tracking-tighter">Dependencia</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4" colSpan={2}>
        {dep.codigo ? (
          <span className="text-[10px] font-mono font-black px-2 py-1 rounded bg-surface-alt border border-border text-body">
            {dep.codigo}
          </span>
        ) : <span className="text-faint">—</span>}
      </td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getEstadoStyle(dep.is_active)}`}>
          {dep.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onVerDetalle(dep)} className="size-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary" title="Ver detalle">
            <Icon name="visibility" className="text-[18px]" />
          </button>

          {/* Solo usuarios con change_dependencia pueden ver Editar y Toggle */}
          <Can perform="ms-usuarios:users:change_dependencia">
            <button onClick={() => onEditar(dep)} className="size-8 flex items-center justify-center rounded-lg hover:bg-amber-500/10 text-amber-600" title="Editar">
              <Icon name="edit" className="text-[18px]" />
            </button>
            <button onClick={() => onToggleEstado(dep)} className={`size-8 flex items-center justify-center rounded-lg ${dep.is_active ? 'hover:bg-red-500/10 text-red-500' : 'hover:bg-emerald-500/10 text-emerald-500'}`} title={dep.is_active ? 'Desactivar' : 'Activar'}>
              <Icon name={dep.is_active ? 'toggle_off' : 'toggle_on'} className="text-[18px]" />
            </button>
          </Can>
        </div>
      </td>
    </tr>
  );
}

// ── Tabla principal ────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function UsuariosTabla({
  activeTab, items, loading, error, refetch,
  onVerDetalle, onEditar, onToggleEstado,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagActual = Math.min(page, totalPages);
  const slice = items.slice((pagActual - 1) * pageSize, pagActual * pageSize);

  const esDep = activeTab === 'dependencias';
  const cols = esDep 
    ? ['Dependencia', 'Código', '', 'Estado', 'Acciones'] 
    : ['Usuario', 'Cargo / Oficina', 'Rol de Acceso', 'Sedes', 'Estado', 'Acciones'];

  if (error) return (
    <div className="card p-12 text-center border-red-100">
      <ErrorState message={error} onRetry={refetch} />
    </div>
  );

  return (
    <div className="table-wrapper border border-border rounded-2xl overflow-hidden bg-surface shadow-sm">
      <div className="table-container overflow-x-auto">
        <table className="table w-full border-collapse border-spacing-0">
          <thead>
            <tr className="bg-surface-alt border-b border-border">
              {cols.map((h, i) => (
                <th key={h} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest text-faint ${i === cols.length - 1 ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
               Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                   {cols.map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-24" /></td>
                  ))}
                </tr>
              ))
            ) : slice.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="px-6 py-16 text-center">
                  <EmptyState icon={esDep ? 'account_tree' : 'group'} title={`Sin ${esDep ? 'dependencias' : 'usuarios'} registrados`} />
                </td>
              </tr>
            ) : esDep ? (
              slice.map((dep) => <FilaDependencia key={dep.id} dep={dep} onVerDetalle={onVerDetalle} onEditar={onEditar} onToggleEstado={onToggleEstado} />)
            ) : (
              slice.map((usr) => <FilaUsuario key={usr.id ?? usr.username} usuario={usr} onVerDetalle={onVerDetalle} onEditar={onEditar} onToggleEstado={onToggleEstado} />)
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer px-6 py-4 bg-surface-alt/50 border-t border-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <p className="text-xs text-faint">
            Total: <b className="text-main font-black">{totalItems}</b> registros
          </p>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Filas:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="text-xs font-bold dark:bg-slate-800 border border-border rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  {i > 0 && arr[i-1] !== pg - 1 && <span className="text-muted text-xs mx-0.5">...</span>}
                  <button
                    onClick={() => setPage(pg)}
                    className={`min-size-8 px-2.5 flex items-center justify-center rounded-lg font-black text-xs transition-all
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

// ── Badge de rol (Sin cambios) ────────────────────────────────────────────────
function RolBadge({ rol }) {
  const rolKey = typeof rol === 'object' && rol !== null ? rol.name : rol;
  const cfg = {
    SYSADMIN:      { cls: 'bg-primary/10 text-primary-hover ',     label: 'SysAdmin'      },
    COORDSISTEMA:  { cls: 'bg-blue-500/10 text-blue-600',   label: 'Coord. Sistema' },
    ADMINSEDE:      { cls: 'bg-purple-500/10 text-purple-600', label: 'Admin Sede'     },
    ASISTSISTEMA:  { cls: 'bg-amber-500/10 text-amber-600', label: 'Asist. Sistema' },
    SEGURSEDE:     { cls: 'bg-orange-500/10 text-orange-600', label: 'Segur. Sede'    },
    USUARIOCORTE:     { cls: 'bg-slate-500/10 text-slate-500', label: 'Usuario Final'  },
  };
  const c = cfg[rolKey] ?? { cls: 'bg-slate-500/10 text-slate-500', label: rolKey ?? '—' };
  return (
    <span className={`badge px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-current/10 ${c.cls}`}>
      {c.label}
    </span>
  );
}