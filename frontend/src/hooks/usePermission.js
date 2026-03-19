import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';

export function usePermission() {
  const role = useAuthStore((s) => s.role);
  const permissionsFlat = useAuthStore((s) => s.permissionsFlat);
  return useMemo(() => {
    const permsSet = new Set(Array.isArray(permissionsFlat) ? permissionsFlat : []);
    const isSysAdmin = role === 'SYSADMIN';
    const can = (perm) => {
      if (!perm || isSysAdmin) return true;
      return permsSet.has(perm); 
    };
    return {
      can,
      hasPermission: can,
      canAll: (...perms) => perms.every(can),
      canAny: (...perms) => perms.some(can),
    };
  }, [role, permissionsFlat]); 
}