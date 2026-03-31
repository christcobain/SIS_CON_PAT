import axios from 'axios';
import axiosUsuarios from './axiosUsuarios';
import axiosBienes from './axiosBienes';
import { useAuthStore } from '../store/authStore';


let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

function applyInterceptors(instance) {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const status = error.response?.status;
      if (status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => instance(originalRequest))
            .catch((err) => Promise.reject(err));
        }
        originalRequest._retry = true;
        isRefreshing = true;
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_USUARIOS_URL}/auth/refreshtokens/`,
            {},
            { withCredentials: true }
          );
          useAuthStore.getState().setAuth(data);
          
          processQueue(null);
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          useAuthStore.getState().clearAuth();
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      if (status === 403) {
        window.dispatchEvent(new CustomEvent('sisconpat:toast', {
          detail: { type: 'error', message: 'No tienes permisos para esta acción.' },
        }));
      }
      if (status === 500) {
        window.dispatchEvent(new CustomEvent('sisconpat:toast', {
          detail: { type: 'error', message: 'Error en el servidor. Reintente.' },
        }));
      }

      return Promise.reject(error);
    }
  );
}

applyInterceptors(axiosUsuarios);
applyInterceptors(axiosBienes);
