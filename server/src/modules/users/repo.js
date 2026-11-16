import { q } from '../../core/db.js';

export const listUsers = () =>
  q.all(`
    SELECT u.id, u.name, u.email, u.role, u.phone, u.telegram, u.created_at,
      (SELECT COUNT(*) FROM tasks t WHERE t.assignee_id = u.id AND t.status NOT IN (SELECT key FROM board_columns WHERE is_done = 1)) AS open_tasks
    FROM users u ORDER BY u.name
  `);

export const getUser = (id) =>
  q.get('SELECT id, name, email, role, phone, telegram, created_at FROM users WHERE id = ?', id);

export const updateUser = (id, { name, phone, telegram }) => {
  const cur = getUser(id);
  const pick = (v, old) => (v === undefined ? old : (v && v.trim() ? v.trim() : null));
  q.run(
    'UPDATE users SET name = ?, phone = ?, telegram = ? WHERE id = ?',
    name ?? cur.name, pick(phone, cur.phone), pick(telegram, cur.telegram), id,
  );
};

export const setUserRole = (id, role) => q.run('UPDATE users SET role = ? WHERE id = ?', role, id);
export const deleteUser = (id) => q.run('DELETE FROM users WHERE id = ?', id);
