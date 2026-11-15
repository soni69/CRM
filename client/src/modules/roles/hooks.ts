import { useAuth } from '../auth';
import { PERM_MATRIX } from './permissions';
import type { Permission } from '@crm/contracts';

export function useCan() {
  const { user } = useAuth();
  return (perm: Permission) => (user ? PERM_MATRIX[user.role]?.includes(perm) ?? false : false);
}
