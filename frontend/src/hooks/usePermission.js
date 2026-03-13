import { useAuthStore } from '../store/authStore';

export function usePermission() {
  const role            = useAuthStore((s) => s.role);
  const permissionsFlat = useAuthStore((s) => s.permissionsFlat);

  const can = (perm) => {
    if (!perm) return true;
    if (role === 'SYSADMIN') return true;
    return Array.isArray(permissionsFlat) && permissionsFlat.includes(perm);
  };

  const canAll = (...perms) => perms.every(can);
  const canAny = (...perms) => perms.some(can);
  return { can, canAll, canAny };
}