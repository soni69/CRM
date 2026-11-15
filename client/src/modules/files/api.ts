import { api } from '../../shared/api/client';
import { API, type Attachment } from '@crm/contracts';

export const filesApi = {
  list: (taskId: number) => api.get<{ files: Attachment[] }>(API.tasks.files(taskId)),
  upload: (taskId: number, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return api.post<{ files: Attachment[] }>(API.tasks.files(taskId), fd);
  },
  remove: (id: number) => api.delete(API.files.one(id)),
  downloadUrl: (id: number) => API.files.download(id),
};
