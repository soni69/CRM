import { q } from '../../core/db.js';
import { deliver } from './channels.js';

// Вставить уведомление, если такого ещё нет (дедуп по user+task+type)
export function notify(userId, { task_id = null, type, title, body = '' }) {
  const exists = q.get(
    'SELECT 1 FROM notifications WHERE user_id = ? AND type = ? AND (task_id IS ? OR task_id = ?)',
    userId, type, task_id, task_id,
  );
  if (exists) return null;
  const { lastInsertRowid } = q.run(
    'INSERT INTO notifications (user_id, task_id, type, title, body) VALUES (?,?,?,?,?)',
    userId, task_id, type, title, body,
  );
  const n = { id: Number(lastInsertRowid), user_id: userId, task_id, type, title, body };
  deliver(userId, n);
  return n;
}

export const listFor = (userId) => q.all(
  'SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50', userId,
);

export const unreadCount = (userId) =>
  q.get('SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND read = 0', userId).c;

export const markRead = (userId, id) =>
  q.run('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', id, userId);

export const markAllRead = (userId) =>
  q.run('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0', userId);

// Периодическая проверка: скоро срок / просрочено.
// Уведомляем исполнителя, а если его нет — автора задачи.
export function checkDeadlines(doneKeys) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  const tasks = q.all(
    `SELECT t.id, t.title, t.due_date, t.due_time, t.status, t.assignee_id, t.creator_id
     FROM tasks t WHERE t.due_date IS NOT NULL`,
  );
  for (const t of tasks) {
    if (doneKeys.includes(t.status)) continue;
    const uid = t.assignee_id ?? t.creator_id;
    if (t.due_date < today) {
      notify(uid, {
        task_id: t.id, type: 'overdue',
        title: 'Просрочена задача',
        body: `«${t.title}» — срок был ${t.due_date}${t.due_time ? ' ' + t.due_time : ''}`,
      });
    } else if (t.due_date === today || t.due_date === tomorrow) {
      notify(uid, {
        task_id: t.id, type: 'due_soon',
        title: t.due_date === today ? 'Срок сегодня' : 'Срок завтра',
        body: `«${t.title}» — дедлайн ${t.due_date}${t.due_time ? ' ' + t.due_time : ''}`,
      });
    }
  }
}
