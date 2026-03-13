export default function DashboardSpinner({ small = false }) {
  return (
    <div className={`flex items-center justify-center ${small ? 'py-4' : 'py-12'}`}>
      <svg className={`animate-spin ${small ? 'h-5 w-5' : 'h-8 w-8'}`}
           style={{ color: 'var(--color-primary)' }}
           fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}