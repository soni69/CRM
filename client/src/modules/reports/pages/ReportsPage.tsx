import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api';
import { PageSpinner, Field, Badge, DatePicker } from '../../../shared/ui';
import { formatDate, formatMinutes } from '../../../shared/utils/format';
import { useCan } from '../../roles';

export function ReportsPage() {
  const can = useCan();
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const { data, isLoading } = useQuery({
    queryKey: ['report', from, to],
    queryFn: () => reportsApi.overview(from, to),
  });

  if (isLoading || !data) return <PageSpinner />;
  const t = data.totals;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <h1 className="text-lg font-semibold">Отчёты</h1>
        {!can('report.team') && <Badge tone="gray">только ваши задачи</Badge>}
        <div className="ml-auto flex items-end gap-2">
          <Field label="С"><DatePicker value={from} onChange={(v) => setFrom(v ?? '')} className="w-40" /></Field>
          <Field label="По"><DatePicker value={to} onChange={(v) => setTo(v ?? '')} className="w-40" /></Field>
        </div>
      </div>

      {/* Сводка */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Всего задач', v: t.total },
          { label: 'В работе', v: t.in_progress },
          { label: 'Выполнено', v: t.done },
          { label: 'Просрочено', v: t.overdue, danger: t.overdue > 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-raised p-4">
            <p className={`text-2xl font-semibold ${s.danger ? 'text-danger' : ''}`}>{s.v}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Просроченные */}
        <section className="rounded-xl border border-border bg-raised">
          <h2 className="border-b border-border px-4 py-2.5 text-sm font-semibold">Просроченные задачи</h2>
          {data.overdue.map((o) => (
            <div key={o.task_id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
              <span className="min-w-0 flex-1 truncate text-sm">{o.title}</span>
              <span className="font-mono text-xs text-danger">{formatDate(o.due_date)}</span>
              <span className="text-xs text-muted">{o.assignee_name ?? '—'}</span>
            </div>
          ))}
          {!data.overdue.length && <p className="px-4 py-6 text-center text-xs text-faint">Просрочек нет</p>}
        </section>

        {/* По людям */}
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-border bg-raised">
            <h2 className="border-b border-border px-4 py-2.5 text-sm font-semibold">Выполнено за период</h2>
            {data.done_by_user.map((r) => {
              const max = Math.max(1, ...data.done_by_user.map((x) => x.done_count));
              return (
                <div key={r.user_id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
                  <span className="w-32 truncate text-sm">{r.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-hover"><div className="h-full rounded-full bg-success" style={{ width: `${(r.done_count / max) * 100}%` }} /></div>
                  <span className="w-8 text-right font-mono text-sm">{r.done_count}</span>
                </div>
              );
            })}
            {!data.done_by_user.length && <p className="px-4 py-6 text-center text-xs text-faint">Нет данных</p>}
          </section>
          <section className="rounded-xl border border-border bg-raised">
            <h2 className="border-b border-border px-4 py-2.5 text-sm font-semibold">Списанное время за период</h2>
            {data.time_by_user.map((r) => {
              const max = Math.max(1, ...data.time_by_user.map((x) => x.minutes));
              return (
                <div key={r.user_id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
                  <span className="w-32 truncate text-sm">{r.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-hover"><div className="h-full rounded-full bg-accent" style={{ width: `${(r.minutes / max) * 100}%` }} /></div>
                  <span className="w-16 text-right font-mono text-sm">{formatMinutes(r.minutes)}</span>
                </div>
              );
            })}
            {!data.time_by_user.length && <p className="px-4 py-6 text-center text-xs text-faint">Нет данных</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
