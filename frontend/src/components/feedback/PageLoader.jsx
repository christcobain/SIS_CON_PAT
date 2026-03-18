export default function PageLoader({ message = 'Cargando...', fullScreen = false }) {
  const cls = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center'
    : 'flex flex-col items-center justify-center w-full min-h-[60vh]';

  return (
    <div className={cls} style={{ background: fullScreen ? 'var(--color-bg)' : 'transparent' }}>
      <div className="flex flex-col items-center gap-5">

        <div className="relative size-16">
          <svg className="size-16 -rotate-90" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28"
              stroke="var(--color-border)" strokeWidth="4" />
          </svg>
          <svg className="size-16 -rotate-90 absolute inset-0 animate-spin"
            viewBox="0 0 64 64" fill="none" style={{ animationDuration: '1.1s' }}>
            <circle cx="32" cy="32" r="28"
              stroke="var(--color-primary)" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="88 88"
              strokeDashoffset="66" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]"
              style={{ color: 'var(--color-primary)', opacity: 0.7 }}>
              inventory_2
            </span>
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] animate-pulse"
            style={{ color: 'var(--color-text-muted)' }}>
            {message}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
            SISCONPAT — Corte Superior de Justicia de Lima Norte
          </p>
        </div>

        <div className="w-32 h-[3px] rounded-full overflow-hidden"
          style={{ background: 'var(--color-border)' }}>
          <div className="h-full rounded-full"
            style={{
              background: 'var(--color-primary)',
              animation: 'sisconpat-bar 1.4s ease-in-out infinite',
            }} />
        </div>
      </div>

      <style>{`
        @keyframes sisconpat-bar {
          0%   { width: 0%;   margin-left: 0%; }
          40%  { width: 60%;  margin-left: 20%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}