import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from './api';
import { useToast } from '../../shared/ui';
import { ApiError } from '../../shared/api/client';

export function useTags() {
  return useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list().then((r) => r.tags), staleTime: 60_000 });
}

export function useCreateTag() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err'),
  });
}
