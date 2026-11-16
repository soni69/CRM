import { httpError } from '../../core/errors.js';
import {
  can, canSeeTask, canChangeStatus, canEditTask, canAssign, canDeleteTask, taskInvolvement,
} from '../roles/index.js';
import { recordEvent } from '../history/index.js';
import { columnByKey } from '../columns/index.js';
import { projectExists } from '../projects/index.js';
import { isProjectMember, isProjectLead } from '../roles/index.js';
import {
  getTask, attachView, listTasks, memberKinds, createTaskRow, updateTaskRow,
  setTaskTags, setTaskMembers, deleteTaskRow, tx, q,
} from './repo.js';

const userExists = (id) => !!q.get('SELECT 1 FROM users WHERE id = ?', id);
const sprintExists = (id) => !!q.get('SELECT 1 FROM sprints WHERE id = ?', id);

// Исполнитель/участники должны быть членами проекта задачи
function assertProjectFit(user, projectId, userIds) {
  if (!projectId) return;
  for (const uid of userIds.filter(Boolean)) {
    if (!isProjectMember({ id: uid }, projectId)) {
      throw httpError(400, 'Исполнитель и участники должны быть членами проекта');
    }
  }
}

export function mustSeeTask(user, id) {
  const task = getTask(id);
  if (!task || !canSeeTask(user, task, memberKinds(task.id, user.id))) {
    throw httpError(404, 'Задача не найдена');
  }
  return task;
}

export function createTask(user, data) {
  if (!can(user, 'task.create')) throw httpError(403, 'Недостаточно прав');

  if (data.assignee_id != null) {
    if (!userExists(data.assignee_id)) throw httpError(400, 'Исполнитель не найден');
    // admin — любого, тимлид — в своём проекте, manager — только себя
    const canSet = can(user, 'task.assign.any')
      || isProjectLead(user, data.project_id)
      || data.assignee_id === user.id;
    if (!canSet) throw httpError(403, 'Можно назначать только себя');
  }
  if (data.parent_id != null && !getTask(data.parent_id)) throw httpError(400, 'Родительская задача не найдена');
  if (data.sprint_id != null && !sprintExists(data.sprint_id)) throw httpError(400, 'Спринт не найден');
  if (data.project_id != null) {
    if (!projectExists(data.project_id)) throw httpError(400, 'Проект не найден');
    if (user.role !== 'admin' && !isProjectMember(user, data.project_id)) {
      throw httpError(403, 'Вы не участник этого проекта');
    }
    assertProjectFit(user, data.project_id,
      [data.assignee_id, ...(data.participant_ids ?? []), ...(data.observer_ids ?? [])]);
  }

  const id = tx(() => {
    const id = createTaskRow(data, user.id);
    setTaskMembers(id, data.participant_ids ?? [], data.observer_ids ?? []);
    setTaskTags(id, data.tag_ids ?? []);
    recordEvent(id, user.id, 'created', { title: data.title });
    return id;
  })();
  return attachView([getTask(id)])[0];
}

export function updateTask(user, id, data) {
  const task = mustSeeTask(user, id);
  if (!canEditTask(user, task)) throw httpError(403, 'Нет прав на редактирование');

  const diff = {};
  for (const f of ['title', 'description', 'priority', 'start_date', 'due_date', 'due_time', 'parent_id', 'sprint_id', 'project_id', 'time_estimate']) {
    if (f in data) diff[f] = data[f];
  }
  if ('assignee_id' in data && data.assignee_id !== task.assignee_id) {
    if (!canAssign(user, data.assignee_id, task)) throw httpError(403, 'Нет прав назначить этого исполнителя');
    diff.assignee_id = data.assignee_id;
  }
  if (data.parent_id != null && !getTask(data.parent_id)) throw httpError(400, 'Родительская задача не найдена');
  if (data.sprint_id != null && data.sprint_id !== task.sprint_id && !sprintExists(data.sprint_id)) {
    throw httpError(400, 'Спринт не найден');
  }
  const nextProject = 'project_id' in data ? data.project_id : task.project_id;
  if (data.project_id != null && data.project_id !== task.project_id) {
    if (!projectExists(data.project_id)) throw httpError(400, 'Проект не найден');
    if (user.role !== 'admin' && !isProjectMember(user, data.project_id)) {
      throw httpError(403, 'Вы не участник этого проекта');
    }
  }
  if (nextProject) {
    const nextAssignee = 'assignee_id' in data ? data.assignee_id : task.assignee_id;
    const curMembers = q.all('SELECT user_id FROM task_members WHERE task_id = ?', id).map((r) => r.user_id);
    assertProjectFit(user, nextProject,
      [nextAssignee, ...(data.participant_ids ?? curMembers), ...(data.observer_ids ?? [])]);
  }

  tx(() => {
    if (Object.keys(diff).length) {
      updateTaskRow(id, diff);
      recordEvent(id, user.id, 'field', { fields: Object.keys(diff) });
    }
    if ('participant_ids' in data || 'observer_ids' in data) {
      const cur = q.all('SELECT user_id, kind FROM task_members WHERE task_id = ?', id);
      setTaskMembers(id, data.participant_ids ?? cur.filter((m) => m.kind === 'participant').map((m) => m.user_id),
        data.observer_ids ?? cur.filter((m) => m.kind === 'observer').map((m) => m.user_id));
      recordEvent(id, user.id, 'member', { participants: data.participant_ids, observers: data.observer_ids });
    }
    if ('tag_ids' in data) {
      setTaskTags(id, data.tag_ids);
      recordEvent(id, user.id, 'tag', { tag_ids: data.tag_ids });
    }
  })();
  return attachView([getTask(id)])[0];
}

export function setStatus(user, id, status) {
  const task = mustSeeTask(user, id);
  if (!canChangeStatus(user, task, memberKinds(task.id, user.id))) {
    throw httpError(403, 'Нет прав менять статус этой задачи');
  }
  const target = columnByKey(status);
  if (!target) throw httpError(400, 'Неизвестный статус');
  const source = columnByKey(task.status);
  if (source?.allowed_to && !source.allowed_to.includes(status)) {
    throw httpError(400, `Из «${source.name}» нельзя перейти в «${target.name}» — запрещено правилами колонки`);
  }
  tx(() => {
    updateTaskRow(id, { status });
    recordEvent(id, user.id, 'status', { from: task.status, to: status });
    // Автоподзадачи при входе в колонку
    for (const title of target.auto_subtasks) {
      const { lastInsertRowid } = q.run(
        `INSERT INTO tasks (title, status, priority, creator_id, parent_id) VALUES (?,?,?,?,?)`,
        title, status, task.priority, user.id, task.id,
      );
      recordEvent(Number(lastInsertRowid), user.id, 'created', { via: 'column_automation', column: status });
    }
  })();
  return attachView([getTask(id)])[0];
}

export function setRecurrence(user, id, freq) {
  const task = mustSeeTask(user, id);
  if (!canEditTask(user, task)) throw httpError(403, 'Нет прав на редактирование');
  let recurrence = null;
  if (freq) {
    const base = task.due_date || new Date().toISOString().slice(0, 10);
    recurrence = JSON.stringify({ freq, next_run: base });
  }
  updateTaskRow(id, { recurrence });
  recordEvent(id, user.id, 'field', { fields: ['recurrence'], freq });
  return attachView([getTask(id)])[0];
}

export function deleteTask(user, id) {
  const task = mustSeeTask(user, id);
  if (!canDeleteTask(user, task)) throw httpError(403, 'Нет прав на удаление');
  deleteTaskRow(id);
}

export function bulk(user, { ids, action, value }) {
  const done = [], failed = [];
  for (const id of ids) {
    try {
      if (action === 'status') setStatus(user, id, value);
      else if (action === 'assign') {
        const task = mustSeeTask(user, id);
        if (!canAssign(user, value, task)) throw httpError(403, 'Нет прав');
        updateTaskRow(id, { assignee_id: value });
        recordEvent(id, user.id, 'assignee', { to: value });
        done.push(id); continue;
      } else if (action === 'delete') deleteTask(user, id);
      done.push(id);
    } catch (e) {
      failed.push({ id, error: e.message });
    }
  }
  return { done, failed };
}

// Список с учётом видимости — переиспользуется search-модулем
export { listTasks, attachView, getTask, memberKinds, taskInvolvement };
