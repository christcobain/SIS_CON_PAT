import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';


export default function PermissionRoute({ perm, role, redirect = '/403' }) {
  const userRole        = useAuthStore((s) => s.role);
  const permissionsFlat = useAuthStore((s) => s.permissionsFlat);
  if (userRole === 'SYSADMIN') return <Outlet />;
  if (role && userRole !== role) return <Navigate to={redirect} replace />;
  if (perm && !permissionsFlat.includes(perm)) return <Navigate to={redirect} replace />;

  return <Outlet />;
}