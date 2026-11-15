import { z } from 'zod';
import { userSchema } from './user.js';

export const attachmentSchema = z.object({
  id: z.number(),
  task_id: z.number(),
  uploader_id: z.number(),
  filename: z.string(),
  orig_name: z.string(),
  size: z.number(),
  mime: z.string(),
  created_at: z.string(),
  uploader: userSchema.optional(),
});
export type Attachment = z.infer<typeof attachmentSchema>;
