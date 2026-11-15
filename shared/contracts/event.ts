import { z } from 'zod';
import { userSchema } from './user.js';

export const EVENT_TYPES = [
  'created', 'status', 'field', 'assignee', 'member',
  'comment', 'file', 'checklist', 'tag', 'sprint', 'time', 'deleted',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const taskEventSchema = z.object({
  id: z.number(),
  task_id: z.number(),
  actor_id: z.number(),
  type: z.enum(EVENT_TYPES),
  payload: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  actor: userSchema.optional(),
});
export type TaskEvent = z.infer<typeof taskEventSchema>;
