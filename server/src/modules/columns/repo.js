import crypto from 'node:crypto';
import { q, tx } from '../../core/db.js';
import { httpError } from '../../core/errors.js';

export const listColumns = () => q.all('SELECT * FROM board_columns ORDER BY position');
export const getColumn = (id) => q.get('SELECT * FROM board_columns WHERE id = ?', id);
export const columnByKey = (key) => q.get('SELECT * FROM board_columns WHERE key = ?', key);
export const firstColumnKey = () =>
  q.get('SELECT key FROM board_columns ORDER BY position LIMIT 1')?.key ?? 'new';
export const doneKeys = () =>
  q.all('SELECT key FROM board_columns WHERE is_done = 1').map((r) => r.key);

export function createColumn({ name, color }) {
  const pos = q.get('SELECT COALESCE(MAX(position), -1) + 1 p FROM board_columns').p;
  const key = 'col_' + crypto.randomBytes(4).toString('hex');
  const { lastInsertRowid } = q.run(
    'INSERT INTO board_columns (key, name, color, position) VALUES (?,?,?,?)', key, name, color, pos,
  );
  return getColumn(Number(lastInsertRowid));
}

export function updateColumn(id, { name, color, hidden, is_done }) {
  const col = getColumn(id);
  if (!col) throw httpError(404, 'Колонка не найдена');
  q.run(
    'UPDATE board_columns SET name = ?, color = ?, hidden = ?, is_done = ? WHERE id = ?',
    name ?? col.name, color ?? col.color,
    hidden === undefined ? col.hidden : Number(hidden),
    is_done === undefined ? col.is_done : Number(is_done),
    id,
  );
  return getColumn(id);
}

export const reorderColumns = (ids) => tx(() => {
  ids.forEach((id, i) => q.run('UPDATE board_columns SET position = ? WHERE id = ?', i, id));
})();

export function deleteColumn(id) {
  const col = getColumn(id);
  if (!col) throw httpError(404, 'Колонка не найдена');
  const cnt = q.get('SELECT COUNT(*) c FROM tasks WHERE status = ?', col.key).c;
  if (cnt) throw httpError(409, `В колонке ${cnt} задач — сначала переместите их`);
  if (q.get('SELECT COUNT(*) c FROM board_columns').c <= 1) {
    throw httpError(400, 'Нельзя удалить последнюю колонку');
  }
  q.run('DELETE FROM board_columns WHERE id = ?', id);
}
