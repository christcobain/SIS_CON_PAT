// import axios from 'axios';

// const axiosUsuarios = axios.create({
//   baseURL: import.meta.env.VITE_API_USUARIOS_URL ,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });


// export default axiosUsuarios;

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const axiosUsuarios = axios.create({
  baseURL: import.meta.env.VITE_API_USUARIOS_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosUsuarios.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

export default axiosUsuarios;