import { Router } from 'express';
import { registerSchema, loginSchema } from '@crm/contracts/auth';
import { API as API_PATHS } from '@crm/contracts/api';
import { asyncH, parseBody, httpError } from '../../core/errors.js';
import { createSession, destroySession, findUserByEmail, createUser, checkPassword, requireAuth } from './service.js';

export const authRouter = Router();
const p = API_PATHS.auth;

authRouter.post(p.register, asyncH(async (req, res) => {
  const data = parseBody(registerSchema, req.body);
  if (findUserByEmail(data.email)) {
    throw httpError(409, 'Пользователь с таким email уже существует');
  }
  const user = createUser(data);
  createSession(res, user.id);
  res.status(201).json({ user });
}));

authRouter.post(p.login, asyncH(async (req, res) => {
  const data = parseBody(loginSchema, req.body);
  const dbUser = findUserByEmail(data.email);
  if (!dbUser || !checkPassword(dbUser, data.password)) {
    throw httpError(401, 'Неверный email или пароль');
  }
  createSession(res, dbUser.id);
  const { password_hash: _ph, ...user } = dbUser;
  res.json({ user });
}));

authRouter.post(p.logout, (req, res) => {
  destroySession(req, res);
  res.status(204).end();
});

authRouter.get(p.me, requireAuth, (req, res) => {
  res.json({ user: req.user });
});
