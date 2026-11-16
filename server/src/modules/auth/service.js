import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { q, now } from '../../core/db.js';
import { config } from '../../core/config.js';
import { httpError } from '../../core/errors.js';

export const COOKIE = 'tt_session';
const TTL_DAYS = 30;

export function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const exp = new Date(Date.now() + TTL_DAYS * 864e5).toISOString();
  q.run('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)', token, userId, exp);
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: TTL_DAYS * 864e5,
    path: '/',
  });
}

export function destroySession(req, res) {
  const token = req.cookies?.[COOKIE];
  if (token) q.run('DELETE FROM sessions WHERE token = ?', token);
  res.clearCookie(COOKIE, { path: '/' });
}

export function findUserByEmail(email) {
  return q.get('SELECT * FROM users WHERE email = ?', email);
}

export function createUser({ name, email, password, role = 'manager' }) {
  const hash = bcrypt.hashSync(password, 10);
  const { lastInsertRowid } = q.run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)', name, email, hash, role,
  );
  return q.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', Number(lastInsertRowid));
}

export function checkPassword(user, password) {
  return bcrypt.compareSync(password, user.password_hash);
}

// Middleware: кладёт req.user или 401
export function requireAuth(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) return next(httpError(401, 'Требуется вход'));
  const row = q.get(
    `SELECT u.id, u.name, u.email, u.role, u.created_at, s.expires_at
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`, token,
  );
  if (!row || row.expires_at < now()) {
    return next(httpError(401, 'Сессия истекла, войдите снова'));
  }
  req.user = { id: row.id, name: row.name, email: row.email, role: row.role, created_at: row.created_at };
  req.sessionToken = token;
  next();
}
