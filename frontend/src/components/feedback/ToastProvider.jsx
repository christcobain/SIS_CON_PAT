import { createContext, useCallback, useRef, useState } from 'react';
import Toast from './Toast';

// Exportado como named para que useToast.js lo consuma
// ToastProvider.jsx solo tiene el componente como default export → eslint ok
export const ToastCtx = createContext(null);

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((type, message, duration = 4000) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    if (duration > 0) setTimeout(() => remove(id), duration);
  }, [remove]);

  const api = {
    success: (msg, ms) => add('success', msg, ms),
    error:   (msg, ms) => add('error',   msg, ms),
    warning: (msg, ms) => add('warning', msg, ms),
    info:    (msg, ms) => add('info',    msg, ms),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={remove} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}