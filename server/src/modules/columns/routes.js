import { Router } from 'express';
import { createColumnSchema, updateColumnSchema, reorderColumnsSchema } from '@crm/contracts/column';
import { asyncH, parseBody } from '../../core/errors.js';
import { requirePermission } from '../roles/index.js';
import { listColumns, createColumn, updateColumn, reorderColumns, deleteColumn } from './repo.js';

export const columnsRouter = Router();
const manage = requirePermission('board.manage');

columnsRouter.get('/api/columns', (_req, res) => {
  res.json({ columns: listColumns() });
});

columnsRouter.post('/api/columns', manage, asyncH(async (req, res) => {
  const data = parseBody(createColumnSchema, req.body);
  res.status(201).json({ column: createColumn(data) });
}));

// Порядок меняется отдельным маршрутом — до /:id
columnsRouter.post('/api/columns/reorder', manage, asyncH(async (req, res) => {
  const { ids } = parseBody(reorderColumnsSchema, req.body);
  reorderColumns(ids);
  res.json({ columns: listColumns() });
}));

columnsRouter.patch('/api/columns/:id', manage, asyncH(async (req, res) => {
  const data = parseBody(updateColumnSchema, req.body);
  res.json({ column: updateColumn(Number(req.params.id), data) });
}));

columnsRouter.delete('/api/columns/:id', manage, asyncH(async (req, res) => {
  deleteColumn(Number(req.params.id));
  res.status(204).end();
}));
