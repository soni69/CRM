import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../tasks/hooks';
import { PageSpinner, EmptyState, Avatar } from '../../../shared/ui';
import { STATUS_LABELS, type TaskView } from '@crm/contracts';
import { cn } from '../../../shared/utils/cn';

const DAY = 26;            // px на день
const ROW = 34;            // высота строки
const BAR_COLORS = { new: '#26b5ce', in_progress: '#f2c94c', done: '#4cb782' } as const;

const dstr = (d: Date) => d.toISOString().slice(0, 10);

export function GanttPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const nav = useNavigate();

  // Диапазон: от самой ранней даты до самой поздней (+ запас)
  const { rows, start, days } = useMemo(() => {
    const dated = tasks
      .map((t) => ({
        task: t,
        from: t.start_date ?? t.due_date ?? t.created_at.slice(0, 10),
        to: t.due_date ?? t.start_date ?? t.created_at.slice(0, 10),
      }))
      .sort((a, b) => a.from.localeCompare(b.from));
    const min = dated.length ? dated[0].from : dstr(new Date());
    const max = dated.length ? dated.reduce((m, r) => (r.to > m ? r.to : m), dated[0].to) : dstr(new Date());
    const s = new Date(min + 'T00:00:00Z'); s.setUTCDate(s.getUTCDate() - 2);
    const e = new Date(max + 'T00:00:00Z'); e.setUTCDate(e.getUTCDate() + 5);
    const days: string[] = [];
    for (let d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) days.push(dstr(d));
    return { rows: dated, start: dstr(s), days };
  }, [tasks]);

  if (isLoading) return <PageSpinner />;
  if (!tasks.length) return <EmptyState title="Нет задач" hint="У задач с датами появится таймлайн" />;

  const x = (date: string) => (Date.parse(date + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z')) / 864e5 * DAY;
  const todayX = x(dstr(new Date()));
  const W = days.length * DAY;
  const H = rows.length * ROW;

  return (
    <div className="h-full overflow-auto p-4">
      <div className="inline-block min-w-full rounded-xl border border-border bg-raised">
        {/* Шапка с датами */}
        <div className="sticky top-0 z-10 flex border-b border-border bg-raised" style={{ width: 200 + W }}>
          <div className="sticky left-0 z-10 w-50 shrink-0 border-r border-border bg-raised px-3 py-2 text-xs font-semibold text-muted" style={{ width: 200 }}>Задача</div>
          <div className="relative" style={{ width: W, height: 30 }}>
            {days.map((d, i) => {
              const date = new Date(d + 'T00:00:00Z');
              const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
              return (
                <span key={d} className={cn('absolute top-1.5 font-mono text-[9px]', isWeekend ? 'text-faint/50' : 'text-faint')} style={{ left: i * DAY + 3 }}>
                  {d.slice(8, 10)}{d.endsWith('01') || i === 0 ? ` ${date.toLocaleDateString('ru-RU', { month: 'short' })}` : ''}
                </span>
              );
            })}
          </div>
        </div>
        {/* Строки */}
        <div className="relative" style={{ width: 200 + W }}>
          {rows.map(({ task, from, to }, i) => (
            <div key={task.id} className="flex border-b border-border/60" style={{ height: ROW }}>
              <button
                onClick={() => nav(`/tasks/${task.id}`)}
                className="sticky left-0 z-10 flex w-50 shrink-0 items-center gap-2 border-r border-border bg-raised px-3 text-left hover:bg-hover"
                style={{ width: 200 }}
              >
                <span className={cn('min-w-0 flex-1 truncate text-xs', task.status === 'done' && 'text-faint line-through')}>{task.title}</span>
                {task.assignee && <Avatar name={task.assignee.name} id={task.assignee.id} size={16} />}
              </button>
              <div className="relative flex-1" style={{ width: W }}>
                <div
                  onClick={() => nav(`/tasks/${task.id}`)}
                  title={`${task.title} · ${STATUS_LABELS[task.status]} · ${from} → ${to}`}
                  className="absolute top-[7px] h-5 cursor-pointer rounded-md opacity-90 transition-opacity hover:opacity-100"
                  style={{ left: x(from), width: Math.max(DAY * 0.8, x(to) - x(from) + DAY), background: BAR_COLORS[task.status] }}
                />
              </div>
            </div>
          ))}
          {/* Вертикальные линии + сегодня */}
          <div className="pointer-events-none absolute inset-y-0" style={{ left: 200, width: W, height: H }}>
            {days.map((d, i) => (i % 7 === 0 ? <div key={d} className="absolute inset-y-0 border-l border-border/40" style={{ left: i * DAY }} /> : null))}
            <div className="absolute inset-y-0 w-px bg-danger" style={{ left: todayX }} />
          </div>
        </div>
      </div>
    </div>
  );
}
