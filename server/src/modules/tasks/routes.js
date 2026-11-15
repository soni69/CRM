import { Router } from 'express';
import { createTaskSchema, updateTaskSchema, updateStatusSchema, bulkActionSchema } from '@crm/contracts/task';
import { z } from 'zod';
import { asyncH, parseBody } from '../../core/errors.js';
import { mustSeeTask, createTask, updateTask, setStatus, deleteTask, bulk, setRecurrence, listTasks } from './service.js';
import { attachView } from './repo.js';

export const tasksRouter = Router();

tasksRouter.get('/api/tasks', asyncH(async (req, res) => {
  res.json({ tasks: listTasks(req.user) });
}));

tasksRouter.post('/api/tasks', asyncH(async (req, res) => {
  const data = parseBody(createTaskSchema, req.body);
  res.status(201).json({ task: createTask(req.user, data) });
}));

tasksRouter.get('/api/tasks/:id', asyncH(async (req, res) => {
  const task = mustSeeTask(req.user, Number(req.params.id));
  res.json({ task: attachView([task])[0] });
}));

tasksRouter.patch('/api/tasks/bulk', asyncH(async (req, res) => {
  const data = parseBody(bulkActionSchema, req.body);
  res.json(bulk(req.user, data));
}));

tasksRouter.patch('/api/tasks/:id', asyncH(async (req, res) => {
  const data = parseBody(updateTaskSchema, req.body);
  res.json({ task: updateTask(req.user, Number(req.params.id), data) });
}));

tasksRouter.patch('/api/tasks/:id/status', asyncH(async (req, res) => {
  const { status } = parseBody(updateStatusSchema, req.body);
  res.json({ task: setStatus(req.user, Number(req.params.id), status) });
}));

tasksRouter.patch('/api/tasks/:id/recurrence', asyncH(async (req, res) => {
  const { freq } = parseBody(z.object({ freq: z.enum(['day', 'week', 'month']).nullable() }), req.body);
  res.json({ task: setRecurrence(req.user, Number(req.params.id), freq) });
}));

tasksRouter.delete('/api/tasks/:id', asyncH(async (req, res) => {
  deleteTask(req.user, Number(req.params.id));
  res.status(204).end();
}));
