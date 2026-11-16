import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../core/config.js';
import { asyncH, httpError } from '../../core/errors.js';
import { upload } from '../../core/uploads.js';
import { mustSeeTask, memberKinds } from '../tasks/index.js';
import { canInteract, canDeleteTask } from '../roles/index.js';
import { recordEvent } from '../history/index.js';
import { q } from '../../core/db.js';

export const filesRouter = Router();

const getFile = (id) => q.get('SELECT * FROM task_attachments WHERE id = ?', id);
const withUploader = (f) => ({
  ...f,
  uploader: q.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', f.uploader_id),
});

filesRouter.get('/api/tasks/:id/files', asyncH(async (req, res) => {
  const task = mustSeeTask(req.user, Number(req.params.id));
  const files = q.all('SELECT * FROM task_attachments WHERE task_id = ? ORDER BY id DESC', task.id).map(withUploader);
  res.json({ files });
}));

filesRouter.post('/api/tasks/:id/files', upload.array('files', 10), asyncH(async (req, res) => {
  const task = mustSeeTask(req.user, Number(req.params.id));
  if (!canInteract(req.user, task, memberKinds(task.id, req.user.id), 'task.files')) {
    for (const f of req.files ?? []) fs.unlinkSync(f.path);
    throw httpError(403, 'Недостаточно прав');
  }
  const saved = (req.files ?? []).map((f) => {
    const { lastInsertRowid } = q.run(
      'INSERT INTO task_attachments (task_id, uploader_id, filename, orig_name, size, mime) VALUES (?,?,?,?,?,?)',
      task.id, req.user.id, f.filename, Buffer.from(f.originalname, 'latin1').toString('utf8'), f.size, f.mimetype,
    );
    recordEvent(task.id, req.user.id, 'file', { name: f.originalname });
    return withUploader(getFile(Number(lastInsertRowid)));
  });
  res.status(201).json({ files: saved });
}));

filesRouter.get('/api/files/:id/download', asyncH(async (req, res) => {
  const f = getFile(Number(req.params.id));
  if (!f) throw httpError(404, 'Файл не найден');
  mustSeeTask(req.user, f.task_id);
  res.download(path.join(config.uploadsDir, f.filename), f.orig_name);
}));

filesRouter.delete('/api/files/:id', asyncH(async (req, res) => {
  const f = getFile(Number(req.params.id));
  if (!f) throw httpError(404, 'Файл не найден');
  const task = mustSeeTask(req.user, f.task_id);
  if (f.uploader_id !== req.user.id && !canDeleteTask(req.user, task)) {
    throw httpError(403, 'Можно удалять только свои файлы');
  }
  fs.unlink(path.join(config.uploadsDir, f.filename), () => {});
  q.run('DELETE FROM task_attachments WHERE id = ?', f.id);
  res.status(204).end();
}));
