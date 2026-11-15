import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { columnsApi } from './api';
import { useToast } from '../../shared/ui';
import { ApiError } from '../../shared/api/client';

export const COLUMNS_KEY = ['columns'];

export function useColumns() {
  return useQuery({
    queryKey: COLUMNS_KEY,
    queryFn: () => columnsApi.list().then((r) => r.columns),
    staleTime: 60_000,
  });
}

// Быстрый поиск колонки по ключу статуса
export function useColumnByKey() {
  const { data: columns = [] } = useColumns();
  const map = new Map(columns.map((c) => [c.key, c]));
  return (key: string) => map.get(key);
}

export function useColumnMutations() {
  const qc = useQueryClient();
  const toast = useToast();
  const inv = () => {
    qc.invalidateQueries({ queryKey: COLUMNS_KEY });
    qc.invalidateQueries({ queryKey: ['tasks'] });
    qc.invalidateQueries({ queryKey: ['search-tasks'] });
  };
  const onErr = (e: unknown) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err');
  return {
    create: useMutation({
      mutationFn: columnsApi.create,
      onSuccess: () => { toast('Колонка создана'); inv(); }, onError: onErr,
    }),
    update: useMutation({
      mutationFn: ({ id, ...d }: { id: number } & Parameters<typeof columnsApi.update>[1]) => columnsApi.update(id, d),
      onSuccess: inv, onError: onErr,
    }),
    reorder: useMutation({
      mutationFn: (ids: number[]) => columnsApi.reorder(ids),
      onSuccess: inv, onError: onErr,
    }),
    remove: useMutation({
      mutationFn: (id: number) => columnsApi.remove(id),
      onSuccess: () => { toast('Колонка удалена'); inv(); }, onError: onErr,
    }),
  };
}
