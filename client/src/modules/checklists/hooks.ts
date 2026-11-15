import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checklistsApi } from './api';
import { useToast } from '../../shared/ui';
import { ApiError } from '../../shared/api/client';

export function useChecklist(taskId: number) {
  return useQuery({ queryKey: ['checklist', taskId], queryFn: () => checklistsApi.list(taskId).then((r) => r.items) });
}

export function useChecklistMutations(taskId: number) {
  const qc = useQueryClient();
  const toast = useToast();
  const inv = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['checklist', taskId] }),
    qc.invalidateQueries({ queryKey: ['tasks'] }),
    qc.invalidateQueries({ queryKey: ['task', taskId] }),
  ]);
  const onErr = (e: unknown) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err');
  return {
    add: useMutation({ mutationFn: (text: string) => checklistsApi.add(taskId, text), onSuccess: inv, onError: onErr }),
    update: useMutation({ mutationFn: (v: { id: number; done?: boolean; text?: string }) => checklistsApi.update(v.id, v), onSuccess: inv, onError: onErr }),
    remove: useMutation({ mutationFn: (id: number) => checklistsApi.remove(id), onSuccess: inv, onError: onErr }),
  };
}
