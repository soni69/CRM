// Матрица прав — единственное место, где она определена на сервере.
// Зеркало для UI: client/src/modules/roles/permissions.ts
// manager — исполнитель в проектах; lead — тимлид проекта; admin — владелец всего.
const MANAGER = [
  'task.create',
  'task.status.own',
  'task.update.own',
  'task.assign.self',
  'task.comment',
  'task.files',
  'task.time',
];
const LEAD = [
  ...MANAGER,
  'project.manage',   // создавать проекты, управлять своими проектами (участники, задачи)
  'board.manage',     // колонки канбана, теги, спринты
  'report.team',
  'transfer.all',
];
const ADMIN = [
  ...LEAD,
  'user.manage',
  'task.view.all',
  'task.status.any',
  'task.update.any',
  'task.assign.any',
  'task.delete',
];

export const PERM_MATRIX = { manager: MANAGER, lead: LEAD, admin: ADMIN };

export function can(user, permission) {
  return PERM_MATRIX[user.role]?.includes(permission) ?? false;
}
