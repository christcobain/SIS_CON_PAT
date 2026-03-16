export default function DashboardSpinner({ 
  small = false, 
  message = "Cargando datos...", 
  withMessage = true 
}) {
  const sizeClass = small ? 'size-6' : 'size-12';
  const strokeWidth = small ? 3 : 2.5;

  return (
    <div className={`flex flex-col items-center justify-center w-full animate-in fade-in duration-500 ${small ? 'py-2' : 'py-16'}`}>
      <div className="relative">
        {/* Anillo de fondo (Sutil) */}
        <svg 
          className={sizeClass} 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <circle 
            className="opacity-10" 
            cx="12" cy="12" r="10" 
            stroke="var(--color-text-primary)" 
            strokeWidth={strokeWidth} 
          />
        </svg>

        {/* Spinner Principal con rastro */}
        <svg 
          className={`absolute top-0 left-0 animate-spin ${sizeClass}`}
          style={{ color: 'var(--color-primary)' }}
          fill="none" 
          viewBox="0 0 24 24"
        >
          <defs>
            <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path 
            fill="url(#spinner-gradient)"
            d="M12 2C6.477 2 2 6.477 2 12c0 1.105.895 2 2 2s2-.895 2-2c0-3.314 2.686-6 6-6s6 2.686 6 6c0 1.105.895 2 2 2s2-.895 2-2c0-5.523-4.477-10-10-10z"
            className="opacity-90"
          />
          {/* Círculo de impacto frontal */}
          <circle 
            cx="12" cy="2" r="2" 
            fill="currentColor" 
          />
        </svg>
      </div>

      {/* Texto de estado profesional */}
      {withMessage && !small && (
        <div className="mt-4 flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">
            {message}
          </span>
          {/* Barra de progreso indeterminada sutil */}
          <div className="mt-2 w-24 h-[2px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-primary/40 rounded-full animate-shimmer" 
                 style={{ 
                   backgroundImage: 'linear-gradient(90deg, transparent, rgba(127,29,29,0.4), transparent)',
                   backgroundSize: '200% 100%' 
                 }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}