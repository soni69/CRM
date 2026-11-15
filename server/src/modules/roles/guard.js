import { can } from './permissions.js';
import { httpError } from '../../core/errors.js';

// Middleware для прав без контекста задачи.
// Контекстные проверки (своя/чужая задача) — через предикаты ниже.
export const requirePermission = (permission) => (req, _res, next) =>
  can(req.user, permission) ? next() : next(httpError(403, 'Недостаточно прав'));

// memberKinds — массив ролей пользователя в задаче ('participant'|'observer')
// плюс вычисленные 'creator'/'assignee'. Возвращает null, если не участвует.
export function taskInvolvement(user, task, memberKinds) {
  const kinds = new Set(memberKinds);
  if (task.creator_id === user.id) kinds.add('creator');
  if (task.assignee_id === user.id) kinds.add('assignee');
  return kinds.size ? kinds : null;
}

export const canSeeTask = (user, task, kinds) =>
  can(user, 'task.view.all') || taskInvolvement(user, task, kinds) !== null;

export const canChangeStatus = (user, task, kinds) => {
  if (can(user, 'task.status.any')) return true;
  const inv = taskInvolvement(user, task, kinds);
  return can(user, 'task.status.own') && inv !== null && !inv.has('observer') || (inv?.has('creator') ?? false);
};

export const canEditTask = (user, task) =>
  can(user, 'task.update.any') || (can(user, 'task.update.own') && task.creator_id === user.id);

export const canAssign = (user, targetUserId, task) => {
  if (can(user, 'task.assign.any')) return true;
  if (!can(user, 'task.assign.self')) return false;
  // member может назначить только себя и только на свою созданную задачу
  return targetUserId === user.id && task.creator_id === user.id;
};

export const canDeleteTask = (user) => can(user, 'task.delete');

// Комментировать/файлы/время — внутри видимых задач, наблюдатель не может
export const canInteract = (user, task, kinds, perm) => {
  if (can(user, 'task.update.any')) return true;
  const inv = taskInvolvement(user, task, kinds);
  return can(user, perm) && inv !== null && !inv.has('observer');
};

// SQL-условие видимости списка задач — используется tasks/repo и search/query
export function visibleTasksWhere(user, alias = 't') {
  if (can(user, 'task.view.all')) return { sql: '1=1', params: [] };
  return {
    sql: `(${alias}.creator_id = ? OR ${alias}.assignee_id = ? OR EXISTS (
            SELECT 1 FROM task_members tm WHERE tm.task_id = ${alias}.id AND tm.user_id = ?))`,
    params: [user.id, user.id, user.id],
  };
}
