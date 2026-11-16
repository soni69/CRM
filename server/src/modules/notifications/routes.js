import { Router } from 'express';
import { asyncH } from '../../core/errors.js';
import { listFor, unreadCount, markRead, markAllRead } from './repo.js';

export const notificationsRouter = Router();

notificationsRouter.get('/api/notifications', asyncH(async (req, res) => {
  res.json({ notifications: listFor(req.user.id), unread: unreadCount(req.user.id) });
}));

notificationsRouter.patch('/api/notifications/:id/read', asyncH(async (req, res) => {
  markRead(req.user.id, Number(req.params.id));
  res.json({ ok: true });
}));

notificationsRouter.post('/api/notifications/read-all', asyncH(async (req, res) => {
  markAllRead(req.user.id);
  res.json({ ok: true });
}));
