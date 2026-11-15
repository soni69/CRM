import { Router } from 'express';
import Papa from 'papaparse';
import fs from 'node:fs/promises';
import { upload } from '../../core/uploads.js';
import { asyncH, httpError } from '../../core/errors.js';
import { listTasks, createTask } from '../tasks/service.js';
import { STATUSES, PRIORITIES } from '@crm/contracts/task';
import { q } from '../../core/db.js';

export const transferRouter = Router();

// Экспорт видимых задач в CSV
transferRouter.get('/api/tasks/export.csv', asyncH(async (req, res) => {
  const tasks = listTasks(req.user);
  const rows = tasks.map((t) => ({
    id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority,
    start_date: t.start_date ?? '', due_date: t.due_date ?? '',
    assignee_email: t.assignee?.email ?? '', creator_email: t.creator?.email ?? '',
    tags: t.tags.map((x) => x.name).join('|'), created_at: t.created_at,
  }));
  const csv = Papa.unparse(rows, { columns: ['id','title','description','status','priority','start_date','due_date','assignee_email','creator_email','tags','created_at'] });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
  res.send('﻿' + csv);
}));

// Импорт CSV: колонки title*, description, status, priority, due_date, assignee_email, tags
transferRouter.post('/api/tasks/import', upload.single('file'), asyncH(async (req, res) => {
  if (!req.file) throw httpError(400, 'Загрузите CSV-файл');
  const text = await fs.readFile(req.file.path, 'utf8');
  const parsed = Papa.parse(text.replace(/^﻿/, ''), { header: true, skipEmptyLines: true });
  const userByEmail = new Map(q.all('SELECT id, email FROM users').map((u) => [u.email, u.id]));
  const tagByName = new Map(q.all('SELECT id, name FROM tags').map((t) => [t.name, t.id]));

  let created = 0;
  const errors = [];
  parsed.data.forEach((row, i) => {
    try {
      const title = String(row.title ?? '').trim();
      if (!title) throw new Error('нет title');
      const status = STATUSES.includes(row.status) ? row.status : 'new';
      const priority = PRIORITIES.includes(row.priority) ? row.priority : 'medium';
      const due = /^\d{4}-\d{2}-\d{2}$/.test(row.due_date ?? '') ? row.due_date : null;
      const assignee = row.assignee_email ? userByEmail.get(row.assignee_email.trim()) ?? null : null;
      const tagIds = String(row.tags ?? '').split('|').map((s) => tagByName.get(s.trim())).filter(Boolean);
      const task = createTask(req.user, {
        title: title.slice(0, 200), description: String(row.description ?? '').slice(0, 5000),
        priority, due_date: due, assignee_id: assignee,
        participant_ids: [], observer_ids: [], tag_ids: tagIds, time_estimate: 0,
      });
      if (status !== 'new') {
        q.run('UPDATE tasks SET status = ? WHERE id = ?', status, task.id);
      }
      created++;
    } catch (e) {
      errors.push({ row: i + 2, error: e.message });
    }
  });
  res.json({ created, errors });
}));
