import type { TaskView } from '@crm/contracts';
import { Avatar, Badge } from '../../../shared/ui';
import { StatusMenu } from './StatusMenu';
import { PriorityIcon } from './badges';
import { formatDate, formatMinutes, isOverdue } from '../../../shared/utils/format';
import { cn } from '../../../shared/utils/cn';
import { useAuth } from '../../../modules/auth';

function Ico({ path }: { path: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="opacity-70">
      <path d={path} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TaskCard({ task, onOpen, selected, onSelect }: {
  task: TaskView; onOpen: (id: number) => void; selected: boolean; onSelect: (id: number) => void;
}) {
  const { user } = useAuth();
  const overdue = isOverdue(task.due_date, task.status);
  const c = task.counts;
  const canSelect = user && (user.role !== 'member' || task.creator_id === user.id || task.assignee_id === user.id);

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-lg border bg-raised p-3 transition-colors',
        selected ? 'border-accent shadow-[0_0_0_1px_var(--accent)]' : 'border-border hover:border-border-strong',
      )}
      onClick={() => onOpen(task.id)}
    >
      {canSelect && (
        <input
          type="checkbox"
          checked={selected}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onSelect(task.id)}
          className={cn('absolute right-2 top-2 h-4 w-4 accent-[var(--accent)]', selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}
        />
      )}
      <div className="flex items-start gap-2">
        <PriorityIcon priority={task.priority} className="mt-1" />
        <div className="min-w-0 flex-1">
          <p className={cn('font-medium leading-snug', task.status === 'done' && 'text-muted line-through')}>{task.title}</p>
          {task.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {task.tags.map((t) => (
                <span key={t.id} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: t.color + '22', color: t.color }}>
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] text-faint">
          {task.due_date && (
            <span className={cn('font-mono', overdue && 'font-semibold text-danger')}>
              {overdue ? '⚠ ' : ''}{formatDate(task.due_date)}
            </span>
          )}
          {c?.subtasks ? <span title="Подзадачи" className="inline-flex items-center gap-0.5"><Ico path="M4 4h8v8H4z" />{c.subtasks}</span> : null}
          {c?.checklist_total ? <span title="Чек-лист" className="inline-flex items-center gap-0.5"><Ico path="M3 5l1.5 1.5L8 3M3 11l1.5 1.5L8 9M10 5h4M10 11h4" />{c.checklist_done}/{c.checklist_total}</span> : null}
          {c?.comments ? <span title="Комментарии" className="inline-flex items-center gap-0.5"><Ico path="M3 3h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7l-4 3V4a1 1 0 0 1 1-1z" />{c.comments}</span> : null}
          {c?.files ? <span title="Файлы" className="inline-flex items-center gap-0.5"><Ico path="M10 3H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6l-2-3z" />{c.files}</span> : null}
          {c?.time_spent ? <span title="Списано времени" className="inline-flex items-center gap-0.5 font-mono"><Ico path="M8 4a4.5 4.5 0 1 0 .001 9.001A4.5 4.5 0 0 0 8 4zM8 6v2.5l1.7 1" />{formatMinutes(c.time_spent)}</span> : null}
        </div>
        <div className="flex items-center gap-1.5">
          <StatusMenu taskId={task.id} status={task.status} />
          {task.assignee
            ? <Avatar name={task.assignee.name} id={task.assignee.id} size={22} />
            : <span title="Не назначена" className="flex items-center justify-center rounded-full border border-dashed border-border-strong text-[10px] text-faint" style={{ width: 22, height: 22 }}>?</span>}
        </div>
      </div>
    </div>
  );
}
