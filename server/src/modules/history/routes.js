import { Router } from 'express';
import { asyncH, httpError } from '../../core/errors.js';
import { getTask, memberKinds } from '../tasks/index.js';
import { canSeeTask } from '../roles/index.js';
import { listEvents } from './service.js';

export const historyRouter = Router();

historyRouter.get('/api/tasks/:id/history', asyncH(async (req, res) => {
  const task = getTask(Number(req.params.id));
  if (!task || !canSeeTask(req.user, task, memberKinds(task.id, req.user.id))) {
    throw httpError(404, 'Задача не найдена');
  }
  res.json({ events: listEvents(task.id) });
}));
