import { Router } from 'express';
import { createSprintSchema, updateSprintSchema } from '@crm/contracts/sprint';
import { asyncH, parseBody, httpError } from '../../core/errors.js';
import { requirePermission, visibleTasksWhere } from '../roles/index.js';
import { attachView } from '../tasks/index.js';
import { q } from '../../core/db.js';

export const sprintsRouter = Router();
const getSprint = (id) => q.get('SELECT * FROM sprints WHERE id = ?', id);

sprintsRouter.get('/api/sprints', asyncH(async (req, res) => {
  const vis = visibleTasksWhere(req.user, 't');
  res.json({
    sprints: q.all(`
      SELECT s.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.sprint_id = s.id AND ${vis.sql}) AS task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.sprint_id = s.id AND t.status IN (SELECT key FROM board_columns WHERE is_done = 1) AND ${vis.sql}) AS done_count
      FROM sprints s ORDER BY s.start_date DESC`, ...vis.params, ...vis.params),
  });
}));

sprintsRouter.post('/api/sprints', asyncH(async (req, res) => {
  const data = parseBody(createSprintSchema, req.body);
  if (data.end_date < data.start_date) throw httpError(400, 'Конец раньше начала');
  const { lastInsertRowid } = q.run(
    'INSERT INTO sprints (name, goal, start_date, end_date) VALUES (?,?,?,?)',
    data.name, data.goal, data.start_date, data.end_date,
  );
  res.status(201).json({ sprint: getSprint(Number(lastInsertRowid)) });
}));

sprintsRouter.patch('/api/sprints/:id', requirePermission('board.manage'), asyncH(async (req, res) => {
  const s = getSprint(Number(req.params.id));
  if (!s) throw httpError(404, 'Спринт не найден');
  const data = parseBody(updateSprintSchema, req.body);
  if (data.status === 'active') q.run("UPDATE sprints SET status = 'closed' WHERE status = 'active'");
  q.run(
    'UPDATE sprints SET name=?, goal=?, start_date=?, end_date=?, status=? WHERE id=?',
    data.name ?? s.name, data.goal ?? s.goal, data.start_date ?? s.start_date,
    data.end_date ?? s.end_date, data.status ?? s.status, s.id,
  );
  res.json({ sprint: getSprint(s.id) });
}));

sprintsRouter.delete('/api/sprints/:id', requirePermission('board.manage'), asyncH(async (req, res) => {
  const s = getSprint(Number(req.params.id));
  if (!s) throw httpError(404, 'Спринт не найден');
  q.run('DELETE FROM sprints WHERE id = ?', s.id);
  res.status(204).end();
}));

// Задачи спринта (видимость соблюдается)
sprintsRouter.get('/api/sprints/:id/tasks', asyncH(async (req, res) => {
  const s = getSprint(Number(req.params.id));
  if (!s) throw httpError(404, 'Спринт не найден');
  const vis = visibleTasksWhere(req.user, 't');
  const rows = q.all(`SELECT t.* FROM tasks t WHERE t.sprint_id = ? AND ${vis.sql} ORDER BY t.id DESC`, s.id, ...vis.params);
  res.json({ sprint: s, tasks: attachView(rows) });
}));
