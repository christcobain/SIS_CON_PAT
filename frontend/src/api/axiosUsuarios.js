import axios from 'axios';

const axiosUsuarios = axios.create({
  baseURL: import.meta.env.VITE_API_USUARIOS_URL ,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


// DEBUG TEMPORAL — borra esto después
axiosUsuarios.interceptors.request.use((config) => {
  console.log('=== AXIOS USUARIOS REQUEST ===');
  console.log('URL:', config.baseURL + config.url);
  console.log('withCredentials:', config.withCredentials);
  console.log('Headers enviados:', config.headers);
  console.log('Cookies disponibles en browser:', document.cookie);
  return config;
});

axiosUsuarios.interceptors.response.use(
  (response) => {
    console.log('=== AXIOS USUARIOS RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Headers respuesta:', response.headers);
    return response;
  },
  (error) => {
    console.log('=== AXIOS USUARIOS ERROR ===');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    return Promise.reject(error);
  }
);
export default axiosUsuarios;