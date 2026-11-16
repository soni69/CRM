import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../tasks/hooks';
import { useUsers } from '../../users';
import { PageSpinner, EmptyState, Avatar, Input, Select } from '../../../shared/ui';
import { useColumns, useColumnByKey } from '../../columns';
import { cn } from '../../../shared/utils/cn';

const ROW = 34;            // высота строки
const LABEL_W = 220;       // ширина колонки с названием
const HOUR_PX = 30, DAY_PX = 26;

const RANGES = [
  { id: '12h', label: '12 часов', ms: 12 * 36e5 },
  { id: '1d', label: 'Сутки', ms: 24 * 36e5 },
  { id: '7d', label: 'Неделя', ms: 7 * 864e5 },
  { id: '14d', label: '2 недели', ms: 14 * 864e5 },
  { id: '30d', label: 'Месяц', ms: 30 * 864e5 },
  { id: '90d', label: 'Квартал', ms: 90 * 864e5 },
  { id: 'all', label: 'Весь срок', ms: 0 },
] as const;
type RangeId = (typeof RANGES)[number]['id'];

const dstr = (d: Date) => d.toISOString().slice(0, 10);
// Локальная полночь даты — шкала тиков строится по локальному времени
const dayMs = (d: string) => new Date(d + 'T00:00:00').getTime();
const timeMs = (t?: string | null) => t ? Number(t.slice(0, 2)) * 36e5 + Number(t.slice(3, 5)) * 6e4 : 864e5;

export function GanttPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: users = [] } = useUsers();
  const { data: columns = [] } = useColumns();
  const colByKey = useColumnByKey();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState('');
  const [rangeId, setRangeId] = useState<RangeId>('all');
  const [zoom, setZoom] = useState(1);
  const range = RANGES.find((r) => r.id === rangeId)!;

  const filtered = useMemo(() => tasks.filter((t) =>
    (!q || t.title.toLowerCase().includes(q.trim().toLowerCase())) &&
    (!assignee || t.assignee?.id === Number(assignee)) &&
    (!status || t.status === status),
  ), [tasks, q, assignee, status]);

  // Окно времени + строки внутри него
  const { rows, winStart, W, PX, tickMs } = useMemo(() => {
    const now = Date.now();
    const dated = filtered.map((t) => ({
      task: t,
      from: t.start_date ?? t.due_date ?? t.created_at.slice(0, 10),
      to: t.due_date ?? t.start_date ?? t.created_at.slice(0, 10),
    })).map((r) => ({ ...r, fromMs: dayMs(r.from), toMs: dayMs(r.to) + timeMs(r.task.due_time) }))
      .sort((a, b) => a.fromMs - b.fromMs);

    let ws: number, we: number;
    if (range.id === 'all') {
      const min = dated.length ? dated[0].fromMs : now;
      const max = dated.length ? dated.reduce((m, r) => Math.max(m, r.toMs), dated[0].toMs) : now;
      ws = min - 2 * 864e5; we = max + 5 * 864e5;
    } else {
      ws = range.ms <= 2 * 864e5
        ? Math.floor(now / 36e5) * 36e5
        : dayMs(dstr(new Date()));
      we = ws + range.ms;
    }
    const rows = range.id === 'all' ? dated : dated.filter((r) => r.toMs > ws && r.fromMs < we);
    const hourly = we - ws <= 2 * 864e5;
    const PX = (hourly ? HOUR_PX : DAY_PX) * zoom;
    const tickMs = hourly ? 36e5 : 864e5;
    return { rows, winStart: ws, W: Math.ceil((we - ws) / tickMs) * PX, PX, tickMs };
  }, [filtered, range, zoom]);

  if (isLoading) return <PageSpinner />;

  const hourly = tickMs === 36e5;
  const ticks: number[] = [];
  for (let t = winStart; t < winStart + (W / PX) * tickMs; t += tickMs) ticks.push(t);
  const x = (ms: number) => (ms - winStart) / tickMs * PX;
  const nowX = x(Date.now());
  const H = rows.length * ROW;

  return (
    <div className="flex h-full flex-col">
      {/* Фильтры */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-raised px-4 py-2.5">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию…" className="h-8 w-full max-w-xs text-xs" />
        <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="h-8 w-auto max-w-44 text-xs">
          <option value="">Любой исполнитель</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 w-auto text-xs">
          <option value="">Все статусы</option>
          {columns.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
        </Select>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border p-0.5" title="Масштаб шкалы">
          <button onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.2).toFixed(1)))} className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-hover">−</button>
          <button onClick={() => setZoom(1)} className="w-11 text-center font-mono text-[11px] text-muted" title="Сбросить масштаб">{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom((z) => Math.min(4, +(z + 0.2).toFixed(1)))} className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-hover">+</button>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setRangeId(r.id)}
              className={cn('rounded-md px-2.5 py-1 text-xs font-medium', rangeId === r.id ? 'bg-hover text-text' : 'text-muted hover:text-text')}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Нет задач за выбранный период" hint="Измените фильтры или временной отрезок" />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="inline-block min-w-full rounded-xl border border-border bg-raised">
            {/* Шапка с датами */}
            <div className="sticky top-0 z-10 flex border-b border-border bg-raised" style={{ width: LABEL_W + W }}>
              <div className="sticky left-0 z-10 shrink-0 border-r border-border bg-raised px-3 py-2 text-xs font-semibold text-muted" style={{ width: LABEL_W }}>Задача</div>
              <div className="relative" style={{ width: W, height: 30 }}>
                {ticks.map((t, i) => {
                  const d = new Date(t);
                  return hourly ? (
                    <span key={t} className="absolute top-1.5 font-mono text-[9px] text-faint" style={{ left: i * PX + 3 }}>
                      {d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span key={t} className={cn('absolute top-1.5 font-mono text-[9px]', d.getUTCDay() === 0 || d.getUTCDay() === 6 ? 'text-faint/50' : 'text-faint')} style={{ left: i * PX + 3 }}>
                      {dstr(d).slice(8, 10)}{dstr(d).endsWith('01') || i === 0 ? ` ${d.toLocaleDateString('ru-RU', { month: 'short', timeZone: 'UTC' })}` : ''}
                    </span>
                  );
                })}
              </div>
            </div>
            {/* Строки */}
            <div className="relative" style={{ width: LABEL_W + W }}>
              {rows.map(({ task, from, to, fromMs, toMs }) => {
                const left = Math.max(0, x(fromMs));
                const right = Math.min(W, x(toMs));
                return (
                  <div key={task.id} className="flex border-b border-border/60" style={{ height: ROW }}>
                    <button
                      onClick={() => nav(`/tasks/${task.id}`)}
                      className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-border bg-raised px-3 text-left hover:bg-hover"
                      style={{ width: LABEL_W }}
                    >
                      <span className={cn('min-w-0 flex-1 truncate text-xs', task.done && 'text-faint line-through')}>{task.title}</span>
                      {task.assignee && <Avatar name={task.assignee.name} id={task.assignee.id} size={16} />}
                    </button>
                    <div className="relative flex-1" style={{ width: W }}>
                      <div
                        onClick={() => nav(`/tasks/${task.id}`)}
                        title={`${task.title} · ${colByKey(task.status)?.name ?? task.status} · ${from} → ${to}${task.due_time ? ' ' + task.due_time : ''}`}
                        className="absolute top-[7px] h-5 cursor-pointer rounded-md opacity-90 transition-opacity hover:opacity-100"
                        style={{ left, width: Math.max(PX * 0.6, right - left), background: colByKey(task.status)?.color ?? '#8d94a8' }}
                      />
                    </div>
                  </div>
                );
              })}
              {/* Сетка: каждый тик + выходные, линия «сейчас» */}
              <div className="pointer-events-none absolute inset-y-0" style={{ left: LABEL_W, width: W, height: H }}>
                {ticks.map((t, i) => {
                  const d = new Date(t);
                  const weekend = !hourly && (d.getDay() === 0 || d.getDay() === 6);
                  return (
                    <div key={t}>
                      {weekend && <div className="absolute inset-y-0 bg-hover/50" style={{ left: i * PX, width: PX }} />}
                      <div className={cn('absolute inset-y-0 border-l', i % (hourly ? 4 : 7) === 0 ? 'border-border' : 'border-border/40')} style={{ left: i * PX }} />
                    </div>
                  );
                })}
                {nowX >= 0 && nowX <= W && <div className="absolute inset-y-0 w-px bg-danger" style={{ left: nowX }} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
