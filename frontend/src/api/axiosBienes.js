// import axios from 'axios';

// const axiosBienes = axios.create({
//   baseURL: import.meta.env.VITE_API_BIENES_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });
// export default axiosBienes;


import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const axiosBienes = axios.create({
  baseURL: import.meta.env.VITE_API_BIENES_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosBienes.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

export default axiosBienes;

