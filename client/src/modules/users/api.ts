import { api } from '../../shared/api/client';
import { API, type User, type Role, type CreateUserInput } from '@crm/contracts';

export type ListedUser = User & { open_tasks: number };

export const usersApi = {
  list: () => api.get<{ users: ListedUser[] }>(API.users.list),
  create: (d: CreateUserInput) => api.post<{ user: User }>(API.users.create, d),
  setRole: (id: number, role: Role) => api.patch<{ user: User }>(API.users.role(id), { role }),
  remove: (id: number) => api.delete(API.users.one(id)),
};
