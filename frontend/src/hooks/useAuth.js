import { useState, useCallback } from 'react';
import { useNavigate }           from 'react-router-dom';
import { useAuthStore }          from '../store/authStore';
import authService               from '../services/auth.service';

export function useAuth() {
  const navigate        = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const user            = useAuthStore((s) => s.user);
  const role            = useAuthStore((s) => s.role);
  const sedes           = useAuthStore((s) => s.sedes);
  const empresaId       = useAuthStore((s) => s.empresaId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth         = useAuthStore((s) => s.setAuth);
  const clearAuth       = useAuthStore((s) => s.clearAuth);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(username, password);
      setAuth(data);
      if (data.needs_password_warning) {
        window.dispatchEvent(new CustomEvent('sisconpat:openChangePassword', {
          detail: { mode: 'warning', username: data.username ?? username }
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
          detail: { mode: 'expired', username }
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

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Error en logout del servidor, limpiando estado local.', err);
    } finally {
      clearAuth();
      sessionStorage.removeItem('sisconpat_expired_user');
      setLoading(false);
      navigate('/login');
    }
  };

  // ── Refresh ───────────────────────────────────────────────────────────────
  const refrescarToken = useCallback(async () => {
    try {
      return await authService.refreshToken();
    } catch (err) {
      clearAuth();
      navigate('/login');
      throw err;
    }
  }, [clearAuth, navigate]);

  // ── Contraseñas ───────────────────────────────────────────────────────────
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
    } finally {
      setLoading(false);
    }
  };

  const cambiarPasswordUsuario = async (username, passwordNuevo) => {
    setLoading(true);
    try {
      return await authService.changePasswordByAdmin(username, passwordNuevo);
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al restablecer contraseña.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Política y Seguridad ──────────────────────────────────────────────────
  const obtenerPolitica             = async ()              => authService.getPasswordPolicyActive();
  const obtenerSesiones             = async (dni = null)    => authService.getSessions(dni);
  const configurarSesionMultiple    = async (u, optId)      => authService.setMultipleSession(u, optId);
  const consultarHistorialContrasenas = async (userId, lim = 5) => authService.getPasswordHistory(userId, lim);

  return {
    user, role, sedes, empresaId, isAuthenticated, loading, error,
    login, logout, refrescarToken,
    cambiarPassword, cambiarPasswordUsuario,
    obtenerPolitica, obtenerSesiones,
    configurarSesionMultiple, consultarHistorialContrasenas,
  };
}