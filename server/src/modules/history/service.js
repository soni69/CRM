import { q } from '../../core/db.js';

// Публичная точка входа для других модулей — пишет событие в ленту задачи.
export function recordEvent(taskId, actorId, type, payload = {}) {
  q.run(
    'INSERT INTO task_events (task_id, actor_id, type, payload) VALUES (?,?,?,?)',
    taskId, actorId, type, JSON.stringify(payload),
  );
}

export function listEvents(taskId, limit = 200) {
  return q.all(
    `SELECT e.*, u.name AS actor_name, u.email AS actor_email, u.role AS actor_role, u.created_at AS actor_created
     FROM task_events e JOIN users u ON u.id = e.actor_id
     WHERE e.task_id = ? ORDER BY e.id DESC LIMIT ?`, taskId, limit,
  ).map((e) => ({
    id: e.id, task_id: e.task_id, actor_id: e.actor_id, type: e.type,
    payload: JSON.parse(e.payload), created_at: e.created_at,
    actor: { id: e.actor_id, name: e.actor_name, email: e.actor_email, role: e.actor_role, created_at: e.actor_created },
  }));
}
