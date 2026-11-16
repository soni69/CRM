import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sprintsApi } from '../api';
import { SPRINT_STATUS_LABELS } from '@crm/contracts';
import { useColumns } from '../../columns';
import { PageSpinner, Badge, EmptyState } from '../../../shared/ui';
import { BoardColumn } from '../../tasks/components/BoardColumn';
import { useSelection, useUpdateStatus } from '../../tasks/hooks';
import { BulkBar } from '../../tasks/components/BulkBar';
import { formatDate } from '../../../shared/utils/format';
import { useMemo } from 'react';

export function SprintBoardPage() {
  const { id } = useParams();
  const sprintId = Number(id);
  const { data, isLoading } = useQuery({
    queryKey: ['sprint-tasks', sprintId],
    queryFn: () => sprintsApi.tasks(sprintId),
    enabled: !isNaN(sprintId),
  });
  const nav = useNavigate();
  const sel = useSelection();
  const setStatus = useUpdateStatus();
  const { data: columns = [] } = useColumns();

  const byStatus = useMemo(() => {
    const visible = columns.filter((c) => !c.hidden);
    const m = new Map(visible.map((c) => [c.key, [] as NonNullable<typeof data>['tasks']]));
    const rest: NonNullable<typeof data>['tasks'] = [];
    for (const t of data?.tasks ?? []) (m.get(t.status) ?? rest).push(t);
    if (rest.length) m.set('__other__', rest);
    return { map: m, visible };
  }, [data, columns]);

  if (isLoading || !data) return <PageSpinner />;
  const { sprint, tasks } = data;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-raised px-4 py-2.5">
        <Link to="/sprints" className="text-sm text-muted hover:text-text">← Спринты</Link>
        <h1 className="font-semibold">{sprint.name}</h1>
        <Badge tone={sprint.status === 'active' ? 'accent' : sprint.status === 'closed' ? 'green' : 'gray'}>{SPRINT_STATUS_LABELS[sprint.status]}</Badge>
        <span className="ml-auto font-mono text-xs text-muted">{formatDate(sprint.start_date)} — {formatDate(sprint.end_date)}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {tasks.length === 0 ? (
          <EmptyState title="В спринте нет задач" hint="Назначьте задачам этот спринт в карточке задачи" />
        ) : (
          <div className="flex h-full gap-3 overflow-x-auto p-4">
            {byStatus.visible.map((c) => (
              <BoardColumn key={c.key} column={c} tasks={byStatus.map.get(c.key) ?? []} onOpen={(id) => nav(`/tasks/${id}`)} selected={sel.selected} onSelect={sel.toggle} onDropTask={(id) => setStatus.mutate({ id, status: c.key })} />
            ))}
          </div>
        )}
      </div>
      <BulkBar selected={sel.selected} onDone={sel.clear} />
    </div>
  );
}
