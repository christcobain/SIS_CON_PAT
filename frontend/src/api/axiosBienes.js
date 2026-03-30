import axios from 'axios';

const axiosBienes = axios.create({
  baseURL: import.meta.env.VITE_API_BIENES_URL || 'http://localhost:8001/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
export default axiosBienes;



