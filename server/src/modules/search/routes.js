import { Router } from 'express';
import { asyncH, parseBody } from '../../core/errors.js';
import { searchParamsSchema, searchTasks } from './query.js';

export const searchRouter = Router();

searchRouter.get('/api/search/tasks', asyncH(async (req, res) => {
  const params = parseBody(searchParamsSchema, req.query);
  res.json({ tasks: searchTasks(req.user, params) });
}));
