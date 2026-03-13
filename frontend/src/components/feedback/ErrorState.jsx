/**
 * Estado de error — cuando falla una carga de datos.
 *
 * Uso:
 *   {error && <ErrorState message={error} onRetry={refetch} />}
 */
export default function ErrorState({ message = 'Ocurrió un error al cargar los datos.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[32px] text-red-300">error_outline</span>
      </div>
      <p className="text-sm font-bold text-slate-600">Error al cargar</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{message}</p>
      {onRetry && (
        <button onClick={onRetry}
          className="mt-4 flex items-center gap-1.5 px-5 py-2 border border-slate-200
                     text-sm font-semibold text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Reintentar
        </button>
      )}
    </div>
  );
}