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
    addStage: useMutation({
      mutationFn: ({ id, ...d }: { id: number } & Parameters<typeof projectsApi.addStage>[1]) => projectsApi.addStage(id, d),
      onSuccess: inv, onError: onErr,
    }),
    updateStage: useMutation({
      mutationFn: ({ id, sid, ...d }: { id: number; sid: number } & Parameters<typeof projectsApi.updateStage>[2]) => projectsApi.updateStage(id, sid, d),
      onSuccess: inv, onError: onErr,
    }),
    removeStage: useMutation({
      mutationFn: ({ id, sid }: { id: number; sid: number }) => projectsApi.removeStage(id, sid),
      onSuccess: inv, onError: onErr,
    }),
  };
}
