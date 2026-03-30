import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; 

const useAuthStore = create(
  persist( 
    (set) => ({
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
      accessToken: null,

      setAuth: (data) =>
        set({
          user: {
            id: data.id,
            username: data.username,
            nombres: data.nombres,
            apellidos: data.apellidos,
            cargo:  data.cargo,
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
          accessToken: data.access ?? null,
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
          accessToken: null 
        }),
    }),
    {
      name: 'sisconpat-auth-storage', 
      storage: createJSONStorage(() => localStorage), 
    }
  )
);

export { useAuthStore };