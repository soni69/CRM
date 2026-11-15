// Матрица прав — единственное место, где она определена на сервере.
// Зеркало для UI: client/src/modules/roles/permissions.ts
const MEMBER = [
  'task.create',
  'task.status.own',
  'task.update.own',
  'task.assign.self',
  'task.comment',
  'task.files',
  'task.time',
];
const MANAGER = [
  ...MEMBER,
  'task.view.all',
  'task.status.any',
  'task.update.any',
  'task.assign.any',
  'task.delete',
  'report.team',
  'transfer.all',
];
const ADMIN = [...MANAGER, 'user.manage'];

export const PERM_MATRIX = { member: MEMBER, manager: MANAGER, admin: ADMIN };

export function can(user, permission) {
  return PERM_MATRIX[user.role]?.includes(permission) ?? false;
}
