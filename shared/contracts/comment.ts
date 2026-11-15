import { z } from 'zod';
import { userSchema } from './user.js';

export const commentSchema = z.object({
  id: z.number(),
  task_id: z.number(),
  author_id: z.number(),
  body: z.string(),
  created_at: z.string(),
  author: userSchema.optional(),
});
export type Comment = z.infer<typeof commentSchema>;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, 'Пустой комментарий').max(3000),
});
