import { can } from './permissions.js';
import { httpError } from '../../core/errors.js';
import { q } from '../../core/db.js';

// Middleware для прав без контекста задачи.
// Контекстные проверки (своя/чужая задача) — через предикаты ниже.
export const requirePermission = (permission) => (req, _res, next) =>
  can(req.user, permission) ? next() : next(httpError(403, 'Недостаточно прав'));

// Членство в проекте: тимлид проекта или рядовой участник
export const isProjectLead = (user, projectId) =>
  !!projectId && !!q.get('SELECT 1 FROM projects WHERE id = ? AND lead_id = ?', projectId, user.id);
export const isProjectMember = (user, projectId) =>
  !!projectId && (isProjectLead(user, projectId) || !!q.get(
    'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?', projectId, user.id));

// memberKinds — массив ролей пользователя в задаче ('participant'|'observer')
// плюс вычисленные 'creator'/'assignee'. Возвращает null, если не участвует.
export function taskInvolvement(user, task, memberKinds) {
  const kinds = new Set(memberKinds);
  if (task.creator_id === user.id) kinds.add('creator');
  if (task.assignee_id === user.id) kinds.add('assignee');
  return kinds.size ? kinds : null;
}

export const canSeeTask = (user, task, kinds) =>
  can(user, 'task.view.all')
  || taskInvolvement(user, task, kinds) !== null
  || isProjectMember(user, task.project_id);

export const canChangeStatus = (user, task, kinds) => {
  if (can(user, 'task.status.any') || isProjectLead(user, task.project_id)) return true;
  const inv = taskInvolvement(user, task, kinds);
  return (can(user, 'task.status.own') && inv !== null && !inv.has('observer'))
    || (inv?.has('creator') ?? false)
    // участник проекта может двигать задачи проекта по доске
    || isProjectMember(user, task.project_id);
};

export const canEditTask = (user, task) =>
  can(user, 'task.update.any')
  || isProjectLead(user, task.project_id)
  || (can(user, 'task.update.own') && task.creator_id === user.id);

export const canAssign = (user, targetUserId, task) => {
  if (can(user, 'task.assign.any') || isProjectLead(user, task.project_id)) return true;
  if (!can(user, 'task.assign.self')) return false;
  // manager может назначить только себя и только на свою созданную задачу
  return targetUserId === user.id && task.creator_id === user.id;
};

export const canDeleteTask = (user, task) =>
  can(user, 'task.delete') || isProjectLead(user, task.project_id);

// Комментировать/файлы/время — внутри видимых задач, наблюдатель не может
export const canInteract = (user, task, kinds, perm) => {
  if (can(user, 'task.update.any') || isProjectLead(user, task.project_id)) return true;
  const inv = taskInvolvement(user, task, kinds);
  return (can(user, perm) && inv !== null && !inv.has('observer'))
    || isProjectMember(user, task.project_id);
};

// SQL-условие видимости списка задач — используется tasks/repo и search/query
export function visibleTasksWhere(user, alias = 't') {
  if (can(user, 'task.view.all')) return { sql: '1=1', params: [] };
  return {
    sql: `(${alias}.creator_id = ? OR ${alias}.assignee_id = ? OR ${alias}.project_id IN (
            SELECT pm.project_id FROM project_members pm WHERE pm.user_id = ?
            UNION SELECT p2.id FROM projects p2 WHERE p2.lead_id = ?)
          OR EXISTS (
            SELECT 1 FROM task_members tm WHERE tm.task_id = ${alias}.id AND tm.user_id = ?))`,
    params: [user.id, user.id, user.id, user.id, user.id],
  };
}
