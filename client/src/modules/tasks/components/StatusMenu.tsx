import { Dropdown, DropdownItem } from '../../../shared/ui';
import { StatusBadge } from './badges';
import { cn } from '../../../shared/utils/cn';
import { useUpdateStatus } from '../hooks';
import { useColumns } from '../../columns';

// Смена статуса кликом по бейджу — варианты = колонки доски
export function StatusMenu({ taskId, status, disabled }: { taskId: number; status: string; disabled?: boolean }) {
  const setStatus = useUpdateStatus();
  const { data: columns = [] } = useColumns();
  if (disabled) return <StatusBadge status={status} />;
  return (
    <Dropdown trigger={<button className="hover:opacity-80"><StatusBadge status={status} /></button>}>
      {columns.map((c) => (
        <DropdownItem key={c.key} onClick={() => setStatus.mutate({ id: taskId, status: c.key })}>
          <span
            className={cn('inline-block h-2 w-2 rounded-full', c.key === status ? 'ring-2 ring-accent ring-offset-1 ring-offset-raised' : 'opacity-70')}
            style={{ backgroundColor: c.color }}
          />
          {c.name}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
