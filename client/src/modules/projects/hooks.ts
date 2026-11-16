import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from './api';
import { useToast } from '../../shared/ui';
import { ApiError } from '../../shared/api/client';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then((r) => r.projects),
    staleTime: 30_000,
  });
}

export function useProjectMutations() {
  const qc = useQueryClient();
  const toast = useToast();
  const inv = () => {
    qc.invalidateQueries({ queryKey: ['projects'] });
    qc.invalidateQueries({ queryKey: ['tasks'] });
    qc.invalidateQueries({ queryKey: ['search-tasks'] });
  };
  const onErr = (e: unknown) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err');
  return {
    create: useMutation({
      mutationFn: projectsApi.create,
      onSuccess: () => { toast('Проект создан'); inv(); }, onError: onErr,
    }),
    update: useMutation({
      mutationFn: ({ id, ...d }: { id: number } & Parameters<typeof projectsApi.update>[1]) => projectsApi.update(id, d),
      onSuccess: () => { toast('Проект сохранён'); inv(); }, onError: onErr,
    }),
    remove: useMutation({
      mutationFn: (id: number) => projectsApi.remove(id),
      onSuccess: () => { toast('Проект удалён'); inv(); }, onError: onErr,
    }),
  };
}
