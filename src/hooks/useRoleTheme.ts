import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { roleColors, type RoleColorKey } from '../constants/theme';

export function useRoleTheme() {
  const role = useAuthStore((s) => s.user?.role);

  return useMemo(() => {
    const key: RoleColorKey =
      role === 'teacher' || role === 'admin'
        ? 'teacher'
        : role === 'parent'
        ? 'parent'
        : 'student';

    return {
      ...roleColors[key],
      roleName: key,
    };
  }, [role]);
}
