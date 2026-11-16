import { api } from '../../shared/api/client';
import { API, type ProjectView, type CreateProjectInput, type UpdateProjectInput, type CreateStageInput, type UpdateStageInput } from '@crm/contracts';

export const projectsApi = {
  list: () => api.get<{ projects: ProjectView[] }>(API.projects.list),
  one: (id: number) => api.get<{ project: ProjectView }>(API.projects.one(id)),
  create: (d: CreateProjectInput) => api.post<{ project: ProjectView }>(API.projects.list, d),
  update: (id: number, d: UpdateProjectInput) => api.patch<{ project: ProjectView }>(API.projects.one(id), d),
  remove: (id: number) => api.delete(API.projects.one(id)),
  addStage: (id: number, d: CreateStageInput) => api.post<{ project: ProjectView }>(API.projects.stages(id), d),
  updateStage: (id: number, sid: number, d: UpdateStageInput) => api.patch<{ project: ProjectView }>(API.projects.stage(id, sid), d),
  removeStage: (id: number, sid: number) => api.delete<{ project: ProjectView }>(API.projects.stage(id, sid)),
};
