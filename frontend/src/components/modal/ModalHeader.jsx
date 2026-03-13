export default function ModalHeader({ title, subtitle, icon, onClose }) {
  return (
    <div
      className="flex items-start justify-between gap-4 px-6 py-5 shrink-0"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-bold leading-tight truncate" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
          )}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="size-8 flex items-center justify-center rounded-lg transition-colors shrink-0"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-border-light)'; e.currentTarget.style.color = 'var(--color-text-body)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      )}
    </div>
  );
}