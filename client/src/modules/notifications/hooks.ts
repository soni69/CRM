import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from './api';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    refetchInterval: 30_000,
  });
}

export function useNotificationMutations() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  return {
    read: useMutation({ mutationFn: notificationsApi.read, onSuccess: inv }),
    readAll: useMutation({ mutationFn: notificationsApi.readAll, onSuccess: inv }),
  };
}
