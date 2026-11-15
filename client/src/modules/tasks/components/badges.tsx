import { PRIORITY_LABELS, type Priority } from '@crm/contracts';
import { cn } from '../../../shared/utils/cn';
import { useColumnByKey } from '../../columns';

// Цветной бейдж статуса — цвет и подпись берутся из настраиваемой колонки
export function StatusBadge({ status }: { status: string }) {
  const column = useColumnByKey()(status);
  const color = column?.color ?? '#8d94a8';
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4"
      style={{ backgroundColor: `${color}26`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {column?.name ?? status}
    </span>
  );
}

export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  const map = {
    high: { icon: '▲', cls: 'text-danger' },
    medium: { icon: '●', cls: 'text-warning' },
    low: { icon: '▽', cls: 'text-faint' },
  } as const;
  const m = map[priority];
  return <span title={PRIORITY_LABELS[priority]} className={cn('text-[10px]', m.cls, className)}>{m.icon}</span>;
}
