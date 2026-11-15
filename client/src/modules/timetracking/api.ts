import { api } from '../../shared/api/client';
import { API, type TimeEntry, type CreateTimeEntryInput } from '@crm/contracts';

export const timeApi = {
  list: (taskId: number) => api.get<{ entries: TimeEntry[]; total: number }>(API.tasks.time(taskId)),
  add: (taskId: number, d: CreateTimeEntryInput) => api.post<{ entry: TimeEntry }>(API.tasks.time(taskId), d),
};
