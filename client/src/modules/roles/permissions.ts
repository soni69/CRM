// Зеркало серверной матрицы — только для сокрытия UI.
// Все проверки настоящие — на сервере.
import type { Permission, Role } from '@crm/contracts';

const MANAGER: Permission[] = [
  'task.create', 'task.status.own', 'task.update.own', 'task.assign.self',
  'task.comment', 'task.files', 'task.time',
];
const LEAD: Permission[] = [
  ...MANAGER, 'project.manage', 'board.manage', 'report.team', 'transfer.all',
];
const ADMIN: Permission[] = [
  ...LEAD, 'user.manage', 'task.view.all', 'task.status.any',
  'task.update.any', 'task.assign.any', 'task.delete',
];

export const PERM_MATRIX: Record<Role, Permission[]> = { manager: MANAGER, lead: LEAD, admin: ADMIN };
