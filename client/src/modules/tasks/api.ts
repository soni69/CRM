import { api } from '../../shared/api/client';
import {
  API, type TaskView, type CreateTaskInput, type UpdateTaskInput,
  type Status, type BulkActionInput, type RecurrenceFreq,
} from '@crm/contracts';

export const tasksApi = {
  list: () => api.get<{ tasks: TaskView[] }>(API.tasks.list),
  one: (id: number) => api.get<{ task: TaskView }>(API.tasks.one(id)),
  create: (d: CreateTaskInput) => api.post<{ task: TaskView }>(API.tasks.list, d),
  update: (id: number, d: UpdateTaskInput) => api.patch<{ task: TaskView }>(API.tasks.one(id), d),
  setStatus: (id: number, status: Status) => api.patch<{ task: TaskView }>(API.tasks.status(id), { status }),
  setRecurrence: (id: number, freq: RecurrenceFreq | null) =>
    api.patch<{ task: TaskView }>(API.tasks.recurrence(id), { freq }),
  bulk: (d: BulkActionInput) => api.patch<{ done: number[]; failed: { id: number; error: string }[] }>(API.tasks.bulk, d),
  remove: (id: number) => api.delete(API.tasks.one(id)),
};
