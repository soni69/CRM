import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { config } from './core/config.js';
import { errorHandler, httpError } from './core/errors.js';
import { authRouter, requireAuth } from './modules/auth/index.js';
import { tasksRouter } from './modules/tasks/index.js';
import { checklistsRouter } from './modules/checklists/index.js';
import { commentsRouter } from './modules/comments/index.js';
import { filesRouter } from './modules/files/index.js';
import { historyRouter } from './modules/history/index.js';
import { tagsRouter } from './modules/tags/index.js';
import { sprintsRouter } from './modules/sprints/index.js';
import { timetrackingRouter } from './modules/timetracking/index.js';
import { templatesRouter } from './modules/templates/index.js';
import { reportsRouter } from './modules/reports/index.js';
import { transferRouter } from './modules/transfer/index.js';
import { searchRouter } from './modules/search/index.js';
import { usersRouter } from './modules/users/index.js';
import { columnsRouter } from './modules/columns/index.js';
import { projectsRouter } from './modules/projects/index.js';

export const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Публичные роуты (логин/регистрация сами управляют)
app.use(authRouter);

// Всё остальное API — только после входа
app.use('/api', requireAuth);
app.use([
  // transferRouter раньше tasksRouter: /api/tasks/export.csv и /api/tasks/import
  // не должны попадать под /api/tasks/:id
  transferRouter, tasksRouter, checklistsRouter, commentsRouter, filesRouter, historyRouter,
  tagsRouter, sprintsRouter, timetrackingRouter, templatesRouter,
  reportsRouter, searchRouter, usersRouter, columnsRouter, projectsRouter,
]);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', (_req, _res, next) => next(httpError(404, 'Не найдено')));

// Статика: собранный клиент + вложения
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);
