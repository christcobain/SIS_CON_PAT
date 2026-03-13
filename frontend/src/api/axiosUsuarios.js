import axios from 'axios';

const axiosUsuarios = axios.create({
  baseURL: import.meta.env.VITE_API_USUARIOS_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosUsuarios;