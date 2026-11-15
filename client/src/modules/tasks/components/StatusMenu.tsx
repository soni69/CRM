import { Dropdown, DropdownItem } from '../../../shared/ui';
import { StatusBadge } from './badges';
import { STATUSES, STATUS_LABELS, type Status } from '@crm/contracts';
import { cn } from '../../../shared/utils/cn';
import { useUpdateStatus } from '../hooks';

// Смена статуса кликом по бейджу
export function StatusMenu({ taskId, status, disabled }: { taskId: number; status: Status; disabled?: boolean }) {
  const setStatus = useUpdateStatus();
  if (disabled) return <StatusBadge status={status} />;
  return (
    <Dropdown trigger={<button className="hover:opacity-80"><StatusBadge status={status} /></button>}>
      {STATUSES.map((s) => (
        <DropdownItem key={s} onClick={() => setStatus.mutate({ id: taskId, status: s })}>
          <span className={cn('inline-block h-2 w-2 rounded-full', s === status ? 'bg-accent' : 'bg-border-strong')} />
          {STATUS_LABELS[s]}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
