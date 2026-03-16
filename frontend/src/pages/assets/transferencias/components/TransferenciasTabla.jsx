import {React,useMemo} from 'react';
import EmptyState from '../../../../components/feedback/EmptyState';
import ErrorState from '../../../../components/feedback/ErrorState';


const Icon = ({ name, className='' }) =>
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
export default function TransferenciasTabla({
  items = [],
  filtros={},
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

  const getEstadoBadge = (estado) => {
    const map = {
      PENDIENTE_APROBACION: 'badge-pendiente',
      ATENDIDO: 'badge-atendido',
      CANCELADO: 'badge-cancelado',
      DEVUELTO: 'badge-devuelto'
    }
    return map[estado] || 'badge-default'
  }
  if (loading && items.length === 0)
    return <EmptyState icon="hourglass_top" title="Cargando transferencias..." />
  if (error)
    return <ErrorState message={error} onRetry={refetch} />
  if (itemsFiltrados.length === 0)
    return <EmptyState icon="search_off" title="No se encontraron coincidencias" />

  return (
    <div className="table-wrapper animate-fade-in">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Orden / Fecha</th>
              <th>Sede / Usuario Origen</th>
              <th>Sede / Usuario Destino</th>
              <th>Motivo Transf./ Asignacion</th>
              <th>Cant. Bienes</th>
              <th>Estado Transf./ Asignacion</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {itemsFiltrados.map(t => {
              const bienesCount = t.bienes?.length || 0
              const puedoEditar = t.estado === 'DEVUELTO'
              const puedoCancelar = !['ATENDIDO','CANCELADO'].includes(t.estado)
              const puedoDescargar = t.tiene_pdf_firmado === true
              return (
                <tr key={t.id} className="hover:bg-surface-alt">
                  <td>
                    <div className="font-mono font-black text-primary">
                      {t.numero_orden}
                    </div>
                    <div className="text-[11px] text-muted">
                      {new Date(t.fecha_registro).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="text-xs font-bold">
                      {t.sede_origen_nombre}
                    </div>
                    <div className="text-[11px] text-muted">
                      {t.usuario_origen_nombre}
                    </div>
                  </td>

                  <td>
                    <div className="text-xs font-black text-primary">
                      {t.sede_destino_nombre}
                    </div>

                    <div className="text-[11px] text-muted">
                      {t.usuario_destino_nombre}
                    </div>
                  </td>

                  <td>
                    <span className="text-[11px] badge-warning">
                      {t.motivo_nombre}
                    </span>
                  </td>

                  <td>
                    <span className="badge-info">
                      {bienesCount}
                    </span>
                  </td>

                  <td>
                    <span className={getEstadoBadge(t.estado)}>
                      {t.estado}
                    </span>
                  </td>

                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={()=>onVerDetalle(t)} className="btn-icon">
                        <Icon name="visibility"/>
                      </button>
                      {puedoEditar &&
                        <button onClick={()=>onEditar(t)} className="btn-icon text-amber-600">
                          <Icon name="edit"/>
                        </button>
                      }
                      {puedoDescargar &&
                        <button onClick={()=>onDownload(t.id)} className="btn-icon">
                          <Icon name="description"/>
                        </button>
                      }
                      {puedoCancelar &&
                        <button onClick={()=>onCancelar(t)} className="btn-icon text-red-500">
                          <Icon name="block"/>
                        </button>
                      }
                    </div>
                  </td>

                </tr>
              )

            })}

          </tbody>
        </table>

      </div>
    </div>
  )
}
