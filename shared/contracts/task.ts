import { z } from 'zod';
import { userSchema } from './user.js';
import { tagSchema } from './tag.js';

export const STATUSES = ['new', 'in_progress', 'done'] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Завершена',
};

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export const MEMBER_KINDS = ['participant', 'observer'] as const;
export type MemberKind = (typeof MEMBER_KINDS)[number];

export const MEMBER_KIND_LABELS: Record<MemberKind, string> = {
  participant: 'Соисполнитель',
  observer: 'Наблюдатель',
};

export const RECURRENCE_FREQS = ['day', 'week', 'month'] as const;
export type RecurrenceFreq = (typeof RECURRENCE_FREQS)[number];

export const RECURRENCE_LABELS: Record<RecurrenceFreq, string> = {
  day: 'Каждый день',
  week: 'Каждую неделю',
  month: 'Каждый месяц',
};

export const recurrenceSchema = z.object({
  freq: z.enum(RECURRENCE_FREQS),
  next_run: z.string(),
});
export type Recurrence = z.infer<typeof recurrenceSchema>;

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты ГГГГ-ММ-ДД');

export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  status: z.enum(STATUSES),
  priority: z.enum(PRIORITIES),
  start_date: dateStr.nullable(),
  due_date: dateStr.nullable(),
  assignee_id: z.number().nullable(),
  creator_id: z.number(),
  parent_id: z.number().nullable(),
  sprint_id: z.number().nullable(),
  time_estimate: z.number(),
  recurrence: recurrenceSchema.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Task = z.infer<typeof taskSchema>;

export const taskMemberSchema = z.object({
  user_id: z.number(),
  kind: z.enum(MEMBER_KINDS),
  user: userSchema.optional(),
});
export type TaskMember = z.infer<typeof taskMemberSchema>;

// Задача с подгруженными связями — формат списка и карточки
export const taskViewSchema = taskSchema.extend({
  assignee: userSchema.nullable().optional(),
  creator: userSchema.optional(),
  tags: z.array(tagSchema).default([]),
  members: z.array(taskMemberSchema).default([]),
  counts: z
    .object({
      subtasks: z.number(),
      comments: z.number(),
      files: z.number(),
      checklist_total: z.number(),
      checklist_done: z.number(),
      time_spent: z.number(),
    })
    .optional(),
});
export type TaskView = z.infer<typeof taskViewSchema>;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Введите название').max(200, 'Название слишком длинное'),
  description: z.string().max(5000).default(''),
  priority: z.enum(PRIORITIES).default('medium'),
  start_date: dateStr.nullish(),
  due_date: dateStr.nullish(),
  assignee_id: z.number().int().positive().nullish(),
  parent_id: z.number().int().positive().nullish(),
  sprint_id: z.number().int().positive().nullish(),
  time_estimate: z.number().int().min(0).default(0),
  participant_ids: z.array(z.number().int().positive()).default([]),
  observer_ids: z.array(z.number().int().positive()).default([]),
  tag_ids: z.array(z.number().int().positive()).default([]),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateStatusSchema = z.object({ status: z.enum(STATUSES) });

export const bulkActionSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200),
  action: z.enum(['status', 'assign', 'delete']),
  value: z.union([z.enum(STATUSES), z.number().int().positive()]).optional(),
});
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
