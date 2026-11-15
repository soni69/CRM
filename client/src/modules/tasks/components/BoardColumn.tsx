import { useState } from 'react';
import type { TaskView, BoardColumn as BoardColumnT } from '@crm/contracts';
import { TaskCard } from './TaskCard';
import { Input } from '../../../shared/ui';
import { useCreateTask } from '../hooks';
import { tasksApi } from '../api';
import { useColumns } from '../../columns';
import { cn } from '../../../shared/utils/cn';

export function BoardColumn({ column, tasks, onOpen, selected, onSelect }: {
  column: BoardColumnT; tasks: TaskView[];
  onOpen: (id: number) => void; selected: Set<number>; onSelect: (id: number) => void;
}) {
  const create = useCreateTask();
  const { data: columns = [] } = useColumns();
  const [quick, setQuick] = useState('');
  const firstKey = columns[0]?.key;
  const add = () => {
    const t = quick.trim();
    if (!t) return;
    create.mutate({ title: t, description: '', priority: 'medium', time_estimate: 0, participant_ids: [], observer_ids: [], tag_ids: [] }, {
      onSuccess: (d) => {
        // быстрая задача сразу в нужную колонку
        if (column.key !== firstKey) tasksApi.setStatus(d.task.id, column.key);
      },
    });
    setQuick('');
  };

  return (
    <section
      className="flex min-h-40 min-w-60 flex-1 basis-0 flex-col rounded-xl border border-border border-t-2 bg-surface"
      style={{ borderTopColor: column.color }}
    >
      <header className="flex items-center justify-between px-3 py-2.5">
        <h3 className="text-sm font-semibold">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: column.color }} />
          {column.name}
        </h3>
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
