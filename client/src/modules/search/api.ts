import { api } from '../../shared/api/client';
import { API, type TaskView } from '@crm/contracts';
import type { TaskFilters } from './hooks';

export const searchApi = {
  tasks: (f: TaskFilters) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v !== '' && v !== undefined) qs.set(k, String(v));
    return api.get<{ tasks: TaskView[] }>(`${API.search.tasks}?${qs}`);
  },
};
