import { useNavigate } from 'react-router-dom';

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function AlertasTablaMovimientos({ role, loading }) {
  const navigate = useNavigate();

  // Función para renderizar botones según tu flujo lógico
  const renderActions = (item) => {
    const { estado } = item;
    const btnClass = "px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-tighter transition-all flex items-center gap-1.5 border";
    
    // 1. PENDIENTE_APROBACION
    if (estado === 'PENDIENTE_APROBACION') {
      if (role === 'ADMINSEDE' || role === 'COORDSISTEMA') {
        return (
          <div className="flex gap-2">
            <button className={`${btnClass} bg-green-500 border-green-600 text-white hover:bg-green-600`}>
              <Icon name="check" className="text-sm" /> Aprobar
            </button>
            <button className={`${btnClass} bg-white text-slate-600 border-slate-200 hover:bg-slate-50`}>
              <Icon name="reply" className="text-sm" /> Devolver
            </button>
          </div>
        );
      }
      if (role === 'SEGURSEDE_SALIDA') {
        return (
          <div className="flex gap-2">
            <button className={`${btnClass} bg-primary border-red-700 text-white hover:bg-red-800`}>
              <Icon name="local_shipping" className="text-sm" /> Aprobar Salida
            </button>
            <button className={`${btnClass} bg-white text-red-600 border-red-200 hover:bg-red-50`}>
               Rechazar
            </button>
          </div>
        );
      }
      if (role === 'ASISTSISTEMA') {
        return <button onClick={() => navigate(`/movimiento/${item.id}`)} className={`${btnClass} bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200`}>Ver Detalle</button>;
      }
    }

    // 2. EN_ESPERA_CONFORMIDAD
    if (estado === 'EN_ESPERA_CONFORMIDAD' && role === 'USUARIO_DESTINO') {
      return (
        <button className={`${btnClass} bg-blue-600 border-blue-700 text-white hover:bg-blue-700`}>
          <Icon name="front_hand" className="text-sm" /> Confirmar Recepción
        </button>
      );
    }

    // 3. EN_RETORNO
    if (estado === 'EN_RETORNO' && role === 'SEGURSEDE') {
      return (
        <button className={`${btnClass} bg-primary border-red-700 text-white hover:bg-red-800`}>
          <Icon name="assignment_return" className="text-sm" /> Aprobar Retorno
        </button>
      );
    }

    // 4. DEVUELTO
    if (estado === 'DEVUELTO' && role === 'REGISTRADOR') {
      return (
        <div className="flex gap-2">
          <button className={`${btnClass} bg-amber-500 border-amber-600 text-white hover:bg-amber-600`}>Reenviar</button>
          <button className={`${btnClass} bg-white text-slate-400 border-slate-200 hover:bg-slate-50`}>Cancelar</button>
        </div>
      );
    }

    // 5. ATENDIDO / CANCELADO (Por defecto)
    return (
      <div className="flex gap-2">
        <button className={`${btnClass} bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200`}>Detalle</button>
        {estado === 'ATENDIDO' && (
          <button className={`${btnClass} bg-white text-primary border-primary/20 hover:bg-red-50`}>
            <Icon name="picture_as_pdf" className="text-sm" /> PDF
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5 text-[10px] uppercase font-black text-slate-400 tracking-widest">
            <th className="px-6 py-4">Tipo / Origen</th>
            <th className="px-6 py-4">Solicitante</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
          {/* Ejemplo de fila */}
          <tr className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Icon name="logout" className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">Salida Temporal</p>
                  <p className="text-[10px] text-slate-400 font-bold tracking-tight">Desde: Sede Central</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Juan Perez</p>
              <p className="text-[10px] text-slate-400 font-medium tracking-tighter uppercase">HACE 10 MINUTOS</p>
            </td>
            <td className="px-6 py-4">
               <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-tighter border border-amber-200">
                  Pendiente Aprobación
               </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex justify-end">
                {renderActions({ estado: 'PENDIENTE_APROBACION', id: 1 })}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}