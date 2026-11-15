import { api } from '../../shared/api/client';
import { API, type TaskTemplate, type CreateTemplateInput, type TaskView } from '@crm/contracts';

export const templatesApi = {
  list: () => api.get<{ templates: TaskTemplate[] }>(API.templates.list),
  create: (d: CreateTemplateInput) => api.post<{ template: TaskTemplate }>(API.templates.list, d),
  remove: (id: number) => api.delete(API.templates.one(id)),
  createTask: (id: number, title?: string) => api.post<{ task: TaskView }>(API.templates.createTask(id), { title }),
};
