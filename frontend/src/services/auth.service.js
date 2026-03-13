import axiosUsuarios from '../api/axiosUsuarios';

const authService = {
  // ==========================================
  // SESIÓN Y TOKENS
  login: async (username, password) => {
    const response = await axiosUsuarios.post('/auth/login/', { username, password });
    return response.data;
  },
  logout: async () => {
    const response = await axiosUsuarios.post('/auth/logout/');
    return response.data;
  },
  refreshToken: async () => {
    const response = await axiosUsuarios.post('/auth/refreshtokens/');
    return response.data;
  },
  // ==========================================
  // GESTIÓN DE CONTRASEÑAS
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