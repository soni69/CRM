import { api } from '../../shared/api/client';
import { API, type User, type LoginInput, type RegisterInput } from '@crm/contracts';

export const authApi = {
  me: () => api.get<{ user: User }>(API.auth.me),
  login: (d: LoginInput) => api.post<{ user: User }>(API.auth.login, d),
  register: (d: RegisterInput) => api.post<{ user: User }>(API.auth.register, d),
  logout: () => api.post<undefined>(API.auth.logout),
};
