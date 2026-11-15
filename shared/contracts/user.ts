import { z } from 'zod';

export const ROLES = ['admin', 'manager', 'member'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  member: 'Участник',
};

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
  created_at: z.string(),
});
export type User = z.infer<typeof userSchema>;
