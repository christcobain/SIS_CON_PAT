import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermission } from '../hooks/usePermission';

export default function PermissionRoute({ perm, role: requiredRole, redirect = '/403' }) {
  const userRole = useAuthStore((s) => s.role);
  const { can, canAny } = usePermission();
  if (userRole === 'SYSADMIN') return <Outlet />;
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={redirect} replace />;
  }
  if (perm) {
    const tienePermiso = Array.isArray(perm) 
      ? canAny(...perm) 
      : can(perm);
    if (!tienePermiso) {
      return <Navigate to={redirect} replace />;
    }
  }

  return <Outlet />;
}