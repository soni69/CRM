import { api } from '../../shared/api/client';
import { API } from '@crm/contracts';

export const transferApi = {
  exportUrl: API.tasks.exportCsv,
  import: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<{ created: number; errors: { row: number; error: string }[] }>(API.tasks.import, fd);
  },
};
