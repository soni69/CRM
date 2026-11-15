import { q, tx, now } from '../../core/db.js';
import { visibleTasksWhere } from '../roles/index.js';
import { firstColumnKey, doneKeys } from '../columns/index.js';

export const memberKinds = (taskId, userId) =>
  q.all('SELECT kind FROM task_members WHERE task_id = ? AND user_id = ?', taskId, userId).map((r) => r.kind);

export const getTask = (id) => q.get('SELECT * FROM tasks WHERE id = ?', id);

const parseRec = (t) => ({ ...t, recurrence: t.recurrence ? JSON.parse(t.recurrence) : null });

// Обогащает сырые строки tasks связями → TaskView
export function attachView(tasks) {
  if (!tasks.length) return [];
  const ids = tasks.map((t) => t.id);
  const ph = ids.map(() => '?').join(',');

  const userIds = [...new Set(tasks.flatMap((t) => [t.assignee_id, t.creator_id]).filter(Boolean))];
  const users = userIds.length
    ? Object.fromEntries(
        q.all(`SELECT id,name,email,role,created_at FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`, ...userIds)
          .map((u) => [u.id, u]),
      )
    : {};

  const tagRows = q.all(
    `SELECT tt.task_id, tg.id, tg.name, tg.color FROM task_tags tt JOIN tags tg ON tg.id = tt.tag_id
     WHERE tt.task_id IN (${ph})`, ...ids,
  );
  const memRows = q.all(
    `SELECT tm.task_id, tm.user_id, tm.kind, u.name, u.email, u.role, u.created_at
     FROM task_members tm JOIN users u ON u.id = tm.user_id WHERE tm.task_id IN (${ph})`, ...ids,
  );
  const countRows = q.all(
    `SELECT t.id,
       (SELECT COUNT(*) FROM tasks s WHERE s.parent_id = t.id)                            AS subtasks,
       (SELECT COUNT(*) FROM task_comments c WHERE c.task_id = t.id)                       AS comments,
       (SELECT COUNT(*) FROM task_attachments a WHERE a.task_id = t.id)                    AS files,
       (SELECT COUNT(*) FROM checklist_items ci WHERE ci.task_id = t.id)                   AS checklist_total,
       (SELECT COUNT(*) FROM checklist_items ci WHERE ci.task_id = t.id AND ci.done = 1)   AS checklist_done,
       (SELECT COALESCE(SUM(te.minutes),0) FROM time_entries te WHERE te.task_id = t.id)   AS time_spent
     FROM tasks t WHERE t.id IN (${ph})`, ...ids,
  );

  const groupBy = (rows, key) => {
    const m = new Map();
    for (const r of rows) (m.get(r[key]) ?? m.set(r[key], []).get(r[key])).push(r);
    return m;
  };
  const tagsByTask = groupBy(tagRows, 'task_id');
  const memByTask = groupBy(memRows, 'task_id');
  const countsByTask = new Map(countRows.map((r) => [r.id, r]));

  const done = new Set(doneKeys());
  return tasks.map((t) => ({
    ...parseRec(t),
    done: done.has(t.status),
    assignee: t.assignee_id ? (users[t.assignee_id] ?? null) : null,
    creator: users[t.creator_id],
    tags: (tagsByTask.get(t.id) ?? []).map(({ id, name, color }) => ({ id, name, color })),
    members: (memByTask.get(t.id) ?? []).map((m) => ({
      user_id: m.user_id, kind: m.kind,
      user: { id: m.user_id, name: m.name, email: m.email, role: m.role, created_at: m.created_at },
    })),
    counts: countsByTask.get(t.id),
  }));
}

export function listTasks(user, extraWhere = '1=1', extraParams = []) {
  const vis = visibleTasksWhere(user, 't');
  const rows = q.all(
    `SELECT t.* FROM tasks t WHERE ${vis.sql} AND ${extraWhere} ORDER BY t.created_at DESC`,
    ...vis.params, ...extraParams,
  );
  return attachView(rows);
}

export function createTaskRow(data, creatorId) {
  const { lastInsertRowid } = q.run(
    `INSERT INTO tasks (title, description, status, priority, start_date, due_date, due_time,
       assignee_id, creator_id, parent_id, sprint_id, time_estimate)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    data.title, data.description ?? '', firstColumnKey(), data.priority ?? 'medium',
    data.start_date ?? null, data.due_date ?? null, data.due_time ?? null,
    data.assignee_id ?? null, creatorId, data.parent_id ?? null,
    data.sprint_id ?? null, data.time_estimate ?? 0,
  );
  return Number(lastInsertRowid);
}

export function updateTaskRow(id, fields) {
  const sets = Object.keys(fields).map((k) => `${k} = ?`).join(', ');
  q.run(`UPDATE tasks SET ${sets}, updated_at = ? WHERE id = ?`, ...Object.values(fields), now(), id);
}

export const setTaskTags = (taskId, tagIds) => {
  q.run('DELETE FROM task_tags WHERE task_id = ?', taskId);
  for (const tagId of tagIds) q.run('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?,?)', taskId, tagId);
};

export function setTaskMembers(taskId, participantIds, observerIds) {
  q.run('DELETE FROM task_members WHERE task_id = ?', taskId);
  for (const uid of participantIds) {
    q.run('INSERT OR IGNORE INTO task_members (task_id, user_id, kind) VALUES (?,?,?)', taskId, uid, 'participant');
  }
  for (const uid of observerIds) {
    q.run('INSERT OR IGNORE INTO task_members (task_id, user_id, kind) VALUES (?,?,?)', taskId, uid, 'observer');
  }
}

export const deleteTaskRow = (id) => q.run('DELETE FROM tasks WHERE id = ?', id);

export { tx, q, now };
