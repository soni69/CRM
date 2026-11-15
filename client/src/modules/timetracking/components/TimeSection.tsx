import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { timeApi } from '../api';
import { Avatar, Button, Field, Input } from '../../../shared/ui';
import { formatDate, formatMinutes } from '../../../shared/utils/format';
import { useToast } from '../../../shared/ui';
import { ApiError } from '../../../shared/api/client';

export function TimeSection({ taskId, estimate }: { taskId: number; estimate: number }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data } = useQuery({ queryKey: ['time', taskId], queryFn: () => timeApi.list(taskId) });
  const [hours, setHours] = useState('');
  const [comment, setComment] = useState('');

  const add = useMutation({
    mutationFn: () => timeApi.add(taskId, {
      minutes: Math.round(parseFloat(hours.replace(',', '.')) * 60),
      work_date: new Date().toISOString().slice(0, 10),
      comment,
    }),
    onSuccess: () => {
      setHours(''); setComment('');
      qc.invalidateQueries({ queryKey: ['time', taskId] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast('Время списано');
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err'),
  });

  const total = data?.total ?? 0;
  const pct = estimate ? Math.min(100, Math.round((total / estimate) * 100)) : 0;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hover">
          <div className={`h-full rounded-full transition-all ${total > estimate && estimate > 0 ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${estimate ? pct : 0}%` }} />
        </div>
        <span className="font-mono text-xs text-muted">
          {formatMinutes(total)}{estimate ? ` / ${formatMinutes(estimate)}` : ''}
        </span>
      </div>
      <div className="mb-3 grid grid-cols-[1fr_2fr_auto] items-end gap-2">
        <Field label="Часы"><Input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="1.5" inputMode="decimal" className="h-8" /></Field>
        <Field label="Комментарий"><Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Что делали…" className="h-8" /></Field>
        <Button size="sm" variant="outline" onClick={() => add.mutate()} disabled={!hours || add.isPending}>Списать</Button>
      </div>
      <div className="flex flex-col gap-1.5">
        {(data?.entries ?? []).map((e) => (
          <div key={e.id} className="flex items-center gap-2 text-sm">
            <Avatar name={e.user?.name ?? '?'} id={e.user_id} size={18} />
            <span className="font-mono text-xs">{formatMinutes(e.minutes)}</span>
            <span className="text-faint">{formatDate(e.work_date)}</span>
            <span className="truncate text-muted">{e.comment}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
