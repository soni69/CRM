import { z } from 'zod';

export const SPRINT_STATUSES = ['planned', 'active', 'closed'] as const;
export type SprintStatus = (typeof SPRINT_STATUSES)[number];

export const SPRINT_STATUS_LABELS: Record<SprintStatus, string> = {
  planned: 'Запланирован',
  active: 'Активный',
  closed: 'Завершён',
};

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты ГГГГ-ММ-ДД');

export const sprintSchema = z.object({
  id: z.number(),
  name: z.string(),
  goal: z.string(),
  start_date: dateStr,
  end_date: dateStr,
  status: z.enum(SPRINT_STATUSES),
});
export type Sprint = z.infer<typeof sprintSchema>;

export const createSprintSchema = z.object({
  name: z.string().trim().min(1, 'Введите название').max(120),
  goal: z.string().max(500).default(''),
  start_date: dateStr,
  end_date: dateStr,
});
export type CreateSprintInput = z.infer<typeof createSprintSchema>;

// см. task.ts — .default() пробивается через .partial(), снимаем
export const updateSprintSchema = z.object(
  Object.fromEntries(
    Object.entries(createSprintSchema.shape).map(([k, s]) => [k, s instanceof z.ZodDefault ? s.unwrap() : s]),
  ),
).partial().extend({
  status: z.enum(SPRINT_STATUSES).optional(),
});
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;
