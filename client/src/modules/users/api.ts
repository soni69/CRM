import { api } from '../../shared/api/client';
import { API, type User, type Role, type CreateUserInput, type UpdateProfileInput } from '@crm/contracts';

export type ListedUser = User & { open_tasks: number };

export const usersApi = {
  list: () => api.get<{ users: ListedUser[] }>(API.users.list),
  create: (d: CreateUserInput) => api.post<{ user: User }>(API.users.create, d),
  setRole: (id: number, role: Role) => api.patch<{ user: User }>(API.users.role(id), { role }),
  update: (id: number, d: UpdateProfileInput) => api.patch<{ user: User }>(API.users.one(id), d),
  remove: (id: number) => api.delete(API.users.one(id)),
};
