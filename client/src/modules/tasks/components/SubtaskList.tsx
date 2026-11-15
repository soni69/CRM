import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../../../modules/search/api';
import { StatusBadge } from './badges';
import { Avatar, Input, Button } from '../../../shared/ui';
import { useCreateTask } from '../hooks';
import { cn } from '../../../shared/utils/cn';

export function SubtaskList({ parentId, onOpen }: { parentId: number; onOpen: (id: number) => void }) {
  const { data: subs = [] } = useQuery({
    queryKey: ['search-tasks', { parent_id: String(parentId) }],
    queryFn: () => searchApi.tasks({ parent_id: String(parentId) }).then((r) => r.tasks),
  });
  const create = useCreateTask();
  const [title, setTitle] = useState('');
  const add = () => {
    const t = title.trim();
    if (!t) return;
    create.mutate({ title: t, description: '', priority: 'medium', parent_id: parentId, time_estimate: 0, participant_ids: [], observer_ids: [], tag_ids: [] });
    setTitle('');
  };

  return (
    <div>
      <div className="flex flex-col gap-1">
        {subs.map((s) => (
          <button key={s.id} onClick={() => onOpen(s.id)} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-left hover:border-border-strong">
            <span className={cn('flex-1 truncate text-sm', s.done && 'text-faint line-through')}>{s.title}</span>
            <StatusBadge status={s.status} />
            {s.assignee && <Avatar name={s.assignee.name} id={s.assignee.id} size={20} />}
          </button>
        ))}
        {!subs.length && <p className="py-2 text-center text-xs text-faint">Подзадач нет</p>}
      </div>
      <div className="mt-2 flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Новая подзадача…" className="h-8" />
        <Button size="sm" variant="outline" onClick={add} disabled={!title.trim()}>Добавить</Button>
      </div>
    </div>
  );
}
