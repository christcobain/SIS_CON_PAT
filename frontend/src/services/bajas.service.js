import axiosBienes from '../api/axiosBienes';

const bajasService = {
  listar: async (params = {}) => {
    const limpio = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const response = await axiosBienes.get('/bajas/', { params: limpio });
    return response.data;
  },

  crear: async (data) => {
    const response = await axiosBienes.post('/bajas/', data);
    return response.data;
  },

  obtener: async (id) => {
    const response = await axiosBienes.get(`/bajas/${id}/`);
    return response.data?.data ?? response.data;
  },

  aprobar: async (id) => {
    const response = await axiosBienes.patch(`/bajas/${id}/aprobar/`);
    return response.data;
  },

  devolver: async (id, motivo) => {
    const response = await axiosBienes.patch(`/bajas/${id}/devolver/`, {
      motivo_devolucion: motivo,
    });
    return response.data;
  },

  cancelar: async (id, data) => {
    const response = await axiosBienes.patch(`/bajas/${id}/cancelar/`, data);
    return response.data;
  },

  reenviar: async (id, data) => {
    const response = await axiosBienes.patch(`/bajas/${id}/reenviar/`, data);
    return response.data;
  },

  descargarPDF: async (id, firmado = false) => {
    const response = await axiosBienes.get(`/bajas/${id}/descargar-pdf/`, {
      params: { 
        firmado: firmado ? '1' : '0' 
      },
      responseType: 'blob',
    });
    return response.data;
  },
  
  pdfFirmado: async (id, formData) => {
    const response = await axiosBienes.post(`/bajas/${id}/pdf-firmado/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  bienesParaBaja: async (params = {}) => {
    const response = await axiosBienes.get('/bajas/bienes-para-baja/', { params });
    return response.data;
  },

  mantenimientosDelBien: async (bienId) => {
    const response = await axiosBienes.get('/bajas/mantenimientos-del-bien/', {
      params: { bien_id: bienId },
    });
    return response.data;
  },
  // pendientesAprobacion: async () => {
  //   const response = await axiosBienes.get('/bajas/', {
  //     params: { estado_baja: 'PENDIENTE_APROBACION' },
  //   });
  //   return response.data;
  // },

  pendientesAprobacion: async () => {
    const response = await axiosBienes.get('/bajas/pendientes-aprobacion/');
    return response.data;
  },
};

export default bajasService;