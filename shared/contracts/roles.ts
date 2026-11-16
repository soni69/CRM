// Имена прав — контракт между сервером (requirePermission) и клиентом (useCan).
// Сама матрица живёт в server/src/modules/roles/permissions.js,
// её зеркало для UI — client/src/modules/roles/permissions.ts.
export const PERMISSIONS = [
  'task.create',
  'task.view.all',        // видеть чужие задачи
  'task.status.own',      // статус у задач, где участвуешь
  'task.status.any',
  'task.update.own',      // редактировать свои созданные
  'task.update.any',
  'task.assign.self',     // назначать только себя
  'task.assign.any',
  'task.delete',
  'task.comment',
  'task.files',
  'task.time',
  'user.manage',
  'report.team',          // отчёты по команде (иначе — только по себе)
  'transfer.all',         // экспорт чужих задач (иначе — только своих)
  'project.manage',       // создавать/вести проекты (тимлид и админ)
  'board.manage',         // колонки, теги, спринты
] as const;
export type Permission = (typeof PERMISSIONS)[number];
