import { z } from 'zod';
import { PRIORITIES } from './task.js';

export const taskTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(PRIORITIES),
  checklist: z.array(z.string()),
  creator_id: z.number(),
});
export type TaskTemplate = z.infer<typeof taskTemplateSchema>;

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Введите название').max(80),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).default(''),
  priority: z.enum(PRIORITIES).default('medium'),
  checklist: z.array(z.string().trim().min(1).max(300)).max(50).default([]),
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
