import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sprintsApi } from '../api';
import { STATUSES, STATUS_LABELS, SPRINT_STATUS_LABELS } from '@crm/contracts';
import { PageSpinner, Badge, EmptyState } from '../../../shared/ui';
import { BoardColumn } from '../../tasks/components/BoardColumn';
import { useSelection } from '../../tasks/hooks';
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

  const byStatus = useMemo(() => {
    const m = new Map(STATUSES.map((s) => [s, [] as NonNullable<typeof data>['tasks']]));
    for (const t of data?.tasks ?? []) m.get(t.status)?.push(t);
    return m;
  }, [data]);

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
            {STATUSES.map((s) => (
              <BoardColumn key={s} status={s} title={STATUS_LABELS[s]} tasks={byStatus.get(s) ?? []} onOpen={(id) => nav(`/tasks/${id}`)} selected={sel.selected} onSelect={sel.toggle} />
            ))}
          </div>
        )}
      </div>
      <BulkBar selected={sel.selected} onDone={sel.clear} />
    </div>
  );
}
