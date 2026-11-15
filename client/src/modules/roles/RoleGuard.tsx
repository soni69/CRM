import type { ReactNode } from 'react';
import { useCan } from './hooks';
import type { Permission } from '@crm/contracts';

export function RoleGuard({ need, children }: { need: Permission; children: ReactNode }) {
  const can = useCan();
  return can(need) ? <>{children}</> : null;
}
