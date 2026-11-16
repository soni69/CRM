import type { TaskView } from '@crm/contracts';
import { Avatar } from '../../../shared/ui';
import { StatusMenu } from './StatusMenu';
import { PriorityIcon } from './badges';
import { formatDate, isOverdue } from '../../../shared/utils/format';
import { cn } from '../../../shared/utils/cn';

// Строка задачи в списке
export function TaskRow({ task, onOpen, selected, onSelect }: {
  task: TaskView; onOpen: (id: number) => void; selected: boolean; onSelect: (id: number) => void;
}) {
  return (
    <div
      onClick={() => onOpen(task.id)}
      className={cn('flex cursor-pointer items-center gap-3 border-b border-border px-4 py-2.5 hover:bg-hover', selected && 'bg-accent-soft')}
    >
      <input type="checkbox" checked={selected} onClick={(e) => e.stopPropagation()} onChange={() => onSelect(task.id)} className="h-4 w-4 shrink-0 accent-[var(--accent)]" />
      <PriorityIcon priority={task.priority} />
      <span className={cn('min-w-0 flex-1 truncate font-medium', task.done && 'text-muted line-through')}>{task.title}</span>
      {task.project && <span className="hidden shrink-0 rounded px-1.5 text-[10px] sm:inline" style={{ background: task.project.color + '1f', color: task.project.color }}>{task.project.name}</span>}
      <div className="hidden gap-1 sm:flex">{task.tags.map((t) => <span key={t.id} className="rounded px-1.5 text-[10px]" style={{ background: t.color + '22', color: t.color }}>{t.name}</span>)}</div>
      {task.due_date && <span className={cn('w-24 font-mono text-[11px]', isOverdue(task.due_date, !!task.done, task.due_time) ? 'text-danger' : 'text-faint')}>{formatDate(task.due_date)}{task.due_time ? ` ${task.due_time}` : ''}</span>}
      <StatusMenu taskId={task.id} status={task.status} />
      {task.assignee ? <Avatar name={task.assignee.name} id={task.assignee.id} size={22} /> : <span style={{ width: 22 }} />}
    </div>
  );
}
