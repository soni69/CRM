import { api } from '../../shared/api/client';
import { API, type Comment } from '@crm/contracts';

export const commentsApi = {
  list: (taskId: number) => api.get<{ comments: Comment[] }>(API.tasks.comments(taskId)),
  add: (taskId: number, body: string) => api.post<{ comment: Comment }>(API.tasks.comments(taskId), { body }),
  remove: (id: number) => api.delete(API.comments.one(id)),
};
