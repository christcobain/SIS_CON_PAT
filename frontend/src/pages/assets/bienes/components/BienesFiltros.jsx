import { useMemo, useState, useRef, useEffect } from 'react';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

function FiltroChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold"
      style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}>
      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>Filtro:</span>
      <span style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      <button onClick={onRemove}
        className="ml-1 size-4 flex items-center justify-center rounded-full transition-all"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
        <Icon name="close" className="text-[12px]" />
      </button>
    </span>
  );
}

function SearchSelect({ placeholder, items = [], labelKey = 'nombre', valueKey = 'id', value, onSelect, onClear }) {
  const [query,   setQuery]   = useState('');
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);
  const [coords,  setCoords]  = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const inputRef   = useRef(null);
  const dropRef    = useRef(null);
  const selected = items.find(i => String(i[valueKey]) === String(value));

  const calcCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
  };

  const openDropdown = () => { calcCoords(); setOpen(true); inputRef.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    const onDown = e => {
      if (triggerRef.current?.contains(e.target)) return;
      if (dropRef.current?.contains(e.target)) return;
      setOpen(false); setQuery('');
    };
    const onScroll = () => { calcCoords(); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('scroll', onScroll, true); };
  }, [open]);

  const filtrados = useMemo(() => {
    if (!query.trim()) return items.slice(0, 40);
    const q = query.trim().toLowerCase();
    return items.filter(i => String(i[labelKey]).toLowerCase().includes(q)).slice(0, 40);
  }, [items, query, labelKey]);

  const handleSelect = item => { onSelect(item[valueKey]); setQuery(''); setOpen(false); };
  const handleClear  = e => { e.stopPropagation(); onClear(); setQuery(''); setOpen(false); };

  return (
    <>
      <div ref={triggerRef}
        className="flex items-center rounded-xl transition-all cursor-text"
        style={{
          background: 'var(--color-surface)',
          border: `1px solid ${focused || open ? 'var(--color-primary)' : 'var(--color-border)'}`,
          padding: '0 10px', height: 41,
          boxShadow: (focused || open) ? '0 0 0 3px rgb(127 29 29 / 0.1)' : 'none',
        }}
        onClick={openDropdown}
      >
        <Icon name="search" className="text-[16px] shrink-0 mr-2"
          style={{ color: (open || value) ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
        {selected && !open ? (
          <span className="flex-1 text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {selected[labelKey]}
          </span>
        ) : (
          <input ref={inputRef} type="text" value={query}
            onChange={e => { setQuery(e.target.value); if (!open) { calcCoords(); setOpen(true); } }}
            onFocus={() => { setFocused(true); calcCoords(); setOpen(true); }}
            onBlur={() => setFocused(false)}
            placeholder={selected ? '' : placeholder}
            className="flex-1 text-xs bg-transparent outline-none"
            style={{ color: 'var(--color-text-primary)', minWidth: 0 }} />
        )}
        {value && (
          <button onMouseDown={handleClear}
            className="ml-1 shrink-0 size-5 flex items-center justify-center rounded-full transition-all"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
            <Icon name="close" className="text-[13px]" />
          </button>
        )}
        <Icon name="arrow_drop_down" className="text-[20px] shrink-0"
          style={{ color: 'var(--color-text-faint)', transform: open ? 'rotate(180deg)' : '', transition: 'transform .2s' }} />
      </div>

      {open && (
        <div ref={dropRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 9999,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgb(0 0 0 / 0.15)',
            maxHeight: 240,
            overflow: 'hidden',
          }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
            {filtrados.length === 0 ? (
              <p className="text-xs px-3 py-3 italic" style={{ color: 'var(--color-text-muted)' }}>Sin resultados</p>
            ) : filtrados.map(item => (
              <button key={item[valueKey]}
                onMouseDown={() => handleSelect(item)}
                className="w-full text-left px-3 py-2.5 text-xs transition-all"
                style={{
                  background: String(item[valueKey]) === String(value) ? 'rgb(127 29 29 / 0.08)' : 'transparent',
                  color: String(item[valueKey]) === String(value) ? 'var(--color-primary)' : 'var(--color-text-body)',
                  fontWeight: String(item[valueKey]) === String(value) ? 700 : 400,
                }}
                onMouseEnter={e => { if (String(item[valueKey]) !== String(value)) e.currentTarget.style.background = 'var(--color-surface-alt)'; }}
                onMouseLeave={e => { if (String(item[valueKey]) !== String(value)) e.currentTarget.style.background = 'transparent'; }}>
                {item[labelKey]}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function BienesFiltros({
  filtros, onFiltroChange, onLimpiar,
  sedes = [], modulos = [], tiposBien = [], estadosFuncionamiento = [], estadosBien = [],
}) {
  const hayFiltros = filtros.search || filtros.sede_id || filtros.modulo_id
    || filtros.custodio_q || filtros.tipo_bien_id
    || filtros.estado_bien_id || filtros.estado_funcionamiento_id;

  const sedeSel    = sedes.find(s => String(s.id) === String(filtros.sede_id));
  const tipoSel    = tiposBien.find(t => String(t.id) === String(filtros.tipo_bien_id));
  const estBienSel = estadosBien.find(e => String(e.id) === String(filtros.estado_bien_id));
  const estFuncSel = estadosFuncionamiento.find(e => String(e.id) === String(filtros.estado_funcionamiento_id));

  return (
    <div className="card shadow-sm overflow-visible">
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">

          {/* Búsqueda libre */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 block"
              style={{ color: 'var(--color-text-muted)' }}>Búsqueda</label>
            <div className="relative">
              <Icon name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none"
                style={{ color: filtros.search ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
              <input type="text" value={filtros.search || ''}
                onChange={e => onFiltroChange('search', e.target.value)}
                placeholder="Serie, código, modelo..."
                className="form-input text-xs"
                style={{ paddingLeft: 40, height: 41 }} />
              {filtros.search && (
                <button onClick={() => onFiltroChange('search', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                  style={{ color: 'var(--color-text-muted)' }}>
                  <Icon name="backspace" className="text-[16px]" />
                </button>
              )}
            </div>
          </div>

          {/* Sede — SearchSelect */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 block"
              style={{ color: 'var(--color-text-muted)' }}>Sede</label>
            <SearchSelect
              placeholder="Buscar sede..."
              items={sedes}
              value={filtros.sede_id}
              onSelect={id => onFiltroChange('sede_id', id)}
              onClear={() => onFiltroChange('sede_id', '')}
            />
          </div>

          {/* Custodio */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 block"
              style={{ color: 'var(--color-text-muted)' }}>Custodio</label>
            <div className="relative">
              <Icon name="person_search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[17px] pointer-events-none"
                style={{ color: filtros.custodio_q ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
              <input type="text" value={filtros.custodio_q || ''}
                onChange={e => onFiltroChange('custodio_q', e.target.value)}
                placeholder="Nombre del custodio..."
                className="form-input text-xs"
                style={{ paddingLeft: 36, height: 41 }} />
              {filtros.custodio_q && (
                <button onClick={() => onFiltroChange('custodio_q', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: 'var(--color-text-muted)' }}>
                  <Icon name="close" className="text-[15px]" />
                </button>
              )}
            </div>
          </div>

          {/* Tipo de bien — SearchSelect */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 block"
              style={{ color: 'var(--color-text-muted)' }}>Tipo de bien</label>
            <SearchSelect
              placeholder="Buscar tipo..."
              items={tiposBien}
              value={filtros.tipo_bien_id}
              onSelect={id => onFiltroChange('tipo_bien_id', id)}
              onClear={() => onFiltroChange('tipo_bien_id', '')}
            />
          </div>

          {/* Estado del bien — SearchSelect */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 block"
              style={{ color: 'var(--color-text-muted)' }}>Estado bien</label>
            <SearchSelect
              placeholder="Estado físico..."
              items={estadosBien}
              value={filtros.estado_bien_id}
              onSelect={id => onFiltroChange('estado_bien_id', id)}
              onClear={() => onFiltroChange('estado_bien_id', '')}
            />
          </div>

          {/* Estado de funcionamiento — SearchSelect */}
          <div className="md:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 block"
              style={{ color: 'var(--color-text-muted)' }}>Func.</label>
            <SearchSelect
              placeholder="Operativo..."
              items={estadosFuncionamiento}
              value={filtros.estado_funcionamiento_id}
              onSelect={id => onFiltroChange('estado_funcionamiento_id', id)}
              onClear={() => onFiltroChange('estado_funcionamiento_id', '')}
            />
          </div>

          {/* Limpiar */}
          <div className="md:col-span-1 flex items-end">
            <button onClick={onLimpiar} disabled={!hayFiltros} title="Limpiar filtros"
              className="flex items-center justify-center w-full rounded-xl border transition-all duration-200 cursor-pointer"
              style={{
                height: 41,
                background: hayFiltros ? 'rgb(220 38 38 / 0.05)' : 'var(--color-surface)',
                border: `1px solid ${hayFiltros ? 'rgb(220 38 38 / 0.2)' : 'var(--color-border)'}`,
                color: hayFiltros ? '#dc2626' : 'var(--color-text-faint)',
                opacity: hayFiltros ? 1 : 0.45,
                cursor: hayFiltros ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={e => { if (hayFiltros) { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={e => { if (hayFiltros) { e.currentTarget.style.background = 'rgb(220 38 38 / 0.05)'; e.currentTarget.style.color = '#dc2626'; } }}>
              <Icon name="filter_alt_off" className="text-[20px]" />
            </button>
          </div>
        </div>

        {/* Chips de filtros activos */}
        {hayFiltros && (
          <div className="flex flex-wrap items-center gap-2 pt-3"
            style={{ borderTop: '1px solid var(--color-border-light)' }}>
            <span className="text-[9px] font-black uppercase tracking-widest mr-1"
              style={{ color: 'var(--color-text-faint)' }}>Filtros activos:</span>
            {filtros.search       && <FiltroChip label={`"${filtros.search}"`}                          onRemove={() => onFiltroChange('search', '')} />}
            {filtros.sede_id      && <FiltroChip label={sedeSel?.nombre ?? `Sede #${filtros.sede_id}`}   onRemove={() => onFiltroChange('sede_id', '')} />}
            {filtros.custodio_q   && <FiltroChip label={`Custodio: "${filtros.custodio_q}"`}            onRemove={() => onFiltroChange('custodio_q', '')} />}
            {filtros.tipo_bien_id && <FiltroChip label={tipoSel?.nombre ?? 'Tipo'}                      onRemove={() => onFiltroChange('tipo_bien_id', '')} />}
            {filtros.estado_bien_id && (
              <FiltroChip label={estBienSel?.nombre ?? 'Estado bien'} onRemove={() => onFiltroChange('estado_bien_id', '')} />
            )}
            {filtros.estado_funcionamiento_id && (
              <FiltroChip label={estFuncSel?.nombre ?? 'Func.'} onRemove={() => onFiltroChange('estado_funcionamiento_id', '')} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function resolverEstadoBienId(b) {
  if (b.estado_bien_id != null)  return String(b.estado_bien_id);
  if (b.estado_bien?.id != null) return String(b.estado_bien.id);
  return '';
}

function resolverEstadoFuncId(b) {
  if (b.estado_funcionamiento_id != null)  return String(b.estado_funcionamiento_id);
  if (b.estado_funcionamiento?.id != null) return String(b.estado_funcionamiento.id);
  return '';
}

export function useFiltradoLocal(bienes = [], filtros = {}, catalogos = {}) {
  const { estadosBien = [], estadosFuncionamiento = [] } = catalogos;

  return useMemo(() => {
    let res = bienes;
    if (filtros.search?.trim()) {
      const q = filtros.search.trim().toLowerCase();
      res = res.filter(b =>
        b.codigo_patrimonial?.toLowerCase().includes(q) ||
        b.numero_serie?.toLowerCase().includes(q)       ||
        b.modelo?.toLowerCase().includes(q)             ||
        b.tipo_bien_nombre?.toLowerCase().includes(q)   ||
        b.marca_nombre?.toLowerCase().includes(q)
      );
    }
    if (filtros.sede_id) {
      res = res.filter(b => String(b.sede_id) === String(filtros.sede_id));
    }
    if (filtros.modulo_id) {
      res = res.filter(b => String(b.modulo_id) === String(filtros.modulo_id));
    }
    if (filtros.custodio_q?.trim()) {
      const q = filtros.custodio_q.trim().toLowerCase();
      res = res.filter(b => b.usuario_asignado_nombre?.toLowerCase().includes(q));
    }
    if (filtros.tipo_bien_id) {
      res = res.filter(b => String(b.tipo_bien_id) === String(filtros.tipo_bien_id));
    }

    if (filtros.estado_bien_id) {
      const catalogoItem = estadosBien.find(e => String(e.id) === String(filtros.estado_bien_id));
      const nombreBuscado = catalogoItem?.nombre?.toUpperCase() ?? '';

      res = res.filter(b => {
        const idBien = resolverEstadoBienId(b);
        if (idBien) return idBien === String(filtros.estado_bien_id);
        return nombreBuscado && b.estado_bien_nombre?.toUpperCase() === nombreBuscado;
      });
    }

    if (filtros.estado_funcionamiento_id) {
      const catalogoItem = estadosFuncionamiento.find(e => String(e.id) === String(filtros.estado_funcionamiento_id));
      const nombreBuscado = catalogoItem?.nombre?.toUpperCase() ?? '';

      res = res.filter(b => {
        const idBien = resolverEstadoFuncId(b);
        if (idBien) return idBien === String(filtros.estado_funcionamiento_id);
        return nombreBuscado && b.estado_funcionamiento_nombre?.toUpperCase() === nombreBuscado;
      });
    }

    return res;
  }, [
    bienes,
    filtros.search,
    filtros.sede_id,
    filtros.modulo_id,
    filtros.custodio_q,
    filtros.tipo_bien_id,
    filtros.estado_bien_id,
    filtros.estado_funcionamiento_id,
    estadosBien,
    estadosFuncionamiento,
  ]);
}