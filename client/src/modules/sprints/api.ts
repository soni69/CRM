import { api } from '../../shared/api/client';
import { API, type Sprint, type CreateSprintInput, type UpdateSprintInput, type TaskView } from '@crm/contracts';

export type ListedSprint = Sprint & { task_count: number; done_count: number };

export const sprintsApi = {
  list: () => api.get<{ sprints: ListedSprint[] }>(API.sprints.list),
  create: (d: CreateSprintInput) => api.post<{ sprint: Sprint }>(API.sprints.list, d),
  update: (id: number, d: UpdateSprintInput) => api.patch<{ sprint: Sprint }>(API.sprints.one(id), d),
  remove: (id: number) => api.delete(API.sprints.one(id)),
  tasks: (id: number) => api.get<{ sprint: Sprint; tasks: TaskView[] }>(`${API.sprints.one(id)}/tasks`),
};
