import { z } from 'zod';
import { userSchema } from './user.js';

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты ГГГГ-ММ-ДД');

export const timeEntrySchema = z.object({
  id: z.number(),
  task_id: z.number(),
  user_id: z.number(),
  minutes: z.number(),
  work_date: dateStr,
  comment: z.string(),
  created_at: z.string(),
  user: userSchema.optional(),
});
export type TimeEntry = z.infer<typeof timeEntrySchema>;

export const createTimeEntrySchema = z.object({
  minutes: z.number().int().min(1, 'Минимум 1 минута').max(100000),
  work_date: dateStr,
  comment: z.string().max(300).default(''),
});
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
