import axiosBienes from '../api/axiosBienes';


const mantenimientosService = {
  listar: async (params = {}) => {
    const response = await axiosBienes.get('/mantenimientos/', { params });
    return response.data;
  },
  obtener: async (id) => {
    const response = await axiosBienes.get(`/mantenimientos/${id}/`);
    return response.data;
  },
  misMantenimientos: async (params = {}) => {
    const response = await axiosBienes.get('/mantenimientos/mis-mantenimientos/', { params });
    return response.data;
  },
  pendientesAprobacion: async () => {
    const response = await axiosBienes.get('/mantenimientos/pendientes-aprobacion/');
    return response.data;
  },
  descargarPDF: async (id) => {
    const response = await axiosBienes.get(`/mantenimientos/${id}/documento/`, {
      responseType: 'blob',
    });
    return response.data;
  },
  crear: async (data) => {
    const response = await axiosBienes.post('/mantenimientos/', data);
    return response.data;
  },
  subirImagen: async (id, imagen, descripcion = '') => {
    const formData = new FormData();
    formData.append('imagen', imagen);
    formData.append('descripcion', descripcion);
    const response = await axiosBienes.post(`/mantenimientos/${id}/imagenes/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  eliminarImagen: async (id, imagen_id) => {
    const response = await axiosBienes.delete(`/mantenimientos/${id}/imagenes/${imagen_id}/`);
    return response.data;
  },





  enviarAprobacion: async (id, data) => {
    const response = await axiosBienes.patch(`/mantenimientos/${id}/enviar-aprobacion/`, data);
    return response.data;
  },
  aprobar: async (id, observacion = '') => {
    const response = await axiosBienes.patch(`/mantenimientos/${id}/aprobar/`, { observacion });
    return response.data;
  },
  devolver: async (id, motivo) => {
    const response = await axiosBienes.patch(`/mantenimientos/${id}/devolver/`, {
      motivo_devolucion: motivo,
    });
    return response.data;
  },
  cancelar: async (id, data) => {
    const response = await axiosBienes.patch(`/mantenimientos/${id}/cancelar/`, data);
    return response.data;
  },
  subirFirmado: async (id, archivo) => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    const response = await axiosBienes.post(`/mantenimientos/${id}/pdf-firmado/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default mantenimientosService;