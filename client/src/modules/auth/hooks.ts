import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../shared/api/client';
import { authApi } from './api';
import type { User } from '@crm/contracts';

export function useAuth() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<User | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return (await authApi.me()).user;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 60_000,
    retry: false,
  });

  const logout = useMutation({
    mutationFn: () => authApi.logout().catch(() => undefined),
    onSettled: () => {
      qc.setQueryData(['me'], null);
      qc.clear();
      qc.setQueryData(['me'], null);
    },
  });

  return { user: data ?? null, isLoading, logout: () => logout.mutate() };
}
