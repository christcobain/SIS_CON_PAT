import axiosUsuarios from '../api/axiosUsuarios';


const locacionesService = {

  // ==========================================
  // EMPRESAS 
  listarEmpresas: async () => {
    const response = await axiosUsuarios.get('/locations/empresas/');
    return response.data;
  },
  obtenerEmpresa: async (id) => {
    const response = await axiosUsuarios.get(`/locations/empresas/${id}/`);
    return response.data;
  },
  crearEmpresa: async (data) => {
    const response = await axiosUsuarios.post('locations//empresas/', data);
    return response.data;
  },
  actualizarEmpresa: async (id, data) => {
    const response = await axiosUsuarios.put(`/locations/empresas/${id}/`, data);
    return response.data;
  },
  activarEmpresa: async (id) => {
    const response = await axiosUsuarios.patch(`/locations/empresas/${id}/activate/`);
    return response.data;
  },
  desactivarEmpresa: async (id) => {
    const response = await axiosUsuarios.patch(`/locations/empresas/${id}/deactivate/`);
    return response.data;
  },
  // ==========================================
  // UBICACIONES (GEOGRÁFICAS)
  listarDepartamentos: async () => {
    const response = await axiosUsuarios.get('/locations/departamentos/');
    return response.data;
  },
  obtenerDepartamento: async (id) => {
    const response = await axiosUsuarios.get(`/locations/departamentos/${id}/`);
    return response.data;
  },
  listarProvincias: async () => {
    const response = await axiosUsuarios.get('/locations/provincias/');
    return response.data;
  },
  obtenerProvincia: async (id) => {
    const response = await axiosUsuarios.get(`/locations/provincias/${id}/`);
    return response.data;
  },
  listarDistritos: async () => {
    const response = await axiosUsuarios.get('/locations/distritos/');
    return response.data;
  },
  obtenerDistrito: async (id) => {
    const response = await axiosUsuarios.get(`/locations/distritos/${id}/`);
    return response.data;
  },
  // ==========================================
  // SEDES
  listarSedes: async () => {
    const response = await axiosUsuarios.get('/locations/sedes/');
    return response.data;
  },
  obtenerSede: async (id) => {
    const response = await axiosUsuarios.get(`/locations/sedes/${id}/`);
    return response.data;
  },
  crearSede: async (data) => {
    const response = await axiosUsuarios.post('/locations/sedes/', data);
    return response.data;
  },
  actualizarSede: async (id, data) => {
    const response = await axiosUsuarios.put(`/locations/sedes/${id}/`, data);
    return response.data;
  },
  activarSede: async (id) => {
    const response = await axiosUsuarios.patch(`/locations/sedes/${id}/activate/`);
    return response.data;
  },
  desactivarSede: async (id) => {
    const response = await axiosUsuarios.patch(`/locations/sedes/${id}/deactivate/`);
    return response.data;
  },
  
  // ==========================================
  // MÓDULOS

  listarModulos: async () => {
    const response = await axiosUsuarios.get('/locations/modulos/');
    return response.data;
  },
  obtenerModulo: async (id) => {
    const response = await axiosUsuarios.get(`/locations/modulos/${id}/`);
    return response.data;
  },
  crearModulo: async (data) => {
    const response = await axiosUsuarios.post('/locations/modulos/', data);
    return response.data;
  },
  actualizarModulo: async (id, data) => {
    const response = await axiosUsuarios.put(`/locations/modulos/${id}/`, data);
    return response.data;
  },
  activarModulo: async (id) => {
    const response = await axiosUsuarios.patch(`/locations/modulos/${id}/activate/`);
    return response.data;
  },
  desactivarModulo: async (id) => {
    const response = await axiosUsuarios.patch(`/locations/modulos/${id}/deactivate/`);
    return response.data;
  },
  // ==========================================
  // UBICACIONES (FÍSICAS / OFICINAS)
  listarUbicaciones: async () => {
    const response = await axiosUsuarios.get('/locations/ubicaciones/');
    return response.data;
  },
  obtenerUbicacion: async (id) => {
    const response = await axiosUsuarios.get(`/locations/ubicaciones/${id}/`);
    return response.data;
  },
  crearUbicacion: async (data) => {
    const response = await axiosUsuarios.post('/locations/ubicaciones/', data);
    return response.data;
  },
  actualizarUbicacion: async (id, data) => {
    const response = await axiosUsuarios.put(`/locations/ubicaciones/${id}/`, data);
    return response.data;
  },
  activarUbicacion: async (id) => {
    const response = await axiosUsuarios.patch(`/locations/ubicaciones/${id}/activate/`);
    return response.data;
  },
  desactivarUbicacion: async (id) => {
    const response = await axiosUsuarios.patch(`/locations/ubicaciones/${id}/deactivate/`);
    return response.data;
  },
};

export default locacionesService;