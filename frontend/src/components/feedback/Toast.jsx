const TIPOS = {
  success: { icon: 'check_circle',        bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-800',  icon_color: 'text-green-500'  },
  error:   { icon: 'cancel',              bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-800',    icon_color: 'text-red-500'    },
  warning: { icon: 'warning',             bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-800',  icon_color: 'text-amber-500'  },
  info:    { icon: 'info',                bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800',   icon_color: 'text-blue-500'   },
};

export default function Toast({ id, type = 'info', message, onClose }) {
  const cfg = TIPOS[type] || TIPOS.info;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg
                     max-w-sm w-full pointer-events-auto
                     animate-[slideIn_0.2s_ease-out]
                     ${cfg.bg} ${cfg.border}`}>
      <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${cfg.icon_color}`}>
        {cfg.icon}
      </span>
      <p className={`flex-1 text-sm font-medium ${cfg.text}`}>{message}</p>
      <button onClick={() => onClose(id)}
        className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}