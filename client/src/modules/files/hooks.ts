import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { filesApi } from './api';
import { useToast } from '../../shared/ui';
import { ApiError } from '../../shared/api/client';

export function useFiles(taskId: number) {
  return useQuery({ queryKey: ['files', taskId], queryFn: () => filesApi.list(taskId).then((r) => r.files) });
}

export function useFileMutations(taskId: number) {
  const qc = useQueryClient();
  const toast = useToast();
  const inv = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['files', taskId] }),
    qc.invalidateQueries({ queryKey: ['tasks'] }),
  ]);
  const onErr = (e: unknown) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err');
  return {
    upload: useMutation({ mutationFn: (files: File[]) => filesApi.upload(taskId, files), onSuccess: inv, onError: onErr }),
    remove: useMutation({ mutationFn: (id: number) => filesApi.remove(id), onSuccess: inv, onError: onErr }),
  };
}
