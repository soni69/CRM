import { useState } from 'react';
import { useChecklist, useChecklistMutations } from '../hooks';
import { Button, Input } from '../../../shared/ui';
import { cn } from '../../../shared/utils/cn';

export function Checklist({ taskId }: { taskId: number }) {
  const { data: items = [] } = useChecklist(taskId);
  const mut = useChecklistMutations(taskId);
  const [text, setText] = useState('');
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  const add = () => { const t = text.trim(); if (t) { mut.add.mutate(t); setText(''); } };

  return (
    <div>
      {items.length > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hover">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-faint">{done}/{items.length}</span>
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        {items.map((i) => (
          <div key={i.id} className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-hover">
            <input type="checkbox" checked={i.done} onChange={(e) => mut.update.mutate({ id: i.id, done: e.target.checked })} className="h-4 w-4 accent-[var(--success)]" />
            <span className={cn('flex-1 text-sm', i.done && 'text-faint line-through')}>{i.text}</span>
            <button onClick={() => mut.remove.mutate(i.id)} className="text-faint opacity-0 hover:text-danger group-hover:opacity-100">×</button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Добавить пункт…" className="h-8" />
        <Button size="sm" variant="outline" onClick={add} disabled={!text.trim()}>Добавить</Button>
      </div>
    </div>
  );
}
