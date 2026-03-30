import axios from 'axios';

const axiosUsuarios = axios.create({
  baseURL: import.meta.env.VITE_API_USUARIOS_URL ,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
export default axiosUsuarios;