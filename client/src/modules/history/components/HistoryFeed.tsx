import { useQuery } from '@tanstack/react-query';
import { historyApi } from '../api';
import { Avatar } from '../../../shared/ui';
import { formatDateTime } from '../../../shared/utils/format';
import { STATUS_LABELS } from '@crm/contracts';
import type { TaskEvent } from '@crm/contracts';

function describe(e: TaskEvent): string {
  const p = e.payload as Record<string, unknown>;
  switch (e.type) {
    case 'created': return 'создал(а) задачу';
    case 'status': return `статус: ${STATUS_LABELS[p.from as keyof typeof STATUS_LABELS] ?? p.from} → ${STATUS_LABELS[p.to as keyof typeof STATUS_LABELS] ?? p.to}`;
    case 'field': return `изменил(а): ${(p.fields as string[])?.join(', ')}`;
    case 'assignee': return 'сменил(а) исполнителя';
    case 'member': return 'обновил(а) участников';
    case 'comment': return `прокомментировал(а): «${String(p.body ?? '').slice(0, 60)}»`;
    case 'file': return `прикрепил(а) файл ${p.name}`;
    case 'checklist': return `чек-лист: ${p.action} «${p.text}»`;
    case 'tag': return 'обновил(а) теги';
    case 'sprint': return 'обновил(а) спринт';
    case 'time': return `списал(а) ${p.minutes} мин`;
    default: return e.type;
  }
}

export function HistoryFeed({ taskId }: { taskId: number }) {
  const { data: events = [] } = useQuery({
    queryKey: ['history', taskId],
    queryFn: () => historyApi.list(taskId).then((r) => r.events),
  });
  return (
    <div className="flex flex-col gap-2.5">
      {events.map((e) => (
        <div key={e.id} className="flex items-start gap-2.5 text-sm">
          <Avatar name={e.actor?.name ?? '?'} id={e.actor_id} size={20} />
          <div className="min-w-0">
            <span className="font-medium">{e.actor?.name}</span>{' '}
            <span className="text-muted">{describe(e)}</span>
            <span className="ml-1.5 text-[11px] text-faint">{formatDateTime(e.created_at)}</span>
          </div>
        </div>
      ))}
      {!events.length && <p className="py-3 text-center text-xs text-faint">История пуста</p>}
    </div>
  );
}
