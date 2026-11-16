import { z } from 'zod';
import { userSchema } from './user.js';

// Проект — группирует задачи и людей, у проекта есть тимлид
export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  goal: z.string(),
  due_date: z.string().nullable(),
  color: z.string(),
  lead_id: z.number().nullable(),
  created_at: z.string(),
});

// Этап проекта — подцель со своим ответственным и сроком
export const projectStageSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  title: z.string(),
  owner_id: z.number().nullable(),
  owner: userSchema.nullable().optional(),
  due_date: z.string().nullable(),
  done: z.number(),
  position: z.number(),
});
export type ProjectStage = z.infer<typeof projectStageSchema>;
export type Project = z.infer<typeof projectSchema>;

export const projectViewSchema = projectSchema.extend({
  lead: userSchema.nullable().optional(),
  member_ids: z.array(z.number()),
  member_count: z.number(),
  task_count: z.number(),
  stages: z.array(projectStageSchema),
});
export type ProjectView = z.infer<typeof projectViewSchema>;

const colorHex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Цвет в формате #RRGGBB');

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Введите название').max(120),
  description: z.string().max(2000).default(''),
  goal: z.string().max(2000).default(''),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  color: colorHex.default('#5e6ad2'),
  lead_id: z.number().int().positive().nullish(),
  member_ids: z.array(z.number().int().positive()).default([]),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const createStageSchema = z.object({
  title: z.string().trim().min(1, 'Введите название этапа').max(200),
  owner_id: z.number().int().positive().nullish(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
});
export type CreateStageInput = z.infer<typeof createStageSchema>;

export const updateStageSchema = createStageSchema.partial().extend({
  done: z.number().int().min(0).max(1).optional(),
});
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
