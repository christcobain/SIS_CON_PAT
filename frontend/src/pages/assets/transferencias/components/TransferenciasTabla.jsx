import { useMemo } from 'react';
import EmptyState from '../../../../components/feedback/EmptyState';
import ErrorState from '../../../../components/feedback/ErrorState';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function TransferenciasTabla({
  items = [],
  filtros = {},
  loading,
  error,
  refetch,
  onVerDetalle,
  onEditar,
  onCancelar,
  onDownload
}) {
  
  // --- LÓGICA DE FILTRADO LOCAL ---
  const itemsFiltrados = useMemo(() => {
    if (!items) return [];
    return items.filter(t => {
      const busqueda = (filtros?.search || '').toLowerCase().trim();
      const estadoFiltro = filtros?.estado || '';
      
      const cumpleBusqueda = !busqueda || (
        t.numero_orden?.toLowerCase().includes(busqueda) ||
        t.sede_origen_nombre?.toLowerCase().includes(busqueda) ||
        t.sede_destino_nombre?.toLowerCase().includes(busqueda) ||
        t.usuario_origen_nombre?.toLowerCase().includes(busqueda) ||
        t.usuario_destino_nombre?.toLowerCase().includes(busqueda) ||
        t.motivo_nombre?.toLowerCase().includes(busqueda)        
      );      
      
      const cumpleEstado = !estadoFiltro || t.estado === estadoFiltro;
      return cumpleBusqueda && cumpleEstado;
    });
  }, [items, filtros?.search, filtros?.estado]);

  // --- MAPEO DE ESTADOS (Consistente con el Modal) ---
  const getEstadoBadge = (estado) => {
    const map = {
      PENDIENTE_APROBACION: 'bg-amber-100 text-amber-700 border-amber-200',
      ATENDIDO:             'bg-green-100 text-green-700 border-green-200',
      CANCELADO:            'bg-slate-100 text-slate-500 border-slate-200',
      DEVUELTO:             'bg-red-100 text-red-700 border-red-200',
      EN_RETORNO:           'bg-orange-100 text-orange-700 border-orange-200',
    };
    return `px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-tighter ${map[estado] || 'bg-gray-100 text-gray-600'}`;
  };

  if (loading && items.length === 0)
    return <EmptyState icon="hourglass_top" title="Cargando transferencias..." />;
  
  if (error)
    return <ErrorState message={error} onRetry={refetch} />;
  
  if (itemsFiltrados.length === 0)
    return <EmptyState icon="search_off" title="No se encontraron coincidencias" />;

  return (
    <div className="table-wrapper animate-fade-in">
      <div className="table-container rounded-xl overflow-hidden">
        <table className="table w-full">
          <thead>
            <tr >
              <th className="px-4 py-3 text-left text-[11px] font-black uppercase text-faint">Orden / Fecha</th>
              <th className="px-4 py-3 text-left text-[11px] font-black uppercase text-faint">Origen</th>
              <th className="px-4 py-3 text-left text-[11px] font-black uppercase text-faint">Destino</th>
              <th className="px-4 py-3 text-left text-[11px] font-black uppercase text-faint">Motivo</th>
              <th className="px-4 py-3 text-center text-[11px] font-black uppercase text-faint">Bienes</th>
              <th className="px-4 py-3 text-left text-[11px] font-black uppercase text-faint">Estado</th>
              <th className="px-4 py-3 text-right text-[11px] font-black uppercase text-faint">Acciones</th>
            </tr>
          </thead>

          <tbody >
            {itemsFiltrados.map(t => {
              const bienesCount = t.bienes?.length || 0;
              const puedoEditar = t.estado === 'DEVUELTO';
              const puedoCancelar = !['ATENDIDO', 'CANCELADO'].includes(t.estado);
              const puedoDescargar = t.tiene_pdf_firmado === true;

              return (
                <tr key={t.id} >
                  {/* ORDEN Y FECHA */}
                  <td className="px-4 py-3">
                    <div className="font-mono font-black text-primary text-sm leading-tight">
                      {t.numero_orden}
                    </div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-tight">
                      {new Date(t.fecha_registro).toLocaleDateString()}
                    </div>
                  </td>

                  {/* ORIGEN */}
                  <td className="px-4 py-3">
                    <div className="text-xs font-bold text-body">
                      {t.sede_origen_nombre}
                    </div>
                    <div className="text-[10px] text-muted truncate max-w-[150px]">
                      {t.usuario_origen_nombre}
                    </div>
                  </td>

                  {/* DESTINO */}
                  <td className="px-4 py-3">
                    <div className="text-xs font-black text-blue-700">
                      {t.sede_destino_nombre}
                    </div>
                    <div className="text-[10px] text-muted truncate max-w-[150px]">
                      {t.usuario_destino_nombre}
                    </div>
                  </td>

                  {/* MOTIVO */}
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-surface border border-border-light dark:border-slate-700 text-body uppercase  tracking-tighter ">
                      {t.motivo_nombre}
                    </span>
                  </td>

                  {/* CANTIDAD BIENES */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center size-6 rounded-lg bg-primary/5 text-primary text-[11px] font-black">
                      {bienesCount}
                    </span>
                  </td>

                  {/* ESTADO */}
                  <td className="px-4 py-3">
                    <span className={getEstadoBadge(t.estado)}>
                      {t.estado.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* ACCIONES */}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => onVerDetalle(t)} 
                        className="size-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        title="Ver detalle completo"
                      >
                        <Icon name="visibility" className="text-[20px]" />
                      </button>

                      {puedoEditar && (
                        <button 
                          onClick={() => onEditar(t)} 
                          className="size-8 flex items-center justify-center rounded-lg hover:bg-amber-100 text-amber-600 transition-colors"
                          title="Corregir devolución"
                        >
                          <Icon name="edit" className="text-[20px]" />
                        </button>
                      )}

                      {puedoDescargar && (
                        <button 
                          onClick={() => onDownload(t.id)} 
                          className="size-8 flex items-center justify-center rounded-lg hover:bg-green-100 text-green-600 transition-colors"
                          title="Descargar PDF Firmado"
                        >
                          <Icon name="verified" className="text-[20px]" />
                        </button>
                      )}

                      {puedoCancelar && (
                        <button 
                          onClick={() => onCancelar(t)} 
                          className="size-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                          title="Cancelar Orden"
                        >
                          <Icon name="cancel" className="text-[20px]" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}