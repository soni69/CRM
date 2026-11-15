import { Router } from 'express';
import { createTemplateSchema } from '@crm/contracts/template';
import { asyncH, parseBody, httpError } from '../../core/errors.js';
import { can } from '../roles/index.js';
import { createTask } from '../tasks/service.js';
import { q, tx } from '../../core/db.js';

export const templatesRouter = Router();
const getTemplate = (id) => {
  const t = q.get('SELECT * FROM task_templates WHERE id = ?', id);
  return t ? { ...t, checklist: JSON.parse(t.checklist) } : null;
};

templatesRouter.get('/api/templates', (_req, res) => {
  res.json({ templates: q.all('SELECT * FROM task_templates ORDER BY name').map((t) => ({ ...t, checklist: JSON.parse(t.checklist) })) });
});

templatesRouter.post('/api/templates', asyncH(async (req, res) => {
  const data = parseBody(createTemplateSchema, req.body);
  const { lastInsertRowid } = q.run(
    'INSERT INTO task_templates (name, title, description, priority, checklist, creator_id) VALUES (?,?,?,?,?,?)',
    data.name, data.title, data.description, data.priority, JSON.stringify(data.checklist), req.user.id,
  );
  res.status(201).json({ template: getTemplate(Number(lastInsertRowid)) });
}));

templatesRouter.delete('/api/templates/:id', asyncH(async (req, res) => {
  const t = getTemplate(Number(req.params.id));
  if (!t) throw httpError(404, 'Шаблон не найден');
  if (t.creator_id !== req.user.id && !can(req.user, 'user.manage')) {
    throw httpError(403, 'Удалять чужие шаблоны может только admin');
  }
  q.run('DELETE FROM task_templates WHERE id = ?', t.id);
  res.status(204).end();
}));

// Создать задачу по шаблону
templatesRouter.post('/api/tasks/from-template/:id', asyncH(async (req, res) => {
  const t = getTemplate(Number(req.params.id));
  if (!t) throw httpError(404, 'Шаблон не найден');
  const task = createTask(req.user, {
    title: req.body?.title?.trim() || t.title,
    description: t.description,
    priority: t.priority,
    participant_ids: [], observer_ids: [], tag_ids: [], time_estimate: 0,
  });
  tx(() => {
    t.checklist.forEach((text, i) =>
      q.run('INSERT INTO checklist_items (task_id, text, position) VALUES (?,?,?)', task.id, text, i));
  })();
  res.status(201).json({ task });
}));
