import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from './api';
import { useToast } from '../../shared/ui';
import { ApiError } from '../../shared/api/client';

export function useComments(taskId: number) {
  return useQuery({ queryKey: ['comments', taskId], queryFn: () => commentsApi.list(taskId).then((r) => r.comments) });
}

export function useCommentMutations(taskId: number) {
  const qc = useQueryClient();
  const toast = useToast();
  const inv = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['comments', taskId] }),
    qc.invalidateQueries({ queryKey: ['tasks'] }),
  ]);
  const onErr = (e: unknown) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err');
  return {
    add: useMutation({ mutationFn: (body: string) => commentsApi.add(taskId, body), onSuccess: inv, onError: onErr }),
    remove: useMutation({ mutationFn: (id: number) => commentsApi.remove(id), onSuccess: inv, onError: onErr }),
  };
}
