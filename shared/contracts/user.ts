import { z } from 'zod';

export const ROLES = ['admin', 'lead', 'manager'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Администратор',
  lead: 'Тимлид',
  manager: 'Менеджер',
};

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
  phone: z.string().nullable().optional(),
  telegram: z.string().nullable().optional(),
  created_at: z.string(),
});
export type User = z.infer<typeof userSchema>;

// Профиль: свой — каждому, чужой — админу
export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  telegram: z.string().trim().max(80).nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
