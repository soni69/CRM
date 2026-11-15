import { api } from '../../shared/api/client';
import { API, type ChecklistItem } from '@crm/contracts';

export const checklistsApi = {
  list: (taskId: number) => api.get<{ items: ChecklistItem[] }>(API.tasks.checklist(taskId)),
  add: (taskId: number, text: string) => api.post<{ item: ChecklistItem }>(API.tasks.checklist(taskId), { text }),
  update: (id: number, d: { text?: string; done?: boolean }) => api.patch<{ item: ChecklistItem }>(API.checklist.one(id), d),
  remove: (id: number) => api.delete(API.checklist.one(id)),
};
