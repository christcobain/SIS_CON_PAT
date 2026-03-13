import axiosBienes from '../api/axiosBienes';


const bienesService = {
  listar: async (params = {}) => {
    const response = await axiosBienes.get('/bienes/', { params });
    return response.data;
  },
  obtener: async (id) => {
    const response = await axiosBienes.get(`/bienes/${id}/`);
    return response.data;
  },
  crear: async (data) => {
    const response = await axiosBienes.post('/bienes/', data);
    return response.data;
  },
  actualizar: async (id, data) => {
    const response = await axiosBienes.patch(`/bienes/${id}/`, data);
    return response.data;
  },
  listarPorUsuario: async (usuarioId) => {
    const response = await axiosBienes.get(`/bienes/usuario/${usuarioId}/`);
    return response.data;
  },
  listarDisponiblesSede: async (sedeId) => {
    const response = await axiosBienes.get(`/bienes/disponibles/${sedeId}/`);
    return response.data;
  },
};

export default bienesService;