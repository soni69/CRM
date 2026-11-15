import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from './api';
import { useToast } from '../../shared/ui';
import { ApiError } from '../../shared/api/client';

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: () => usersApi.list().then((r) => r.users), staleTime: 60_000 });
}

export function useUserMutations() {
  const qc = useQueryClient();
  const toast = useToast();
  const inv = () => qc.invalidateQueries({ queryKey: ['users'] });
  const onErr = (e: unknown) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err');
  return {
    create: useMutation({
      mutationFn: (d: Parameters<typeof usersApi.create>[0]) => usersApi.create(d),
      onSuccess: () => { toast('Пользователь создан'); inv(); }, onError: onErr,
    }),
    setRole: useMutation({
      mutationFn: (v: { id: number; role: Parameters<typeof usersApi.setRole>[1] }) => usersApi.setRole(v.id, v.role),
      onSuccess: () => { toast('Роль обновлена'); inv(); }, onError: onErr,
    }),
    remove: useMutation({
      mutationFn: (id: number) => usersApi.remove(id),
      onSuccess: () => { toast('Пользователь удалён'); inv(); }, onError: onErr,
    }),
  };
}
