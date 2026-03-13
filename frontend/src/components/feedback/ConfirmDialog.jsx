
const VARIANTES = {
  danger:  { btn: 'bg-red-600 hover:bg-red-700 text-white',    icon: 'warning',       iconColor: 'text-red-500',    iconBg: 'bg-red-100'    },
  warning: { btn: 'bg-amber-500 hover:bg-amber-600 text-white',icon: 'error',         iconColor: 'text-amber-500',  iconBg: 'bg-amber-100'  },
  primary: { btn: 'bg-primary hover:bg-primary-hover text-white', icon: 'help_outline', iconColor: 'text-primary',  iconBg: 'bg-primary/10' },
};

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  variant = 'danger', loading = false, onConfirm, onClose,
}) {
  if (!open) return null;
  const v = VARIANTES[variant] || VARIANTES.primary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
        <div className="flex items-start gap-4">
          <div className={`size-11 rounded-full flex items-center justify-center shrink-0 ${v.iconBg}`}>
            <span className={`material-symbols-outlined text-[24px] ${v.iconColor}`}>{v.icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} disabled={loading}
            className="px-5 py-2 rounded-lg border border-slate-200 text-sm font-semibold
                       text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold
                        transition-colors disabled:opacity-60 ${v.btn}`}>
            {loading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}