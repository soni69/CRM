import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { tasksApi } from './api';
import { useToast } from '../../shared/ui';
import { ApiError } from '../../shared/api/client';

const KEY = ['tasks'];

// Инвалидация всех списков задач (board, search, sprint)
export const invalidateTasks = (qc: ReturnType<typeof useQueryClient>) =>
  Promise.all([qc.invalidateQueries({ queryKey: ['tasks'] }), qc.invalidateQueries({ queryKey: ['search-tasks'] })]);

export function useTasks() {
  return useQuery({ queryKey: KEY, queryFn: () => tasksApi.list().then((r) => r.tasks) });
}

export function useTask(id: number | null) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.one(id!).then((r) => r.task),
    enabled: id !== null,
  });
}

function useTaskMutation<T, R>(fn: (v: T) => Promise<R>, ok?: string) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => { if (ok) toast(ok); await invalidateTasks(qc); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err'),
  });
}

export const useCreateTask = () =>
  useTaskMutation((d: Parameters<typeof tasksApi.create>[0]) => tasksApi.create(d), 'Задача создана');
export const useUpdateTask = (id: number) =>
  useTaskMutation((d: Parameters<typeof tasksApi.update>[1]) => tasksApi.update(id, d));
export const useUpdateStatus = () =>
  useTaskMutation((v: { id: number; status: Parameters<typeof tasksApi.setStatus>[1] }) => tasksApi.setStatus(v.id, v.status));
export const useDeleteTask = () =>
  useTaskMutation((id: number) => tasksApi.remove(id), 'Задача удалена');
export const useBulk = () =>
  useTaskMutation((d: Parameters<typeof tasksApi.bulk>[0]) => tasksApi.bulk(d));

// Мультивыделение карточек для массовых действий
export function useSelection() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggle = useCallback((id: number) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const clear = useCallback(() => setSelected(new Set()), []);
  return { selected, toggle, clear };
}
