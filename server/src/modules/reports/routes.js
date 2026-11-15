import { Router } from 'express';
import { z } from 'zod';
import { asyncH, parseBody } from '../../core/errors.js';
import { can, visibleTasksWhere } from '../roles/index.js';
import { q } from '../../core/db.js';

export const reportsRouter = Router();

const paramsSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

reportsRouter.get('/api/reports/overview', asyncH(async (req, res) => {
  const p = parseBody(paramsSchema, req.query);
  const from = p.from ?? '2000-01-01';
  const to = p.to ?? '2100-01-01';
  const teamWide = can(req.user, 'report.team');
  const vis = visibleTasksWhere(req.user, 't');

  // member без права report.team — срез только по себе
  const mineSql = teamWide ? '1=1' : '(t.assignee_id = ? OR t.creator_id = ?)';
  const mineArgs = teamWide ? [] : [req.user.id, req.user.id];

  const overdue = q.all(`
    SELECT t.id AS task_id, t.title, t.due_date, u.name AS assignee_name
    FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
    WHERE ${vis.sql} AND ${mineSql} AND t.due_date IS NOT NULL AND t.due_date < date('now') AND t.status NOT IN (SELECT key FROM board_columns WHERE is_done = 1)
    ORDER BY t.due_date`, ...vis.params, ...mineArgs);

  const doneByUser = q.all(`
    SELECT u.id AS user_id, u.name, COUNT(t.id) AS done_count
    FROM tasks t JOIN users u ON u.id = COALESCE(t.assignee_id, t.creator_id)
    WHERE ${vis.sql} AND ${teamWide ? '1=1' : 'u.id = ?'} AND t.status IN (SELECT key FROM board_columns WHERE is_done = 1)
      AND t.updated_at BETWEEN ? AND ?
    GROUP BY u.id ORDER BY done_count DESC`, ...vis.params, ...(teamWide ? [] : [req.user.id]), from, to + 'T23:59:59');

  const timeByUser = q.all(`
    SELECT u.id AS user_id, u.name, COALESCE(SUM(te.minutes),0) AS minutes
    FROM time_entries te JOIN users u ON u.id = te.user_id
    JOIN tasks t ON t.id = te.task_id
    WHERE ${vis.sql} AND ${teamWide ? '1=1' : 'u.id = ?'} AND te.work_date BETWEEN ? AND ?
    GROUP BY u.id ORDER BY minutes DESC`, ...vis.params, ...(teamWide ? [] : [req.user.id]), from, to);

  const totals = q.get(`
    SELECT COUNT(*) AS total,
      SUM(status IN (SELECT key FROM board_columns WHERE is_done = 1)) AS done,
      SUM(due_date IS NOT NULL AND due_date < date('now') AND status NOT IN (SELECT key FROM board_columns WHERE is_done = 1)) AS overdue
    FROM tasks t WHERE ${vis.sql} AND ${mineSql}`, ...vis.params, ...mineArgs);

  res.json({ overdue, done_by_user: doneByUser, time_by_user: timeByUser, totals });
}));
