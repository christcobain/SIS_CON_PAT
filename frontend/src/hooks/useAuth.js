import { useState, useCallback } from 'react';
import { useNavigate }  from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import authService      from '../services/auth.service';

export function useAuth() {
  const navigate        = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const user            = useAuthStore(s => s.user);
  const role            = useAuthStore(s => s.role);
  const sedes           = useAuthStore(s => s.sedes);
  const empresaId       = useAuthStore(s => s.empresaId);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const setAuth         = useAuthStore(s => s.setAuth);
  const clearAuth       = useAuthStore(s => s.clearAuth);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(username, password);
      setAuth(data);
      if (data.needs_password_warning) {
        window.dispatchEvent(new CustomEvent('sisconpat:openChangePassword', {
          detail: { mode: 'warning', username: data.username ?? username },
        }));
      } else {
        navigate('/dashboard');
      }
      return data;
    } catch (err) {
      const errData = err?.response?.data;
      const isExpired =
        errData?.success === false &&
        (errData?.error?.[0] === 'True' || errData?.error === 'True' ||
         String(errData?.error).includes('True'));
      if (isExpired) {
        window.dispatchEvent(new CustomEvent('sisconpat:openChangePassword', {
          detail: { mode: 'expired', username },
        }));
        return;
      }
      const msg = errData?.detail || errData?.error || errData?.non_field_errors?.[0] || 'Credenciales inválidas.';
      setError(typeof msg === 'string' ? msg : msg[0] ?? 'Error al iniciar sesión.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
        await authService.logout();
    } catch (err) {
        console.warn('Error en logout del servidor, limpiando estado local.', err);
    } finally {
        clearAuth();
        sessionStorage.clear();
        localStorage.removeItem('sisconpat_expired_user');
        localStorage.removeItem('sisconpat-auth-storage');
        setLoading(false);
        navigate('/login', { replace: true });
    }
};

  const refrescarToken = useCallback(async () => {
    try {
      return await authService.refreshToken();
    } catch (err) {
      clearAuth();
      navigate('/login');
      throw err;
    }
  }, [clearAuth, navigate]);

  const cambiarPassword = async (passwordActual, passwordNuevo, usernameOverride) => {
    const username = usernameOverride || user?.username || sessionStorage.getItem('sisconpat_expired_user');
    if (!username) throw new Error('No hay usuario identificado.');
    setLoading(true);
    try {
      const res = await authService.changePasswordSelf(username, passwordActual, passwordNuevo);
      sessionStorage.removeItem('sisconpat_expired_user');
      return res;
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al cambiar contraseña.');
      throw err;
    } finally { setLoading(false); }
  };

  const cambiarPasswordUsuario = async (username, passwordNuevo) => {
    setLoading(true);
    try {
      return await authService.changePasswordByAdmin(username, passwordNuevo);
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al restablecer contraseña.');
      throw err;
    } finally { setLoading(false); }
  };

  const resetearPasswordPorDni    = async (username)      => authService.resetPasswordByDni(username);
  const obtenerPolitica           = async ()              => authService.getPasswordPolicyActive();
  const listarPoliticas           = async ()              => authService.listarPoliticas();
  const crearPolitica             = async (data)          => authService.crearPolitica(data);
  const actualizarPolitica        = async (id, data)      => authService.actualizarPolitica(id, data);
  const activarPolitica           = async (id)            => authService.activarPolitica(id);
  const desactivarPolitica        = async (id)            => authService.desactivarPolitica(id);
  const obtenerSesiones           = async (dni = null)    => authService.getSessions(dni);
  const obtenerHistorialSesiones  = async (params = {})   => authService.getSessionsHistorial(params);
  const obtenerIntentos           = async (params = {})   => authService.getLoginAttempts(params);
  const obtenerCredenciales       = async (params = {})   => authService.getCredentials(params);
  const desbloquearCredencial     = async (username)      => authService.unlockCredential(username);
  const configurarSesionMultiple  = async (u, optId)      => authService.setMultipleSession(u, optId);
  const consultarHistorialContrasenas = async (userId, lim = 5) => authService.getPasswordHistory(userId, lim);

  return {
    user, role, sedes, empresaId, isAuthenticated, loading, error,
    login, logout, refrescarToken,
    cambiarPassword, cambiarPasswordUsuario, resetearPasswordPorDni,
    obtenerPolitica, listarPoliticas,
    crearPolitica, actualizarPolitica, activarPolitica, desactivarPolitica,
    obtenerSesiones, obtenerHistorialSesiones,
    obtenerIntentos, obtenerCredenciales, desbloquearCredencial,
    configurarSesionMultiple, consultarHistorialContrasenas,
  };
}