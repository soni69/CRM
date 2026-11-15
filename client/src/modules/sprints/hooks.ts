import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sprintsApi } from './api';
import { useToast } from '../../shared/ui';
import { ApiError } from '../../shared/api/client';

export function useSprints() {
  return useQuery({ queryKey: ['sprints'], queryFn: () => sprintsApi.list().then((r) => r.sprints) });
}

export function useSprintMutations() {
  const qc = useQueryClient();
  const toast = useToast();
  const inv = () => qc.invalidateQueries({ queryKey: ['sprints'] });
  const onErr = (e: unknown) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err');
  return {
    create: useMutation({ mutationFn: sprintsApi.create, onSuccess: () => { toast('Спринт создан'); inv(); }, onError: onErr }),
    update: useMutation({
      mutationFn: (v: { id: number; d: Parameters<typeof sprintsApi.update>[1] }) => sprintsApi.update(v.id, v.d),
      onSuccess: inv, onError: onErr,
    }),
    remove: useMutation({ mutationFn: (id: number) => sprintsApi.remove(id), onSuccess: inv, onError: onErr }),
  };
}
