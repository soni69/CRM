import { api } from '../../shared/api/client';
import { API, type Tag, type CreateTagInput } from '@crm/contracts';

export const tagsApi = {
  list: () => api.get<{ tags: Tag[] }>(API.tags.list),
  create: (d: CreateTagInput) => api.post<{ tag: Tag }>(API.tags.list, d),
  update: (id: number, d: Partial<CreateTagInput>) => api.patch<{ tag: Tag }>(API.tags.one(id), d),
  remove: (id: number) => api.delete(API.tags.one(id)),
  setTaskTags: (taskId: number, tag_ids: number[]) => api.put(API.tasks.tags(taskId), { tag_ids }),
};
