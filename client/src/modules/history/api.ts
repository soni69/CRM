import { api } from '../../shared/api/client';
import { API, type TaskEvent } from '@crm/contracts';

export const historyApi = {
  list: (taskId: number) => api.get<{ events: TaskEvent[] }>(API.tasks.history(taskId)),
};
