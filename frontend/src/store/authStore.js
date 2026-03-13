import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,          
  role: null,         
  permissions: {},     
  permissionsFlat: [], 
  modulo_id: null,    
  modulo_nombre: null, 
  sedes: [],          
  empresaId: null,
  empresaNombre: null,
  passwordExpiresInDays: null,
  needsPasswordWarning: false,
  isAuthenticated: false,

  setAuth: (data) =>
    set({
      user: {
        id: data.id,
        username: data.username,
        nombres: data.nombres,
        apellidos: data.apellidos,
      },
      role: data.role,
      permissions: data.permissions || {},
      permissionsFlat: data.permissions_flat || [],
      modulo_id: data.modulo_id || null,
      modulo_nombre: data.modulo_nombre || null,
      sedes: data.sedes || [],
      empresaId: data.empresa_id || null,
      empresaNombre: data.empresa_nombre || null,
      passwordExpiresInDays: data.password_expires_in_days ?? null,
      needsPasswordWarning: data.needs_password_warning || false,
      isAuthenticated: true,
    }),

  clearAuth: () =>
    set({
      user: null,
      role: null,
      permissions: {},
      permissionsFlat: [],
      sedes: [],
      empresaId: null,
      empresaNombre: null,
      passwordExpiresInDays: null,
      needsPasswordWarning: false,
      isAuthenticated: false,
    }),
}));

export { useAuthStore };