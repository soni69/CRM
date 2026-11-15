import { useState } from 'react';
import type { TaskView, Status } from '@crm/contracts';
import { TaskCard } from './TaskCard';
import { Button, Input } from '../../../shared/ui';
import { useCreateTask } from '../hooks';
import { tasksApi } from '../api';
import { cn } from '../../../shared/utils/cn';

const COL_COLOR: Record<Status, string> = {
  new: 'border-t-[#26b5ce]',
  in_progress: 'border-t-warning',
  done: 'border-t-success',
};

export function BoardColumn({ status, title, tasks, onOpen, selected, onSelect }: {
  status: Status; title: string; tasks: TaskView[];
  onOpen: (id: number) => void; selected: Set<number>; onSelect: (id: number) => void;
}) {
  const create = useCreateTask();
  const [quick, setQuick] = useState('');
  const add = () => {
    const t = quick.trim();
    if (!t) return;
    create.mutate({ title: t, description: '', priority: 'medium', time_estimate: 0, participant_ids: [], observer_ids: [], tag_ids: [] }, {
      onSuccess: (d) => {
        // быстрая задача сразу в нужную колонку
        if (status !== 'new') tasksApi.setStatus(d.task.id, status);
      },
    });
    setQuick('');
  };

  return (
    <section className={cn('flex min-h-40 w-72 shrink-0 flex-col rounded-xl border border-border border-t-2 bg-surface sm:w-80', COL_COLOR[status])}>
      <header className="flex items-center justify-between px-3 py-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-faint">{tasks.length}</span>
      </header>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2.5 pb-2">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onOpen={onOpen} selected={selected.has(t.id)} onSelect={onSelect} />
        ))}
        {!tasks.length && <p className="py-6 text-center text-xs text-faint">Пусто</p>}
      </div>
      <div className="flex gap-1.5 p-2.5 pt-1">
        <Input value={quick} onChange={(e) => setQuick(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="+ Быстрая задача" className="h-8 text-xs" />
      </div>
    </section>
  );
}
