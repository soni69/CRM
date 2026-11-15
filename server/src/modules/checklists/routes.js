import { Router } from 'express';
import { createChecklistItemSchema, updateChecklistItemSchema } from '@crm/contracts/checklist';
import { asyncH, parseBody, httpError } from '../../core/errors.js';
import { mustSeeTask, memberKinds } from '../tasks/index.js';
import { canInteract } from '../roles/index.js';
import { recordEvent } from '../history/index.js';
import { q } from '../../core/db.js';

export const checklistsRouter = Router();

const getItem = (id) => q.get('SELECT * FROM checklist_items WHERE id = ?', id);
const listItems = (taskId) =>
  q.all('SELECT id, task_id, text, done, position FROM checklist_items WHERE task_id = ? ORDER BY position, id', taskId)
    .map((i) => ({ ...i, done: !!i.done }));

function mustInteract(req, taskId) {
  const task = mustSeeTask(req.user, taskId);
  if (!canInteract(req.user, task, memberKinds(taskId, req.user.id), 'task.comment')) {
    throw httpError(403, 'Недостаточно прав');
  }
  return task;
}

checklistsRouter.post('/api/tasks/:id/checklist', asyncH(async (req, res) => {
  const task = mustInteract(req, Number(req.params.id));
  const { text } = parseBody(createChecklistItemSchema, req.body);
  const pos = (q.get('SELECT COALESCE(MAX(position),-1) p FROM checklist_items WHERE task_id = ?', task.id).p) + 1;
  const { lastInsertRowid } = q.run('INSERT INTO checklist_items (task_id, text, position) VALUES (?,?,?)', task.id, text, pos);
  recordEvent(task.id, req.user.id, 'checklist', { action: 'add', text });
  res.status(201).json({ item: { ...getItem(Number(lastInsertRowid)), done: false } });
}));

checklistsRouter.get('/api/tasks/:id/checklist', asyncH(async (req, res) => {
  const task = mustSeeTask(req.user, Number(req.params.id));
  res.json({ items: listItems(task.id) });
}));

checklistsRouter.patch('/api/checklist/:id', asyncH(async (req, res) => {
  const item = getItem(Number(req.params.id));
  if (!item) throw httpError(404, 'Пункт не найден');
  mustInteract(req, item.task_id);
  const data = parseBody(updateChecklistItemSchema, req.body);
  q.run('UPDATE checklist_items SET text = ?, done = ? WHERE id = ?',
    data.text ?? item.text, data.done === undefined ? item.done : (data.done ? 1 : 0), item.id);
  if ('done' in data) recordEvent(item.task_id, req.user.id, 'checklist', { action: data.done ? 'done' : 'undone', text: item.text });
  res.json({ item: { ...getItem(item.id), done: !!getItem(item.id).done } });
}));

checklistsRouter.delete('/api/checklist/:id', asyncH(async (req, res) => {
  const item = getItem(Number(req.params.id));
  if (!item) throw httpError(404, 'Пункт не найден');
  mustInteract(req, item.task_id);
  q.run('DELETE FROM checklist_items WHERE id = ?', item.id);
  recordEvent(item.task_id, req.user.id, 'checklist', { action: 'remove', text: item.text });
  res.status(204).end();
}));
