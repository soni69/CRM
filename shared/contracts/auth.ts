import { z } from 'zod';
import { userSchema, ROLES } from './user.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Имя короче 2 символов').max(60, 'Имя слишком длинное'),
  email: z.email('Некорректный email').trim().toLowerCase(),
  password: z.string().min(6, 'Пароль короче 6 символов').max(100),
});

export const createUserSchema = registerSchema.extend({ role: z.enum(ROLES).default('member') });
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const loginSchema = z.object({
  email: z.email('Некорректный email').trim().toLowerCase(),
  password: z.string().min(1, 'Введите пароль'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const sessionSchema = z.object({ user: userSchema });
export type Session = z.infer<typeof sessionSchema>;
