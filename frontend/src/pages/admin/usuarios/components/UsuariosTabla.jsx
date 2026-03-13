import { useState } from 'react';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

// ── Avatar con iniciales ───────────────────────────────────────────────────────
function Avatar({ nombres, apellidos }) {
  const ini = `${nombres?.[0] ?? ''}${apellidos?.[0] ?? ''}`.toUpperCase() || '?';
  return (
    <div className="size-9 rounded-full flex items-center justify-center shrink-0
                    text-xs font-black text-white"
         style={{ background: 'var(--color-primary)' }}>
      {ini}
    </div>
  );
}

// ── Fila de usuario ────────────────────────────────────────────────────────────
function FilaUsuario({ usuario, onVerDetalle, onEditar, onToggleEstado }) {
  const activo = usuario.is_active;
  const sedes  = usuario.sedes ?? [];

  return (
    <tr className="table-row transition-colors">
      {/* Usuario */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar nombres={usuario.first_name} apellidos={usuario.last_name} />
          <div className="min-w-0">
            <p className="text-sm font-black leading-tight truncate"
               style={{ color: 'var(--color-text-primary)' }}>
              {usuario.first_name} {usuario.last_name}
            </p>
            <p className="text-[11px] font-mono mt-0.5"
               style={{ color: 'var(--color-text-muted)' }}>
              DNI: {usuario.dni}
            </p>
            {usuario.cargo && (
              <p className="text-[10px] mt-0.5 truncate"
                 style={{ color: 'var(--color-text-faint)' }}>
                {usuario.cargo}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Rol */}
      <td className="px-5 py-3.5">
        <RolBadge rol={usuario.role} />
      </td>

      {/* Sedes asignadas */}
      <td className="px-5 py-3.5">
        {sedes.length > 0 ? (
          <div className="flex flex-col gap-1">
            {sedes.slice(0, 2).map((s) => (
              <span key={s.id} className="text-xs" style={{ color: 'var(--color-text-body)' }}>
                {s.nombre}
              </span>
            ))}
            {sedes.length > 2 && (
              <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
                +{sedes.length - 2} más
              </span>
            )}
          </div>
        ) : (
          <span style={{ color: 'var(--color-text-faint)' }} className="text-sm">—</span>
        )}
      </td>

      {/* Estado */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${activo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          <span className={`text-xs font-bold ${activo ? 'text-emerald-600' : ''}`}
                style={!activo ? { color: 'var(--color-text-muted)' } : {}}>
            {activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </td>

      {/* Acciones */}
      <td className="px-5 py-3.5 text-right">
        <div className="flex justify-end gap-1">
          <button onClick={() => onEditar(usuario)}
            className="btn-icon p-1.5"
            title="Editar usuario">
            <Icon name="edit" className="text-[18px]" />
          </button>
          <button onClick={() => onVerDetalle(usuario)}
            className="btn-icon p-1.5"
            title="Ver detalle">
            <Icon name="visibility" className="text-[18px]" />
          </button>
          <button
            onClick={() => onToggleEstado(usuario)}
            className="p-1.5 rounded-lg transition-colors"
            title={activo ? 'Desactivar' : 'Activar'}
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = activo ? '#ef4444' : '#22c55e';
              e.currentTarget.style.background = activo ? '#fef2f2' : '#f0fdf4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-muted)';
              e.currentTarget.style.background = '';
            }}
          >
            <Icon name={activo ? 'person_off' : 'person_check'} className="text-[18px]" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Fila de dependencia ────────────────────────────────────────────────────────
function FilaDependencia({ dep, onVerDetalle, onEditar, onToggleEstado }) {
  return (
    <tr className="table-row transition-colors">
      {/* Nombre */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl flex items-center justify-center shrink-0"
               style={{ background: 'var(--color-border-light)' }}>
            <Icon name="account_tree" className="text-[18px]"
                  style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate"
               style={{ color: 'var(--color-text-primary)' }}>
              {dep.nombre}
            </p>
            {dep.codigo && (
              <p className="text-[10px] font-mono mt-0.5"
                 style={{ color: 'var(--color-text-muted)' }}>
                Cód: {dep.codigo}
              </p>
            )}
          </div>
        </div>
      </td>
      {/* Código */}
      <td className="px-5 py-3.5">
        {dep.codigo
          ? <span className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                  style={{ background: 'var(--color-border-light)',
                           color: 'var(--color-text-body)' }}>
              {dep.codigo}
            </span>
          : <span style={{ color: 'var(--color-text-faint)' }}>—</span>
        }
      </td>
      {/* Estado */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${dep.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          <span className={`text-xs font-bold ${dep.is_active ? 'text-emerald-600' : ''}`}
                style={!dep.is_active ? { color: 'var(--color-text-muted)' } : {}}>
            {dep.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </td>
      {/* Fecha */}
      <td className="px-5 py-3.5">
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {dep.created_at
            ? new Date(dep.created_at).toLocaleDateString('es-PE',
                { day: '2-digit', month: 'short', year: 'numeric' })
            : '—'}
        </p>
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex justify-end gap-1">
          <button onClick={() => onEditar(dep)} className="btn-icon p-1.5" title="Editar">
            <Icon name="edit" className="text-[18px]" />
          </button>
          <button onClick={() => onVerDetalle(dep)} className="btn-icon p-1.5" title="Ver detalle">
            <Icon name="visibility" className="text-[18px]" />
          </button>
          <button onClick={() => onToggleEstado(dep)}
            className="p-1.5 rounded-lg transition-colors"
            title={dep.is_active ? 'Desactivar' : 'Activar'}
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = dep.is_active ? '#ef4444' : '#22c55e';
              e.currentTarget.style.background = dep.is_active ? '#fef2f2' : '#f0fdf4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-muted)';
              e.currentTarget.style.background = '';
            }}
          >
            <Icon name={dep.is_active ? 'toggle_off' : 'toggle_on'} className="text-[18px]" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function SkeletonRows({ cols }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 rounded animate-pulse"
               style={{ background: 'var(--color-border-light)', width: j === 0 ? '70%' : '50%' }} />
        </td>
      ))}
    </tr>
  ));
}

// ── Tabla principal ────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function UsuariosTabla({
  activeTab, items, loading, error, refetch,
  onVerDetalle, onEditar, onToggleEstado,
}) {
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagActual  = Math.min(page, totalPages);
  const slice      = items.slice((pagActual - 1) * pageSize, pagActual * pageSize);

  const esDep   = activeTab === 'dependencias';
  const colsNum = esDep ? 5 : 5;

  // Columnas por tab
  const colsUser = ['Usuario', 'Rol', 'Sedes Asignadas', 'Estado', ''];
  const colsDep  = ['Dependencia', 'Código', 'Estado', 'Registrado', ''];
  const cols     = esDep ? colsDep : colsUser;

  // Error
  if (error) {
    return (
      <div className="card p-10 text-center">
        <Icon name="error_outline" className="text-[40px] block mb-2 text-red-400" />
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
        <button onClick={refetch} className="btn-secondary mt-4">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="table-wrapper overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table w-full text-left">
          <thead>
            <tr>
              {cols.map((h) => (
                <th key={h}
                    className="px-5 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                    style={{ color: 'var(--color-text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={colsNum} />
            ) : slice.length === 0 ? (
              <tr>
                <td colSpan={colsNum} className="px-5 py-16 text-center">
                  <Icon name={esDep ? 'account_tree' : 'group'}
                        className="text-[44px] block mb-3"
                        style={{ color: 'var(--color-border)' }} />
                  <p className="text-sm font-semibold"
                     style={{ color: 'var(--color-text-muted)' }}>
                    Sin {esDep ? 'dependencias' : 'usuarios'} registrados
                  </p>
                </td>
              </tr>
            ) : esDep ? (
              slice.map((dep) => (
                <FilaDependencia key={dep.id} dep={dep}
                  onVerDetalle={onVerDetalle} onEditar={onEditar}
                  onToggleEstado={onToggleEstado} />
              ))
            ) : (
              slice.map((usr) => (
                <FilaUsuario key={usr.id ?? usr.username} usuario={usr}
                  onVerDetalle={onVerDetalle} onEditar={onEditar}
                  onToggleEstado={onToggleEstado} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer paginación ── */}
      <div className="table-footer flex items-center justify-between flex-wrap gap-3">
        {/* Contador y selector de filas */}
        <div className="flex items-center gap-3">
          <span className="table-count">
            {loading ? '…' : `${totalItems} ${esDep ? 'dependencia' : 'usuario'}${totalItems !== 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}>
              Filas:
            </span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="text-xs rounded-lg px-2 py-1 font-bold"
              style={{
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-body)',
              }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Paginación */}
        <div className="pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagActual === 1}
            className="page-btn page-btn-inactive disabled:opacity-40"
          >
            <Icon name="chevron_left" className="text-[18px]" />
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pg = i + 1;
            if (totalPages > 5 && pagActual > 3) pg = pagActual - 2 + i;
            if (pg > totalPages) return null;
            return (
              <button key={pg}
                onClick={() => setPage(pg)}
                className={pagActual === pg ? 'page-btn page-btn-active' : 'page-btn page-btn-inactive'}>
                {pg}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pagActual === totalPages}
            className="page-btn page-btn-inactive disabled:opacity-40"
          >
            <Icon name="chevron_right" className="text-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Badge de rol ───────────────────────────────────────────────────────────────
// rol puede llegar como string (legacy) o como objeto {id, name, permissions}
function RolBadge({ rol }) {
  const rolKey = typeof rol === 'object' && rol !== null ? rol.name : rol;
  const cfg = {
    SYSADMIN:      { cls: 'bg-primary/10 text-primary',    label: 'SysAdmin'       },
    COORDSISTEMA:  { cls: 'bg-blue-100 text-blue-700',     label: 'Coord. Sistema' },
    ADMINSEDE:     { cls: 'bg-purple-100 text-purple-700', label: 'Admin Sede'     },
    ASISTSISTEMA:  { cls: 'bg-amber-100 text-amber-700',   label: 'Asist. Sistema' },
    SEGURSEDE:     { cls: 'bg-orange-100 text-orange-700', label: 'Segur. Sede'    },
    USUARIOFINAL:  { cls: 'bg-slate-100 text-slate-600',   label: 'Usuario Final'  },
  };
  const c = cfg[rolKey] ?? { cls: 'bg-slate-100 text-slate-500', label: rolKey ?? '—' };
  return (
    <span className={`badge text-[10px] font-black px-2.5 py-1 rounded-full ${c.cls}`}>
      {c.label}
    </span>
  );
}