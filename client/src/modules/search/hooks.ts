import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { searchApi } from './api';

export interface TaskFilters {
  q?: string;
  status?: string;
  assignee_id?: string;
  priority?: string;
  tag_id?: string;
  sprint_id?: string;
  project_id?: string;
  parent_id?: string;
  overdue?: string;
  sort?: string;
  order?: string;
}

// Состояние фильтров живёт в URL — ссылкой можно делиться
export function useTaskFilters() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo<TaskFilters>(() => {
    const f: TaskFilters = {};
    for (const k of ['q','status','assignee_id','priority','tag_id','sprint_id','parent_id','overdue','sort','order'] as const) {
      const v = params.get(k);
      if (v) f[k] = v;
    }
    return f;
  }, [params]);

  const setFilter = (key: keyof TaskFilters, value: string | undefined) => {
    setParams((p) => {
      const n = new URLSearchParams(p);
      value ? n.set(key, value) : n.delete(key);
      return n;
    }, { replace: true });
  };
  const reset = () => setParams({}, { replace: true });
  const active = Object.keys(filters).filter((k) => k !== 'sort' && k !== 'order').length;
  return { filters, setFilter, reset, active };
}

// Поисковый запрос — активен только когда есть фильтры
export function useSearchTasks(filters: TaskFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['search-tasks', filters],
    queryFn: () => searchApi.tasks(filters).then((r) => r.tasks),
    enabled,
  });
}
