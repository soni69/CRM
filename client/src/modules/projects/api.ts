import { api } from '../../shared/api/client';
import { API, type ProjectView, type CreateProjectInput, type UpdateProjectInput } from '@crm/contracts';

export const projectsApi = {
  list: () => api.get<{ projects: ProjectView[] }>(API.projects.list),
  one: (id: number) => api.get<{ project: ProjectView }>(API.projects.one(id)),
  create: (d: CreateProjectInput) => api.post<{ project: ProjectView }>(API.projects.list, d),
  update: (id: number, d: UpdateProjectInput) => api.patch<{ project: ProjectView }>(API.projects.one(id), d),
  remove: (id: number) => api.delete(API.projects.one(id)),
};
