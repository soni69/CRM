import { z } from 'zod';

export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
});
export type Tag = z.infer<typeof tagSchema>;

export const createTagSchema = z.object({
  name: z.string().trim().min(1, 'Введите название').max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Цвет в формате #RRGGBB').default('#888888'),
});
export type CreateTagInput = z.infer<typeof createTagSchema>;

export const setTagsSchema = z.object({
  tag_ids: z.array(z.number().int().positive()).max(20),
});
