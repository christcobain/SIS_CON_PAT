import axiosUsuarios from '../api/axiosUsuarios';

const authService = {
  // ==========================================
  // SESIÓN Y TOKENS
  login: async (username, password) => {
    const response = await axiosUsuarios.post('/auth/login/', { username, password });
    return response.data;
  },
  logout: async () => {
    const response = await axiosUsuarios.post('/auth/logout/', {}, { withCredentials: true });
    return response.data;
  },
  refreshToken: async () => {
    const response = await axiosUsuarios.post('/auth/refreshtokens/');
    return response.data;
  },
  // ==========================================
  // GESTIÓN DE CONTRASEÑAS Y POLITICAS
  changePasswordSelf: async (username, currentPassword, newPassword) => {
    const response = await axiosUsuarios.post('/auth/changepassworduser/', {
      username: username,
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
  changePasswordByAdmin: async (username, newPassword) => {
    const response = await axiosUsuarios.post('/auth/changepassword/', {
      username: username,
      new_password: newPassword,
    });
    return response.data;
  },
  resetPasswordByDni: async (username) => {
    const response = await axiosUsuarios.post('/auth/changepassword/', { username });
    return response.data;
  },  

  listarPoliticas: async () => {
    const response = await axiosUsuarios.get('/auth/passwordpolicy/');
    return response.data;
  },  
  detallePolitica:async(id)=>{
    const response = await axiosUsuarios.get(`/auth/passwordpolicy/${id}/`);
    return response.data;
  
  },
  crearPolitica:async(body)=>{
    const response = await axiosUsuarios.post('/auth/passwordpolicy/',{ body });
    return response.data;
  },
  actualizarPolitica:async(id,body)=>{
    const response = await axiosUsuarios.put(`/auth/passwordpolicy/${id}/`, body );
    return response.data;
  },
  activarPolitica:async(id)=>{
    const response = await axiosUsuarios.put(`/auth/passwordpolicy/${id}/activate/` );
    return response.data;
  },
  desactivarPolitica:async(id)=>{
    const response = await axiosUsuarios.put(`/auth/passwordpolicy/${id}/deactivate/` );
    return response.data;
  },
  getPasswordPolicyActive: async () => {
    const response = await axiosUsuarios.get('/auth/passwordpolicy/active/');
    return response.data;
  },

  // ==========================================
  // MONITOREO Y CONFIGURACIÓN (SYSADMIN)
  getSessions: async (dni = null) => {
    const params = dni ? { dni } : {};
    const response = await axiosUsuarios.get('/auth/login/sessions/', { params });
    return response.data;
  },
  getSessionsHistorial: async (params = {}) => {
    const response = await axiosUsuarios.get('/auth/login/sessions/historial/', { params });
    return response.data;
  },
   getLoginAttempts: async (params = {}) => {
    const response = await axiosUsuarios.get('/auth/login/attempts/', { params });
    return response.data;
  },
 
  getCredentials: async (params = {}) => {
    const response = await axiosUsuarios.get('/auth/credentials/', { params });
    return response.data;
  },
  unlockCredential: async (username) => {
    const response = await axiosUsuarios.post('/auth/credentials/unlock/', { username });
    return response.data;
  },
  setMultipleSession: async (username, optionId) => {
    const response = await axiosUsuarios.post('/auth/multiplesession/', {
      username,
      option_id: optionId
    });
    return response.data;
  },
  getPasswordHistory: async (userId, limit = 5) => {
    const response = await axiosUsuarios.post('/auth/passwordhistory/', {
      user_id: userId,
      limit: limit
    });
    return response.data;
  }
};

export default authService;