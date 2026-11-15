import { Router } from 'express';
import { createCommentSchema } from '@crm/contracts/comment';
import { asyncH, parseBody, httpError } from '../../core/errors.js';
import { mustSeeTask, memberKinds } from '../tasks/index.js';
import { canInteract, canDeleteTask } from '../roles/index.js';
import { recordEvent } from '../history/index.js';
import { q } from '../../core/db.js';

export const commentsRouter = Router();

const getComment = (id) => q.get('SELECT * FROM task_comments WHERE id = ?', id);

commentsRouter.get('/api/tasks/:id/comments', asyncH(async (req, res) => {
  const task = mustSeeTask(req.user, Number(req.params.id));
  const comments = q.all(
    `SELECT c.*, u.name, u.email, u.role, u.created_at AS u_created
     FROM task_comments c JOIN users u ON u.id = c.author_id
     WHERE c.task_id = ? ORDER BY c.id ASC`, task.id,
  ).map((c) => ({
    id: c.id, task_id: c.task_id, author_id: c.author_id, body: c.body, created_at: c.created_at,
    author: { id: c.author_id, name: c.name, email: c.email, role: c.role, created_at: c.u_created },
  }));
  res.json({ comments });
}));

commentsRouter.post('/api/tasks/:id/comments', asyncH(async (req, res) => {
  const task = mustSeeTask(req.user, Number(req.params.id));
  if (!canInteract(req.user, task, memberKinds(task.id, req.user.id), 'task.comment')) {
    throw httpError(403, 'Недостаточно прав');
  }
  const { body } = parseBody(createCommentSchema, req.body);
  const { lastInsertRowid } = q.run(
    'INSERT INTO task_comments (task_id, author_id, body) VALUES (?,?,?)', task.id, req.user.id, body,
  );
  recordEvent(task.id, req.user.id, 'comment', { body: body.slice(0, 120) });
  res.status(201).json({ comment: { ...getComment(Number(lastInsertRowid)), author: req.user } });
}));

commentsRouter.delete('/api/comments/:id', asyncH(async (req, res) => {
  const c = getComment(Number(req.params.id));
  if (!c) throw httpError(404, 'Комментарий не найден');
  mustSeeTask(req.user, c.task_id);
  if (c.author_id !== req.user.id && !canDeleteTask(req.user)) {
    throw httpError(403, 'Можно удалять только свои комментарии');
  }
  q.run('DELETE FROM task_comments WHERE id = ?', c.id);
  res.status(204).end();
}));
