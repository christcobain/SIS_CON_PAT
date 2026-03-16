import axiosBienes from '../api/axiosBienes';

const transferenciasService = {  
  listar: async (params = {}) => {
    const response = await axiosBienes.get('/transferencias/', { params });
    return response.data;
  },
  obtener: async (id) => {
    const response = await axiosBienes.get(`/transferencias/${id}/`);
    return response.data;
  },
  misTransferencias: async (usuarioI,params = {}) => {
    // const response = await axiosBienes.get('/transferencias/mis-transferencias/', { params,usuarioId:usuarioI });
    const response = await axiosBienes.get('/transferencias/mis-transferencias/', { 
        params: { 
            ...params, 
            usuario_id: usuarioI 
        } 
    });
    return response.data;
  },
  descargarPDF: async (id) => {
    const response = await axiosBienes.get(`/transferencias/${id}/documento/`, {
      responseType: 'blob',
    });
    return response.data;
  },
  // ==========================================
  // CREACIÓN DE MOVIMIENTOS
   crearTraslado: async (data) => {
    const response = await axiosBienes.post('/transferencias/traslado/', data);
    return response.data;
  },
  crearAsignacion: async (data) => {
    const response = await axiosBienes.post('/transferencias/asignacion/', data);
    return response.data;
  },
  // ==========================================
   aprobarAdminSede: async (id) => {
    const response = await axiosBienes.patch(`/transferencias/${id}/aprobar-adminsede/`);
    return response.data;
  },
  devolver: async (id, data) => {
    const response = await axiosBienes.patch(`/transferencias/${id}/devolver/`, data);
    return response.data;
  },
  aprobarSalidaSeguridad: async (id, data = {}) => {
    const response = await axiosBienes.patch(`/transferencias/${id}/aprobar-segur-salida/`, data);
    return response.data;
  },
  aprobarEntradaSeguridad: async (id, data = {}) => {
    const response = await axiosBienes.patch(`/transferencias/${id}/aprobar-segur-entrada/`, data);
    return response.data;
  },
  rechazarSalidaSeguridad: async (id, data = {}) => {
    const response = await axiosBienes.patch(`/transferencias/${id}/rechazar-segur-salida/`, data);
    return response.data;
  },
  rechazarEntradaSeguridad: async (id, data = {}) => {
    const response = await axiosBienes.patch(`/transferencias/${id}/rechazar-segur-entrada/`, data);
    return response.data;
  },
  // ==========================================
  // RETORNOS (NUEVO: Acciones para devoluciones de bienes)
  retornoSalida: async (id, data) => {
    const response = await axiosBienes.post(`/transferencias/${id}/aprobar-retorno-salida/`, data);
    return response.data;
  },
  retornoEntrada: async (id, data) => {
    const response = await axiosBienes.post(`/transferencias/${id}/aprobar-retorno-entrada/`, data);
    return response.data;
  },
  // ==========================================
  // GESTIÓN DE ESTADOS
  cancelar: async (id, data) => {
    const response = await axiosBienes.patch(`/transferencias/${id}/cancelar/`, data);
    return response.data;
  },
  reenviar: async (id, data = {}) => {
    const response = await axiosBienes.patch(`/transferencias/${id}/reenviar/`, data);
    return response.data;
  },
  subirFirmado: async (id, archivo) => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    const response = await axiosBienes.post(`/transferencias/${id}/subir-firmado/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  confirmarRecepcion:async(id, data = {})=>{
    const response = await axiosBienes.patch(`/transferencias/${id}/confirmar-recepcion/`, data);
    return response.data;

  },
};

export default transferenciasService;