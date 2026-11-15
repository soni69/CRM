import { z } from 'zod';

export const checklistItemSchema = z.object({
  id: z.number(),
  task_id: z.number(),
  text: z.string(),
  done: z.boolean(),
  position: z.number(),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const createChecklistItemSchema = z.object({
  text: z.string().trim().min(1, 'Пустой пункт').max(300),
});

export const updateChecklistItemSchema = z.object({
  text: z.string().trim().min(1).max(300).optional(),
  done: z.boolean().optional(),
});
