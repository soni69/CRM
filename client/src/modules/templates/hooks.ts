import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { templatesApi } from './api';
import { useToast } from '../../shared/ui';
import { ApiError } from '../../shared/api/client';

export function useTemplates() {
  return useQuery({ queryKey: ['templates'], queryFn: () => templatesApi.list().then((r) => r.templates), staleTime: 60_000 });
}

export function useTemplateMutations() {
  const qc = useQueryClient();
  const toast = useToast();
  const inv = () => qc.invalidateQueries({ queryKey: ['templates'] });
  const invTasks = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['tasks'] }),
    qc.invalidateQueries({ queryKey: ['search-tasks'] }),
  ]);
  const onErr = (e: unknown) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err');
  return {
    create: useMutation({ mutationFn: templatesApi.create, onSuccess: () => { toast('Шаблон сохранён'); inv(); }, onError: onErr }),
    remove: useMutation({ mutationFn: (id: number) => templatesApi.remove(id), onSuccess: inv, onError: onErr }),
    createTask: useMutation({
      mutationFn: (v: { id: number; title?: string }) => templatesApi.createTask(v.id, v.title),
      onSuccess: () => { toast('Задача создана из шаблона'); invTasks(); }, onError: onErr,
    }),
  };
}
