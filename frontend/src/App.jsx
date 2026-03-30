// import './api/interceptors';
// import AppRouter from './routes/AppRouter';
// import ToastProvider from './components/feedback/ToastProvider';


// export default function App() {
//   return <ToastProvider><AppRouter /></ToastProvider>
// }


import { useEffect } from 'react';
import './api/interceptors';
import AppRouter from './routes/AppRouter';
import ToastProvider from './components/feedback/ToastProvider';
import { useAuthStore } from './store/authStore';
import axiosUsuarios from './api/axiosUsuarios';

function SessionRestorer() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const accessToken = useAuthStore(s => s.accessToken);
  const setAuth = useAuthStore(s => s.setAuth);
  const clearAuth = useAuthStore(s => s.clearAuth);

  useEffect(() => {
    if (isAuthenticated && !accessToken) {
      axiosUsuarios
        .post('/auth/refreshtokens/')
        .then(({ data }) => setAuth(data))
        .catch(() => clearAuth());
    }
  }, []);

  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <SessionRestorer />
      <AppRouter />
    </ToastProvider>
  );
}