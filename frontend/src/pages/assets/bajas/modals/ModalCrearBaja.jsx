import { useState, useEffect, useMemo } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useCatalogos }  from '../../../../hooks/useCatalogos';
import { useUsuarios }   from '../../../../hooks/useUsuarios';
import { useToast }      from '../../../../hooks/useToast';
import { useAuthStore }  from '../../../../store/authStore';

const BACKEND_URL = import.meta.env.VITE_API_BIENES_URL?.replace('/api/v1', '') || 'http://localhost:8001';

const Icon = ({ name, className = '', style = {} }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={style}>{name}</span>
);

const S = {
  input: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    outline: 'none',
    color: 'var(--color-text-primary)',
  },
};
const onF  = (e) => { e.currentTarget.style.border = '1px solid var(--color-primary)'; };
const offF = (e) => { e.currentTarget.style.border = '1px solid var(--color-border)'; };

const PASOS_LABELS = ['Destinatario', 'Bienes', 'Sustentación', 'Confirmar'];

function FLabel({ children, required, hint }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
        {children}{required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      {hint && <span className="text-[9px] italic normal-case tracking-normal" style={{ color: 'var(--color-text-faint)' }}>{hint}</span>}
    </div>
  );
}

function StepIndicator({ paso, total, labels }) {
  return (
    <div className="flex items-center gap-1 mb-5 flex-wrap">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex items-center gap-1.5">
            <div
              className="size-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all"
              style={{
                background: i < paso ? 'var(--color-primary)' : i === paso ? 'rgb(127 29 29 / 0.05)' : 'transparent',
                border: i < paso ? 'none' : `2px solid ${i === paso ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color: i < paso ? '#fff' : i === paso ? 'var(--color-primary)' : 'var(--color-text-faint)',
              }}
            >
              {i < paso ? <Icon name="check" className="text-[13px]" /> : i + 1}
            </div>
            {labels && (
              <span className="text-[10px] font-bold hidden md:inline"
                style={{ color: i === paso ? 'var(--color-primary)' : 'var(--color-text-faint)' }}>
                {labels[i]}
              </span>
            )}
          </div>
          {i < total - 1 && (
            <div className="h-0.5 w-6 rounded mx-1 transition-all"
              style={{ background: i < paso ? 'var(--color-primary)' : 'var(--color-border)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

function InfoBox({ text, color }) {
  const c = color === 'blue' ? '#1d4ed8' : 'var(--color-primary)';
  const bg = color === 'blue' ? 'rgb(37 99 235 / 0.06)' : 'rgb(127 29 29 / 0.05)';
  const border = color === 'blue' ? 'rgb(37 99 235 / 0.15)' : 'rgb(127 29 29 / 0.15)';
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl"
      style={{ background: bg, border: `1px solid ${border}` }}>
      <Icon name="info" className="text-[14px] shrink-0 mt-0.5" style={{ color: c }} />
      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-body)' }}>{text}</p>
    </div>
  );
}

function BienRow({ bien, seleccionado, motivosBaja, onToggle, onMotivoChange, onMantChange, onImagenToggle, imagenesSeleccionadas }) {
  const mantenimientos = bien.mantenimientos_disponibles || [];
  const mantActual = seleccionado?.mantenimiento_id
    ? mantenimientos.find((m) => m.mantenimiento_id === seleccionado.mantenimiento_id)
    : null;

  const resolverUrl = (img) => {
    if (!img?.imagen) return null;
    return img.imagen.startsWith('http') ? img.imagen : `${BACKEND_URL}${img.imagen}`;
  };

  const estadoColor = (() => {
    const u = (bien.estado_funcionamiento_nombre || '').toUpperCase();
    if (u === 'INOPERATIVO')   return { color: '#dc2626', bg: 'rgb(220 38 38 / 0.1)'  };
    if (u === 'OBSOLETO')      return { color: '#b45309', bg: 'rgb(180 83 9 / 0.1)'   };
    if (u === 'IRRECUPERABLE') return { color: '#7c3aed', bg: 'rgb(124 58 237 / 0.1)' };
    return { color: '#64748b', bg: 'var(--color-border-light)' };
  })();

  return (
    <div className="rounded-xl transition-all overflow-hidden"
      style={{
        border: `1px solid ${seleccionado ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: seleccionado ? 'rgb(127 29 29 / 0.03)' : 'var(--color-surface)',
      }}>
      <button type="button" onClick={() => onToggle(bien)}
        className="w-full flex items-center gap-3 p-3.5 text-left">
        <div className="relative size-5 shrink-0">
          <input type="checkbox" checked={!!seleccionado} onChange={() => {}} readOnly
            className="appearance-none size-5 rounded-md border-2 transition-all"
            style={{
              borderColor: seleccionado ? 'var(--color-primary)' : 'var(--color-border)',
              background:  seleccionado ? 'var(--color-primary)' : 'transparent',
            }}
          />
          {seleccionado && <Icon name="check" className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white" />}
        </div>

        <Icon name="devices" className="text-[20px] shrink-0"
          style={{ color: seleccionado ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />

        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase truncate" style={{ color: 'var(--color-text-primary)' }}>
            {bien.tipo_bien_nombre} — {bien.codigo_patrimonial}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {bien.marca_nombre} · {bien.modelo} · S/N: {bien.numero_serie}
          </p>
        </div>

        <span className="text-[9px] font-black px-2 py-0.5 rounded-md shrink-0"
          style={{ color: estadoColor.color, background: estadoColor.bg }}>
          {bien.estado_funcionamiento_nombre}
        </span>
      </button>

      {seleccionado && (
        <div className="px-3.5 pb-3.5 space-y-3"
          style={{ borderTop: '1px solid var(--color-border-light)' }}>
          <div className="pt-3">
            <FLabel required>Motivo de baja</FLabel>
            <select value={seleccionado.motivo_baja_id || ''} onChange={(e) => onMotivoChange(bien.bien_id, e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2.5 cursor-pointer"
              style={S.input} onFocus={onF} onBlur={offF}>
              <option value="">Seleccione motivo...</option>
              {(motivosBaja || []).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>

          {mantenimientos.length > 0 && (
            <div>
              <FLabel hint="Opcional">Mantenimiento de sustento</FLabel>
              <div className="space-y-1.5">
                <button type="button" onClick={() => onMantChange(bien.bien_id, null)}
                  className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    border: `1px solid ${!seleccionado.mantenimiento_id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: !seleccionado.mantenimiento_id ? 'rgb(127 29 29 / 0.05)' : 'var(--color-surface-alt)',
                    color: !seleccionado.mantenimiento_id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}>
                  Sin mantenimiento vinculado
                </button>
                {mantenimientos.map((mnt) => {
                  const activo = seleccionado.mantenimiento_id === mnt.mantenimiento_id;
                  return (
                    <button key={mnt.mantenimiento_id} type="button"
                      onClick={() => onMantChange(bien.bien_id, mnt.mantenimiento_id)}
                      className="w-full text-left p-2.5 rounded-xl transition-all"
                      style={{
                        border: `1px solid ${activo ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: activo ? 'rgb(127 29 29 / 0.05)' : 'var(--color-surface)',
                      }}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[11px] font-bold flex items-center gap-1.5"
                          style={{ color: activo ? 'var(--color-primary)' : 'var(--color-text-body)' }}>
                          <Icon name="history_edu" className="text-[15px]"
                            style={{ color: activo ? 'var(--color-primary)' : 'var(--color-text-faint)' }} />
                          MNT N° {mnt.numero_orden}
                        </p>
                        <p className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(mnt.fecha_registro).toLocaleDateString('es-PE')}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-faint)' }}>Diag. Final</p>
                          <p className="text-[10px] italic" style={{ color: 'var(--color-text-body)' }}>{mnt.diagnostico_final || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-faint)' }}>Estado Final</p>
                          <p className="text-[10px] font-bold" style={{ color: '#dc2626' }}>{mnt.estado_funcionamiento_final_nombre || '—'}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mantActual?.imagenes?.length > 0 && (
            <div>
              <FLabel hint="Opcional">Imágenes de evidencia a incluir</FLabel>
              <div className="flex gap-2 flex-wrap">
                {mantActual.imagenes.map((img) => {
                  const url    = resolverUrl(img);
                  const imgId  = img.id;
                  const activa = (imagenesSeleccionadas[bien.bien_id] || []).includes(imgId);
                  return (
                    <button key={imgId} type="button" onClick={() => onImagenToggle(bien.bien_id, imgId)}
                      title={img.descripcion || ''}
                      className="size-14 rounded-lg overflow-hidden relative transition-all"
                      style={{
                        border: `2px solid ${activa ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        opacity: activa ? 1 : 0.6,
                      }}>
                      {url
                        ? <img src={url} alt="Evidencia" className="size-full object-cover" />
                        : <div className="size-full flex items-center justify-center" style={{ background: 'var(--color-surface-alt)' }}>
                            <Icon name="image" className="text-[18px]" style={{ color: 'var(--color-text-faint)' }} />
                          </div>
                      }
                      {activa && (
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ background: 'rgb(127 29 29 / 0.25)' }}>
                          <Icon name="check_circle" className="text-[18px] text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ModalCrearBaja({ open, onClose, acciones, onGuardado }) {
  const toast      = useToast();
  const { bienesParaBaja, crear } = acciones;
  const { fetchCatalogos, motivosBaja }         = useCatalogos();
  const { filtrarUsuarios, loading: loadingUsuarios } = useUsuarios();

  const authUser   = useAuthStore((s) => s.user);
  const authSedes  = useAuthStore((s) => s.sedes);
  const authModulo = useAuthStore((s) => s.modulo_nombre);
  const nombreRegistrador = authUser ? `${authUser.nombres ?? ''} ${authUser.apellidos ?? ''}`.trim() : '';
  const cargoRegistrador  = authUser?.cargo || '';
  const sedeRegistrador   = authSedes?.[0]?.nombre || '';

  const [paso,     setPaso]     = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [confirm,  setConfirm]  = useState(false);
  const [loadingBienes,     setLoadingBienes]     = useState(false);
  const [bienesDisponibles, setBienesDisponibles] = useState([]);
  const [busquedaSearch, setBusquedaSearch] = useState('');
  const [busquedaCargo,  setBusquedaCargo]  = useState('');
  const [coordinadores,  setCoordinadores]  = useState([]);
  const [buscando,       setBuscando]       = useState(false);
  const [coordSeleccionado, setCoordSeleccionado] = useState(null);
  const [bienesSeleccionados,   setBienesSeleccionados]   = useState({});
  const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState({});

  const [form, setForm] = useState({
    cargo_elabora:    '',
    antecedentes:     '',
    observaciones:    '',
    sustento_tecnico: '',
    conclusiones:     '',
    recomendaciones:  '',
  });

  useEffect(() => {
    if (!open) return;
    setPaso(0);
    setCoordSeleccionado(null);
    setBusquedaSearch(''); setBusquedaCargo('');
    setCoordinadores([]);
    setBienesSeleccionados({});
    setImagenesSeleccionadas({});
    setForm({ cargo_elabora: '', antecedentes: '', observaciones: '', sustento_tecnico: '', conclusiones: '', recomendaciones: '' });
    fetchCatalogos(['motivosBaja']);
    setLoadingBienes(true);
    bienesParaBaja()
      .then((d) => setBienesDisponibles(Array.isArray(d) ? d : []))
      .catch(() => setBienesDisponibles([]))
      .finally(() => setLoadingBienes(false));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBuscar = async () => {
    const params = {};
    if (busquedaSearch.trim()) params.search = busquedaSearch.trim();
    if (busquedaCargo.trim())  params.cargo  = busquedaCargo.trim();
    if (!params.search && !params.cargo) return;
    setBuscando(true);
    try {
      const lista = await filtrarUsuarios(params);
      setCoordinadores(Array.isArray(lista) ? lista : lista?.results ?? []);
    } catch {
      setCoordinadores([]);
    } finally {
      setBuscando(false);
    }
  };

  const handleSeleccionarCoord = (u) => {
    setCoordSeleccionado(u);
    setCoordinadores([]);
    setBusquedaSearch(''); setBusquedaCargo('');
  };

  const handleToggleBien = (bien) => {
    setBienesSeleccionados((prev) => {
      if (prev[bien.bien_id]) {
        const next = { ...prev };
        delete next[bien.bien_id];
        return next;
      }
      return { ...prev, [bien.bien_id]: { bien_id: bien.bien_id, motivo_baja_id: '', mantenimiento_id: null } };
    });
  };

  const handleMotivoChange = (bienId, motivoId) =>
    setBienesSeleccionados((prev) => ({ ...prev, [bienId]: { ...prev[bienId], motivo_baja_id: motivoId } }));

  const handleMantChange = (bienId, mantId) => {
    setBienesSeleccionados((prev) => ({ ...prev, [bienId]: { ...prev[bienId], mantenimiento_id: mantId } }));
    setImagenesSeleccionadas((prev) => ({ ...prev, [bienId]: [] }));
  };

  const handleImagenToggle = (bienId, imgId) => {
    setImagenesSeleccionadas((prev) => {
      const actual = prev[bienId] || [];
      return { ...prev, [bienId]: actual.includes(imgId) ? actual.filter((i) => i !== imgId) : [...actual, imgId] };
    });
  };

  const bienesArray       = Object.values(bienesSeleccionados);
  const todosTienenMotivo = bienesArray.length > 0 && bienesArray.every((b) => !!b.motivo_baja_id);

  const pasosValidos = useMemo(() => ({
    0: !!coordSeleccionado,
    1: bienesArray.length > 0 && todosTienenMotivo,
    2: true,
    3: true,
  }), [coordSeleccionado, bienesArray.length, todosTienenMotivo]);

  const nombreCoord = coordSeleccionado
    ? `${coordSeleccionado.first_name} ${coordSeleccionado.last_name}`.trim()
    : '';

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const items = bienesArray.map((b) => {
        const item = { bien_id: b.bien_id, motivo_baja_id: parseInt(b.motivo_baja_id) };
        if (b.mantenimiento_id) {
          item.mantenimiento_id = b.mantenimiento_id;
          const imgs = imagenesSeleccionadas[b.bien_id] || [];
          if (imgs.length > 0) item.imagenes_incluidas = imgs;
        }
        return item;
      });
      const analisisCombinado = [form.observaciones.trim(), form.sustento_tecnico.trim()].join('\n§§§\n');
      const payload = {
        usuario_destino_id: coordSeleccionado.id,
        nombre_destino:     nombreCoord,
        cargo_destino:      coordSeleccionado.cargo || '',
        cargo_elabora:      form.cargo_elabora,
        antecedentes:       form.antecedentes,
        analisis:           analisisCombinado,
        conclusiones:       form.conclusiones,
        recomendaciones:    form.recomendaciones,
        items,
      };
      const res = await crear(payload);
      toast.success(res?.message || 'Informe de baja registrado correctamente.');
      onGuardado();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.detail || 'Error al registrar el informe de baja');
    } finally {
      setGuardando(false);
      setConfirm(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="xl">
        <ModalHeader title="Nuevo Informe de Baja Técnica" icon="delete_sweep" onClose={onClose} />

        <ModalBody>
          <StepIndicator paso={paso} total={PASOS_LABELS.length} labels={PASOS_LABELS} />

          {/* ══ PASO 0: DESTINATARIO ══ */}
          {paso === 0 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <InfoBox text='Busque al Coordinador de Informática destinatario del informe. Puede buscar por nombre/apellido/DNI o por cargo.' />

              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-3"
                  style={{ color: 'var(--color-text-muted)' }}>
                  Buscar coordinador — campo "A" del informe
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <FLabel>Nombre / Apellido / DNI</FLabel>
                    <div className="relative">
                      <Icon name="search" className="text-[17px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: 'var(--color-text-faint)' }} />
                      <input type="text" value={busquedaSearch}
                        onChange={(e) => setBusquedaSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                        disabled={!!coordSeleccionado}
                        placeholder="Ej: Miranda, Flores, 45112233..."
                        className="w-full text-sm rounded-xl py-2.5 pr-4 transition-all disabled:opacity-50"
                        style={{ paddingLeft: 40, ...S.input }} onFocus={onF} onBlur={offF} />
                    </div>
                  </div>
                  <div>
                    <FLabel>Cargo</FLabel>
                    <div className="relative">
                      <Icon name="work" className="text-[17px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: 'var(--color-text-faint)' }} />
                      <input type="text" value={busquedaCargo}
                        onChange={(e) => setBusquedaCargo(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                        disabled={!!coordSeleccionado}
                        placeholder="Ej: Coordinador de Informática..."
                        className="w-full text-sm rounded-xl py-2.5 pr-4 transition-all disabled:opacity-50"
                        style={{ paddingLeft: 40, ...S.input }} onFocus={onF} onBlur={offF} />
                    </div>
                  </div>
                </div>

                {!coordSeleccionado && (
                  <button type="button" onClick={handleBuscar}
                    disabled={(!busquedaSearch.trim() && !busquedaCargo.trim()) || buscando || loadingUsuarios}
                    className="btn-primary flex items-center gap-1.5 px-4 py-2">
                    {buscando || loadingUsuarios
                      ? <span className="btn-loading-spin" />
                      : <Icon name="person_search" className="text-[18px]" />}
                    Buscar Usuario
                  </button>
                )}

                {coordinadores.length > 0 && !coordSeleccionado && (
                  <div className="mt-3 rounded-xl overflow-hidden shadow-sm"
                    style={{ border: '1px solid var(--color-border)' }}>
                    {coordinadores.map((u) => (
                      <button key={u.id} type="button" onClick={() => handleSeleccionarCoord(u)}
                        className="w-full flex items-center justify-between px-4 py-3 transition-colors text-left"
                        style={{ borderBottom: '1px solid var(--color-border-light)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div>
                          <p className="text-xs font-bold" style={{ color: 'var(--color-text-body)' }}>
                            {u.first_name} {u.last_name}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                            {u.cargo || '—'} · DNI: {u.dni || u.username}
                          </p>
                        </div>
                        <Icon name="arrow_forward_ios" className="text-[13px]" style={{ color: 'var(--color-text-faint)' }} />
                      </button>
                    ))}
                  </div>
                )}

                {coordSeleccionado && (
                  <div className="mt-3 p-4 rounded-xl flex items-center justify-between gap-3"
                    style={{ border: '1px solid rgb(127 29 29 / 0.3)', background: 'rgb(127 29 29 / 0.05)' }}>
                    <div>
                      <p className="text-sm font-black" style={{ color: 'var(--color-primary)' }}>{nombreCoord}</p>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{coordSeleccionado.cargo || '—'}</p>
                    </div>
                    <button type="button" onClick={() => setCoordSeleccionado(null)} className="btn-secondary text-xs px-3 py-1.5">
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl space-y-1"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-2"
                  style={{ color: 'var(--color-text-muted)' }}>
                  Campo "De" — datos del registrador
                </p>
                {[
                  { label: 'Nombre', value: nombreRegistrador || '—' },
                  { label: 'Cargo',  value: cargoRegistrador  || '—' },
                  { label: 'Sede',   value: sedeRegistrador   || '—' },
                  { label: 'Módulo', value: authModulo        || '—' },
                ].map(({ label, value }) => (
                  <p key={label} className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="font-bold" style={{ color: 'var(--color-text-body)' }}>{label}: </span>{value}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ══ PASO 1: BIENES ══ */}
          {paso === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <InfoBox text="Seleccione los bienes a dar de baja. Solo se muestran bienes INOPERATIVO, OBSOLETO o IRRECUPERABLE de su sede." />

              {loadingBienes ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                </div>
              ) : bienesDisponibles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <Icon name="inventory_2" className="text-[40px]" style={{ color: 'var(--color-text-faint)' }} />
                  <p className="text-xs font-bold uppercase tracking-tighter" style={{ color: 'var(--color-text-faint)' }}>
                    Sin bienes disponibles para baja
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                    No hay bienes INOPERATIVO, OBSOLETO o IRRECUPERABLE en su sede.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {bienesDisponibles.map((bien) => (
                    <BienRow
                      key={bien.bien_id}
                      bien={bien}
                      seleccionado={bienesSeleccionados[bien.bien_id]}
                      motivosBaja={motivosBaja}
                      onToggle={handleToggleBien}
                      onMotivoChange={handleMotivoChange}
                      onMantChange={handleMantChange}
                      onImagenToggle={handleImagenToggle}
                      imagenesSeleccionadas={imagenesSeleccionadas}
                    />
                  ))}
                </div>
              )}

              {bienesArray.length > 0 && (
                <div className="flex items-center gap-1.5 p-3 rounded-xl"
                  style={{ background: 'rgb(127 29 29 / 0.04)', border: '1px solid rgb(127 29 29 / 0.15)' }}>
                  <Icon name="check_circle" className="text-[14px]" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-[11px] font-bold" style={{ color: 'var(--color-primary)' }}>
                    {bienesArray.length} bien(es) seleccionado(s)
                  </p>
                  {!todosTienenMotivo && (
                    <span className="text-[10px] font-bold ml-1" style={{ color: '#b45309' }}>
                      — Asigne motivo a todos los bienes
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ PASO 2: SECCIONES NARRATIVAS ══ */}
          {paso === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <InfoBox text="Complete las secciones del informe. El documento PDF se generará automáticamente con el formato institucional." color="blue" />

              <div>
                <FLabel hint="Base legal: D.Leg. 1439, Directiva N° 0006-2021-EF/54.01">1. Antecedentes</FLabel>
                <textarea value={form.antecedentes} onChange={(e) => setForm({ ...form, antecedentes: e.target.value })}
                  placeholder={`En cumplimiento de las funciones asignadas como Asistente de Informática...\n\nBASE LEGAL\n• Decreto Legislativo Nº 1439...\n• Directiva Nº 0006-2021-EF/54.01...`}
                  rows={7} className="w-full text-sm rounded-xl p-3 transition-all resize-y font-mono"
                  style={S.input} onFocus={onF} onBlur={offF} />
              </div>

              <div className="rounded-xl p-4 space-y-4"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-alt)' }}>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                  2. Análisis
                </p>
                <div>
                  <FLabel hint="Se agrega tras los datos de cada bien en el doc.">2.1 Observaciones</FLabel>
                  <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                    placeholder="• Agotamiento de Vida Útil: Los equipos han superado el contador de páginas..."
                    rows={5} className="w-full text-sm rounded-xl p-3 transition-all resize-y font-mono"
                    style={S.input} onFocus={onF} onBlur={offF} />
                </div>
                <div>
                  <FLabel hint="Referencia a artículos de la Directiva por causal.">2.2 Sustento técnico</FLabel>
                  <textarea value={form.sustento_tecnico} onChange={(e) => setForm({ ...form, sustento_tecnico: e.target.value })}
                    placeholder="• Falta de idoneidad (Art. 48.1.e): Se ha determinado que el desgaste natural..."
                    rows={5} className="w-full text-sm rounded-xl p-3 transition-all resize-y font-mono"
                    style={S.input} onFocus={onF} onBlur={offF} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FLabel>3. Conclusiones</FLabel>
                  <textarea value={form.conclusiones} onChange={(e) => setForm({ ...form, conclusiones: e.target.value })}
                    placeholder="Los bienes han superado su ciclo de vida útil..."
                    rows={5} className="w-full text-sm rounded-xl p-3 transition-all resize-y font-mono"
                    style={S.input} onFocus={onF} onBlur={offF} />
                </div>
                <div>
                  <FLabel>4. Recomendaciones</FLabel>
                  <textarea value={form.recomendaciones} onChange={(e) => setForm({ ...form, recomendaciones: e.target.value })}
                    placeholder="Proceder con la baja conforme al Título VII..."
                    rows={5} className="w-full text-sm rounded-xl p-3 transition-all resize-y font-mono"
                    style={S.input} onFocus={onF} onBlur={offF} />
                </div>
              </div>
            </div>
          )}

          {/* ══ PASO 3: CONFIRMAR ══ */}
          {paso === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <InfoBox text="Revise el resumen antes de generar. El informe quedará PENDIENTE DE APROBACIÓN por el Coordinador de Informática." color="blue" />

              <div className="p-4 rounded-xl space-y-2"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-alt)' }}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-3"
                  style={{ color: 'var(--color-text-muted)' }}>Vista previa del encabezado</p>
                <div className="grid grid-cols-1 gap-y-1.5 text-[11px]">
                  {[
                    { label: 'A',      value: `${nombreCoord}${coordSeleccionado?.cargo ? ` · ${coordSeleccionado.cargo}` : ''}` },
                    { label: 'De',     value: `${nombreRegistrador}${cargoRegistrador ? ` · ${cargoRegistrador}` : ''}${sedeRegistrador ? ` · ${sedeRegistrador}` : ''}` },
                    { label: 'Bienes', value: `${bienesArray.length} bien(es) seleccionado(s)` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <span className="font-black w-28 inline-block" style={{ color: 'var(--color-text-body)' }}>{label}:</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-2"
                  style={{ color: 'var(--color-text-muted)' }}>Bienes a dar de baja</p>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
                        {['Bien', 'Cód. Patrimonial', 'Motivo', 'MNT Vinculado'].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-left text-[9px] font-black uppercase tracking-widest"
                            style={{ color: 'var(--color-text-faint)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bienesArray.map((bs) => {
                        const bien   = bienesDisponibles.find((x) => x.bien_id === bs.bien_id);
                        const motivo = (motivosBaja || []).find((m) => String(m.id) === String(bs.motivo_baja_id));
                        const mnt    = bs.mantenimiento_id
                          ? (bien?.mantenimientos_disponibles || []).find((m) => m.mantenimiento_id === bs.mantenimiento_id)
                          : null;
                        return (
                          <tr key={bs.bien_id} style={{ borderTop: '1px solid var(--color-border-light)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td className="px-3 py-2.5">
                              <p className="font-bold" style={{ color: 'var(--color-text-body)' }}>{bien?.tipo_bien_nombre} {bien?.marca_nombre}</p>
                              <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>Mod. {bien?.modelo}</p>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: 'var(--color-primary)' }}>
                              {bien?.codigo_patrimonial}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}>
                                {motivo?.nombre || '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-[11px] italic" style={{ color: 'var(--color-text-muted)' }}>
                              {mnt ? `MNT ${mnt.numero_orden}` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter align="right">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <div className="flex items-center gap-2">
            {paso > 0 && (
              <button type="button" onClick={() => setPaso((p) => p - 1)} className="btn-secondary flex items-center gap-1.5">
                <Icon name="arrow_back" className="text-[16px]" /> Anterior
              </button>
            )}
            {paso < PASOS_LABELS.length - 1 ? (
              <button type="button" onClick={() => setPaso((p) => p + 1)}
                disabled={!pasosValidos[paso]}
                className="btn-primary flex items-center gap-1.5">
                Siguiente <Icon name="arrow_forward" className="text-[16px]" />
              </button>
            ) : (
              <button type="button" disabled={!pasosValidos[0] || !pasosValidos[1] || guardando}
                onClick={() => setConfirm(true)} className="btn-primary flex items-center gap-2">
                {guardando ? <span className="btn-loading-spin" /> : <Icon name="description" className="text-[18px]" />}
                Generar Informe ({bienesArray.length} bien{bienesArray.length !== 1 ? 'es' : ''})
              </button>
            )}
          </div>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={confirm}
        title="Confirmar Registro de Baja"
        message={`¿Confirma iniciar el proceso de baja para ${bienesArray.length} bien(es)? Se generará el informe BAJ-YYYY-XXXX en estado PENDIENTE DE APROBACIÓN.`}
        confirmLabel="Sí, registrar"
        variant="primary"
        loading={guardando}
        onConfirm={handleGuardar}
        onClose={() => setConfirm(false)}
      />
    </>
  );
}