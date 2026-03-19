import { usePermission } from '../../hooks/usePermission';

export default function Can({ perform, children, fallback = null }) {
  const { can } = usePermission();
  return can(perform) ? children : fallback;
}