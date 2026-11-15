import { Router } from 'express';
import { createTagSchema, setTagsSchema } from '@crm/contracts/tag';
import { asyncH, parseBody, httpError } from '../../core/errors.js';
import { requirePermission, canEditTask } from '../roles/index.js';
import { mustSeeTask, setTaskTags } from '../tasks/index.js';
import { recordEvent } from '../history/index.js';
import { q } from '../../core/db.js';

export const tagsRouter = Router();

tagsRouter.get('/api/tags', (_req, res) => {
  res.json({ tags: q.all('SELECT * FROM tags ORDER BY name') });
});

tagsRouter.post('/api/tags', asyncH(async (req, res) => {
  const data = parseBody(createTagSchema, req.body);
  try {
    const { lastInsertRowid } = q.run('INSERT INTO tags (name, color) VALUES (?,?)', data.name, data.color);
    res.status(201).json({ tag: q.get('SELECT * FROM tags WHERE id = ?', Number(lastInsertRowid)) });
  } catch {
    throw httpError(409, 'Тег с таким именем уже есть');
  }
}));

tagsRouter.patch('/api/tags/:id', requirePermission('task.update.any'), asyncH(async (req, res) => {
  const tag = q.get('SELECT * FROM tags WHERE id = ?', Number(req.params.id));
  if (!tag) throw httpError(404, 'Тег не найден');
  const data = parseBody(createTagSchema.partial(), req.body);
  q.run('UPDATE tags SET name = ?, color = ? WHERE id = ?', data.name ?? tag.name, data.color ?? tag.color, tag.id);
  res.json({ tag: q.get('SELECT * FROM tags WHERE id = ?', tag.id) });
}));

tagsRouter.delete('/api/tags/:id', requirePermission('task.update.any'), asyncH(async (req, res) => {
  const tag = q.get('SELECT * FROM tags WHERE id = ?', Number(req.params.id));
  if (!tag) throw httpError(404, 'Тег не найден');
  q.run('DELETE FROM tags WHERE id = ?', tag.id);
  res.status(204).end();
}));

// Привязка тегов к задаче — живёт здесь, теги принадлежат этому модулю
tagsRouter.put('/api/tasks/:id/tags', asyncH(async (req, res) => {
  const task = mustSeeTask(req.user, Number(req.params.id));
  if (!canEditTask(req.user, task)) throw httpError(403, 'Нет прав на редактирование');
  const { tag_ids } = parseBody(setTagsSchema, req.body);
  for (const id of tag_ids) {
    if (!q.get('SELECT 1 FROM tags WHERE id = ?', id)) throw httpError(400, `Тег #${id} не найден`);
  }
  setTaskTags(task.id, tag_ids);
  recordEvent(task.id, req.user.id, 'tag', { tag_ids });
  res.status(204).end();
}));
