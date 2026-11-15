import { q } from '../../core/db.js';

export const listUsers = () =>
  q.all(`
    SELECT u.id, u.name, u.email, u.role, u.created_at,
      (SELECT COUNT(*) FROM tasks t WHERE t.assignee_id = u.id AND t.status != 'done') AS open_tasks
    FROM users u ORDER BY u.name
  `);

export const getUser = (id) =>
  q.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', id);

export const setUserRole = (id, role) => q.run('UPDATE users SET role = ? WHERE id = ?', role, id);
export const deleteUser = (id) => q.run('DELETE FROM users WHERE id = ?', id);
