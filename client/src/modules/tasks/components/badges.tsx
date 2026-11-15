import { Badge } from '../../../shared/ui';
import { STATUS_LABELS, PRIORITY_LABELS, type Status, type Priority } from '@crm/contracts';
import { cn } from '../../../shared/utils/cn';

const STATUS_TONE: Record<Status, 'blue' | 'amber' | 'green'> = {
  new: 'blue', in_progress: 'amber', done: 'green',
};

export const StatusBadge = ({ status }: { status: Status }) => (
  <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>
);

export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  const map = {
    high: { icon: '▲', cls: 'text-danger' },
    medium: { icon: '●', cls: 'text-warning' },
    low: { icon: '▽', cls: 'text-faint' },
  } as const;
  const m = map[priority];
  return <span title={PRIORITY_LABELS[priority]} className={cn('text-[10px]', m.cls, className)}>{m.icon}</span>;
}
