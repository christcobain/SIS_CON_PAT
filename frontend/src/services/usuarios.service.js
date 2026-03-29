import axiosUsuarios from '../api/axiosUsuarios';


const usuariosService = {
  buscarEmpleadoPorDni: async (dni) => {
    const response = await axiosUsuarios.get(`/users/empleados/${dni}/`);
    return response.data;
  },
  listar: async (params = {}) => {
    const limpio = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const response = await axiosUsuarios.get('/users/users/', { params: limpio });
    return response.data;
  },
  filtrar: async (params = {}) => {
    const limpio = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const response = await axiosUsuarios.get('/users/users/filters/', { params: limpio });
    return response.data;
  },
  obtener: async (id) => {
    const response = await axiosUsuarios.get(`/users/users/${id}/`);
    return response.data;
  },
  crear: async (data) => {
    const response = await axiosUsuarios.post('/users/users/', data);
    return response.data;
  },  
  actualizar: async (id, data) => {
    const response = await axiosUsuarios.put(`/users/users/${id}/`, data);
    return response.data;
  },
  activar: async (id) => {
    const response = await axiosUsuarios.patch(`/users/users/${id}/activate/`);
    return response.data;
  },
  desactivar: async (id) => {
    const response = await axiosUsuarios.patch(`/users/users/${id}/deactivate/`);
    return response.data;
  },
  listarDependencias: async () => {
    const response = await axiosUsuarios.get('/users/dependencies/');
    return response.data;
  },
  obtenerDependencia: async (id) => {
    const response = await axiosUsuarios.get(`/users/dependencies/${id}/`);
    return response.data;
  },
  crearDependencia: async (data) => {
    const response = await axiosUsuarios.post('/users/dependencies/', data);
    return response.data;
  },
  actualizarDependencia: async (id, data) => {
    const response = await axiosUsuarios.put(`/users/dependencies/${id}/`, data);
    return response.data;
  },
  activarDependencia: async (id) => {
    const response = await axiosUsuarios.patch(`/users/dependencies/${id}/activate/`);
    return response.data;
  },
  desactivarDependencia: async (id) => {
    const response = await axiosUsuarios.patch(`/users/dependencies/${id}/deactivate/`);
    return response.data;
  },
  
};

export default usuariosService;