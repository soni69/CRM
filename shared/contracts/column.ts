import { z } from 'zod';

// Колонка доски — настраиваемый статус задачи
export const boardColumnSchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
  color: z.string(),
  position: z.number(),
  is_done: z.number(),
  hidden: z.number(),
});
export type BoardColumn = z.infer<typeof boardColumnSchema>;

const colorHex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Цвет в формате #RRGGBB');

export const createColumnSchema = z.object({
  name: z.string().trim().min(1, 'Введите название').max(60, 'Название слишком длинное'),
  color: colorHex.default('#5e6ad2'),
});
export type CreateColumnInput = z.infer<typeof createColumnSchema>;

export const updateColumnSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  color: colorHex.optional(),
  hidden: z.boolean().optional(),
  is_done: z.boolean().optional(),
});
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;

export const reorderColumnsSchema = z.object({ ids: z.array(z.number().int().positive()).min(1) });
export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;
