import { Router } from 'express';
import { createTimeEntrySchema } from '@crm/contracts/timeentry';
import { asyncH, parseBody, httpError } from '../../core/errors.js';
import { mustSeeTask, memberKinds } from '../tasks/index.js';
import { canInteract } from '../roles/index.js';
import { recordEvent } from '../history/index.js';
import { q } from '../../core/db.js';

export const timetrackingRouter = Router();

timetrackingRouter.get('/api/tasks/:id/time', asyncH(async (req, res) => {
  const task = mustSeeTask(req.user, Number(req.params.id));
  const entries = q.all(
    `SELECT te.*, u.name, u.email, u.role, u.created_at AS u_created
     FROM time_entries te JOIN users u ON u.id = te.user_id
     WHERE te.task_id = ? ORDER BY te.work_date DESC, te.id DESC`, task.id,
  ).map((e) => ({
    ...e,
    user: { id: e.user_id, name: e.name, email: e.email, role: e.role, created_at: e.u_created },
  }));
  res.json({ entries, total: entries.reduce((s, e) => s + e.minutes, 0) });
}));

timetrackingRouter.post('/api/tasks/:id/time', asyncH(async (req, res) => {
  const task = mustSeeTask(req.user, Number(req.params.id));
  if (!canInteract(req.user, task, memberKinds(task.id, req.user.id), 'task.time')) {
    throw httpError(403, 'Недостаточно прав');
  }
  const data = parseBody(createTimeEntrySchema, req.body);
  const { lastInsertRowid } = q.run(
    'INSERT INTO time_entries (task_id, user_id, minutes, work_date, comment) VALUES (?,?,?,?,?)',
    task.id, req.user.id, data.minutes, data.work_date, data.comment,
  );
  recordEvent(task.id, req.user.id, 'time', { minutes: data.minutes });
  res.status(201).json({ entry: { ...q.get('SELECT * FROM time_entries WHERE id = ?', Number(lastInsertRowid)), user: req.user } });
}));
