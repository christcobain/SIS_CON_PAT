import { useState, useEffect, useMemo } from 'react';
import Modal         from '../../../../components/modal/Modal';
import ModalHeader   from '../../../../components/modal/ModalHeader';
import ModalBody     from '../../../../components/modal/ModalBody';
import ModalFooter   from '../../../../components/modal/ModalFooter';
import ConfirmDialog from '../../../../components/feedback/ConfirmDialog';
import { useBajas }      from '../../../../hooks/useBajas';
import { useCatalogos }  from '../../../../hooks/useCatalogos';
import { useUsuarios }   from '../../../../hooks/useUsuarios';
import { useToast }      from '../../../../hooks/useToast';
import { useAuthStore }  from '../../../../store/authStore';

const BACKEND_URL = import.meta.env.VITE_API_BIENES_URL?.replace('/api/v1', '') || 'http://localhost:8001';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

const inputStyle = {
  background: 'var(--color-surface)',
  border:     '1px solid var(--color-border)',
  outline:    'none',
  color:      'var(--color-text-primary)',
};
const onFocus = (e) => { e.currentTarget.style.border = '1px solid var(--color-primary)'; };
const onBlur  = (e) => { e.currentTarget.style.border = '1px solid var(--color-border)'; };

function FieldLabel({ label, requerido = false, hint = '' }) {
  return (
    <div className="flex items-baseline justify-between mb-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-faint">
        {label}{requerido && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <span className="text-[9px] text-faint italic normal-case tracking-normal">{hint}</span>}
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
              className={`size-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                i < paso
                  ? 'bg-primary text-white'
                  : i === paso
                  ? 'border-2 border-primary text-primary bg-primary/5'
                  : 'border-2 border-border text-faint'
              }`}
            >
              {i < paso ? <Icon name="check" className="text-[13px]" /> : i + 1}
            </div>
            {labels && (
              <span className={`text-[10px] font-bold hidden md:inline ${i === paso ? 'text-primary' : 'text-faint'}`}>
                {labels[i]}
              </span>
            )}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-6 rounded mx-1 transition-all ${i < paso ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function InfoBox({ text }) {
  return (
    <div className="p-3 rounded-xl bg-surface-alt/50 border border-border/60 flex items-start gap-2">
      <Icon name="info" className="text-[16px] text-primary shrink-0 mt-0.5" />
      <p className="text-[11px] text-muted leading-relaxed">{text}</p>
    </div>
  );
}

const PASOS_LABELS = ['Destinatario', 'Bienes', 'Sustentación', 'Confirmar'];

// ── Tarjeta de bien individual ─────────────────────────────────────────────────
function BienRow({
  bien, seleccionado, motivosBaja,
  onToggle, onMotivoChange, onMantChange, onImagenToggle, imagenesSeleccionadas,
}) {
  const mantenimientos = bien.mantenimientos_disponibles || [];
  const mantActual = seleccionado?.mantenimiento_id
    ? mantenimientos.find((m) => m.mantenimiento_id === seleccionado.mantenimiento_id)
    : null;

  const resolverUrl = (img) => {
    if (!img?.imagen) return null;
    return img.imagen.startsWith('http') ? img.imagen : `${BACKEND_URL}${img.imagen}`;
  };

  return (
    <div className={`rounded-xl border-2 transition-all ${seleccionado ? 'border-primary bg-primary/5' : 'border-border bg-surface'}`}>
      <button
        type="button"
        onClick={() => onToggle(bien)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
            seleccionado ? 'border-primary bg-primary' : 'border-border'
          }`}>
            {seleccionado && <Icon name="check" className="text-white text-[12px]" />}
          </div>
          <Icon name="devices" className={`text-[20px] ${seleccionado ? 'text-primary' : 'text-faint'}`} />
          <div>
            <p className="text-xs font-bold text-body">{bien.tipo_bien_nombre} — {bien.codigo_patrimonial}</p>
            <p className="text-[10px] text-muted">{bien.marca_nombre} · Mod. {bien.modelo} · S/N: {bien.numero_serie}</p>
          </div>
        </div>
        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-red-700 shrink-0 ml-2">
          {bien.estado_funcionamiento_nombre}
        </span>
      </button>

      {seleccionado && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/40 pt-3">
          {/* Motivo de baja */}
          <div className="space-y-1">
            <FieldLabel label="Motivo de baja" requerido />
            <select
              value={seleccionado.motivo_baja_id || ''}
              onChange={(e) => onMotivoChange(bien.bien_id, e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 transition-all"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            >
              <option value="">Seleccione motivo...</option>
              {(motivosBaja || []).map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>

          {/* Mantenimiento vinculado */}
          {mantenimientos.length > 0 && (
            <div className="space-y-1">
              <FieldLabel label="Mantenimiento de sustento" hint="Opcional" />
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => onMantChange(bien.bien_id, null)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                    !seleccionado.mantenimiento_id
                      ? 'border-primary bg-primary/5 text-primary font-bold'
                      : 'border-border text-muted hover:bg-surface-alt'
                  }`}
                >
                  Sin mantenimiento vinculado
                </button>
                {mantenimientos.map((mnt) => {
                  const activo = seleccionado.mantenimiento_id === mnt.mantenimiento_id;
                  return (
                    <button
                      key={mnt.mantenimiento_id}
                      type="button"
                      onClick={() => onMantChange(bien.bien_id, mnt.mantenimiento_id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                        activo ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-alt'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[11px] font-bold text-body flex items-center gap-1.5">
                          <Icon name="history_edu" className={`text-[15px] ${activo ? 'text-primary' : 'text-faint'}`} />
                          MNT N° {mnt.numero_orden}
                        </p>
                        <p className="text-[9px] text-muted">{new Date(mnt.fecha_registro).toLocaleDateString('es-PE')}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[9px] font-black text-faint uppercase">Diag. Final</p>
                          <p className="text-[10px] text-body italic">{mnt.diagnostico_final || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-faint uppercase">Estado Final</p>
                          <p className="text-[10px] text-red-600 font-bold">{mnt.estado_funcionamiento_final_nombre || '—'}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Imágenes de evidencia */}
          {mantActual?.imagenes?.length > 0 && (
            <div>
              <FieldLabel label="Imágenes de evidencia a incluir" hint="Opcional" />
              <div className="flex gap-2 flex-wrap">
                {mantActual.imagenes.map((img) => {
                  const url   = resolverUrl(img);
                  const imgId = img.id;
                  const activa = (imagenesSeleccionadas[bien.bien_id] || []).includes(imgId);
                  return (
                    <button
                      key={imgId}
                      type="button"
                      onClick={() => onImagenToggle(bien.bien_id, imgId)}
                      title={img.descripcion || ''}
                      className={`size-14 rounded-lg border-2 overflow-hidden transition-all relative ${
                        activa ? 'border-primary shadow-sm ring-2 ring-primary/30' : 'border-border opacity-60 hover:opacity-100'
                      }`}
                    >
                      {url
                        ? <img src={url} alt="Evidencia" className="size-full object-cover" />
                        : <div className="size-full flex items-center justify-center bg-surface-alt"><Icon name="image" className="text-faint text-[18px]" /></div>
                      }
                      {activa && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/25">
                          <Icon name="check_circle" className="text-white text-[18px]" />
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

// ── Componente principal ───────────────────────────────────────────────────────
export default function ModalCrearBaja({ open, onClose }) {
  const toast = useToast();
  const { bienesParaBaja, crear }         = useBajas();
  const { fetchCatalogos, motivosBaja }   = useCatalogos();
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
  const [loadingBienes,    setLoadingBienes]    = useState(false);
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
  }, [open]);

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
      return {
        ...prev,
        [bien.bien_id]: { bien_id: bien.bien_id, motivo_baja_id: '', mantenimiento_id: null },
      };
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
      return {
        ...prev,
        [bienId]: actual.includes(imgId) ? actual.filter((i) => i !== imgId) : [...actual, imgId],
      };
    });
  };

  const bienesArray        = Object.values(bienesSeleccionados);
  const todosTienenMotivo  = bienesArray.length > 0 && bienesArray.every((b) => !!b.motivo_baja_id);

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
        const item = {
          bien_id:        b.bien_id,
          motivo_baja_id: parseInt(b.motivo_baja_id),
        };
        if (b.mantenimiento_id) {
          item.mantenimiento_id = b.mantenimiento_id;
          const imgs = imagenesSeleccionadas[b.bien_id] || [];
          if (imgs.length > 0) item.imagenes_incluidas = imgs;
        }
        return item;
      });
      const analisisCombinado = [
        form.observaciones.trim(),
        form.sustento_tecnico.trim(),
      ].join('\n§§§\n');
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
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        'Error al registrar el informe de baja'
      );
    } finally {
      setGuardando(false);
      setConfirm(false);
    }
  };

  return (
    <>
      {/* FIX: Modal usa size="xl" no maxWidth prop */}
      <Modal open={open} onClose={onClose} size="xl">
        <ModalHeader title="Nuevo Informe de Baja Técnica" icon="delete_sweep" onClose={onClose} />

        <ModalBody>
          <StepIndicator paso={paso} total={PASOS_LABELS.length} labels={PASOS_LABELS} />

          {/* ══ PASO 0: DESTINATARIO ══ */}
          {paso === 0 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <InfoBox text='Busque al Coordinador de Informática destinatario del informe. Puede buscar por nombre/apellido/DNI o por cargo.' />

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-faint mb-3">
                  Buscar coordinador — campo "A" del informe
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="space-y-1">
                    <FieldLabel label="Nombre / Apellido / DNI" />
                    <div className="relative">
                      <Icon name="search" className="text-[17px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-faint" />
                      <input
                        type="text" value={busquedaSearch}
                        onChange={(e) => setBusquedaSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                        disabled={!!coordSeleccionado}
                        placeholder="Ej: Miranda, Flores, 45112233..."
                        className="w-full text-sm rounded-xl py-2.5 pr-4 transition-all disabled:opacity-50"
                        style={{ paddingLeft: 40, ...inputStyle }} onFocus={onFocus} onBlur={onBlur}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel label="Cargo" />
                    <div className="relative">
                      <Icon name="work" className="text-[17px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-faint" />
                      <input
                        type="text" value={busquedaCargo}
                        onChange={(e) => setBusquedaCargo(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                        disabled={!!coordSeleccionado}
                        placeholder="Ej: Coordinador de Informática..."
                        className="w-full text-sm rounded-xl py-2.5 pr-4 transition-all disabled:opacity-50"
                        style={{ paddingLeft: 40, ...inputStyle }} onFocus={onFocus} onBlur={onBlur}
                      />
                    </div>
                  </div>
                </div>

                {!coordSeleccionado && (
                  <button
                    type="button"
                    onClick={handleBuscar}
                    disabled={(!busquedaSearch.trim() && !busquedaCargo.trim()) || buscando || loadingUsuarios}
                    className="btn-primary flex items-center gap-1.5 px-4 py-2"
                  >
                    {buscando || loadingUsuarios
                      ? <span className="btn-loading-spin" />
                      : <Icon name="person_search" className="text-[18px]" />}
                    Buscar Usuario
                  </button>
                )}

                {coordinadores.length > 0 && !coordSeleccionado && (
                  <div className="mt-3 border border-border rounded-xl overflow-hidden shadow-sm">
                    {coordinadores.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSeleccionarCoord(u)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-alt transition-colors border-b border-border/50 last:border-0 text-left"
                      >
                        <div>
                          <p className="text-xs font-bold text-body">{u.first_name} {u.last_name}</p>
                          <p className="text-[10px] text-muted">{u.cargo || '—'} · DNI: {u.dni || u.username}</p>
                        </div>
                        <Icon name="arrow_forward_ios" className="text-[13px] text-faint" />
                      </button>
                    ))}
                  </div>
                )}

                {coordSeleccionado && (
                  <div className="mt-3 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-primary">{nombreCoord}</p>
                      <p className="text-[11px] text-muted">{coordSeleccionado.cargo || '—'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoordSeleccionado(null)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              {/* Vista previa del elaborador */}
              <div className="p-3 rounded-xl bg-surface-alt/50 border border-border/60 space-y-1 text-[11px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-faint mb-2">
                  Campo "De" — datos del registrador
                </p>
                <p className="text-muted"><span className="font-bold text-body">Nombre: </span>{nombreRegistrador || '—'}</p>
                <p className="text-muted"><span className="font-bold text-body">Cargo: </span>{cargoRegistrador || '—'}</p>
                <p className="text-muted"><span className="font-bold text-body">Sede: </span>{sedeRegistrador || '—'}</p>
                <p className="text-muted"><span className="font-bold text-body">Módulo: </span>{authModulo || '—'}</p>
              </div>
            </div>
          )}

          {/* ══ PASO 1: BIENES ══ */}
          {paso === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <InfoBox text={`Seleccione bienes a dar de baja y su Mant.\n Estados Bienes INOPERATIVO, OBSOLETO o IRRECUPERABLE de su sede. `}/>

              {loadingBienes ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                </div>
              ) : bienesDisponibles.length === 0 ? (
                <div className="text-center py-12 card rounded-xl">
                  <Icon name="inventory_2" className="text-[40px] text-faint" />
                  <p className="text-sm mt-2 font-semibold text-muted">Sin bienes disponibles para baja</p>
                  <p className="text-xs mt-1 text-faint">No hay bienes INOPERATIVO, OBSOLETO o IRRECUPERABLE en su sede.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
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
                <p className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                  <Icon name="check_circle" className="text-[14px]" />
                  {bienesArray.length} bien(es) seleccionado(s)
                  {!todosTienenMotivo && (
                    <span className="text-amber-600 ml-2">— Asigne motivo a todos los bienes</span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* ══ PASO 2: SECCIONES NARRATIVAS ══ */}
          {paso === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <InfoBox text="Complete las secciones del informe. Puede pegar texto desde Word. El documento PDF se generará automáticamente con el formato institucional CSJLN." />

              <div className="space-y-1">
                <FieldLabel label="1. Antecedentes" hint="Base legal: D.Leg. 1439, Directiva N° 0006-2021-EF/54.01" />
                <textarea
                  value={form.antecedentes}
                  onChange={(e) => setForm({ ...form, antecedentes: e.target.value })}
                  placeholder={`En cumplimiento de las funciones asignadas como Asistente de Informática...\n\nBASE LEGAL\n• Decreto Legislativo Nº 1439...\n• Directiva Nº 0006-2021-EF/54.01...\n• Artículo 48, numeral 48.1 literal e...`}
                  rows={7}
                  className="w-full text-sm rounded-xl p-3 transition-all resize-y font-mono"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
              </div>

              <div className="border border-border/60 rounded-xl p-4 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-faint">2. Análisis</p>
                <div className="space-y-1">
                  <FieldLabel label="2.1 Observaciones" hint="Se agrega tras los datos de cada bien en el doc." />
                  <textarea
                    value={form.observaciones}
                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                    placeholder={`• Agotamiento de Vida Útil: Los equipos han superado el contador de páginas...\n• Deterioro de Componentes Internos: Se identifica un desgaste crítico...\n• Obsolescencia: Los fabricantes han incluido estos modelos en "Fin de Asistencia"...`}
                    rows={5}
                    className="w-full text-sm rounded-xl p-3 transition-all resize-y font-mono"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel label="2.2 Sustento técnico" hint="Referencia a artículos de la Directiva por causal." />
                  <textarea
                    value={form.sustento_tecnico}
                    onChange={(e) => setForm({ ...form, sustento_tecnico: e.target.value })}
                    placeholder={`• Falta de idoneidad (Art. 48.1.e): Se ha determinado que el desgaste natural...\n• Mantenimiento oneroso (Art. 48.1.f): Debido al estado de los equipos...\n• Obsolescencia Tecnológica (Art. 48.1.g): Los equipos cuentan con 7 años de antigüedad...`}
                    rows={5}
                    className="w-full text-sm rounded-xl p-3 transition-all resize-y font-mono"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <FieldLabel label="3. Conclusiones" />
                  <textarea
                    value={form.conclusiones}
                    onChange={(e) => setForm({ ...form, conclusiones: e.target.value })}
                    placeholder="Los bienes han superado su ciclo de vida útil..."
                    rows={5}
                    className="w-full text-sm rounded-xl p-3 transition-all resize-y font-mono"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel label="4. Recomendaciones" />
                  <textarea
                    value={form.recomendaciones}
                    onChange={(e) => setForm({ ...form, recomendaciones: e.target.value })}
                    placeholder="Proceder con la baja conforme al Título VII..."
                    rows={5}
                    className="w-full text-sm rounded-xl p-3 transition-all resize-y font-mono"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ PASO 3: RESUMEN Y CONFIRMACIÓN ══ */}
          {paso === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <InfoBox text="Revise el resumen del informe antes de generar. Una vez registrado, quedará PENDIENTE DE APROBACIÓN por el Coordinador de Informática." />

              <div className="p-4 rounded-xl border border-border/60 bg-surface-alt/30 space-y-2 text-[12px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-faint mb-3">Vista previa del encabezado</p>
                <div className="grid grid-cols-1 gap-y-1.5">
                  <div><span className="font-black text-body w-28 inline-block">A:</span><span className="text-muted">{nombreCoord} {coordSeleccionado?.cargo ? `· ${coordSeleccionado.cargo}` : ''}</span></div>
                  <div><span className="font-black text-body w-28 inline-block">De:</span><span className="text-muted">{nombreRegistrador}{cargoRegistrador ? ` · ${cargoRegistrador}` : ''}{sedeRegistrador ? ` · ${sedeRegistrador}` : ''}</span></div>
                  <div><span className="font-black text-body w-28 inline-block">Bienes:</span><span className="text-muted">{bienesArray.length} bien(es) seleccionado(s)</span></div>
                  <div>
                    <span className="font-black text-body w-28 inline-block">Referencia MNT:</span>
                    <span className="text-muted">
                      {bienesArray.some((b) => b.mantenimiento_id)
                        ? bienesArray
                            .filter((b) => b.mantenimiento_id)
                            .map((b) => {
                              const bien = bienesDisponibles.find((x) => x.bien_id === b.bien_id);
                              const mnt  = (bien?.mantenimientos_disponibles || []).find(
                                (m) => m.mantenimiento_id === b.mantenimiento_id
                              );
                              return mnt?.numero_orden;
                            })
                            .filter(Boolean)
                            .join(', ')
                        : 'Sin mantenimiento vinculado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resumen de bienes */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-faint mb-2">Bienes a dar de baja</p>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-alt">
                      <tr>
                        {['Bien', 'Cód. Patrimonial', 'Motivo', 'MNT Vinculado'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-faint font-bold uppercase text-[9px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {bienesArray.map((bs) => {
                        const bien   = bienesDisponibles.find((x) => x.bien_id === bs.bien_id);
                        const motivo = (motivosBaja || []).find((m) => String(m.id) === String(bs.motivo_baja_id));
                        const mnt    = bs.mantenimiento_id
                          ? (bien?.mantenimientos_disponibles || []).find((m) => m.mantenimiento_id === bs.mantenimiento_id)
                          : null;
                        return (
                          <tr key={bs.bien_id} className="hover:bg-surface-alt/30">
                            <td className="px-3 py-2.5">
                              <p className="font-bold text-body">{bien?.tipo_bien_nombre} {bien?.marca_nombre}</p>
                              <p className="text-[10px] text-faint">Mod. {bien?.modelo}</p>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[11px]">{bien?.codigo_patrimonial}</td>
                            <td className="px-3 py-2.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-alt border border-border">
                                {motivo?.nombre || '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-muted italic text-[11px]">
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
              <button
                type="button"
                onClick={() => setPaso((p) => p + 1)}
                disabled={!pasosValidos[paso]}
                className="btn-primary flex items-center gap-1.5"
              >
                Siguiente <Icon name="arrow_forward" className="text-[16px]" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!pasosValidos[0] || !pasosValidos[1] || guardando}
                onClick={() => setConfirm(true)}
                className="btn-primary flex items-center gap-2"
              >
                {guardando
                  ? <span className="btn-loading-spin" />
                  : <Icon name="description" className="text-[18px]" />}
                Generar Informe ({bienesArray.length} bien{bienesArray.length !== 1 ? 'es' : ''})
              </button>
            )}
          </div>
        </ModalFooter>
      </Modal>

      {/* FIX: ConfirmDialog usa onClose, no onCancel */}
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