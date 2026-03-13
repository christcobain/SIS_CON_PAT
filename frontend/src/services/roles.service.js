import axiosUsuarios from '../api/axiosUsuarios';


const rolesService = {
  listar: async () => {
    const response = await axiosUsuarios.get('/roles/roles/');
    return response.data;
  },
  obtener: async (id) => {
    const response = await axiosUsuarios.get(`/roles/roles/${id}/`);
    return response.data;
  },
  crear: async (data) => {
    const response = await axiosUsuarios.post('/roles/roles/', data);
    return response.data;
  },
  actualizar: async (id, data) => {
    const response = await axiosUsuarios.patch(`/roles/roles/${id}/`, data);
    return response.data;
  },
  activar: async (id) => {
    const response = await axiosUsuarios.put(`/roles/roles/${id}/activate/`);
    return response.data;
  },
  desactivar: async (id) => {
    const response = await axiosUsuarios.delete(`/roles/roles/${id}/deactivate/`);
    return response.data;
  },

  obtenerPermisosPorRol: async (id) => {
    const response = await axiosUsuarios.get(`/roles/roles/${id}/role_permissions/`);
    return response.data;
  },
  sincronizarPermisos: async (id, permissionIds) => {
    const response = await axiosUsuarios.put(`/roles/roles/${id}/sync_permissions/`, {
      permission_ids: permissionIds,
    });
    return response.data;
  },
  
  obtenerArbolPermisos: async () => {
    const response = await axiosUsuarios.get('/roles/permissionstree/');
    return response.data;
  },
  listarPermisos: async (params = {}) => {
    const response = await axiosUsuarios.get('/roles/permissions/', { params });
    return response.data;
  },
  listarMicroservicios: async () => {
    const response = await axiosUsuarios.get('/roles/microservices/');
    return response.data;
  },
};

export default rolesService;