import { z } from 'zod';
import { userSchema } from './user.js';

// Проект — группирует задачи и людей, у проекта есть тимлид
export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  color: z.string(),
  lead_id: z.number().nullable(),
  created_at: z.string(),
});
export type Project = z.infer<typeof projectSchema>;

export const projectViewSchema = projectSchema.extend({
  lead: userSchema.nullable().optional(),
  member_ids: z.array(z.number()),
  member_count: z.number(),
  task_count: z.number(),
});
export type ProjectView = z.infer<typeof projectViewSchema>;

const colorHex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Цвет в формате #RRGGBB');

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Введите название').max(120),
  description: z.string().max(2000).default(''),
  color: colorHex.default('#5e6ad2'),
  lead_id: z.number().int().positive().nullish(),
  member_ids: z.array(z.number().int().positive()).default([]),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
