import { Router } from 'express';
import { z } from 'zod';
import { ROLES } from '@crm/contracts/user';
import { createUserSchema } from '@crm/contracts/auth';
import { asyncH, parseBody, httpError } from '../../core/errors.js';
import { requirePermission } from '../roles/index.js';
import { createUser, findUserByEmail } from '../auth/index.js';
import { listUsers, getUser, setUserRole, deleteUser } from './repo.js';

export const usersRouter = Router();

// Список нужен всем — для выбора ответственного/соисполнителей
usersRouter.get('/api/users', asyncH(async (_req, res) => {
  res.json({ users: listUsers() });
}));

// Создание учёток — только админ (публичной регистрации нет)
usersRouter.post('/api/users', requirePermission('user.manage'), asyncH(async (req, res) => {
  const data = parseBody(createUserSchema, req.body);
  if (findUserByEmail(data.email)) {
    throw httpError(409, 'Пользователь с таким email уже существует');
  }
  res.status(201).json({ user: createUser(data) });
}));

usersRouter.patch('/api/users/:id/role', requirePermission('user.manage'), asyncH(async (req, res) => {
  const { role } = parseBody(z.object({ role: z.enum(ROLES) }), req.body);
  const target = getUser(Number(req.params.id));
  if (!target) throw httpError(404, 'Пользователь не найден');
  if (target.id === req.user.id) throw httpError(400, 'Нельзя менять свою роль');
  setUserRole(target.id, role);
  res.json({ user: getUser(target.id) });
}));

usersRouter.delete('/api/users/:id', requirePermission('user.manage'), asyncH(async (req, res) => {
  const target = getUser(Number(req.params.id));
  if (!target) throw httpError(404, 'Пользователь не найден');
  if (target.id === req.user.id) throw httpError(400, 'Нельзя удалить себя');
  deleteUser(target.id);
  res.status(204).end();
}));
