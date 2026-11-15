// Зеркало серверной матрицы — только для сокрытия UI.
// Все проверки настоящие — на сервере.
import type { Permission, Role } from '@crm/contracts';

const MEMBER: Permission[] = [
  'task.create', 'task.status.own', 'task.update.own', 'task.assign.self',
  'task.comment', 'task.files', 'task.time',
];
const MANAGER: Permission[] = [
  ...MEMBER, 'task.view.all', 'task.status.any', 'task.update.any',
  'task.assign.any', 'task.delete', 'report.team', 'transfer.all',
];
const ADMIN: Permission[] = [...MANAGER, 'user.manage'];

export const PERM_MATRIX: Record<Role, Permission[]> = { member: MEMBER, manager: MANAGER, admin: ADMIN };
