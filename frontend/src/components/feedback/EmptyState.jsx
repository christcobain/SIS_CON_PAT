
export default function EmptyState({ icon = 'inbox', title = 'Sin resultados', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[32px] text-slate-300">{icon}</span>
      </div>
      <p className="text-sm font-bold text-slate-600">{title}</p>
      {description && <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>}
      {action && (
        <button onClick={action.onClick}
          className="mt-4 px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg
                     hover:bg-primary-hover transition-colors">
          {action.label}
        </button>
      )}
    </div>
  );
}