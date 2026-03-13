import axiosUsuarios from './axiosUsuarios';
import axiosBienes from './axiosBienes';

function applyInterceptors(instance) {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      if (status === 401) {
        import('../store/authStore').then(({ useAuthStore }) => {
          useAuthStore.getState().clearAuth();
        });
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }

      if (status === 403) {
        window.dispatchEvent(
          new CustomEvent('sisconpat:toast', {
            detail: { type: 'error', message: 'No tienes permisos para realizar esta acción.' },
          })
        );
      }

      if (status === 500) {
        window.dispatchEvent(
          new CustomEvent('sisconpat:toast', {
            detail: { type: 'error', message: 'Error interno del servidor. Intenta de nuevo.' },
          })
        );
      }
      return Promise.reject(error);
    }
  );
}

applyInterceptors(axiosUsuarios);
applyInterceptors(axiosBienes);